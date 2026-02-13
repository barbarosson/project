from typing import List, Dict, Optional
from datetime import datetime
import asyncpg
from pydantic import BaseModel


class RuleDefinition(BaseModel):
    """Kural tanımı"""
    name: str
    description: Optional[str]
    rule_type: str
    conditions: Dict
    adjustment_factor: float
    priority: int = 0
    is_active: bool = True


class CashFlowRuleEngine:
    """Nakit akış kural motoru"""

    def __init__(self, db_pool: asyncpg.Pool):
        self.db = db_pool

    async def create_rule(
        self,
        tenant_id: str,
        rule: RuleDefinition
    ) -> str:
        """Yeni kural oluştur"""

        result = await self.db.fetchrow("""
            INSERT INTO public.cash_flow_rules
            (tenant_id, name, description, rule_type, conditions, adjustment_factor, priority, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        """,
            tenant_id,
            rule.name,
            rule.description,
            rule.rule_type,
            rule.conditions,
            rule.adjustment_factor,
            rule.priority,
            rule.is_active
        )

        return str(result['id'])

    async def create_marketplace_delay_rule(
        self,
        tenant_id: str,
        marketplace_name: str,
        delay_days: int,
        confidence_factor: float = 0.85
    ):
        """Pazaryeri gecikme kuralı oluştur"""

        rule = RuleDefinition(
            name=f"{marketplace_name} Ödeme Gecikmesi",
            description=f"{marketplace_name} ödemeleri ortalama {delay_days} gün gecikir",
            rule_type='marketplace_delay',
            conditions={
                'marketplace_prefix': marketplace_name[:3].upper(),
                'delay_days': delay_days
            },
            adjustment_factor=confidence_factor,
            priority=10
        )

        return await self.create_rule(tenant_id, rule)

    async def create_seasonal_rule(
        self,
        tenant_id: str,
        name: str,
        start_date: str,
        end_date: str,
        adjustment_factor: float,
        description: Optional[str] = None
    ):
        """Mevsimsel kural oluştur"""

        rule = RuleDefinition(
            name=name,
            description=description or f"{start_date} - {end_date} arası özel dönem",
            rule_type='seasonal_factor',
            conditions={
                'start_date': start_date,
                'end_date': end_date
            },
            adjustment_factor=adjustment_factor,
            priority=5
        )

        return await self.create_rule(tenant_id, rule)

    async def create_payment_term_rule(
        self,
        tenant_id: str,
        term_days: int,
        adjustment_factor: float
    ):
        """Ödeme vadesi kuralı"""

        rule = RuleDefinition(
            name=f"{term_days}+ Gün Vadeli Ödemeler",
            description=f"{term_days} gün ve üzeri vadeli ödemeler için risk ayarı",
            rule_type='payment_term',
            conditions={
                'term_days': term_days
            },
            adjustment_factor=adjustment_factor,
            priority=3
        )

        return await self.create_rule(tenant_id, rule)

    async def get_active_rules(self, tenant_id: str) -> List[Dict]:
        """Aktif kuralları getir"""

        rules = await self.db.fetch("""
            SELECT *
            FROM public.cash_flow_rules
            WHERE tenant_id = $1 AND is_active = true
            ORDER BY priority DESC, created_at DESC
        """, tenant_id)

        return [dict(rule) for rule in rules]

    async def update_rule(
        self,
        rule_id: str,
        updates: Dict
    ):
        """Kuralı güncelle"""

        set_clause = ', '.join([f"{k} = ${i+2}" for i, k in enumerate(updates.keys())])
        values = [rule_id] + list(updates.values())

        await self.db.execute(f"""
            UPDATE public.cash_flow_rules
            SET {set_clause}, updated_at = NOW()
            WHERE id = $1
        """, *values)

    async def deactivate_rule(self, rule_id: str):
        """Kuralı devre dışı bırak"""

        await self.db.execute("""
            UPDATE public.cash_flow_rules
            SET is_active = false, updated_at = NOW()
            WHERE id = $1
        """, rule_id)

    async def test_rule_impact(
        self,
        tenant_id: str,
        rule: RuleDefinition,
        sample_size: int = 100
    ) -> Dict:
        """Kural etkisini test et"""

        transactions = await self.db.fetch("""
            SELECT *
            FROM public.cash_flow
            WHERE tenant_id = $1
            AND status = 'pending'
            ORDER BY expected_date
            LIMIT $2
        """, tenant_id, sample_size)

        affected_count = 0
        total_adjustment = 0

        for trans in transactions:
            trans_dict = dict(trans)

            if await self._rule_applies(trans_dict, rule):
                affected_count += 1
                original_confidence = trans_dict.get('ai_confidence_score', 1.0)
                new_confidence = original_confidence * rule.adjustment_factor
                total_adjustment += abs(new_confidence - original_confidence)

        return {
            'affected_transactions': affected_count,
            'total_transactions': len(transactions),
            'impact_percentage': (affected_count / len(transactions) * 100) if transactions else 0,
            'average_adjustment': (total_adjustment / affected_count) if affected_count > 0 else 0
        }

    async def _rule_applies(self, transaction: Dict, rule: RuleDefinition) -> bool:
        """Kural bu işleme uygulanır mı?"""

        if rule.rule_type == 'marketplace_delay':
            return (
                transaction['source_module'] == 'marketplace' and
                transaction.get('reference_no', '').startswith(
                    rule.conditions.get('marketplace_prefix', '')
                )
            )

        elif rule.rule_type == 'seasonal_factor':
            start_date = datetime.strptime(rule.conditions['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(rule.conditions['end_date'], '%Y-%m-%d').date()
            expected_date = transaction['expected_date']

            if isinstance(expected_date, str):
                expected_date = datetime.fromisoformat(expected_date).date()

            return start_date <= expected_date <= end_date

        elif rule.rule_type == 'payment_term':
            return transaction.get('payment_term_days', 0) >= rule.conditions.get('term_days', 0)

        return False
