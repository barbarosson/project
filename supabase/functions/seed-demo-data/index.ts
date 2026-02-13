import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function respond(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d.toISOString().split("T")[0];
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function shortId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const steps: string[] = [];

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return respond({ error: "Missing authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const db = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    steps.push("service client created");

    const {
      data: { user },
      error: authError,
    } = await db.auth.admin.getUserById(
      (
        await createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        }).auth.getUser(token)
      ).data.user?.id || ""
    );

    if (authError || !user) {
      return respond(
        { error: "Invalid token", detail: authError?.message },
        401
      );
    }

    steps.push("user verified: " + user.id);

    const { data: callerProfile } = await db
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    steps.push("profile: " + JSON.stringify(callerProfile));

    if (
      !callerProfile ||
      (callerProfile.role !== "admin" && callerProfile.role !== "super_admin")
    ) {
      return respond(
        {
          error: "Insufficient permissions",
          detail: `Role: ${callerProfile?.role || "none"}`,
        },
        403
      );
    }

    const body = await req.json();
    const tenant_id = body.tenant_id;

    if (!tenant_id) {
      return respond({ error: "tenant_id is required" }, 400);
    }

    steps.push("tenant_id: " + tenant_id);

    const now = new Date();
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const batchId = shortId();
    const results: Record<string, number> = {};

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

    // DELETE existing data in correct order (children first)
    const deleteTables = [
      "transactions",
      "stock_movements",
      "proposal_line_items",
      "invoice_line_items",
      "proposals",
      "invoices",
      "expenses",
      "campaigns",
      "support_tickets",
      "accounts",
      "products",
      "customers",
    ];

    for (const table of deleteTables) {
      const { error } = await db
        .from(table)
        .delete()
        .eq("tenant_id", tenant_id);
      if (error) {
        steps.push(`DELETE ${table} failed: ${error.message}`);
      }
    }

    steps.push("old data deleted");

    // CUSTOMERS
    const customersData = COMPANY_NAMES.map((name, i) => ({
      tenant_id,
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

    const { data: customers, error: custErr } = await db
      .from("customers")
      .insert(customersData)
      .select("id");
    if (custErr)
      return respond(
        { error: `Customers insert failed: ${custErr.message}`, steps },
        500
      );
    results.customers = customers!.length;
    steps.push("customers created");

    // PRODUCTS
    const productsData = Array.from({ length: 10 }, (_, i) => {
      const pp = randomBetween(100, 5000);
      const sp = Math.round(pp * randomBetween(1.2, 2.5) * 100) / 100;
      return {
        tenant_id,
        name: [
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
        ][i],
        sku: `PRD-${batchId}-${String(i + 1).padStart(3, "0")}`,
        category: ["Yazilim", "Hizmet", "Danismanlik", "Donanim", "Lisans"][
          i % 5
        ],
        purchase_price: pp,
        sale_price: sp,
        unit_price: sp,
        vat_rate: randomPick([1, 10, 20]),
        stock_quantity: Math.floor(Math.random() * 200),
        current_stock: Math.floor(Math.random() * 200),
        min_stock_level: randomPick([5, 10, 20, 50]),
        unit: randomPick(["piece", "kg", "hour", "package"]),
        status: "active",
      };
    });

    const { data: products, error: prodErr } = await db
      .from("products")
      .insert(productsData)
      .select("id, name, sale_price, vat_rate");
    if (prodErr)
      return respond(
        { error: `Products insert failed: ${prodErr.message}`, steps },
        500
      );
    results.products = products!.length;
    steps.push("products created");

    // INVOICES
    const customerIds = customers!.map((c: any) => c.id);
    const statuses = [
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
      const sub = randomBetween(1000, 50000);
      const vat = sub * 0.2;
      const tot = sub + vat;
      const st = statuses[i];
      const pa = st === "paid" ? tot : st === "overdue" ? tot * 0.3 : 0;
      return {
        tenant_id,
        customer_id: customerIds[i % customerIds.length],
        invoice_number: `INV-${batchId}-${String(i + 1).padStart(4, "0")}`,
        amount: Math.round(tot * 100) / 100,
        subtotal: Math.round(sub * 100) / 100,
        total_vat: Math.round(vat * 100) / 100,
        total: Math.round(tot * 100) / 100,
        status: st,
        issue_date: randomDate(sixMonthsAgo, now),
        due_date: randomDate(now, threeMonthsLater),
        paid_amount: Math.round(pa * 100) / 100,
        remaining_amount: Math.round((tot - pa) * 100) / 100,
        notes: `Demo fatura #${i + 1}`,
      };
    });

    const { data: invoices, error: invErr } = await db
      .from("invoices")
      .insert(invoicesData)
      .select("id");
    if (invErr)
      return respond(
        { error: `Invoices insert failed: ${invErr.message}`, steps },
        500
      );
    results.invoices = invoices!.length;
    steps.push("invoices created");

    // INVOICE LINE ITEMS
    const lineItems: any[] = [];
    for (const inv of invoices!) {
      const n = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < n; j++) {
        const p = products![Math.floor(Math.random() * products!.length)];
        const q = Math.floor(Math.random() * 10) + 1;
        const up = p.sale_price || randomBetween(100, 5000);
        const lt = q * up;
        const va = lt * ((p.vat_rate || 20) / 100);
        lineItems.push({
          tenant_id,
          invoice_id: inv.id,
          product_id: p.id,
          product_name: p.name,
          quantity: q,
          unit_price: up,
          vat_rate: p.vat_rate || 20,
          line_total: Math.round(lt * 100) / 100,
          vat_amount: Math.round(va * 100) / 100,
          total_with_vat: Math.round((lt + va) * 100) / 100,
        });
      }
    }

    const { error: liErr } = await db
      .from("invoice_line_items")
      .insert(lineItems);
    if (liErr)
      return respond(
        {
          error: `Invoice line items insert failed: ${liErr.message}`,
          steps,
        },
        500
      );
    results.invoice_line_items = lineItems.length;
    steps.push("invoice line items created");

    // EXPENSES
    const expCats = [
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
    ];
    const expensesData = expCats.map((cat) => {
      const amt = randomBetween(500, 15000);
      const st = randomPick(["paid", "unpaid", "partially_paid"]);
      const pa =
        st === "paid"
          ? amt
          : st === "partially_paid"
            ? Math.round(amt * 0.5 * 100) / 100
            : 0;
      return {
        tenant_id,
        category: cat,
        description: `${cat} gideri - Demo`,
        amount: amt,
        expense_date: randomDate(sixMonthsAgo, now),
        payment_method: randomPick(["cash", "bank_transfer", "credit_card"]),
        status: st,
        tax_rate: randomPick([1, 10, 20]),
        currency: "TRY",
        paid_amount: pa,
        remaining_amount: Math.round((amt - pa) * 100) / 100,
      };
    });

    const { error: expErr } = await db.from("expenses").insert(expensesData);
    if (expErr)
      return respond(
        { error: `Expenses insert failed: ${expErr.message}`, steps },
        500
      );
    results.expenses = expensesData.length;
    steps.push("expenses created");

    // CAMPAIGNS
    const campaignsData = [
      { name: "Yaz Indirimi", type: "email", status: "active" },
      { name: "Yeni Uye Hosgeldin", type: "email", status: "active" },
      { name: "Black Friday Ozel", type: "sms", status: "draft" },
      { name: "Sadakat Programi", type: "email", status: "completed" },
      { name: "Urun Tanitim", type: "email", status: "active" },
      { name: "Referans Programi", type: "email", status: "draft" },
      { name: "Bayram Kampanyasi", type: "sms", status: "completed" },
      { name: "Geri Kazanim", type: "email", status: "active" },
      { name: "Yilbasi Ozel", type: "email", status: "draft" },
      { name: "Erken Kus Firsati", type: "sms", status: "active" },
    ].map((c, i) => ({
      tenant_id,
      ...c,
      target_segment: randomPick(["all", "new", "returning", "vip"]),
      subject: `${c.name} - Ozel Firsat`,
      message: `${c.name} kampanyasi. Bu firsati kacirmayin!`,
      discount_rate: randomPick([5, 10, 15, 20, 25, 30]),
      start_date: randomDate(sixMonthsAgo, now),
      end_date: randomDate(now, threeMonthsLater),
      budget: randomBetween(1000, 50000),
      code: `${batchId}${String(i + 1).padStart(2, "0")}`,
    }));

    const { error: campErr } = await db
      .from("campaigns")
      .insert(campaignsData);
    if (campErr)
      return respond(
        { error: `Campaigns insert failed: ${campErr.message}`, steps },
        500
      );
    results.campaigns = campaignsData.length;
    steps.push("campaigns created");

    // PROPOSALS
    const proposalsData = Array.from({ length: 10 }, (_, i) => {
      const sub = randomBetween(5000, 100000);
      const vat = sub * 0.2;
      return {
        tenant_id,
        customer_id: customerIds[i % customerIds.length],
        proposal_number: `TEK-${batchId}-${String(i + 1).padStart(4, "0")}`,
        title: `${randomPick(["Web Gelistirme", "Mobil Uygulama", "ERP Entegrasyonu", "Dijital Pazarlama", "IT Danismanligi"])} Teklifi`,
        status: randomPick(["draft", "sent", "accepted", "rejected"]),
        valid_until: randomDate(now, threeMonthsLater),
        subtotal: Math.round(sub * 100) / 100,
        vat_total: Math.round(vat * 100) / 100,
        total: Math.round((sub + vat) * 100) / 100,
      };
    });

    const { data: proposals, error: propErr } = await db
      .from("proposals")
      .insert(proposalsData)
      .select("id");
    if (propErr)
      return respond(
        { error: `Proposals insert failed: ${propErr.message}`, steps },
        500
      );
    results.proposals = proposals!.length;
    steps.push("proposals created");

    // PROPOSAL LINE ITEMS
    const pLineItems: any[] = [];
    for (const prop of proposals!) {
      const n = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < n; j++) {
        const p = products![Math.floor(Math.random() * products!.length)];
        const q = Math.floor(Math.random() * 5) + 1;
        const up = p.sale_price || randomBetween(500, 10000);
        const lt = q * up;
        const va = lt * 0.2;
        pLineItems.push({
          tenant_id,
          proposal_id: prop.id,
          product_id: p.id,
          product_name: p.name,
          quantity: q,
          unit_price: up,
          vat_rate: 20,
          line_total: Math.round(lt * 100) / 100,
          vat_amount: Math.round(va * 100) / 100,
          total_with_vat: Math.round((lt + va) * 100) / 100,
        });
      }
    }

    const { error: pliErr } = await db
      .from("proposal_line_items")
      .insert(pLineItems);
    if (pliErr)
      return respond(
        {
          error: `Proposal line items insert failed: ${pliErr.message}`,
          steps,
        },
        500
      );
    results.proposal_line_items = pLineItems.length;
    steps.push("proposal line items created");

    // STOCK MOVEMENTS
    const smData = products!.map((p: any) => ({
      tenant_id,
      product_id: p.id,
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

    const { error: smErr } = await db
      .from("stock_movements")
      .insert(smData);
    if (smErr)
      return respond(
        { error: `Stock movements insert failed: ${smErr.message}`, steps },
        500
      );
    results.stock_movements = smData.length;
    steps.push("stock movements created");

    // SUPPORT TICKETS
    const ticketsData = Array.from({ length: 10 }, (_, i) => ({
      tenant_id,
      ticket_number: `TKT-${batchId}-${String(i + 1).padStart(4, "0")}`,
      subject: randomPick([
        "Fatura yazdirilmiyor",
        "Stok guncelleme sorunu",
        "Giris yapilamiyor",
        "Rapor eksik gorunuyor",
        "Kampanya kodu calismiyor",
      ]),
      category: randomPick(["General", "Billing", "Technical", "Feature"]),
      priority: randomPick(["Low", "Medium", "High", "Critical"]),
      status: randomPick(["Open", "In Progress", "Resolved", "Closed"]),
      message: "Demo destek talebi aciklamasi.",
      created_by: CONTACT_NAMES[i],
    }));

    const { error: tickErr } = await db
      .from("support_tickets")
      .insert(ticketsData);
    if (tickErr)
      return respond(
        { error: `Support tickets insert failed: ${tickErr.message}`, steps },
        500
      );
    results.support_tickets = ticketsData.length;
    steps.push("support tickets created");

    // ACCOUNTS
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
    ].map((a) => ({ tenant_id, currency: "TRY", ...a }));

    const { data: accounts, error: accErr } = await db
      .from("accounts")
      .insert(accountsData)
      .select("id");
    if (accErr)
      return respond(
        { error: `Accounts insert failed: ${accErr.message}`, steps },
        500
      );
    results.accounts = accounts!.length;
    steps.push("accounts created");

    // TRANSACTIONS
    const txData = Array.from({ length: 10 }, (_, i) => ({
      tenant_id,
      account_id: accounts![i % accounts!.length].id,
      transaction_type: randomPick(["income", "expense", "transfer"]),
      amount: randomBetween(500, 25000),
      currency: "TRY",
      transaction_date: randomDate(sixMonthsAgo, now),
      description: `Demo islem #${i + 1}`,
      payment_method: randomPick(["cash", "bank_transfer", "credit_card"]),
    }));

    const { error: txErr } = await db.from("transactions").insert(txData);
    if (txErr)
      return respond(
        { error: `Transactions insert failed: ${txErr.message}`, steps },
        500
      );
    results.transactions = txData.length;
    steps.push("transactions created");

    return respond({
      success: true,
      message: "Demo verileri basariyla yuklendi",
      results,
    });
  } catch (error: any) {
    console.error("seed-demo-data error:", error);
    return respond(
      {
        error: error.message || "Internal server error",
        steps,
        stack: error.stack,
      },
      500
    );
  }
});
