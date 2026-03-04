"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Calendar, Package } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { PurchaseOrder } from "@/lib/procurement-types";

type ProcurementT = {
  upcomingDeliveriesTitle: string;
  noUpcomingDeliveries: string;
  unknownSupplier: string;
};

interface UpcomingDeliveriesListProps {
  orders: PurchaseOrder[];
  t?: ProcurementT;
}

export function UpcomingDeliveriesList({ orders, t }: UpcomingDeliveriesListProps) {
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
    if (daysUntil < 0) return "bg-red-500/10 text-red-600 border-red-200";
    if (daysUntil <= 3) return "bg-amber-500/10 text-amber-600 border-amber-200";
    return "bg-cyan-500/10 text-cyan-600 border-cyan-200";
  };

  const title = t?.upcomingDeliveriesTitle ?? "Upcoming Deliveries";
  const emptyText = t?.noUpcomingDeliveries ?? "No upcoming deliveries";
  const unknownSupplier = t?.unknownSupplier ?? "Unknown Supplier";

  if (upcomingOrders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-[#00D4AA]" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-gray-500">
            {emptyText}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Truck className="h-5 w-5 text-[#00D4AA]" />
          {title}
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
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:border-[#00D4AA]/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{order.po_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {order.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {order.supplier?.name || unknownSupplier}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(order.expected_delivery_date!), 'MMM dd')}
                    </div>
                    <p className={`text-xs ${
                      daysUntil < 0
                        ? 'text-red-600'
                        : daysUntil <= 3
                        ? 'text-amber-600'
                        : 'text-[#00D4AA]'
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
                        ? 'bg-red-500 animate-pulse'
                        : daysUntil <= 3
                        ? 'bg-amber-500'
                        : 'bg-[#00D4AA]'
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
