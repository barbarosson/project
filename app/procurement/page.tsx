"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Package,
  Plus,
  Search,
  TruckIcon,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/contexts/tenant-context";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { supabase } from "@/lib/supabase";
import { ProcurementStatsCards } from "@/components/procurement/procurement-stats-cards";
import { SupplierPerformanceChart } from "@/components/procurement/supplier-performance-chart";
import { UpcomingDeliveriesList } from "@/components/procurement/upcoming-deliveries-list";
import { CreatePurchaseOrderDialog } from "@/components/procurement/create-purchase-order-dialog";
import { GoodsReceiptDialog } from "@/components/procurement/goods-receipt-dialog";
import { PurchaseOrderDetailSheet } from "@/components/procurement/purchase-order-detail-sheet";
import { EditPurchaseOrderDialog } from "@/components/procurement/edit-purchase-order-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { PurchaseOrderExcelImportDialog } from "@/components/procurement/purchase-order-excel-import-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PurchaseOrder, Supplier } from "@/lib/procurement-types";
import { format } from "date-fns";

export default function ProcurementPage() {
  const { user } = useAuth();
  const { tenantId: currentTenant } = useTenant();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [goodsReceiptOpen, setGoodsReceiptOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedPOForDetail, setSelectedPOForDetail] = useState<PurchaseOrder | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPOForEdit, setSelectedPOForEdit] = useState<PurchaseOrder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [excelImportOpen, setExcelImportOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant]);

  const loadData = async () => {
    if (!currentTenant) return;

    setLoading(true);

    try {
      const { data: ordersData } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          supplier:suppliers(id, name, reliability_rating, status)
        `)
        .eq("tenant_id", currentTenant)
        .order("created_at", { ascending: false });

      const { data: suppliersData } = await supabase
        .from("suppliers")
        .select("*")
        .eq("tenant_id", currentTenant)
        .order("name");

      setOrders(ordersData || []);
      setSuppliers(suppliersData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: t.procurement.loadDataError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    activeOrders: orders.filter((o) => ["approved", "ordered"].includes(o.status)).length,
    pendingApprovals: orders.filter((o) => o.status === "draft").length,
    upcomingDeliveries: orders.filter(
      (o) => (o.status === "ordered" || o.status === "approved") && o.expected_delivery_date
    ).length,
    totalSpent: orders
      .filter((o) => o.status === "received")
      .reduce((sum, o) => sum + o.total_amount, 0),
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      approved: "bg-cyan-50 text-cyan-700 border-cyan-200",
      ordered: "bg-blue-50 text-blue-700 border-blue-200",
      partially_received: "bg-amber-50 text-amber-700 border-amber-200",
      received: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return FileText;
      case "approved":
      case "ordered":
        return Clock;
      case "received":
        return CheckCircle2;
      case "cancelled":
        return XCircle;
      default:
        return Package;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleReceiveGoods = (order: PurchaseOrder) => {
    setSelectedPO(order);
    setGoodsReceiptOpen(true);
  };

  const handleViewDetail = (order: PurchaseOrder) => {
    setSelectedPOForDetail(order);
    setDetailSheetOpen(true);
  };

  const handleApprove = async (order: PurchaseOrder) => {
    if (order.status !== "draft") return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", order.id);
      if (error) throw error;
      toast({ title: t.procurement.approved, variant: "default" });
      loadData();
    } catch (err: any) {
      toast({ title: t.procurement.loadDataError, description: err?.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = (order: PurchaseOrder) => {
    setSelectedPOForEdit(order);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (order: PurchaseOrder) => {
    setPoToDelete(order);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!poToDelete) return;
    try {
      const { error } = await supabase.from("purchase_orders").delete().eq("id", poToDelete.id);
      if (error) throw error;
      toast({ title: t.procurement.purchaseOrders, description: `${poToDelete.po_number} silindi.`, variant: "default" });
      loadData();
      setDeleteDialogOpen(false);
      setPoToDelete(null);
    } catch (err: any) {
      toast({ title: t.procurement.loadDataError, description: err?.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00D4AA] mx-auto mb-4" />
            <p className="text-gray-500">{t.procurement.loadingData}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TruckIcon className="h-8 w-8 text-[#00D4AA]" />
            {t.procurement.title}
          </h1>
          <p className="text-gray-500 mt-1">{t.procurement.subtitle}</p>
        </div>
        <Button
          onClick={() => setCreatePOOpen(true)}
          className="bg-[#00D4AA] hover:bg-[#00B894] font-semibold text-contrast-body"
        >
          <Plus className="h-4 w-4 mr-2" />
          {t.procurement.newPurchaseOrder}
        </Button>
      </div>

      <ProcurementStatsCards stats={stats} t={t.procurement} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SupplierPerformanceChart suppliers={suppliers} t={t.procurement} />
        <UpcomingDeliveriesList orders={orders} t={t.procurement} />
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="bg-muted">
          <TabsTrigger value="orders" className="data-[state=active]:bg-[#00D4AA] data-[state=active]:text-white">
            <Package className="h-4 w-4 mr-2" />
            {t.procurement.purchaseOrders}
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-[#00D4AA] data-[state=active]:text-white">
            <Users className="h-4 w-4 mr-2" />
            {t.procurement.suppliers}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-900">{t.procurement.purchaseOrders}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExcelImportOpen(true)}
                    className="border-gray-300 bg-white hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t.procurement.bulkImport}
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={t.procurement.searchOrders}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background"
                  >
                    <option value="all">{t.procurement.allStatus}</option>
                    <option value="draft">{t.procurement.draft}</option>
                    <option value="approved">{t.procurement.approved}</option>
                    <option value="ordered">{t.procurement.ordered}</option>
                    <option value="received">{t.procurement.received}</option>
                    <option value="cancelled">{t.procurement.cancelled}</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);

                  return (
                    <div
                      key={order.id}
                      className="p-4 border rounded-lg hover:border-[#00D4AA]/50 transition-colors bg-card"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#00D4AA]/10 rounded-lg">
                            <StatusIcon className="h-5 w-5 text-[#00D4AA]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{order.po_number}</h4>
                            <p className="text-sm text-gray-500">
                              {order.supplier?.name || t.procurement.unknownSupplier}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {(t.procurement as Record<string, string>)[order.status] ?? order.status}
                          </Badge>
                          {(order.status === "approved" || order.status === "ordered") && (
                            <Button
                              size="sm"
                              onClick={() => handleReceiveGoods(order)}
                              className="bg-[#00D4AA] hover:bg-[#00B894] text-white"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              {t.procurement.receive}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-800" aria-label={t.common.actions}>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                {t.procurement.viewDetails}
                              </DropdownMenuItem>
                              {order.status === "draft" && (
                                <DropdownMenuItem onClick={() => handleApprove(order)} disabled={actionLoading}>
                                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                                  {t.procurement.approveDraft}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(order)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t.common.edit}
                              </DropdownMenuItem>
                              {(order.status === "approved" || order.status === "ordered") && (
                                <DropdownMenuItem onClick={() => handleReceiveGoods(order)}>
                                  <TruckIcon className="h-4 w-4 mr-2 text-teal-600" />
                                  {t.procurement.receive}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDeleteClick(order)} className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t.common.delete}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">{t.procurement.orderDate}</p>
                          <p className="text-gray-900 font-medium">
                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {order.expected_delivery_date && (
                          <div>
                            <p className="text-gray-500">{t.procurement.expectedDelivery}</p>
                            <p className="text-gray-900 font-medium">
                              {format(new Date(order.expected_delivery_date), "MMM dd, yyyy")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500">{t.procurement.totalAmount}</p>
                          <p className="text-[#00D4AA] font-bold">
                            {order.total_amount.toFixed(2)} {order.currency}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Package className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p>{t.procurement.noPurchaseOrdersFound}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">{t.procurement.suppliers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-4 border rounded-lg hover:border-[#00D4AA]/50 transition-colors bg-card"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{supplier.name}</h4>
                          <Badge
                            variant="outline"
                            className={
                              supplier.status === "active"
                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                : "bg-red-500/10 text-red-700 border-red-500/20"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{supplier.category}</p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < supplier.reliability_rating
                                  ? "text-amber-500"
                                  : "text-gray-300"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {supplier.total_orders_count} {t.procurement.ordersCount} •{" "}
                          {supplier.total_spent.toFixed(0)} TRY
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {suppliers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p>{t.procurement.noSuppliersFound}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreatePurchaseOrderDialog
        open={createPOOpen}
        onOpenChange={setCreatePOOpen}
        onSuccess={() => loadData()}
      />

      <GoodsReceiptDialog
        open={goodsReceiptOpen}
        onOpenChange={setGoodsReceiptOpen}
        purchaseOrder={selectedPO}
        onSuccess={() => loadData()}
      />

      <PurchaseOrderDetailSheet
        purchaseOrder={selectedPOForDetail}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />

      <EditPurchaseOrderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        purchaseOrder={selectedPOForEdit}
        onSuccess={() => { loadData(); setSelectedPOForEdit(null); }}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => { if (!open) { setPoToDelete(null); } setDeleteDialogOpen(open); }}
        onConfirm={handleDeleteConfirm}
        itemCount={poToDelete ? 1 : 0}
      />

      <PurchaseOrderExcelImportDialog
        open={excelImportOpen}
        onOpenChange={setExcelImportOpen}
        onSuccess={() => loadData()}
      />
    </div>
    </DashboardLayout>
  );
}
