"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/tenant-context";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import type { Supplier, PurchaseOrderItem } from "@/lib/procurement-types";

interface CreatePurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface POItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_percent: number;
  line_total: number;
  price_alert?: boolean;
  avg_price?: number;
}

export function CreatePurchaseOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePurchaseOrderDialogProps) {
  const { toast } = useToast();
  const { tenantId: currentTenant } = useTenant();
  const { t } = useLanguage();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [vendorCustomers, setVendorCustomers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: "",
    branch_id: "",
    project_id: "",
    expected_delivery_date: "",
    shipping_cost: 0,
    tax_amount: 0,
    discount_amount: 0,
    payment_terms: "",
    notes: "",
  });

  const [items, setItems] = useState<POItem[]>([]);

  useEffect(() => {
    if (open && currentTenant) {
      loadData();
    }
  }, [open, currentTenant]);

  const loadData = async () => {
    if (!currentTenant) return;

    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", currentTenant)
      .order("name");

    const { data: customersData } = await supabase
      .from("customers")
      .select("id, company_title, name")
      .eq("tenant_id", currentTenant)
      .in("account_type", ["vendor", "both"])
      .order("company_title");

    setVendorCustomers(
      (customersData || []).map((c) => ({
        id: c.id,
        name: (c.company_title || c.name || "").trim() || "—",
      }))
    );

    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, sku, unit, stock_quantity, purchase_price")
      .eq("tenant_id", currentTenant)
      .order("name");

    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name")
      .eq("tenant_id", currentTenant)
      .order("name");

    const { data: projectsData } = await supabase
      .from("projects")
      .select("id, name, status")
      .eq("tenant_id", currentTenant)
      .in("status", ["planning", "in_progress"])
      .order("name");

    setSuppliers(suppliersData || []);
    setProducts(productsData || []);
    setBranches(branchesData || []);
    setProjects(projectsData || []);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        tax_percent: 18,
        line_total: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = product.purchase_price || 0;
      }
    }

    if (["quantity", "unit_price", "discount_percent", "tax_percent"].includes(field)) {
      const item = newItems[index];
      const subtotal = item.quantity * item.unit_price;
      const discount = subtotal * (item.discount_percent / 100);
      const taxableAmount = subtotal - discount;
      const tax = taxableAmount * (item.tax_percent / 100);
      item.line_total = taxableAmount + tax;
    }

    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const base = item.quantity * item.unit_price;
      const discount = base * (item.discount_percent / 100);
      return sum + (base - discount);
    }, 0);

    const tax = items.reduce((sum, item) => {
      const base = item.quantity * item.unit_price;
      const discount = base * (item.discount_percent / 100);
      const taxableAmount = base - discount;
      return sum + (taxableAmount * (item.tax_percent / 100));
    }, 0);

    const total = subtotal + tax + formData.shipping_cost - formData.discount_amount;

    return { subtotal, tax, total };
  };

  const resolveSupplierId = async (): Promise<string> => {
    const raw = formData.supplier_id;
    if (raw.startsWith("customer:")) {
      const customerId = raw.replace("customer:", "");
      const customer = vendorCustomers.find((c) => c.id === customerId);
      if (!customer) throw new Error("Customer not found");
      const { data: newSupplierId, error: rpcErr } = await supabase.rpc(
        "create_supplier_from_customer",
        { p_tenant_id: currentTenant, p_name: customer.name }
      );
      if (rpcErr) throw rpcErr;
      if (!newSupplierId) throw new Error("Failed to create supplier");
      return newSupplierId as string;
    }
    return raw.replace("supplier:", "");
  };

  const handleSubmit = async () => {
    if (!currentTenant || items.length === 0) {
      toast({
        title: "Error",
        description: t.procurement.addOneItemError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supplierId = await resolveSupplierId();
      const { subtotal, tax, total } = calculateTotals();

      const { data: poNumberData } = await supabase.rpc("generate_po_number", {
        p_tenant_id: currentTenant,
      });

      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          tenant_id: currentTenant,
          po_number: poNumberData,
          supplier_id: supplierId,
          branch_id: formData.branch_id || null,
          project_id: formData.project_id || null,
          expected_delivery_date: formData.expected_delivery_date || null,
          subtotal,
          shipping_cost: formData.shipping_cost,
          tax_amount: tax,
          discount_amount: formData.discount_amount,
          total_amount: total,
          payment_terms: formData.payment_terms,
          notes: formData.notes,
          status: "draft",
        })
        .select()
        .single();

      if (poError) throw poError;

      const poItems = items.map((item) => ({
        tenant_id: currentTenant,
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_percent: item.tax_percent,
        line_total: item.line_total,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_order_items")
        .insert(poItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: t.procurement.createSuccess.replace("{poNumber}", String(poNumberData)),
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      const msg = error?.message || error?.error_description || error?.details || t.procurement.createError;
      console.error("Error creating PO:", error);
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      supplier_id: "",
      branch_id: "",
      project_id: "",
      expected_delivery_date: "",
      shipping_cost: 0,
      tax_amount: 0,
      discount_amount: 0,
      payment_terms: "",
      notes: "",
    });
    setItems([]);
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-900 flex items-center gap-2">
            <span className="text-[#00D4AA]">◆</span> {t.procurement.createPurchaseOrder}
            <Badge variant="outline" className="ml-auto bg-muted">
              {t.procurement.stepOf.replace("{step}", String(step))}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">{t.procurement.supplierRequired}</Label>
                <Select
                  value={formData.supplier_id || undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                >
                  <SelectTrigger className="bg-background border text-gray-900">
                    <SelectValue placeholder={t.procurement.selectSupplier} />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" position="popper">
                    {suppliers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground font-normal text-xs">
                          {t.procurement.suppliers}
                        </SelectLabel>
                        {suppliers.map((supplier) => (
                          <SelectItem key={`s-${supplier.id}`} value={`supplier:${supplier.id}`}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {vendorCustomers.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground font-normal text-xs">
                          {t.procurement.suppliersFromCariler ?? "Cariler (Tedarikçi)"}
                        </SelectLabel>
                        {vendorCustomers.map((c) => (
                          <SelectItem key={`c-${c.id}`} value={`customer:${c.id}`}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {suppliers.length === 0 && vendorCustomers.length === 0 && (
                      <div className="px-2 py-3 text-sm text-muted-foreground">
                        {t.procurement.noSuppliersHint}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">{t.procurement.expectedDelivery}</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_delivery_date: e.target.value })
                  }
                  className="bg-background border text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">{t.procurement.branch}</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branch_id: value })
                  }
                >
                  <SelectTrigger className="bg-background border text-gray-900">
                    <SelectValue placeholder={t.procurement.selectBranchOptional} />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" position="popper">
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">{t.procurement.project}</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger className="bg-background border text-gray-900">
                    <SelectValue placeholder={t.procurement.selectProjectOptional} />
                  </SelectTrigger>
                  <SelectContent className="z-[100]" position="popper">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">{t.procurement.paymentTerms}</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData({ ...formData, payment_terms: e.target.value })
                }
                placeholder={t.procurement.paymentTermsPlaceholder}
                className="bg-background border text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">{t.procurement.notes}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder={t.procurement.notesPlaceholder}
                className="bg-background border text-gray-900"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t.common.cancel}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.supplier_id}
                className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
              >
                {t.procurement.nextAddItems}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t.procurement.orderItems}</h3>
              <Button
                size="sm"
                onClick={addItem}
                className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
              >
                <Plus className="h-4 w-4 mr-1" />
                {t.procurement.addItem}
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-muted/30"
                >
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <Label className="text-gray-700 text-xs">{t.procurement.product}</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, "product_id", value)}
                      >
                        <SelectTrigger className="bg-background border text-gray-900 h-8">
                          <SelectValue placeholder={t.procurement.product} />
                        </SelectTrigger>
                        <SelectContent className="z-[100]" position="popper">
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-gray-700 text-xs">{t.procurement.quantity}</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="bg-background border text-gray-900 h-8"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 text-xs">{t.procurement.unitPrice}</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                        className="bg-background border text-gray-900 h-8"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 text-xs">{t.procurement.taxPercent}</Label>
                      <Input
                        type="number"
                        value={item.tax_percent}
                        onChange={(e) =>
                          updateItem(index, "tax_percent", parseFloat(e.target.value) || 0)
                        }
                        className="bg-background border text-gray-900 h-8"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-gray-700 text-xs">{t.procurement.total}</Label>
                        <div className="h-8 flex items-center text-sm font-semibold text-[#00D4AA]">
                          {item.line_total.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t.procurement.noItemsYet}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>{t.procurement.subtotal}:</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)} TRY</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>{t.procurement.tax}:</span>
                <span className="font-semibold">{totals.tax.toFixed(2)} TRY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t.procurement.shipping}:</span>
                <Input
                  type="number"
                  value={formData.shipping_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 bg-background border text-gray-900 h-8 text-right"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">{t.procurement.discount}:</span>
                <Input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 bg-background border text-gray-900 h-8 text-right"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-xl font-bold text-[#00D4AA] pt-2 border-t">
                <span>{t.procurement.total}:</span>
                <span>{totals.total.toFixed(2)} TRY</span>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                {t.procurement.back}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || items.length === 0}
                  className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
                >
                  {loading ? t.procurement.creating : t.procurement.createPurchaseOrder}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
