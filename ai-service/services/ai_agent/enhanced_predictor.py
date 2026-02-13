from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import asyncpg
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CashFlowRule(BaseModel):
    id: str
    rule_type: str
    conditions: Dict
    adjustment_factor: float
    priority: int


class ScenarioType(BaseModel):
    name: str
    inflow_adjustment: float = 0.0
    outflow_adjustment: float = 0.0
    delay_days: int = 0


class PredictionResult(BaseModel):
    date: datetime
    predicted_balance: float
    confidence_score: float
    risk_level: str
    risk_color: str
    factors: Dict[str, float]
    recommendations: List[str]
    scenario_type: str = 'realistic'


class ModelMetrics(BaseModel):
    accuracy_score: float
    mae: float
    rmse: float
    training_date: datetime
    data_points: int
    model_version: str


class EnhancedCashFlowAIAgent:
    """
    Gelişmiş AI Nakit Akış Tahmin Motoru

    Özellikler:
    - Kural tabanlı tahminleme
    - Çoklu senaryo analizi
    - Otomatik model eğitimi
    - Doğruluk takibi
    """

    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool
        self.model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        self.is_trained = False
        self.model_version = "2.0.0"
        self.last_training_date = None
        self.accuracy_score = 0.0

        self.risk_colors = {
            'low': '#22c55e',
            'medium': '#f59e0b',
            'high': '#ef4444',
            'critical': '#dc2626'
        }

    async def train_model(self, tenant_id: str, branch_id: Optional[str] = None, force_retrain: bool = False) -> ModelMetrics:
        """Model eğitimi"""

        if not force_retrain and self.last_training_date:
            if datetime.now() - self.last_training_date < timedelta(hours=24):
                logger.info(f"Model son 24 saatte eğitilmiş. Atlanıyor.")
                return ModelMetrics(
                    accuracy_score=self.accuracy_score,
                    mae=0,
                    rmse=0,
                    training_date=self.last_training_date,
                    data_points=0,
                    model_version=self.model_version
                )

        logger.info(f"Model eğitimi başlıyor: Tenant {tenant_id}")

        query = """
            SELECT
                cf.id,
                cf.expected_date,
                cf.actual_date,
                cf.amount,
                cf.type,
                cf.source_module,
                cf.status,
                cf.ai_confidence_score,
                cf.category,
                EXTRACT(DOW FROM cf.expected_date) as day_of_week,
                EXTRACT(MONTH FROM cf.expected_date) as month,
                EXTRACT(DAY FROM cf.expected_date) as day_of_month,
                EXTRACT(EPOCH FROM (cf.actual_date - cf.expected_date)) / 86400 as delay_days
            FROM public.cash_flow cf
            WHERE cf.tenant_id = $1
            AND ($2::uuid IS NULL OR cf.branch_id = $2)
            AND cf.actual_date IS NOT NULL
            AND cf.created_at > NOW() - INTERVAL '12 months'
            AND cf.status = 'cleared'
            ORDER BY cf.expected_date
        """

        historical_data = await self.db.fetch(query, tenant_id, branch_id)

        if len(historical_data) < 100:
            logger.warning(f"Yetersiz veri: {len(historical_data)} kayıt. Minimum 100 gerekli.")
            return ModelMetrics(
                accuracy_score=0.0,
                mae=0,
                rmse=0,
                training_date=datetime.now(),
                data_points=len(historical_data),
                model_version=self.model_version
            )

        df = pd.DataFrame([dict(row) for row in historical_data])
        df = await self._engineer_features(df, tenant_id)

        y = df['delay_days'].fillna(0)

        feature_columns = [
            'amount', 'day_of_week', 'month', 'day_of_month',
            'is_inflow', 'is_marketplace', 'is_invoice', 'is_expense',
            'is_weekend', 'is_month_end', 'amount_category', 'seasonal_factor'
        ]

        X = df[feature_columns].fillna(0)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        self.model.fit(X_train, y_train)
        y_pred = self.model.predict(X_test)

        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        correct_predictions = np.abs(y_test - y_pred) <= 3
        accuracy = correct_predictions.sum() / len(y_test) * 100

        self.is_trained = True
        self.last_training_date = datetime.now()
        self.accuracy_score = accuracy

        metrics = ModelMetrics(
            accuracy_score=accuracy,
            mae=mae,
            rmse=rmse,
            training_date=self.last_training_date,
            data_points=len(historical_data),
            model_version=self.model_version
        )

        await self._save_model_metrics(tenant_id, branch_id, metrics)

        logger.info(f"Model eğitimi tamamlandı. Accuracy: {accuracy:.2f}%, MAE: {mae:.2f} gün")

        return metrics

    async def _engineer_features(self, df: pd.DataFrame, tenant_id: str) -> pd.DataFrame:
        """Feature engineering"""

        df['is_inflow'] = (df['type'] == 'inflow').astype(int)
        df['is_marketplace'] = (df['source_module'] == 'marketplace').astype(int)
        df['is_invoice'] = (df['source_module'] == 'e-invoice').astype(int)
        df['is_expense'] = (df['source_module'] == 'expense').astype(int)

        df['is_weekend'] = df['day_of_week'].isin([0, 6]).astype(int)
        df['is_month_end'] = (df['day_of_month'] >= 25).astype(int)

        df['amount_category'] = pd.cut(
            df['amount'],
            bins=[0, 1000, 5000, 20000, 50000, float('inf')],
            labels=[1, 2, 3, 4, 5]
        ).astype(int)

        df['seasonal_factor'] = df['month'].map({
            1: 0.9, 2: 0.95, 3: 1.0, 4: 1.05, 5: 1.1, 6: 1.05,
            7: 0.85, 8: 0.8, 9: 1.1, 10: 1.15, 11: 1.2, 12: 1.25
        })

        return df

    async def _get_active_rules(self, tenant_id: str) -> List[CashFlowRule]:
        """Aktif nakit akış kurallarını çek"""

        rules_data = await self.db.fetch("""
            SELECT id, rule_type, conditions, adjustment_factor, priority
            FROM public.cash_flow_rules
            WHERE tenant_id = $1 AND is_active = true
            ORDER BY priority DESC
        """, tenant_id)

        return [
            CashFlowRule(
                id=str(row['id']),
                rule_type=row['rule_type'],
                conditions=row['conditions'],
                adjustment_factor=float(row['adjustment_factor']),
                priority=row['priority']
            )
            for row in rules_data
        ]

    async def _calculate_confidence(
        self,
        transaction: Dict,
        rules: List[CashFlowRule],
        scenario: Optional[ScenarioType] = None
    ) -> float:
        """Gelişmiş güven skoru hesaplama"""

        base_confidence = float(transaction.get('ai_confidence_score', 1.0))

        source_multipliers = {
            'bank': 1.0,
            'e-invoice': 0.85,
            'marketplace': 0.75,
            'sales_order': 0.70,
            'purchase_order': 0.95,
            'expense': 0.90,
            'payroll': 0.98,
            'manual': 0.60
        }

        source_confidence = source_multipliers.get(
            transaction['source_module'],
            0.5
        )

        for rule in rules:
            try:
                if rule.rule_type == 'marketplace_delay':
                    if transaction['source_module'] == 'marketplace':
                        marketplace_prefix = rule.conditions.get('marketplace_prefix', '')
                        reference_no = transaction.get('reference_no', '')

                        if reference_no.startswith(marketplace_prefix):
                            source_confidence *= rule.adjustment_factor

                elif rule.rule_type == 'seasonal_factor':
                    start_date_str = rule.conditions.get('start_date')
                    end_date_str = rule.conditions.get('end_date')

                    if start_date_str and end_date_str:
                        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
                        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()

                        expected_date = transaction['expected_date']
                        if isinstance(expected_date, str):
                            expected_date = datetime.fromisoformat(expected_date).date()

                        if start_date <= expected_date <= end_date:
                            source_confidence *= rule.adjustment_factor

            except Exception as e:
                logger.error(f"Rule application error: {rule.rule_type} - {str(e)}")
                continue

        if scenario:
            if transaction['type'] == 'inflow':
                adjustment = 1 + (scenario.inflow_adjustment / 100)
                source_confidence *= adjustment
            elif transaction['type'] == 'outflow':
                adjustment = 1 + (scenario.outflow_adjustment / 100)
                source_confidence *= adjustment

        final_confidence = max(0.05, min(1.0, base_confidence * source_confidence))

        return final_confidence

    async def predict_cash_flow(
        self,
        tenant_id: str,
        forecast_days: int = 30,
        branch_id: Optional[str] = None,
        scenario_type: str = 'realistic'
    ) -> List[PredictionResult]:
        """Nakit akışı tahmini yap"""

        logger.info(f"Prediction started: Tenant {tenant_id}, Scenario: {scenario_type}")

        scenarios = {
            'pessimistic': ScenarioType(
                name='pessimistic',
                inflow_adjustment=-20,
                outflow_adjustment=10,
                delay_days=7
            ),
            'realistic': ScenarioType(
                name='realistic',
                inflow_adjustment=0,
                outflow_adjustment=0,
                delay_days=0
            ),
            'optimistic': ScenarioType(
                name='optimistic',
                inflow_adjustment=15,
                outflow_adjustment=-10,
                delay_days=-3
            )
        }

        scenario = scenarios.get(scenario_type, scenarios['realistic'])
        rules = await self._get_active_rules(tenant_id)

        current_balance = await self._get_current_balance(tenant_id, branch_id)

        end_date = datetime.now() + timedelta(days=forecast_days)
        pending_transactions = await self.db.fetch("""
            SELECT *
            FROM public.cash_flow
            WHERE tenant_id = $1
            AND ($2::uuid IS NULL OR branch_id = $2)
            AND status IN ('pending', 'partial', 'overdue')
            AND expected_date <= $3
            ORDER BY expected_date
        """, tenant_id, branch_id, end_date)

        logger.info(f"Pending transactions: {len(pending_transactions)}")

        predictions = []
        running_balance = current_balance

        transactions_by_date = {}
        for trans in pending_transactions:
            trans_dict = dict(trans)

            expected_date = trans_dict['expected_date']
            if scenario.delay_days != 0 and trans_dict['type'] == 'inflow':
                expected_date = expected_date + timedelta(days=scenario.delay_days)

            date_key = expected_date.date()

            if date_key not in transactions_by_date:
                transactions_by_date[date_key] = []

            transactions_by_date[date_key].append(trans_dict)

        for day in range(forecast_days):
            target_date = datetime.now() + timedelta(days=day)
            date_key = target_date.date()

            day_transactions = transactions_by_date.get(date_key, [])

            day_inflow = 0
            day_outflow = 0

            for trans in day_transactions:
                confidence = await self._calculate_confidence(trans, rules, scenario)
                adjusted_amount = trans['amount'] * confidence

                if trans['type'] == 'inflow':
                    day_inflow += adjusted_amount
                else:
                    day_outflow += adjusted_amount

            net_flow = day_inflow - day_outflow
            running_balance += net_flow

            confidence_factors = {
                'inflow_confidence': (day_inflow / (day_inflow + day_outflow)) if (day_inflow + day_outflow) > 0 else 0.5,
                'transaction_count': len(day_transactions),
                'scenario_adjustment': scenario.inflow_adjustment
            }

            overall_confidence = 0.8 if day_transactions else 0.5

            risk_level, risk_color = self._calculate_risk_level(
                running_balance,
                day_outflow,
                day
            )

            recommendations = await self._generate_recommendations(
                running_balance,
                day_transactions,
                risk_level,
                day,
                scenario_type
            )

            predictions.append(PredictionResult(
                date=target_date,
                predicted_balance=running_balance,
                confidence_score=overall_confidence,
                risk_level=risk_level,
                risk_color=risk_color,
                factors=confidence_factors,
                recommendations=recommendations,
                scenario_type=scenario_type
            ))

        logger.info(f"Prediction completed: {len(predictions)} days")

        return predictions

    def _calculate_risk_level(
        self,
        balance: float,
        daily_outflow: float,
        days_ahead: int
    ) -> Tuple[str, str]:
        """Risk seviyesi hesapla"""

        if balance < 0:
            return ('critical', self.risk_colors['critical'])

        if daily_outflow > 0:
            runway_days = balance / daily_outflow

            if runway_days < 7:
                return ('critical', self.risk_colors['critical'])
            elif runway_days < 15:
                return ('high', self.risk_colors['high'])
            elif runway_days < 30:
                return ('medium', self.risk_colors['medium'])

        if days_ahead > 60:
            if balance < 50000:
                return ('medium', self.risk_colors['medium'])

        return ('low', self.risk_colors['low'])

    async def _generate_recommendations(
        self,
        balance: float,
        transactions: List[Dict],
        risk_level: str,
        days_ahead: int,
        scenario_type: str
    ) -> List[str]:
        """Aksiyon önerileri üret"""

        recommendations = []

        if risk_level == 'critical':
            recommendations.append(
                "🚨 KRİTİK: Nakit sıkıntısı riski! Acil tahsilat yapılması şarttır."
            )

            if balance < 0:
                recommendations.append(
                    f"⚠️ Bakiye eksi: ₺{abs(balance):,.2f}. Acil finansman gerekebilir."
                )

        elif risk_level == 'high':
            recommendations.append(
                "⚠️ YÜKSEK RİSK: Nakit akışı dikkatle izlenmeli."
            )

        overdue = [
            t for t in transactions
            if t['type'] == 'inflow' and t.get('status') == 'overdue'
        ]

        if overdue:
            total_overdue = sum(t['amount'] for t in overdue)
            recommendations.append(
                f"📞 {len(overdue)} vadesi geçmiş alacak var (₺{total_overdue:,.2f}). "
                "Tahsilat ekibi bilgilendirilmeli."
            )

        return recommendations[:5]

    async def _get_current_balance(self, tenant_id: str, branch_id: Optional[str]) -> float:
        """Güncel nakit bakiyesi"""

        result = await self.db.fetchrow("""
            SELECT COALESCE(SUM(
                CASE
                    WHEN type = 'inflow' THEN amount
                    WHEN type = 'outflow' THEN -amount
                END
            ), 0) as balance
            FROM public.cash_flow
            WHERE tenant_id = $1
            AND ($2::uuid IS NULL OR branch_id = $2)
            AND status = 'cleared'
        """, tenant_id, branch_id)

        return float(result['balance']) if result else 0.0

    async def _save_model_metrics(self, tenant_id: str, branch_id: Optional[str], metrics: ModelMetrics):
        """Model metriklerini kaydet"""

        await self.db.execute("""
            INSERT INTO public.ai_model_metrics
            (tenant_id, branch_id, accuracy_score, mae, rmse, training_date, data_points, model_version)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        """,
            tenant_id,
            branch_id,
            metrics.accuracy_score,
            metrics.mae,
            metrics.rmse,
            metrics.training_date,
            metrics.data_points,
            metrics.model_version
        )

    async def calculate_scenario_comparison(
        self,
        tenant_id: str,
        forecast_days: int = 30,
        branch_id: Optional[str] = None
    ) -> Dict:
        """Tüm senaryoları karşılaştır"""

        scenarios = {}

        for scenario_type in ['pessimistic', 'realistic', 'optimistic']:
            predictions = await self.predict_cash_flow(
                tenant_id,
                forecast_days,
                branch_id,
                scenario_type
            )

            scenarios[scenario_type] = {
                'predictions': [p.dict() for p in predictions],
                'final_balance': predictions[-1].predicted_balance if predictions else 0,
                'min_balance': min(p.predicted_balance for p in predictions) if predictions else 0,
                'critical_days': [
                    p.date.isoformat()
                    for p in predictions
                    if p.risk_level in ['critical', 'high']
                ],
                'cash_runway_days': next(
                    (i for i, p in enumerate(predictions) if p.predicted_balance < 0),
                    len(predictions)
                )
            }

        return scenarios
