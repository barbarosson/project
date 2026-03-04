"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Package, Clock, ShieldCheck } from "lucide-react";
import type { AIInsight } from "@/lib/procurement-types";

interface AIInsightsPanelProps {
  insights: AIInsight[];
  onActionClick?: (insight: AIInsight) => void;
}

export function AIInsightsPanel({ insights, onActionClick }: AIInsightsPanelProps) {
  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'price_risk':
        return TrendingUp;
      case 'lead_time_warning':
        return Clock;
      case 'stock_out':
        return Package;
      case 'supplier_performance':
        return ShieldCheck;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityColor = (severity: AIInsight['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          badge: 'bg-red-50 text-red-700 border-red-200',
          icon: 'text-red-600',
          border: 'border-red-200'
        };
      case 'warning':
        return {
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: 'text-amber-600',
          border: 'border-amber-200'
        };
      case 'info':
        return {
          badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          icon: 'text-cyan-600',
          border: 'border-cyan-200'
        };
    }
  };

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <span className="text-[#00D4AA]">◆</span> AI Insights
            <Badge variant="outline" className="ml-auto text-emerald-600 border-emerald-200">
              All Clear
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <ShieldCheck className="h-12 w-12 mb-2 text-emerald-500" />
            <p className="text-sm">No issues detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <span className="text-[#00D4AA]">◆</span> AI Insights
            <Badge variant="outline" className="text-amber-600 border-amber-200">
              {insights.length} Alert{insights.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const colors = getSeverityColor(insight.severity);

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border bg-card ${colors.border} hover:border-[#00D4AA]/50 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.badge}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${colors.badge}`}
                      >
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {insight.description}
                    </p>

                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#00D4AA]/50 text-[#00D4AA] hover:bg-[#00D4AA]/10"
                        onClick={() => onActionClick?.(insight)}
                      >
                        {insight.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
