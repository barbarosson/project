import asyncio
import asyncpg
import os
from datetime import datetime
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from services.ai_agent.enhanced_predictor import EnhancedCashFlowAIAgent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CashFlowScheduler:
    """Otomatik görev zamanlayıcı"""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.db_pool = None

    async def initialize(self):
        """Veritabanı bağlantısını başlat"""
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            raise RuntimeError("DATABASE_URL environment variable not set")

        self.db_pool = await asyncpg.create_pool(
            db_url,
            min_size=2,
            max_size=5
        )
        logger.info("Scheduler database pool created")

    async def nightly_model_training(self):
        """Her gece saat 02:00'de tüm tenant'lar için model eğitimi"""
        logger.info("Starting nightly model training...")

        try:
            tenants = await self.db_pool.fetch("""
                SELECT DISTINCT tenant_id
                FROM public.cash_flow
                WHERE created_at > NOW() - INTERVAL '30 days'
            """)

            logger.info(f"Found {len(tenants)} tenants to train")

            for tenant in tenants:
                tenant_id = str(tenant['tenant_id'])

                try:
                    agent = EnhancedCashFlowAIAgent(self.db_pool)
                    metrics = await agent.train_model(tenant_id, force_retrain=True)

                    logger.info(
                        f"Tenant {tenant_id} trained: "
                        f"Accuracy {metrics.accuracy_score:.2f}%, "
                        f"Data points: {metrics.data_points}"
                    )

                except Exception as e:
                    logger.error(f"Training failed for tenant {tenant_id}: {str(e)}")
                    continue

            logger.info("Nightly model training completed")

        except Exception as e:
            logger.error(f"Nightly training error: {str(e)}", exc_info=True)

    async def hourly_prediction_update(self):
        """Her saat başı tahminleri güncelle"""
        logger.info("Starting hourly prediction update...")

        try:
            tenants = await self.db_pool.fetch("""
                SELECT DISTINCT tenant_id
                FROM public.cash_flow
                WHERE status IN ('pending', 'partial', 'overdue')
            """)

            for tenant in tenants:
                tenant_id = str(tenant['tenant_id'])

                try:
                    agent = EnhancedCashFlowAIAgent(self.db_pool)

                    predictions = await agent.predict_cash_flow(
                        tenant_id,
                        forecast_days=30,
                        scenario_type='realistic'
                    )

                    for pred in predictions:
                        await self.db_pool.execute("""
                            INSERT INTO public.cash_flow_predictions
                            (tenant_id, prediction_date, predicted_balance, model_version,
                             factors_used, confidence_score, risk_level, risk_color,
                             scenario_type, recommendations)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            ON CONFLICT (tenant_id, branch_id, prediction_date, scenario_type)
                            DO UPDATE SET
                                predicted_balance = $3,
                                factors_used = $5,
                                confidence_score = $6,
                                risk_level = $7,
                                risk_color = $8,
                                recommendations = $10,
                                updated_at = NOW()
                        """,
                            tenant_id,
                            pred.date,
                            pred.predicted_balance,
                            agent.model_version,
                            pred.factors,
                            pred.confidence_score,
                            pred.risk_level,
                            pred.risk_color,
                            pred.scenario_type,
                            pred.recommendations
                        )

                    logger.info(f"Tenant {tenant_id} predictions updated: {len(predictions)} days")

                except Exception as e:
                    logger.error(f"Prediction update failed for tenant {tenant_id}: {str(e)}")
                    continue

            logger.info("Hourly prediction update completed")

        except Exception as e:
            logger.error(f"Hourly update error: {str(e)}", exc_info=True)

    def start(self):
        """Zamanlayıcıyı başlat"""

        self.scheduler.add_job(
            self.nightly_model_training,
            CronTrigger(hour=2, minute=0),
            id='nightly_training',
            name='Nightly Model Training',
            replace_existing=True
        )

        self.scheduler.add_job(
            self.hourly_prediction_update,
            CronTrigger(minute=0),
            id='hourly_predictions',
            name='Hourly Prediction Update',
            replace_existing=True
        )

        self.scheduler.start()
        logger.info("Scheduler started successfully")

    async def stop(self):
        """Zamanlayıcıyı durdur"""
        self.scheduler.shutdown()

        if self.db_pool:
            await self.db_pool.close()

        logger.info("Scheduler stopped")


async def main():
    """Ana fonksiyon"""
    scheduler = CashFlowScheduler()
    await scheduler.initialize()
    scheduler.start()

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        await scheduler.stop()


if __name__ == "__main__":
    asyncio.run(main())
