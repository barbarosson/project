'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { AICashFlowPredictions } from '@/components/ai-cash-flow-predictions';

export default function AICashFlowPage() {
  return (
    <DashboardLayout>
      <AICashFlowPredictions />
    </DashboardLayout>
  );
}
