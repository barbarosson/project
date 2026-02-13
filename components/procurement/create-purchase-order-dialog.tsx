"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/use-tenant";
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

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
      .eq("status", "active")
      .order("name");

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

  const handleSubmit = async () => {
    if (!currentTenant || items.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the purchase order",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { subtotal, tax, total } = calculateTotals();

      const { data: poNumberData } = await supabase.rpc("generate_po_number", {
        p_tenant_id: currentTenant,
      });

      const { data: po, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          tenant_id: currentTenant,
          po_number: poNumberData,
          supplier_id: formData.supplier_id,
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
        description: `Purchase order ${poNumberData} created successfully`,
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating PO:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <span className="text-cyan-400">◆</span> Create Purchase Order
            <Badge variant="outline" className="ml-auto">
              Step {step} of 2
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Supplier *</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, supplier_id: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Expected Delivery</Label>
                <Input
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expected_delivery_date: e.target.value })
                  }
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Branch</Label>
                <Select
                  value={formData.branch_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, branch_id: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select branch (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_id: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select project (optional)" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Label className="text-slate-300">Payment Terms</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) =>
                  setFormData({ ...formData, payment_terms: e.target.value })
                }
                placeholder="e.g., Net 30, Net 60, Cash on Delivery"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                className="bg-slate-800 border-slate-700 text-white"
                rows={3}
              />
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
                onClick={() => setStep(2)}
                disabled={!formData.supplier_id}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Next: Add Items
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Order Items</h3>
              <Button
                size="sm"
                onClick={addItem}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
                >
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-2">
                      <Label className="text-slate-300 text-xs">Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateItem(index, "product_id", value)}
                      >
                        <SelectTrigger className="bg-slate-900 border-slate-600 text-white h-8">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-slate-300 text-xs">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="bg-slate-900 border-slate-600 text-white h-8"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300 text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                        className="bg-slate-900 border-slate-600 text-white h-8"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <Label className="text-slate-300 text-xs">Tax %</Label>
                      <Input
                        type="number"
                        value={item.tax_percent}
                        onChange={(e) =>
                          updateItem(index, "tax_percent", parseFloat(e.target.value) || 0)
                        }
                        className="bg-slate-900 border-slate-600 text-white h-8"
                        min="0"
                        step="1"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-slate-300 text-xs">Total</Label>
                        <div className="h-8 flex items-center text-sm font-semibold text-cyan-400">
                          {item.line_total.toFixed(2)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeItem(index)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)} TRY</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tax:</span>
                <span className="font-semibold">{totals.tax.toFixed(2)} TRY</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Shipping:</span>
                <Input
                  type="number"
                  value={formData.shipping_cost}
                  onChange={(e) =>
                    setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 bg-slate-800 border-slate-700 text-white h-8 text-right"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Discount:</span>
                <Input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })
                  }
                  className="w-32 bg-slate-800 border-slate-700 text-white h-8 text-right"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex justify-between text-xl font-bold text-cyan-400 pt-2 border-t border-slate-700">
                <span>Total:</span>
                <span>{totals.total.toFixed(2)} TRY</span>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-slate-700"
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || items.length === 0}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {loading ? "Creating..." : "Create Purchase Order"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
