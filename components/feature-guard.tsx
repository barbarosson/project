"use client";

import React, { useState } from 'react';
import { useSubscription, FeatureCode, PlanName } from '@/contexts/subscription-context';
import { UpgradePlanDialog } from './upgrade-plan-dialog';

interface FeatureGuardProps {
  feature: FeatureCode;
  featureName: string;
  requiredPlan: PlanName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGuard({ feature, featureName, requiredPlan, children, fallback }: FeatureGuardProps) {
  const { hasFeature } = useSubscription();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const hasAccess = hasFeature(feature);

  if (!hasAccess) {
    return (
      <>
        {fallback || (
          <div onClick={() => setShowUpgradeDialog(true)} className="cursor-pointer">
            {children}
          </div>
        )}
        <UpgradePlanDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          featureName={featureName}
          requiredPlan={requiredPlan}
        />
      </>
    );
  }

  return <>{children}</>;
}
