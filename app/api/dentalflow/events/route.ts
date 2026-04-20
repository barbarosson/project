import { NextRequest, NextResponse } from 'next/server'

import {
  DentalflowEventPayload,
  getDentalflowFunctionUrl,
  validateDentalflowWebhookSecret,
} from '@/lib/dentalflow'

export const runtime = 'nodejs'

function getServiceRoleAuthHeader() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey?.trim()) return null
  return `Bearer ${serviceRoleKey}`
}

function validatePayload(payload: any): payload is DentalflowEventPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.event === 'string' &&
    typeof payload.clinic_id === 'string' &&
    payload.clinic_id.trim().length > 0
  )
}

export async function POST(request: NextRequest) {
  const secretHeader = request.headers.get('x-dentalflow-secret')
  if (!validateDentalflowWebhookSecret(secretHeader)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!validatePayload(body)) {
    return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 })
  }

  const functionUrl = getDentalflowFunctionUrl()
  if (!functionUrl) {
    return NextResponse.json({ ok: false, error: 'missing_function_url' }, { status: 500 })
  }

  const authorization = getServiceRoleAuthHeader()
  if (!authorization) {
    return NextResponse.json({ ok: false, error: 'missing_service_role_key' }, { status: 500 })
  }

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify(body),
  })

  const responseText = await response.text()
  let result: unknown = null

  if (responseText) {
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { raw: responseText }
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: 'orchestrator_failed', status: response.status, details: result },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, result })
}
