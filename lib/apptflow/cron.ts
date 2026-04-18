import type { NextRequest } from 'next/server'
import { env } from './env'

// All /api/apptflow/cron/* endpoints share this guard. Accepts either
//  1. Authorization: Bearer <APPTFLOW_CRON_SECRET>  (Vercel Cron / external)
//  2. x-apptflow-cron-secret: <secret>              (curl / k8s CronJob)
export function requireCronAuth(req: NextRequest): boolean {
  const expected = env.cronSecret()
  const bearer = req.headers.get('authorization')
  if (bearer === `Bearer ${expected}`) return true
  const alt = req.headers.get('x-apptflow-cron-secret')
  if (alt && alt === expected) return true
  return false
}
