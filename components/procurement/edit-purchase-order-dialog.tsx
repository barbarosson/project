"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import type { PurchaseOrder } from "@/lib/procurement-types";

interface EditPurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { value: PurchaseOrder["status"]; labelKey: string }[] = [
  { value: "draft", labelKey: "draft" },
  { value: "approved", labelKey: "approved" },
  { value: "ordered", labelKey: "ordered" },
  { value: "partially_received", labelKey: "partially_received" },
  { value: "received", labelKey: "received" },
  { value: "cancelled", labelKey: "cancelled" },
];

export function EditPurchaseOrderDialog({
  open,
  onOpenChange,
  purchaseOrder,
  onSuccess,
}: EditPurchaseOrderDialogProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PurchaseOrder["status"]>("draft");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && purchaseOrder) {
      setStatus(purchaseOrder.status);
      setExpectedDeliveryDate(
        purchaseOrder.expected_delivery_date
          ? purchaseOrder.expected_delivery_date.slice(0, 10)
          : ""
      );
      setNotes(purchaseOrder.notes || "");
    }
  }, [open, purchaseOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrder?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          status,
          expected_delivery_date: expectedDeliveryDate || null,
          notes: notes.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", purchaseOrder.id);

      if (error) throw error;
      toast({
        title: t.procurement.updateSuccess,
        variant: "default",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: t.procurement.createError,
        description: err?.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!purchaseOrder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">
            {t.common.edit} – {purchaseOrder.po_number}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-gray-700">{t.procurement.allStatus}</Label>
            <Select value={status} onValueChange={(v: PurchaseOrder["status"]) => setStatus(v)}>
              <SelectTrigger className="mt-1 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {((t.procurement as unknown) as Record<string, string>)[opt.labelKey] ?? opt.labelKey}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-gray-700">{t.procurement.expectedDelivery}</Label>
            <Input
              type="date"
              value={expectedDeliveryDate}
              onChange={(e) => setExpectedDeliveryDate(e.target.value)}
              className="mt-1 bg-white border-gray-300"
            />
          </div>
          <div>
            <Label className="text-gray-700">{t.procurement.notes}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.procurement.notesPlaceholder}
              className="mt-1 bg-white border-gray-300 min-h-[80px]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.common.save}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
