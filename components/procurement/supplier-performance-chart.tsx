"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { Supplier } from "@/lib/procurement-types";

interface SupplierPerformanceChartProps {
  suppliers: Supplier[];
}

export function SupplierPerformanceChart({ suppliers }: SupplierPerformanceChartProps) {
  const topSuppliers = suppliers
    .filter(s => s.status === 'active')
    .sort((a, b) => b.total_orders_count - a.total_orders_count)
    .slice(0, 5);

  const data = topSuppliers.map(supplier => ({
    subject: supplier.name.length > 15 ? supplier.name.substring(0, 15) + '...' : supplier.name,
    quality: supplier.reliability_rating * 20,
    speed: supplier.average_delivery_days
      ? Math.max(0, 100 - (supplier.average_delivery_days * 5))
      : 50,
    volume: Math.min(100, (supplier.total_orders_count / 20) * 100),
    fullMark: 100,
  }));

  if (data.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-cyan-400">◆</span> Supplier Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-slate-400">
            No supplier data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-cyan-400">◆</span> Supplier Performance
        </CardTitle>
        <p className="text-sm text-slate-400">Quality vs. Speed vs. Volume</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#64748b' }}
            />
            <Radar
              name="Quality"
              dataKey="quality"
              stroke="#7dd3fc"
              fill="#7dd3fc"
              fillOpacity={0.3}
            />
            <Radar
              name="Speed"
              dataKey="speed"
              stroke="#34d399"
              fill="#34d399"
              fillOpacity={0.3}
            />
            <Radar
              name="Volume"
              dataKey="volume"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-sm text-slate-300">Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-300">Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-300">Volume</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
