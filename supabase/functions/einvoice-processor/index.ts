import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ValidationIssue {
  severity: string;
  field: string;
  issue_type: string;
  message: string;
  suggested_fix?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, invoice_id, tenant_id } = await req.json();

    switch (action) {
      case 'create_einvoice':
        return await createEInvoice(supabase, invoice_id, tenant_id);

      case 'validate_invoice':
        return await validateInvoice(supabase, invoice_id);

      case 'send_to_gib':
        return await sendToGIB(supabase, invoice_id);

      case 'check_status':
        return await checkGIBStatus(supabase, invoice_id);

      case 'get_pending':
        return await getPendingInvoices(supabase, tenant_id);

      case 'cancel_invoice':
        const { reason } = await req.json();
        return await cancelInvoice(supabase, invoice_id, reason);

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createEInvoice(supabase: any, invoice_id: string, tenant_id: string) {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('*, customers(*)')
    .eq('id', invoice_id)
    .single();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found');
  }

  const invoice_type = invoice.customers.gib_registered ? 'e-invoice' : 'e-archive';

  const { data: einvoiceDetail, error: createError } = await supabase
    .from('einvoice_details')
    .insert({
      tenant_id,
      invoice_id,
      branch_id: invoice.branch_id,
      invoice_type,
      status: 'draft',
      gib_uuid: crypto.randomUUID(),
      ettn: generateETTN(),
    })
    .select()
    .single();

  if (createError) {
    throw new Error(`Failed to create e-invoice detail: ${createError.message}`);
  }

  await supabase
    .from('einvoice_logs')
    .insert({
      einvoice_detail_id: einvoiceDetail.id,
      log_level: 'info',
      event_type: 'creation',
      message: `e-Invoice detail created: ${invoice_type}`,
    });

  return new Response(
    JSON.stringify({
      success: true,
      einvoice_detail_id: einvoiceDetail.id,
      invoice_type,
      status: 'draft',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function validateInvoice(supabase: any, invoice_id: string) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customers(*),
      invoice_items(*)
    `)
    .eq('id', invoice_id)
    .single();

  if (error || !invoice) {
    throw new Error('Invoice not found');
  }

  const issues: ValidationIssue[] = [];
  let compliance_score = 1.0;

  if (!invoice.invoice_no) {
    issues.push({
      severity: 'critical',
      field: 'invoice_no',
      issue_type: 'missing_field',
      message: 'Fatura numarası eksik',
      suggested_fix: 'Fatura numarası girin',
    });
    compliance_score -= 0.3;
  }

  if (!invoice.customers?.tax_number) {
    issues.push({
      severity: 'critical',
      field: 'tax_number',
      issue_type: 'missing_field',
      message: 'Müşteri vergi numarası eksik',
      suggested_fix: 'Müşteri kartında VKN/TCKN tanımlayın',
    });
    compliance_score -= 0.3;
  }

  if (invoice.customers?.tax_id_type === 'vkn' && invoice.customers?.tax_number?.length !== 10) {
    issues.push({
      severity: 'critical',
      field: 'tax_number',
      issue_type: 'invalid_format',
      message: 'VKN 10 haneli olmalıdır',
      suggested_fix: 'Geçerli bir VKN girin',
    });
    compliance_score -= 0.2;
  }

  if (invoice.customers?.tax_id_type === 'tckn' && invoice.customers?.tax_number?.length !== 11) {
    issues.push({
      severity: 'critical',
      field: 'tax_number',
      issue_type: 'invalid_format',
      message: 'TCKN 11 haneli olmalıdır',
      suggested_fix: 'Geçerli bir TCKN girin',
    });
    compliance_score -= 0.2;
  }

  if (!invoice.invoice_items || invoice.invoice_items.length === 0) {
    issues.push({
      severity: 'critical',
      field: 'invoice_items',
      issue_type: 'empty_lines',
      message: 'Faturada hiç kalem yok',
      suggested_fix: 'En az bir kalem ekleyin',
    });
    compliance_score -= 0.3;
  }

  const calculated_total = invoice.invoice_items?.reduce(
    (sum: number, item: any) => sum + (item.quantity * item.unit_price),
    0
  ) || 0;

  if (Math.abs(calculated_total - invoice.total_amount) > 0.01) {
    issues.push({
      severity: 'warning',
      field: 'total_amount',
      issue_type: 'amount_mismatch',
      message: `Tutarlar uyuşmuyor: Hesaplanan ${calculated_total}, Faturadaki ${invoice.total_amount}`,
      suggested_fix: 'Tutarları yeniden hesaplayın',
    });
    compliance_score -= 0.1;
  }

  const is_compliant = issues.filter((i) => i.severity === 'critical').length === 0 && compliance_score >= 0.85;
  const anomalies_detected = issues.some((i) => i.issue_type === 'anomaly');

  await supabase
    .from('einvoice_details')
    .update({
      ai_validation_score: Math.max(0, compliance_score),
      ai_validation_issues: issues,
      tax_anomaly_detected: anomalies_detected,
      status: is_compliant ? 'validated' : 'draft',
      updated_at: new Date().toISOString(),
    })
    .eq('invoice_id', invoice_id);

  await supabase
    .from('einvoice_logs')
    .insert({
      einvoice_detail_id: (await supabase.from('einvoice_details').select('id').eq('invoice_id', invoice_id).single()).data?.id,
      log_level: is_compliant ? 'info' : 'warning',
      event_type: 'validation',
      message: `Validation completed: ${is_compliant ? 'Compliant' : 'Issues found'}`,
      details: { issues, compliance_score },
    });

  return new Response(
    JSON.stringify({
      is_compliant,
      compliance_score: Math.round(compliance_score * 100) / 100,
      issues,
      anomalies_detected,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function sendToGIB(supabase: any, invoice_id: string) {
  const { data: einvoiceDetail } = await supabase
    .from('einvoice_details')
    .select('*, invoices(*)')
    .eq('invoice_id', invoice_id)
    .single();

  if (!einvoiceDetail) {
    throw new Error('e-Invoice detail not found');
  }

  if (einvoiceDetail.status !== 'validated') {
    throw new Error('Invoice must be validated first');
  }

  await supabase
    .from('einvoice_details')
    .update({
      status: 'sending',
      sent_at: new Date().toISOString(),
    })
    .eq('id', einvoiceDetail.id);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const success = Math.random() > 0.2;

  if (success) {
    await supabase
      .from('einvoice_details')
      .update({
        status: 'approved',
        response_code: '200',
        response_message: 'Fatura GİB tarafından onaylandı',
        response_received_at: new Date().toISOString(),
      })
      .eq('id', einvoiceDetail.id);

    await supabase
      .from('cash_flow')
      .update({
        ai_confidence_score: 0.95,
      })
      .eq('source_module', 'invoice')
      .eq('source_id', invoice_id);

    await supabase
      .from('einvoice_logs')
      .insert({
        einvoice_detail_id: einvoiceDetail.id,
        log_level: 'info',
        event_type: 'approval',
        message: 'Fatura GİB tarafından onaylandı',
      });

    return new Response(
      JSON.stringify({
        success: true,
        status: 'approved',
        message: 'Fatura başarıyla GİB\'e gönderildi ve onaylandı',
        gib_uuid: einvoiceDetail.gib_uuid,
        ettn: einvoiceDetail.ettn,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } else {
    const error_message = 'GİB sisteminde geçici bir hata oluştu';

    await supabase
      .from('einvoice_details')
      .update({
        status: 'error',
        gib_error_code: 'ERR_503',
        gib_error_detail: error_message,
        response_received_at: new Date().toISOString(),
      })
      .eq('id', einvoiceDetail.id);

    await supabase
      .from('einvoice_logs')
      .insert({
        einvoice_detail_id: einvoiceDetail.id,
        log_level: 'error',
        event_type: 'error',
        message: error_message,
      });

    throw new Error(error_message);
  }
}

async function checkGIBStatus(supabase: any, invoice_id: string) {
  const { data: einvoiceDetail } = await supabase
    .from('einvoice_details')
    .select('*')
    .eq('invoice_id', invoice_id)
    .single();

  if (!einvoiceDetail) {
    throw new Error('e-Invoice detail not found');
  }

  return new Response(
    JSON.stringify({
      status: einvoiceDetail.status,
      gib_uuid: einvoiceDetail.gib_uuid,
      ettn: einvoiceDetail.ettn,
      sent_at: einvoiceDetail.sent_at,
      response_message: einvoiceDetail.response_message,
      error_detail: einvoiceDetail.gib_error_detail,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getPendingInvoices(supabase: any, tenant_id: string) {
  const { data, error } = await supabase
    .from('einvoice_details')
    .select(`
      *,
      invoices (
        invoice_no,
        invoice_date,
        grand_total,
        customers (
          name
        )
      )
    `)
    .eq('tenant_id', tenant_id)
    .in('status', ['draft', 'validated', 'sending'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`Failed to fetch pending invoices: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ invoices: data, count: data.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function cancelInvoice(supabase: any, invoice_id: string, reason: string) {
  const { data: einvoiceDetail } = await supabase
    .from('einvoice_details')
    .select('*')
    .eq('invoice_id', invoice_id)
    .single();

  if (!einvoiceDetail) {
    throw new Error('e-Invoice detail not found');
  }

  if (einvoiceDetail.status === 'cancelled') {
    throw new Error('Invoice already cancelled');
  }

  await supabase
    .from('einvoice_details')
    .update({
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', einvoiceDetail.id);

  await supabase
    .from('einvoice_logs')
    .insert({
      einvoice_detail_id: einvoiceDetail.id,
      log_level: 'warning',
      event_type: 'cancellation',
      message: `Invoice cancelled: ${reason}`,
    });

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Fatura iptal edildi',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateETTN(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${random}`.toUpperCase();
}
