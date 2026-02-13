from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import asyncpg
import os
from datetime import datetime
import logging

from services.ai_agent.enhanced_predictor import (
    EnhancedCashFlowAIAgent,
    PredictionResult,
    ModelMetrics
)
from services.ai_agent.rule_engine import CashFlowRuleEngine, RuleDefinition

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Modulus AI Cash Flow Prediction Service",
    description="Gelişmiş AI destekli nakit akışı tahminleme servisi",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db_pool: Optional[asyncpg.Pool] = None


@app.on_event("startup")
async def startup():
    """Uygulama başlangıcı"""
    global db_pool

    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise RuntimeError("DATABASE_URL environment variable not set")

    db_pool = await asyncpg.create_pool(
        db_url,
        min_size=5,
        max_size=20
    )

    logger.info("Database pool created successfully")


@app.on_event("shutdown")
async def shutdown():
    """Uygulama kapanışı"""
    global db_pool

    if db_pool:
        await db_pool.close()
        logger.info("Database pool closed")


def get_db() -> asyncpg.Pool:
    """Database dependency"""
    if not db_pool:
        raise HTTPException(status_code=500, detail="Database not initialized")
    return db_pool


@app.get("/health")
async def health_check():
    """Sağlık kontrolü"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }


@app.post("/api/ai/cash-flow/predict")
async def predict_cash_flow(
    tenant_id: str,
    forecast_days: int = 30,
    branch_id: Optional[str] = None,
    scenario: str = 'realistic',
    db: asyncpg.Pool = Depends(get_db)
) -> List[PredictionResult]:
    """
    Nakit akışı tahmini yap

    - **tenant_id**: Firma ID
    - **forecast_days**: Tahmin günü (7-90)
    - **branch_id**: Şube ID (opsiyonel)
    - **scenario**: 'pessimistic', 'realistic', 'optimistic'
    """

    try:
        if forecast_days < 7 or forecast_days > 90:
            raise HTTPException(
                status_code=400,
                detail="forecast_days must be between 7 and 90"
            )

        if scenario not in ['pessimistic', 'realistic', 'optimistic']:
            raise HTTPException(
                status_code=400,
                detail="scenario must be 'pessimistic', 'realistic', or 'optimistic'"
            )

        agent = EnhancedCashFlowAIAgent(db)

        await agent.train_model(tenant_id, branch_id)

        predictions = await agent.predict_cash_flow(
            tenant_id,
            forecast_days,
            branch_id,
            scenario
        )

        for pred in predictions:
            await db.execute("""
                INSERT INTO public.cash_flow_predictions
                (tenant_id, branch_id, prediction_date, predicted_balance, model_version, factors_used,
                 confidence_score, risk_level, risk_color, scenario_type, recommendations)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (tenant_id, branch_id, prediction_date, scenario_type)
                DO UPDATE SET
                    predicted_balance = $4,
                    factors_used = $6,
                    confidence_score = $7,
                    risk_level = $8,
                    risk_color = $9,
                    recommendations = $11,
                    updated_at = NOW()
            """,
                tenant_id,
                branch_id,
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

        logger.info(f"Prediction completed for tenant {tenant_id}: {len(predictions)} days")

        return predictions

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/cash-flow/scenarios")
async def get_scenario_comparison(
    tenant_id: str,
    forecast_days: int = 30,
    branch_id: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """
    Tüm senaryoları karşılaştır

    - Kötümser, gerçekçi, iyimser senaryolar
    - Her senaryo için: tahminler, final bakiye, kritik günler
    """

    try:
        agent = EnhancedCashFlowAIAgent(db)

        scenarios = await agent.calculate_scenario_comparison(
            tenant_id,
            forecast_days,
            branch_id
        )

        return scenarios

    except Exception as e:
        logger.error(f"Scenario comparison error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/cash-flow/train")
async def train_model(
    tenant_id: str,
    branch_id: Optional[str] = None,
    force_retrain: bool = False,
    db: asyncpg.Pool = Depends(get_db)
) -> ModelMetrics:
    """
    Modeli eğit

    - **tenant_id**: Firma ID
    - **branch_id**: Şube ID (opsiyonel)
    - **force_retrain**: Zorla yeniden eğitim
    """

    try:
        agent = EnhancedCashFlowAIAgent(db)

        metrics = await agent.train_model(tenant_id, branch_id, force_retrain)

        logger.info(f"Model trained for tenant {tenant_id}: Accuracy {metrics.accuracy_score:.2f}%")

        return metrics

    except Exception as e:
        logger.error(f"Training error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/cash-flow/accuracy")
async def get_model_accuracy(
    tenant_id: str,
    branch_id: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """
    Model doğruluğunu getir

    - Son eğitim metrikleri
    - Gerçek vs tahmin karşılaştırması
    """

    try:
        latest_metrics = await db.fetchrow("""
            SELECT *
            FROM public.ai_model_metrics
            WHERE tenant_id = $1
            AND ($2::uuid IS NULL OR branch_id = $2)
            ORDER BY training_date DESC
            LIMIT 1
        """, tenant_id, branch_id)

        if not latest_metrics:
            return {
                "message": "Model henüz eğitilmemiş",
                "accuracy_score": 0
            }

        accuracy_data = await db.fetch("""
            SELECT
                prediction_date,
                predicted_balance,
                actual_balance,
                accuracy_score
            FROM public.cash_flow_predictions
            WHERE tenant_id = $1
            AND ($2::uuid IS NULL OR branch_id = $2)
            AND actual_balance IS NOT NULL
            ORDER BY prediction_date DESC
            LIMIT 30
        """, tenant_id, branch_id)

        import numpy as np

        return {
            "model_metrics": dict(latest_metrics),
            "recent_predictions": [dict(row) for row in accuracy_data],
            "average_accuracy": np.mean([row['accuracy_score'] for row in accuracy_data]) if accuracy_data else 0
        }

    except Exception as e:
        logger.error(f"Accuracy retrieval error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/rules/create")
async def create_rule(
    tenant_id: str,
    rule: RuleDefinition,
    db: asyncpg.Pool = Depends(get_db)
):
    """Yeni kural oluştur"""

    try:
        engine = CashFlowRuleEngine(db)
        rule_id = await engine.create_rule(tenant_id, rule)

        logger.info(f"Rule created: {rule_id} for tenant {tenant_id}")

        return {"rule_id": rule_id, "message": "Kural başarıyla oluşturuldu"}

    except Exception as e:
        logger.error(f"Rule creation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/rules/marketplace-delay")
async def create_marketplace_delay_rule(
    tenant_id: str,
    marketplace_name: str,
    delay_days: int,
    confidence_factor: float = 0.85,
    db: asyncpg.Pool = Depends(get_db)
):
    """Pazaryeri gecikme kuralı oluştur"""

    try:
        engine = CashFlowRuleEngine(db)
        rule_id = await engine.create_marketplace_delay_rule(
            tenant_id,
            marketplace_name,
            delay_days,
            confidence_factor
        )

        return {"rule_id": rule_id, "message": f"{marketplace_name} kuralı oluşturuldu"}

    except Exception as e:
        logger.error(f"Marketplace rule creation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai/rules/seasonal")
async def create_seasonal_rule(
    tenant_id: str,
    name: str,
    start_date: str,
    end_date: str,
    adjustment_factor: float,
    description: Optional[str] = None,
    db: asyncpg.Pool = Depends(get_db)
):
    """Mevsimsel kural oluştur"""

    try:
        engine = CashFlowRuleEngine(db)
        rule_id = await engine.create_seasonal_rule(
            tenant_id,
            name,
            start_date,
            end_date,
            adjustment_factor,
            description
        )

        return {"rule_id": rule_id, "message": "Mevsimsel kural oluşturuldu"}

    except Exception as e:
        logger.error(f"Seasonal rule creation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ai/rules")
async def get_rules(
    tenant_id: str,
    db: asyncpg.Pool = Depends(get_db)
):
    """Firma kurallarını listele"""

    try:
        engine = CashFlowRuleEngine(db)
        rules = await engine.get_active_rules(tenant_id)

        return {"rules": rules, "count": len(rules)}

    except Exception as e:
        logger.error(f"Rules retrieval error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/ai/rules/{rule_id}")
async def deactivate_rule(
    rule_id: str,
    db: asyncpg.Pool = Depends(get_db)
):
    """Kuralı devre dışı bırak"""

    try:
        engine = CashFlowRuleEngine(db)
        await engine.deactivate_rule(rule_id)

        return {"message": "Kural devre dışı bırakıldı"}

    except Exception as e:
        logger.error(f"Rule deactivation error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
