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
          badge: 'bg-red-500/10 text-red-400 border-red-500/20',
          icon: 'text-red-400',
          border: 'border-red-500/30'
        };
      case 'warning':
        return {
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: 'text-amber-400',
          border: 'border-amber-500/30'
        };
      case 'info':
        return {
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          icon: 'text-cyan-400',
          border: 'border-cyan-500/30'
        };
    }
  };

  if (insights.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-cyan-400">◆</span> AI Insights
            <Badge variant="outline" className="ml-auto text-emerald-400 border-emerald-400/30">
              All Clear
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <ShieldCheck className="h-12 w-12 mb-2 text-emerald-400" />
            <p className="text-sm">No issues detected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-cyan-400">◆</span> AI Insights
            <Badge variant="outline" className="text-amber-400 border-amber-400/30">
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
                className={`p-4 rounded-lg bg-slate-800/50 border ${colors.border} hover:bg-slate-800/70 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.badge}`}>
                    <Icon className={`h-5 w-5 ${colors.icon}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{insight.title}</h4>
                      <Badge
                        variant="outline"
                        className={`text-xs ${colors.badge}`}
                      >
                        {insight.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      {insight.description}
                    </p>

                    {insight.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
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
