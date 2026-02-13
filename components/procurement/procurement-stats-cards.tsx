"use client";

import { Package, FileCheck, Truck, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProcurementStatsCardsProps {
  stats: {
    activeOrders: number;
    pendingApprovals: number;
    upcomingDeliveries: number;
    totalSpent: number;
  };
  currency?: string;
}

export function ProcurementStatsCards({ stats, currency = "TRY" }: ProcurementStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const cards = [
    {
      title: "Active Orders",
      value: stats.activeOrders.toString(),
      icon: Package,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/20"
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: FileCheck,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/20"
    },
    {
      title: "Upcoming Deliveries",
      value: stats.upcomingDeliveries.toString(),
      icon: Truck,
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      borderColor: "border-cyan-500/20"
    },
    {
      title: "Total Spent (MTD)",
      value: formatCurrency(stats.totalSpent),
      icon: DollarSign,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      borderColor: "border-emerald-500/20"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`border ${card.borderColor} bg-slate-900/50 backdrop-blur-sm hover:bg-slate-900/70 transition-colors`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-white mt-2">{card.value}</p>
                </div>
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
