'use client';

import ActivityLogViewer from '@/components/admin/activity-log-viewer';

export default function AdminActivityLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Aktivite Günlüğü</h1>
        <p className="text-muted-foreground mt-1">
          Sistemdeki tüm değişiklik ve işlemleri takip edin
        </p>
      </div>
      <ActivityLogViewer />
    </div>
  );
}
