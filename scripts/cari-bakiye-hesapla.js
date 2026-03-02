#!/usr/bin/env node
/**
 * BARBAROS SONGUR (veya isim verilen cari) için olması gereken bakiyeyi hesaplar.
 * .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY olmalı.
 *
 * Kullanım: node scripts/cari-bakiye-hesapla.js
 * veya:     node scripts/cari-bakiye-hesapla.js "BAŞKA CARİ"
 */

const path = require('path')
const fs = require('fs')

// .env.local yükle
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
}

const customerName = process.argv[2] || 'BARBAROS SONGUR'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Hata: .env.local içinde NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı olmalı.')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const terms = customerName.split(/\s+/).filter(Boolean)
  const firstTerm = terms[0] || customerName
  const { data: allCustomers, error: custErr } = await supabase
    .from('customers')
    .select('id, company_title, name, balance, tenant_id')
    .or(`company_title.ilike.%${firstTerm}%,name.ilike.%${firstTerm}%`)
    .limit(50)
  let customers = allCustomers || []
  if (terms.length > 1) {
    customers = customers.filter((c) => {
      const full = `${(c.company_title || '')} ${(c.name || '')}`.toUpperCase()
      return terms.every((t) => t && full.includes(t.toUpperCase()))
    })
  }
  customers = customers.slice(0, 5)

  if (custErr) {
    console.error('Cari sorgu hatası:', custErr.message)
    process.exit(1)
  }
  if (!customers || customers.length === 0) {
    console.log(`"${customerName}" ile eşleşen cari bulunamadı.`)
    process.exit(0)
  }

  for (const c of customers) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, total, amount, paid_amount, remaining_amount, status, invoice_number')
      .eq('customer_id', c.id)
      .neq('status', 'cancelled')

    const { data: expenses } = await supabase
      .from('expenses')
      .select('id, amount, description')
      .eq('customer_id', c.id)

    const faturaKalan = (invoices || []).reduce((sum, i) => {
      const remaining = Number(i.remaining_amount ?? (Number(i.total ?? i.amount ?? 0) - Number(i.paid_amount ?? 0)))
      return sum + remaining
    }, 0)
    const masrafToplam = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0)
    const olmasiGereken = faturaKalan + masrafToplam
    const kayitli = Number(c.balance ?? 0)
    const fark = kayitli - olmasiGereken

    console.log('---')
    console.log('Cari:', c.company_title || c.name, '(', c.id, ')')
    console.log('Kayıtlı bakiye (DB):', kayitli)
    console.log('Fatura kalan toplamı:', faturaKalan)
    console.log('Cariye yansıyan masraf:', masrafToplam)
    console.log('Olması gereken bakiye:', olmasiGereken)
    console.log('Fark (kayıtlı - olması gereken):', fark)
    if ((invoices || []).length) {
      console.log('Faturalar:', (invoices || []).map((i) => `${i.invoice_number}=${i.remaining_amount ?? (Number(i.total ?? i.amount ?? 0) - Number(i.paid_amount ?? 0))}`).join(', '))
    }
    if ((expenses || []).length) {
      console.log('Masraflar:', (expenses || []).map((e) => `${e.description}=${e.amount}`).join(', '))
    }
  }
  console.log('---')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
