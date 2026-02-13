import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { requestId, email, fullName, companyName } = await req.json();

    if (!requestId || !email || !fullName || !companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const password = generatePassword();

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
        },
      });

    if (userError) throw userError;

    const userId = userData.user.id;

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .insert({
        name: companyName,
        owner_id: userId,
        settings: {
          currency: "TRY",
          language: "tr",
          plan: "demo",
          plan_started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (tenantError) throw tenantError;

    const tenantId = tenant.id;

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        tenant_id: tenantId,
        role: "admin",
        company_name: companyName,
        full_name: fullName,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    await supabaseAdmin.from("company_settings").insert({
      tenant_id: tenantId,
      company_name: companyName,
      email: email,
      currency: "TRY",
    });

    await createDemoData(supabaseAdmin, tenantId);

    const { error: updateError } = await supabaseAdmin
      .from("demo_requests")
      .update({
        status: "approved",
        user_id: userId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        password,
        message: "Demo account created successfully with sample data",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating demo account:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generatePassword(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d.toISOString().split("T")[0];
}

function shortId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function createDemoData(supabase: any, tenantId: string) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const threeMonthsLater = new Date(now);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const batchId = shortId();

  const CONTACT_NAMES = [
    "Ahmet Yilmaz",
    "Mehmet Kaya",
    "Ayse Demir",
    "Fatma Celik",
    "Ali Ozturk",
    "Zeynep Sahin",
    "Mustafa Arslan",
    "Emine Dogan",
    "Hasan Kilic",
    "Hatice Yildiz",
  ];

  const COMPANY_NAMES = [
    "Yildiz Teknoloji A.S.",
    "Anadolu Gida Ltd.",
    "Marmara Insaat",
    "Karadeniz Lojistik",
    "Ege Tekstil San.",
    "Bosphorus Trading Co.",
    "Akdeniz Tarim",
    "Trakya Enerji",
    "Istanbul Dijital Medya",
    "Ankara Muhendislik",
  ];

  const CITIES = [
    "Istanbul",
    "Ankara",
    "Izmir",
    "Bursa",
    "Antalya",
    "Adana",
    "Konya",
    "Gaziantep",
    "Kayseri",
    "Mersin",
  ];

  const customersData = COMPANY_NAMES.map((name, i) => ({
    tenant_id: tenantId,
    name: CONTACT_NAMES[i],
    company_title: name,
    email: `${CONTACT_NAMES[i].toLowerCase().replace(/\s/g, ".")}@example.com`,
    phone: `+90 5${Math.floor(100000000 + Math.random() * 900000000)}`,
    city: CITIES[i],
    province: CITIES[i],
    country: "Turkiye",
    type: i % 3 === 0 ? "Corporate" : "Individual",
    status: i === 9 ? "inactive" : "active",
    balance: randomBetween(0, 50000),
    total_revenue: randomBetween(10000, 500000),
    tax_office: `${CITIES[i]} Vergi Dairesi`,
    tax_number: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
    payment_terms: randomPick([0, 15, 30, 45, 60]),
  }));

  const { data: customers, error: custErr } = await supabase
    .from("customers")
    .insert(customersData)
    .select("id, name");

  if (custErr) throw new Error(`Customers: ${custErr.message}`);

  const PRODUCT_NAMES = [
    "Bulut ERP Lisansi",
    "Web Hosting Paketi",
    "SSL Sertifikasi",
    "Mobil Uygulama Gelistirme",
    "SEO Optimizasyon Hizmeti",
    "Grafik Tasarim Paketi",
    "Veri Analiz Raporu",
    "Siber Guvenlik Denetimi",
    "API Entegrasyon Hizmeti",
    "Teknik Destek Paketi",
  ];

  const PRODUCT_CATEGORIES = [
    "Yazilim",
    "Hizmet",
    "Danismanlik",
    "Donanim",
    "Lisans",
  ];

  const productsData = PRODUCT_NAMES.map((pName, i) => {
    const purchasePrice = randomBetween(100, 5000);
    const salePrice = purchasePrice * randomBetween(1.2, 2.5);
    return {
      tenant_id: tenantId,
      name: pName,
      sku: `PRD-${batchId}-${String(i + 1).padStart(3, "0")}`,
      category: PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length],
      purchase_price: purchasePrice,
      sale_price: Math.round(salePrice * 100) / 100,
      unit_price: Math.round(salePrice * 100) / 100,
      vat_rate: randomPick([1, 10, 20]),
      stock_quantity: Math.floor(Math.random() * 200),
      min_stock_level: randomPick([5, 10, 20, 50]),
      unit: randomPick(["piece", "kg", "hour", "package"]),
      status: "active",
    };
  });

  const { data: products, error: prodErr } = await supabase
    .from("products")
    .insert(productsData)
    .select("id, name, sale_price, vat_rate");

  if (prodErr) throw new Error(`Products: ${prodErr.message}`);

  const customerIds = customers!.map((c: any) => c.id);
  const invoiceStatuses: string[] = [
    "draft",
    "sent",
    "paid",
    "paid",
    "paid",
    "sent",
    "overdue",
    "paid",
    "sent",
    "draft",
  ];

  const invoicesData = Array.from({ length: 10 }, (_, i) => {
    const subtotal = randomBetween(1000, 50000);
    const vatTotal = subtotal * 0.2;
    const total = subtotal + vatTotal;
    const status = invoiceStatuses[i];
    const paidAmount =
      status === "paid" ? total : status === "overdue" ? total * 0.3 : 0;

    return {
      tenant_id: tenantId,
      customer_id: customerIds[i % customerIds.length],
      invoice_number: `INV-${batchId}-${String(i + 1).padStart(4, "0")}`,
      amount: Math.round(total * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      total_vat: Math.round(vatTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      status,
      issue_date: randomDate(sixMonthsAgo, now),
      due_date: randomDate(now, threeMonthsLater),
      paid_amount: Math.round(paidAmount * 100) / 100,
      remaining_amount: Math.round((total - paidAmount) * 100) / 100,
      notes: `Demo fatura #${i + 1}`,
    };
  });

  const { data: invoices, error: invErr } = await supabase
    .from("invoices")
    .insert(invoicesData)
    .select("id");

  if (invErr) throw new Error(`Invoices: ${invErr.message}`);

  const lineItemsData: any[] = [];
  for (const inv of invoices!) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numItems; j++) {
      const product = products![Math.floor(Math.random() * products!.length)];
      const qty = Math.floor(Math.random() * 10) + 1;
      const unitPrice = product.sale_price || randomBetween(100, 5000);
      const lineTotal = qty * unitPrice;
      const vatAmount = lineTotal * ((product.vat_rate || 20) / 100);
      lineItemsData.push({
        tenant_id: tenantId,
        invoice_id: inv.id,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        vat_rate: product.vat_rate || 20,
        line_total: Math.round(lineTotal * 100) / 100,
        vat_amount: Math.round(vatAmount * 100) / 100,
        total_with_vat: Math.round((lineTotal + vatAmount) * 100) / 100,
      });
    }
  }

  const { error: liErr } = await supabase
    .from("invoice_line_items")
    .insert(lineItemsData);

  if (liErr) throw new Error(`Invoice Line Items: ${liErr.message}`);

  const expensesData = [
    "rent",
    "personnel",
    "utilities",
    "utilities",
    "other",
    "office",
    "marketing",
    "other",
    "general",
    "tax",
  ].map((cat) => {
    const amount = randomBetween(500, 15000);
    const status = randomPick(["paid", "unpaid", "partially_paid"]);
    let paidAmount = 0;
    let remainingAmount = amount;
    if (status === "paid") {
      paidAmount = amount;
      remainingAmount = 0;
    } else if (status === "partially_paid") {
      paidAmount = Math.round(amount * 0.5 * 100) / 100;
      remainingAmount = Math.round((amount - paidAmount) * 100) / 100;
    }
    return {
      tenant_id: tenantId,
      category: cat,
      description: `${cat} gideri - Demo`,
      amount,
      expense_date: randomDate(sixMonthsAgo, now),
      payment_method: randomPick(["cash", "bank_transfer", "credit_card"]),
      status,
      tax_rate: randomPick([1, 10, 20]),
      currency: "TRY",
      paid_amount: paidAmount,
      remaining_amount: remainingAmount,
    };
  });

  const { error: expErr } = await supabase
    .from("expenses")
    .insert(expensesData);
  if (expErr) throw new Error(`Expenses: ${expErr.message}`);

  const campaignsData = [
    {
      name: "Yaz Indirimi Kampanyasi",
      type: "email",
      status: "active",
      description: "Yaz sezonu ozel indirimleri",
    },
    {
      name: "Yeni Uye Hosgeldin",
      type: "email",
      status: "active",
      description: "Yeni musterilere ozel firsatlar",
    },
    {
      name: "Black Friday Ozel",
      type: "sms",
      status: "draft",
      description: "Black Friday kampanyasi",
    },
    {
      name: "Sadakat Programi",
      type: "email",
      status: "completed",
      description: "Sadik musterilere ozel avantajlar",
    },
    {
      name: "Urun Tanitim Maili",
      type: "email",
      status: "active",
      description: "Yeni urun tanitimi",
    },
    {
      name: "Referans Programi",
      type: "email",
      status: "draft",
      description: "Referans ile kazanin",
    },
    {
      name: "Bayram Kampanyasi",
      type: "sms",
      status: "completed",
      description: "Bayram ozel indirimleri",
    },
    {
      name: "Geri Kazanim Maili",
      type: "email",
      status: "active",
      description: "Inaktif musterileri geri kazanma",
    },
    {
      name: "Yilbasi Ozel",
      type: "email",
      status: "draft",
      description: "Yilbasi hediye kampanyasi",
    },
    {
      name: "Erken Kus Firsati",
      type: "sms",
      status: "active",
      description: "Erken rezervasyon indirimi",
    },
  ].map((c, i) => ({
    tenant_id: tenantId,
    ...c,
    target_segment: randomPick(["all", "new", "returning", "vip"]),
    subject: `${c.name} - Ozel Firsat`,
    message: `${c.description}. Bu firsati kacirmayin!`,
    discount_rate: randomPick([5, 10, 15, 20, 25, 30]),
    start_date: randomDate(sixMonthsAgo, now),
    end_date: randomDate(now, threeMonthsLater),
    budget: randomBetween(1000, 50000),
    code: `${batchId}${String(i + 1).padStart(2, "0")}`,
  }));

  const { error: campErr } = await supabase
    .from("campaigns")
    .insert(campaignsData);
  if (campErr) throw new Error(`Campaigns: ${campErr.message}`);

  const proposalsData = Array.from({ length: 10 }, (_, i) => {
    const subtotal = randomBetween(5000, 100000);
    const vatTotal = subtotal * 0.2;
    return {
      tenant_id: tenantId,
      customer_id: customerIds[i % customerIds.length],
      proposal_number: `TEK-${batchId}-${String(i + 1).padStart(4, "0")}`,
      title: `${randomPick(["Web Gelistirme", "Mobil Uygulama", "ERP Entegrasyonu", "Dijital Pazarlama", "IT Danismanligi"])} Teklifi`,
      description: "Demo teklif aciklamasi",
      status: randomPick(["draft", "sent", "accepted", "rejected"]),
      valid_until: randomDate(now, threeMonthsLater),
      subtotal: Math.round(subtotal * 100) / 100,
      vat_total: Math.round(vatTotal * 100) / 100,
      total: Math.round((subtotal + vatTotal) * 100) / 100,
      notes: "Demo teklif notu",
    };
  });

  const { data: proposals, error: propErr } = await supabase
    .from("proposals")
    .insert(proposalsData)
    .select("id");

  if (propErr) throw new Error(`Proposals: ${propErr.message}`);

  const proposalLineItems: any[] = [];
  for (const prop of proposals!) {
    const numItems = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numItems; j++) {
      const product = products![Math.floor(Math.random() * products!.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const unitPrice = product.sale_price || randomBetween(500, 10000);
      const lineTotal = qty * unitPrice;
      const vatAmount = lineTotal * 0.2;
      proposalLineItems.push({
        tenant_id: tenantId,
        proposal_id: prop.id,
        product_id: product.id,
        product_name: product.name,
        quantity: qty,
        unit_price: unitPrice,
        vat_rate: 20,
        line_total: Math.round(lineTotal * 100) / 100,
        vat_amount: Math.round(vatAmount * 100) / 100,
        total_with_vat: Math.round((lineTotal + vatAmount) * 100) / 100,
      });
    }
  }

  const { error: pliErr } = await supabase
    .from("proposal_line_items")
    .insert(proposalLineItems);
  if (pliErr) throw new Error(`Proposal Line Items: ${pliErr.message}`);

  const stockMovementsData = products!.map((product: any) => ({
    tenant_id: tenantId,
    product_id: product.id,
    movement_type: randomPick(["in", "out", "adjustment"]),
    quantity: Math.floor(Math.random() * 50) + 1,
    reason: randomPick([
      "Satin alma",
      "Satis",
      "Iade",
      "Sayim duzeltme",
      "Transfer",
    ]),
    unit_cost: randomBetween(50, 2000),
  }));

  const { error: smErr } = await supabase
    .from("stock_movements")
    .insert(stockMovementsData);
  if (smErr) throw new Error(`Stock Movements: ${smErr.message}`);

  const ticketsData = Array.from({ length: 10 }, (_, i) => ({
    tenant_id: tenantId,
    ticket_number: `TKT-${batchId}-${String(i + 1).padStart(4, "0")}`,
    subject: randomPick([
      "Fatura yazdirilmiyor",
      "Stok guncelleme sorunu",
      "Giris yapilamiyor",
      "Rapor eksik gorunuyor",
      "Kampanya kodu calismiyor",
      "PDF indirme hatasi",
      "Musteri bilgisi guncelleme",
      "E-fatura entegrasyonu",
      "Yetkilendirme sorunu",
      "Performans yavaslamasi",
    ]),
    category: randomPick(["General", "Billing", "Technical", "Feature"]),
    priority: randomPick(["Low", "Medium", "High", "Critical"]),
    status: randomPick(["Open", "In Progress", "Resolved", "Closed"]),
    message: "Demo destek talebi aciklamasi. Lutfen inceleyiniz.",
    created_by: CONTACT_NAMES[i],
  }));

  const { error: tickErr } = await supabase
    .from("support_tickets")
    .insert(ticketsData);
  if (tickErr) throw new Error(`Support Tickets: ${tickErr.message}`);

  const accountsData = [
    {
      name: "Ana Banka Hesabi",
      type: "bank",
      bank_name: "Garanti BBVA",
      iban: `TR${batchId}000000000000000001`,
      opening_balance: 100000,
      current_balance: 150000,
    },
    {
      name: "Kasa",
      type: "cash",
      opening_balance: 25000,
      current_balance: 32000,
    },
    {
      name: "Kredi Karti Hesabi",
      type: "credit_card",
      bank_name: "Is Bankasi",
      opening_balance: 0,
      current_balance: -15000,
    },
  ].map((a) => ({ tenant_id: tenantId, currency: "TRY", ...a }));

  const { data: accounts, error: accErr } = await supabase
    .from("accounts")
    .insert(accountsData)
    .select("id");

  if (accErr) throw new Error(`Accounts: ${accErr.message}`);

  const transactionsData = Array.from({ length: 10 }, (_, i) => ({
    tenant_id: tenantId,
    account_id: accounts![i % accounts!.length].id,
    transaction_type: randomPick(["income", "expense", "transfer"]),
    amount: randomBetween(500, 25000),
    currency: "TRY",
    transaction_date: randomDate(sixMonthsAgo, now),
    description: `Demo islem #${i + 1}`,
    payment_method: randomPick(["cash", "bank_transfer", "credit_card"]),
  }));

  const { error: txErr } = await supabase
    .from("transactions")
    .insert(transactionsData);
  if (txErr) throw new Error(`Transactions: ${txErr.message}`);

  console.log("Demo data created successfully for tenant:", tenantId);
}
