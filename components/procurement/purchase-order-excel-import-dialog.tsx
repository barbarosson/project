"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/tenant-context";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import { Upload, FileSpreadsheet, Loader2, Download } from "lucide-react";
import * as XLSX from "xlsx";

const TEMPLATE_HEADERS = [
  "supplier_name",
  "order_date",
  "expected_delivery_date",
  "product_sku",
  "quantity",
  "unit_price",
];

const HEADER_ALIASES: Record<string, string> = {
  supplier_name: "supplier_name",
  "tedarikçi adı": "supplier_name",
  "supplier name": "supplier_name",
  order_date: "order_date",
  "sipariş tarihi": "order_date",
  "order date": "order_date",
  expected_delivery_date: "expected_delivery_date",
  "teslimat tarihi": "expected_delivery_date",
  "expected delivery": "expected_delivery_date",
  product_sku: "product_sku",
  "ürün kodu": "product_sku",
  sku: "product_sku",
  quantity: "quantity",
  miktar: "quantity",
  unit_price: "unit_price",
  "birim fiyat": "unit_price",
  "unit price": "unit_price",
};

function cellToString(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).trim();
}

function parseExcel(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const wb = XLSX.read(buffer, { type: "array" });
  const firstSheet = wb.Sheets[wb.SheetNames[0]];
  if (!firstSheet) return { headers: [], rows: [] };
  const aoa = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }) as unknown[][];
  if (aoa.length === 0) return { headers: [], rows: [] };
  const headers = (aoa[0] || []).map(cellToString);
  const colCount = headers.length;
  const rows = aoa
    .slice(1)
    .map((row) => {
      const arr = (Array.isArray(row) ? row : []).map(cellToString);
      while (arr.length < colCount) arr.push("");
      return arr.slice(0, colCount);
    })
    .filter((r) => r.some((c) => c !== ""));
  return { headers, rows };
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, " ").trim();
}

function parseNum(s: string): number {
  const v = String(s || "").replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(v);
  return Number.isNaN(n) ? 0 : n;
}

function parseDate(s: string): string | null {
  const v = String(s || "").trim();
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

interface PurchaseOrderExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PurchaseOrderExcelImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: PurchaseOrderExcelImportDialogProps) {
  const { toast } = useToast();
  const { tenantId } = useTenant();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      TEMPLATE_HEADERS,
      ["Örnek Tedarikçi A.Ş.", "2025-03-01", "2025-03-15", "ÜRUN-001", "10", "100.00"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Satınalma");
    XLSX.writeFile(wb, "satin_alma_siparisi_sablonu.xlsx");
    toast({ title: t.common.downloadTemplate, variant: "default" });
  };

  const mapHeaders = (headers: string[]): Record<string, number> => {
    const map: Record<string, number> = {};
    headers.forEach((h, i) => {
      const n = normalizeHeader(h);
      const key = HEADER_ALIASES[n] || HEADER_ALIASES[n.replace(/\s/g, "_")];
      if (key) map[key] = i;
    });
    return map;
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const { headers, rows } = parseExcel(buf);
      const colMap = mapHeaders(headers);
      if (colMap.supplier_name === undefined || colMap.order_date === undefined || colMap.product_sku === undefined || colMap.quantity === undefined || colMap.unit_price === undefined) {
        toast({
          title: t.procurement.createError,
          description: "Excel sütunları: supplier_name, order_date, product_sku, quantity, unit_price (expected_delivery_date opsiyonel)",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      const { data: suppliers } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("tenant_id", tenantId);
      const supplierByName = new Map<string, string>((suppliers || []).map((s) => [s.name.trim().toLowerCase(), s.id]));

      const { data: products } = await supabase
        .from("products")
        .select("id, sku")
        .eq("tenant_id", tenantId);
      const productBySku = new Map<string, string>((products || []).map((p) => [(p.sku || "").trim().toLowerCase(), p.id]));

      type Row = { supplier_name: string; order_date: string; expected_delivery_date: string | null; product_sku: string; quantity: number; unit_price: number };
      const parsed: Row[] = rows.map((row) => ({
        supplier_name: row[colMap.supplier_name] ?? "",
        order_date: parseDate(row[colMap.order_date] ?? "") ?? new Date().toISOString().slice(0, 10),
        expected_delivery_date: parseDate(row[colMap.expected_delivery_date] ?? "") ?? null,
        product_sku: (row[colMap.product_sku] ?? "").trim(),
        quantity: parseNum(row[colMap.quantity] ?? "0"),
        unit_price: parseNum(row[colMap.unit_price] ?? "0"),
      })).filter((r) => r.supplier_name && r.product_sku && r.quantity > 0);

      const groups = new Map<string, Row[]>();
      parsed.forEach((r) => {
        const key = `${r.supplier_name.toLowerCase().trim()}|${r.order_date}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      });

      let created = 0;
      let skipped = 0;
      for (const [, groupRows] of groups) {
        const first = groupRows[0];
        const supplierId = supplierByName.get(first.supplier_name.toLowerCase().trim());
        if (!supplierId) {
          skipped++;
          continue;
        }
        const { data: poNumberData } = await supabase.rpc("generate_po_number", { p_tenant_id: tenantId });
        const orderDate = first.order_date;
        const expectedDelivery = first.expected_delivery_date;

        let subtotal = 0;
        const items: { product_id: string; quantity: number; unit_price: number; line_total: number }[] = [];
        for (const row of groupRows) {
          const productId = productBySku.get(row.product_sku.toLowerCase());
          if (!productId) continue;
          const lineTotal = row.quantity * row.unit_price;
          subtotal += lineTotal;
          items.push({
            product_id: productId,
            quantity: row.quantity,
            unit_price: row.unit_price,
            line_total: lineTotal,
          });
        }
        if (items.length === 0) {
          skipped++;
          continue;
        }

        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .insert({
            tenant_id: tenantId,
            po_number: poNumberData,
            supplier_id: supplierId,
            order_date: orderDate,
            expected_delivery_date: expectedDelivery,
            subtotal,
            shipping_cost: 0,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: subtotal,
            currency: "TRY",
            status: "draft",
          })
          .select()
          .single();

        if (poError) {
          toast({ title: t.procurement.createError, description: poError.message, variant: "destructive" });
          setUploading(false);
          return;
        }

        const poItems = items.map((item) => ({
          tenant_id: tenantId,
          purchase_order_id: po.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          received_quantity: 0,
          discount_percent: 0,
          discount_amount: 0,
          tax_percent: 0,
          tax_amount: 0,
          line_total: item.line_total,
        }));
        await supabase.from("purchase_order_items").insert(poItems);
        created++;
      }

      toast({
        title: t.procurement.createSuccess.replace("{poNumber}", `${created} sipariş`),
        description: skipped > 0 ? `${skipped} satır/grup atlandı (tedarikçi veya ürün bulunamadı).` : undefined,
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
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#00D4AA]" />
            {t.procurement.bulkImport} – Excel
          </DialogTitle>
          <DialogDescription>
            Excel dosyasında sütunlar: Tedarikçi adı, Sipariş tarihi, Teslimat tarihi (opsiyonel), Ürün kodu (SKU), Miktar, Birim fiyat. Aynı tedarikçi ve tarih bir siparişte birleştirilir.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            disabled={loading}
            className="border border-input bg-white hover:bg-gray-50 font-semibold text-contrast-body"
          >
            <Download className="h-4 w-4 mr-2" />
            {t.common.downloadTemplate}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFile}
          />
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            {uploading ? "Yükleniyor..." : t.common.import}
          </Button>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
