"use client";

import { Package, FileCheck, Truck, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ProcurementT = {
  activeOrders: string;
  pendingApprovals: string;
  upcomingDeliveries: string;
  totalSpentMtd: string;
};

interface ProcurementStatsCardsProps {
  stats: {
    activeOrders: number;
    pendingApprovals: number;
    upcomingDeliveries: number;
    totalSpent: number;
  };
  currency?: string;
  t?: ProcurementT;
}

export function ProcurementStatsCards({ stats, currency = "TRY", t }: ProcurementStatsCardsProps) {
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
      title: t?.activeOrders ?? "Active Orders",
      value: stats.activeOrders.toString(),
      icon: Package,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200"
    },
    {
      title: t?.pendingApprovals ?? "Pending Approvals",
      value: stats.pendingApprovals.toString(),
      icon: FileCheck,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200"
    },
    {
      title: t?.upcomingDeliveries ?? "Upcoming Deliveries",
      value: stats.upcomingDeliveries.toString(),
      icon: Truck,
      bgColor: "bg-cyan-500/10",
      iconColor: "text-cyan-600",
      borderColor: "border-cyan-200"
    },
    {
      title: t?.totalSpentMtd ?? "Total Spent (MTD)",
      value: formatCurrency(stats.totalSpent),
      icon: DollarSign,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      borderColor: "border-emerald-200"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`border ${card.borderColor} bg-card hover:bg-muted/50 transition-colors`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
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
