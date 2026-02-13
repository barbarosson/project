'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { aiCashFlowClient, PredictionResult, ScenarioComparison } from '@/lib/ai-cash-flow-client';
import { useTenant } from '@/hooks/use-tenant';
import { AlertTriangle, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react';

export function AICashFlowPredictions() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<PredictionResult[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioComparison | null>(null);
  const [activeScenario, setActiveScenario] = useState<'pessimistic' | 'realistic' | 'optimistic'>('realistic');
  const [modelAccuracy, setModelAccuracy] = useState<number>(0);

  useEffect(() => {
    if (tenantId) {
      loadPredictions();
      loadModelAccuracy();
    }
  }, [tenantId]);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      const result = await aiCashFlowClient.predictCashFlow({
        tenant_id: tenantId!,
        forecast_days: 30,
        scenario: activeScenario,
      });
      setPredictions(result);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      setLoading(true);
      const result = await aiCashFlowClient.getScenarioComparison({
        tenant_id: tenantId!,
        forecast_days: 30,
      });
      setScenarios(result);
    } catch (error) {
      console.error('Failed to load scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadModelAccuracy = async () => {
    try {
      const result = await aiCashFlowClient.getModelAccuracy({
        tenant_id: tenantId!,
      });
      setModelAccuracy(result.average_accuracy || 0);
    } catch (error) {
      console.error('Failed to load model accuracy:', error);
    }
  };

  const trainModel = async () => {
    try {
      setLoading(true);
      await aiCashFlowClient.trainModel({
        tenant_id: tenantId!,
        force_retrain: true,
      });
      await loadPredictions();
      await loadModelAccuracy();
    } catch (error) {
      console.error('Failed to train model:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = predictions.map((pred) => ({
    date: new Date(pred.date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
    balance: pred.predicted_balance,
    confidence: pred.confidence_score * 100,
    riskLevel: pred.risk_level,
  }));

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getCriticalDays = () => {
    return predictions.filter((p) => p.risk_level === 'critical' || p.risk_level === 'high');
  };

  if (!tenantId) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>Tenant bilgisi yükleniyor...</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Nakit Akış Tahminleri</h2>
          <p className="text-muted-foreground">Gelişmiş makine öğrenmesi ile 30 günlük nakit akış tahmini</p>
        </div>
        <div className="flex items-center gap-2">
          {modelAccuracy > 0 && (
            <Badge variant="outline" className="text-sm">
              Model Doğruluk: {modelAccuracy.toFixed(1)}%
            </Badge>
          )}
          <Button onClick={trainModel} disabled={loading} variant="outline">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Modeli Eğit
          </Button>
          <Button onClick={loadScenarios} disabled={loading}>
            Senaryo Analizi
          </Button>
        </div>
      </div>

      <Tabs value={activeScenario} onValueChange={(v) => {
        setActiveScenario(v as any);
        loadPredictions();
      }}>
        <TabsList>
          <TabsTrigger value="pessimistic">Kötümser</TabsTrigger>
          <TabsTrigger value="realistic">Gerçekçi</TabsTrigger>
          <TabsTrigger value="optimistic">İyimser</TabsTrigger>
        </TabsList>

        <TabsContent value={activeScenario} className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Nakit Bakiye Tahmini</CardTitle>
                  <CardDescription>Önümüzdeki 30 gün için tahmin edilen nakit bakiyesi</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'balance') {
                            return [`₺${value.toLocaleString('tr-TR')}`, 'Bakiye'];
                          }
                          if (name === 'confidence') {
                            return [`%${value.toFixed(1)}`, 'Güven'];
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                        name="Bakiye"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {getCriticalDays().length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dikkat:</strong> {getCriticalDays().length} gün yüksek riskli olarak tespit edildi!
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predictions.slice(0, 10).map((pred, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {new Date(pred.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </CardTitle>
                        <Badge variant={getRiskBadgeVariant(pred.risk_level)} className="text-xs">
                          {pred.risk_level === 'low' && 'Düşük'}
                          {pred.risk_level === 'medium' && 'Orta'}
                          {pred.risk_level === 'high' && 'Yüksek'}
                          {pred.risk_level === 'critical' && 'Kritik'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold">
                            ₺{pred.predicted_balance.toLocaleString('tr-TR')}
                          </span>
                          {pred.predicted_balance > 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Güven: %{(pred.confidence_score * 100).toFixed(0)}
                        </div>
                        {pred.recommendations.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {pred.recommendations[0]}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {scenarios && (
        <Card>
          <CardHeader>
            <CardTitle>Senaryo Karşılaştırması</CardTitle>
            <CardDescription>Farklı senaryolarda 30 günlük tahmin sonuçları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-red-200">
                <CardHeader>
                  <CardTitle className="text-sm">Kötümser</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Final Bakiye</p>
                      <p className="text-lg font-bold">₺{scenarios.pessimistic.final_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum Bakiye</p>
                      <p className="text-sm">₺{scenarios.pessimistic.min_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kritik Günler</p>
                      <p className="text-sm">{scenarios.pessimistic.critical_days.length} gün</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-sm">Gerçekçi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Final Bakiye</p>
                      <p className="text-lg font-bold">₺{scenarios.realistic.final_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum Bakiye</p>
                      <p className="text-sm">₺{scenarios.realistic.min_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kritik Günler</p>
                      <p className="text-sm">{scenarios.realistic.critical_days.length} gün</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardHeader>
                  <CardTitle className="text-sm">İyimser</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Final Bakiye</p>
                      <p className="text-lg font-bold">₺{scenarios.optimistic.final_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum Bakiye</p>
                      <p className="text-sm">₺{scenarios.optimistic.min_balance.toLocaleString('tr-TR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Kritik Günler</p>
                      <p className="text-sm">{scenarios.optimistic.critical_days.length} gün</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
