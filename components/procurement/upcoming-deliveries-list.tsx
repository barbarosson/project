"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Calendar, Package } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { PurchaseOrder } from "@/lib/procurement-types";

interface UpcomingDeliveriesListProps {
  orders: PurchaseOrder[];
}

export function UpcomingDeliveriesList({ orders }: UpcomingDeliveriesListProps) {
  const upcomingOrders = orders
    .filter(po =>
      (po.status === 'ordered' || po.status === 'approved') &&
      po.expected_delivery_date
    )
    .sort((a, b) =>
      new Date(a.expected_delivery_date!).getTime() -
      new Date(b.expected_delivery_date!).getTime()
    )
    .slice(0, 5);

  const getUrgencyColor = (deliveryDate: string) => {
    const daysUntil = differenceInDays(new Date(deliveryDate), new Date());
    if (daysUntil < 0) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (daysUntil <= 3) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
  };

  if (upcomingOrders.length === 0) {
    return (
      <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-cyan-400" />
            Upcoming Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-slate-400">
            No upcoming deliveries
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Truck className="h-5 w-5 text-cyan-400" />
          Upcoming Deliveries
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingOrders.map((order) => {
            const daysUntil = differenceInDays(
              new Date(order.expected_delivery_date!),
              new Date()
            );

            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-white">{order.po_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-400">
                    {order.supplier?.name || 'Unknown Supplier'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-slate-300">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.expected_delivery_date!), 'MMM dd')}
                    </div>
                    <p className={`text-xs ${
                      daysUntil < 0
                        ? 'text-red-400'
                        : daysUntil <= 3
                        ? 'text-amber-400'
                        : 'text-cyan-400'
                    }`}>
                      {daysUntil < 0
                        ? `${Math.abs(daysUntil)} days late`
                        : daysUntil === 0
                        ? 'Today'
                        : daysUntil === 1
                        ? 'Tomorrow'
                        : `in ${daysUntil} days`}
                    </p>
                  </div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      daysUntil < 0
                        ? 'bg-red-400 animate-pulse'
                        : daysUntil <= 3
                        ? 'bg-amber-400'
                        : 'bg-cyan-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
