"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import {
  Package,
  FileText,
  Calendar,
  TruckIcon,
  Loader2,
} from "lucide-react";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/procurement-types";

interface PurchaseOrderDetailSheetProps {
  purchaseOrder: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderDetailSheet({
  purchaseOrder,
  open,
  onOpenChange,
}: PurchaseOrderDetailSheetProps) {
  const { t } = useLanguage();
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && purchaseOrder?.id) {
      setLoading(true);
      supabase
        .from("purchase_order_items")
        .select(`
          *,
          product:products(id, name, sku, unit)
        `)
        .eq("purchase_order_id", purchaseOrder.id)
        .then(({ data }) => {
          setItems(data || []);
        })
        .finally(() => setLoading(false));
    }
  }, [open, purchaseOrder?.id]);

  if (!purchaseOrder) return null;

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 border-gray-200",
    approved: "bg-cyan-50 text-cyan-700 border-cyan-200",
    ordered: "bg-blue-50 text-blue-700 border-blue-200",
    partially_received: "bg-amber-50 text-amber-700 border-amber-200",
    received: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-gray-900">
            <FileText className="h-5 w-5 text-[#00D4AA]" />
            {purchaseOrder.po_number}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={statusColors[purchaseOrder.status] || "bg-gray-100 text-gray-700"}
            >
              {((t.procurement as unknown) as Record<string, string>)[purchaseOrder.status] ?? purchaseOrder.status}
            </Badge>
            <span className="text-sm text-gray-500">
              {purchaseOrder.supplier?.name || t.procurement.unknownSupplier}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-gray-500">{t.procurement.orderDate}</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(purchaseOrder.order_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>
            {purchaseOrder.expected_delivery_date && (
              <div className="flex items-center gap-2">
                <TruckIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">{t.procurement.expectedDelivery}</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(purchaseOrder.expected_delivery_date), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {purchaseOrder.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">{t.procurement.notes}</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{purchaseOrder.notes}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#00D4AA]" />
              {t.procurement.orderItems}
            </h4>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#00D4AA]" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium text-gray-700">{t.procurement.product}</th>
                      <th className="text-right p-2 font-medium text-gray-700">{t.procurement.quantity}</th>
                      <th className="text-right p-2 font-medium text-gray-700">{t.procurement.unitPrice}</th>
                      <th className="text-right p-2 font-medium text-gray-700">{t.procurement.total}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 text-gray-900">
                          {(item as any).product?.name ?? "-"}
                          {(item as any).product?.sku && (
                            <span className="text-gray-500 ml-1">({(item as any).product.sku})</span>
                          )}
                        </td>
                        <td className="p-2 text-right text-gray-900">
                          {item.quantity} {(item as any).product?.unit ?? ""}
                        </td>
                        <td className="p-2 text-right text-gray-900">{item.unit_price.toFixed(2)}</td>
                        <td className="p-2 text-right font-medium text-gray-900">{item.line_total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length === 0 && !loading && (
                  <p className="p-4 text-center text-gray-500">{t.procurement.noItemsYet}</p>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t flex justify-between items-center">
            <span className="text-sm text-gray-500">{t.procurement.totalAmount}</span>
            <span className="text-lg font-bold text-[#00D4AA]">
              {purchaseOrder.total_amount.toFixed(2)} {purchaseOrder.currency}
            </span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
