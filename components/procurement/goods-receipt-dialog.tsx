"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    setCheckedItems(new Set());
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

    if (checkedItems.size === 0) {
      toast({
        title: "No items checked",
        description: "Please verify and check at least one item",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          status: "received",
          actual_delivery_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", purchaseOrder.id);

      if (error) throw error;

      toast({
        title: "Goods Received",
        description: `${purchaseOrder.po_number} has been marked as received. Inventory updated automatically.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error receiving goods:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to receive goods",
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-cyan-400" />
            Goods Receipt: {purchaseOrder.po_number}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">
              {purchaseOrder.supplier?.name || "Unknown Supplier"}
            </Badge>
            {purchaseOrder.expected_delivery_date && (
              <span className="text-sm text-slate-400">
                Expected: {new Date(purchaseOrder.expected_delivery_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
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
                className="border-slate-600"
              />
              <span className="font-medium text-white">
                {allChecked
                  ? "All items verified"
                  : someChecked
                  ? `${checkedItems.size} of ${items.length} items verified`
                  : "Verify all items"}
              </span>
            </div>
            <Badge
              variant="outline"
              className={
                allChecked
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "text-slate-400 border-slate-600"
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
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : "bg-slate-800/30 border-slate-700 hover:border-slate-600"
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleItem(item.id)}
                      className={`mt-1 ${
                        isChecked ? "border-emerald-500" : "border-slate-600"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-white">
                            {item.product?.name || "Unknown Product"}
                          </h4>
                          <p className="text-sm text-slate-400">
                            SKU: {item.product?.sku || "N/A"}
                          </p>
                        </div>
                        {isChecked && (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Quantity</p>
                          <p className="font-semibold text-white">
                            {item.quantity} {item.product?.unit || "pcs"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Unit Price</p>
                          <p className="font-semibold text-white">
                            {item.unit_price.toFixed(2)} TRY
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Tax</p>
                          <p className="font-semibold text-white">{item.tax_percent}%</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Line Total</p>
                          <p className="font-semibold text-cyan-400">
                            {item.line_total.toFixed(2)} TRY
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
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No items in this purchase order</p>
            </div>
          )}

          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span className="text-slate-300">Total Amount:</span>
              <span className="text-cyan-400">
                {purchaseOrder.total_amount.toFixed(2)} {purchaseOrder.currency}
              </span>
            </div>
          </div>

          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-cyan-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-cyan-400 mb-1">
                  Important: Automatic Actions
                </p>
                <ul className="text-slate-300 space-y-1">
                  <li>• Inventory will be updated automatically for all items</li>
                  <li>• A draft expense invoice will be created</li>
                  <li>• Supplier statistics will be updated</li>
                  <li>• Stock levels will reflect the new quantities immediately</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReceiveGoods}
              disabled={loading || checkedItems.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Processing..." : "Confirm Goods Receipt"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
