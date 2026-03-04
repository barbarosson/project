"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/procurement-types";

interface GoodsReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess: () => void;
}

export function GoodsReceiptDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSuccess,
}: GoodsReceiptDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const g = t.procurement.goodsReceipt;

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && purchaseOrder) {
      loadItems();
    }
  }, [open, purchaseOrder]);

  const loadItems = async () => {
    if (!purchaseOrder) return;

    const { data, error } = await supabase
      .from("purchase_order_items")
      .select(`
        *,
        product:products(id, name, sku, unit)
      `)
      .eq("purchase_order_id", purchaseOrder.id);

    if (error) {
      console.error("Error loading items:", error);
      return;
    }

    setItems(data || []);
    setCheckedItems(new Set((data || []).map((i) => i.id)));
  };

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  const handleReceiveGoods = async () => {
    if (!purchaseOrder) return;

    setLoading(true);

    try {
      const { error } = await supabase.rpc("receive_purchase_order", {
        p_po_id: purchaseOrder.id,
      });

      if (error) {
        throw new Error(error.message || error.details || String(error));
      }

      toast({
        title: g?.receivedTitle ?? "Mal Teslim Alındı",
        description: (g?.receivedDesc ?? "{poNumber} teslim alındı.").replace("{poNumber}", purchaseOrder.po_number),
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const msg = error?.message || error?.error_description || error?.details || g?.errorReceiving || "İşlem başarısız.";
      const code = error?.code ? ` [${error.code}]` : "";
      console.error("Error receiving goods:", error);
      toast({
        title: t.procurement?.loadDataError ?? "Hata",
        description: `${msg}${code}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!purchaseOrder) return null;

  const allChecked = items.length > 0 && checkedItems.size === items.length;
  const someChecked = checkedItems.size > 0 && checkedItems.size < items.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-[#00D4AA]" />
            {g.title}: {purchaseOrder.po_number}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-[#00D4AA] border-[#00D4AA]/30 bg-[#00D4AA]/5">
              {purchaseOrder.supplier?.name || g.unknownSupplier}
            </Badge>
            {purchaseOrder.expected_delivery_date && (
              <span className="text-sm text-gray-500">
                {g.expected}: {new Date(purchaseOrder.expected_delivery_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setCheckedItems(new Set(items.map((i) => i.id)));
                  } else {
                    setCheckedItems(new Set());
                  }
                }}
                className="border-gray-300"
              />
              <span className="font-medium text-gray-900">
                {allChecked
                  ? g.allItemsVerified
                  : someChecked
                  ? g.itemsVerifiedCount.replace("{checked}", String(checkedItems.size)).replace("{total}", String(items.length))
                  : g.verifyAllItems}
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                allChecked
                  ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                  : "text-gray-500 border-gray-300"
              }
            >
              {checkedItems.size} / {items.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {items.map((item) => {
              const isChecked = checkedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg transition-all cursor-pointer ${
                    isChecked
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50/80 border-gray-200 hover:border-[#00D4AA]/50"
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleItem(item.id)}
                      className={`mt-1 ${isChecked ? "border-emerald-500" : "border-gray-300"}`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {(item as any).product?.name || g.unknownProduct}
                          </h4>
                          <p className="text-sm text-gray-500">
                            SKU: {(item as any).product?.sku || "N/A"}
                          </p>
                        </div>
                        {isChecked && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{g.quantity}</p>
                          <p className="font-semibold text-gray-900">
                            {item.quantity} {(item as any).product?.unit || "adet"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{g.unitPrice}</p>
                          <p className="font-semibold text-gray-900">
                            {item.unit_price.toFixed(2)} {purchaseOrder.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">{g.tax}</p>
                          <p className="font-semibold text-gray-900">{item.tax_percent}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{g.lineTotal}</p>
                          <p className="font-semibold text-[#00D4AA]">
                            {item.line_total.toFixed(2)} {purchaseOrder.currency}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{g.noItemsInPO}</p>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span className="text-gray-700">{g.totalAmount}:</span>
              <span className="text-[#00D4AA]">
                {purchaseOrder.total_amount.toFixed(2)} {purchaseOrder.currency}
              </span>
            </div>
          </div>

          <div className="bg-[#00D4AA]/10 border border-[#00D4AA]/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[#00D4AA] mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-[#00D4AA] mb-1">{g.importantActions}</p>
                <ul className="text-gray-700 space-y-1">
                  <li>• {g.action1}</li>
                  <li>• {g.action2}</li>
                  <li>• {g.action3}</li>
                  <li>• {g.action4}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">
              {g.cancel}
            </Button>
            <Button
              onClick={handleReceiveGoods}
              disabled={loading}
              className="bg-[#00D4AA] hover:bg-[#00B894] text-white"
            >
              {loading ? (g?.processing ?? "İşleniyor...") : (g?.confirmReceipt ?? "Mal Kabulü Onayla")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
