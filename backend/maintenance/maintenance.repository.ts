import { prisma } from "@/lib/db/prisma";

export async function getMaintenanceReports(status?: string) {
  return prisma.maintenanceReport.findMany({
    where: status ? { status: status as any } : {},
    include: {
      reportedBy: { include: { user: { select: { name: true, image: true } } } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createMaintenanceReport(data: {
  title: string;
  description?: string;
  location?: string;
  priority: string;
  reportedById: string;
  imageUrl?: string;
}) {
  return prisma.maintenanceReport.create({
    data: { ...data, priority: data.priority as any, status: "REPORTED" },
  });
}

export async function updateMaintenanceStatus(id: string, status: string, note?: string) {
  return prisma.maintenanceReport.update({
    where: { id },
    data: {
      status: status as any,
      note,
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });
}
