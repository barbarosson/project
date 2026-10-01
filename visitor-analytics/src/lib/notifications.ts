import { prisma } from "./prisma";

export type NotificationType =
  | "digest_weekly"
  | "quota_warning"
  | "traffic_spike";

export async function createNotification(opts: {
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.notification.create({
    data: {
      orgId: opts.orgId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      meta: JSON.stringify(opts.meta ?? {}),
    },
  });
}

export async function listOrgNotifications(orgId: string, take = 40) {
  return prisma.notification.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function markNotificationsRead(orgId: string, ids?: string[]) {
  return prisma.notification.updateMany({
    where: {
      orgId,
      readAt: null,
      ...(ids?.length ? { id: { in: ids } } : {}),
    },
    data: { readAt: new Date() },
  });
}
