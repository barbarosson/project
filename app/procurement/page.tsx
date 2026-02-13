"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTenant } from "@/hooks/use-tenant";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { ProcurementStatsCards } from "@/components/procurement/procurement-stats-cards";
import { SupplierPerformanceChart } from "@/components/procurement/supplier-performance-chart";
import { UpcomingDeliveriesList } from "@/components/procurement/upcoming-deliveries-list";
import { AIInsightsPanel } from "@/components/procurement/ai-insights-panel";
import { CreatePurchaseOrderDialog } from "@/components/procurement/create-purchase-order-dialog";
import { GoodsReceiptDialog } from "@/components/procurement/goods-receipt-dialog";
import type { PurchaseOrder, Supplier, AIInsight } from "@/lib/procurement-types";
import { format } from "date-fns";

export default function ProcurementPage() {
  const { user } = useAuth();
  const { tenantId: currentTenant } = useTenant();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [goodsReceiptOpen, setGoodsReceiptOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    if (currentTenant) {
      loadData();
      loadAIInsights();
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
        description: "Failed to load procurement data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    if (!currentTenant) return;

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/procurement-ai-insights`;
      const headers = {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      };

      const response = await fetch(apiUrl, { headers });
      const data = await response.json();

      if (data.insights) {
        setInsights(data.insights);
      }
    } catch (error) {
      console.error("Error loading AI insights:", error);
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
      draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      approved: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      ordered: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      partially_received: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      received: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return colors[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400">Loading procurement data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[#0A192F] min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <TruckIcon className="h-8 w-8 text-cyan-400" />
            Procurement Center
          </h1>
          <p className="text-slate-400 mt-1">Manage suppliers, purchase orders, and inventory inbound</p>
        </div>
        <Button
          onClick={() => setCreatePOOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <ProcurementStatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SupplierPerformanceChart suppliers={suppliers} />
        <UpcomingDeliveriesList orders={orders} />
      </div>

      <AIInsightsPanel insights={insights} onActionClick={() => {}} />

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-700">
          <TabsTrigger value="orders" className="data-[state=active]:bg-cyan-600">
            <Package className="h-4 w-4 mr-2" />
            Purchase Orders
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="data-[state=active]:bg-cyan-600">
            <Users className="h-4 w-4 mr-2" />
            Suppliers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Purchase Orders</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-slate-800 border-slate-700 text-white w-64"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="ordered">Ordered</option>
                    <option value="received">Received</option>
                    <option value="cancelled">Cancelled</option>
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
                      className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-cyan-500/30 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <StatusIcon className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{order.po_number}</h4>
                            <p className="text-sm text-slate-400">
                              {order.supplier?.name || "Unknown Supplier"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          {(order.status === "approved" || order.status === "ordered") && (
                            <Button
                              size="sm"
                              onClick={() => handleReceiveGoods(order)}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Receive
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Order Date</p>
                          <p className="text-white font-medium">
                            {format(new Date(order.order_date), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {order.expected_delivery_date && (
                          <div>
                            <p className="text-slate-400">Expected Delivery</p>
                            <p className="text-white font-medium">
                              {format(new Date(order.expected_delivery_date), "MMM dd, yyyy")}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-400">Total Amount</p>
                          <p className="text-cyan-400 font-bold">
                            {order.total_amount.toFixed(2)} {order.currency}
                          </p>
                        </div>
                        <div className="flex justify-end">
                          <Button size="sm" variant="ghost" className="text-cyan-400">
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Package className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p>No purchase orders found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card className="border-slate-700 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">{supplier.name}</h4>
                          <Badge
                            variant="outline"
                            className={
                              supplier.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">{supplier.category}</p>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < supplier.reliability_rating
                                  ? "text-amber-400"
                                  : "text-slate-700"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-slate-400">
                          {supplier.total_orders_count} orders •{" "}
                          {supplier.total_spent.toFixed(0)} TRY
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {suppliers.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="h-16 w-16 mx-auto mb-3 opacity-50" />
                    <p>No suppliers found</p>
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
        onSuccess={() => {
          loadData();
          loadAIInsights();
        }}
      />

      <GoodsReceiptDialog
        open={goodsReceiptOpen}
        onOpenChange={setGoodsReceiptOpen}
        purchaseOrder={selectedPO}
        onSuccess={() => {
          loadData();
          loadAIInsights();
        }}
      />
    </div>
  );
}
