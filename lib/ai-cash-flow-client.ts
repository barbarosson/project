export interface PredictionResult {
  date: string;
  predicted_balance: number;
  confidence_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_color: string;
  factors: {
    inflow_confidence: number;
    transaction_count: number;
    scenario_adjustment: number;
  };
  recommendations: string[];
  scenario_type: 'pessimistic' | 'realistic' | 'optimistic';
}

export interface ModelMetrics {
  accuracy_score: number;
  mae: number;
  rmse: number;
  training_date: string;
  data_points: number;
  model_version: string;
}

export interface RuleDefinition {
  name: string;
  description?: string;
  rule_type: 'marketplace_delay' | 'seasonal_factor' | 'payment_term' | 'collection_pattern' | 'customer_risk';
  conditions: Record<string, any>;
  adjustment_factor: number;
  priority?: number;
  is_active?: boolean;
}

export interface ScenarioComparison {
  pessimistic: {
    predictions: PredictionResult[];
    final_balance: number;
    min_balance: number;
    critical_days: string[];
    cash_runway_days: number;
  };
  realistic: {
    predictions: PredictionResult[];
    final_balance: number;
    min_balance: number;
    critical_days: string[];
    cash_runway_days: number;
  };
  optimistic: {
    predictions: PredictionResult[];
    final_balance: number;
    min_balance: number;
    critical_days: string[];
    cash_runway_days: number;
  };
}

export class AICashFlowClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async predictCashFlow(params: {
    tenant_id: string;
    forecast_days?: number;
    branch_id?: string;
    scenario?: 'pessimistic' | 'realistic' | 'optimistic';
  }): Promise<PredictionResult[]> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
      forecast_days: String(params.forecast_days || 30),
      scenario: params.scenario || 'realistic',
    });

    if (params.branch_id) {
      searchParams.append('branch_id', params.branch_id);
    }

    const response = await fetch(
      `${this.baseUrl}/api/ai/cash-flow/predict?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getScenarioComparison(params: {
    tenant_id: string;
    forecast_days?: number;
    branch_id?: string;
  }): Promise<ScenarioComparison> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
      forecast_days: String(params.forecast_days || 30),
    });

    if (params.branch_id) {
      searchParams.append('branch_id', params.branch_id);
    }

    const response = await fetch(
      `${this.baseUrl}/api/ai/cash-flow/scenarios?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Scenario comparison failed: ${response.statusText}`);
    }

    return response.json();
  }

  async trainModel(params: {
    tenant_id: string;
    branch_id?: string;
    force_retrain?: boolean;
  }): Promise<ModelMetrics> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
      force_retrain: String(params.force_retrain || false),
    });

    if (params.branch_id) {
      searchParams.append('branch_id', params.branch_id);
    }

    const response = await fetch(
      `${this.baseUrl}/api/ai/cash-flow/train?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Model training failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getModelAccuracy(params: {
    tenant_id: string;
    branch_id?: string;
  }): Promise<{
    model_metrics?: any;
    recent_predictions: any[];
    average_accuracy: number;
  }> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
    });

    if (params.branch_id) {
      searchParams.append('branch_id', params.branch_id);
    }

    const response = await fetch(
      `${this.baseUrl}/api/ai/cash-flow/accuracy?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get model accuracy: ${response.statusText}`);
    }

    return response.json();
  }

  async createRule(params: {
    tenant_id: string;
    rule: RuleDefinition;
  }): Promise<{ rule_id: string; message: string }> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
    });

    const response = await fetch(
      `${this.baseUrl}/api/ai/rules/create?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params.rule),
      }
    );

    if (!response.ok) {
      throw new Error(`Rule creation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createMarketplaceDelayRule(params: {
    tenant_id: string;
    marketplace_name: string;
    delay_days: number;
    confidence_factor?: number;
  }): Promise<{ rule_id: string; message: string }> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
      marketplace_name: params.marketplace_name,
      delay_days: String(params.delay_days),
      confidence_factor: String(params.confidence_factor || 0.85),
    });

    const response = await fetch(
      `${this.baseUrl}/api/ai/rules/marketplace-delay?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Marketplace rule creation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createSeasonalRule(params: {
    tenant_id: string;
    name: string;
    start_date: string;
    end_date: string;
    adjustment_factor: number;
    description?: string;
  }): Promise<{ rule_id: string; message: string }> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
      name: params.name,
      start_date: params.start_date,
      end_date: params.end_date,
      adjustment_factor: String(params.adjustment_factor),
    });

    if (params.description) {
      searchParams.append('description', params.description);
    }

    const response = await fetch(
      `${this.baseUrl}/api/ai/rules/seasonal?${searchParams}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Seasonal rule creation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getRules(params: {
    tenant_id: string;
  }): Promise<{ rules: any[]; count: number }> {
    const searchParams = new URLSearchParams({
      tenant_id: params.tenant_id,
    });

    const response = await fetch(
      `${this.baseUrl}/api/ai/rules?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get rules: ${response.statusText}`);
    }

    return response.json();
  }

  async deactivateRule(ruleId: string): Promise<{ message: string }> {
    const response = await fetch(
      `${this.baseUrl}/api/ai/rules/${ruleId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Rule deactivation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await fetch(`${this.baseUrl}/health`);

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }
}

export const aiCashFlowClient = new AICashFlowClient();
