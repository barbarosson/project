"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { Supplier } from "@/lib/procurement-types";

type ProcurementT = {
  supplierPerformance: string;
  qualityVsSpeedVsVolume: string;
  noSupplierData: string;
};

interface SupplierPerformanceChartProps {
  suppliers: Supplier[];
  t?: ProcurementT;
}

export function SupplierPerformanceChart({ suppliers, t }: SupplierPerformanceChartProps) {
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
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <span className="text-[#00D4AA]">◆</span> {t?.supplierPerformance ?? "Supplier Performance"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-gray-500">
            {t?.noSupplierData ?? "No supplier data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <span className="text-[#00D4AA]">◆</span> {t?.supplierPerformance ?? "Supplier Performance"}
        </CardTitle>
        <p className="text-sm text-gray-500">{t?.qualityVsSpeedVsVolume ?? "Quality vs. Speed vs. Volume"}</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9ca3af' }}
            />
            <Radar
              name="Quality"
              dataKey="quality"
              stroke="#00D4AA"
              fill="#00D4AA"
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
            <div className="w-3 h-3 rounded-full bg-[#00D4AA]" />
            <span className="text-sm text-gray-600">Quality</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-gray-600">Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-gray-600">Volume</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
