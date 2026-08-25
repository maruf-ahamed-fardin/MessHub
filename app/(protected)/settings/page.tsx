import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();

  let settings: any = {
    messName: "MessHub Flat 4B",
    address: "House 12, Road 4, Dhanmondi, Dhaka",
    currency: "৳",
    guestMealPricing: "DYNAMIC",
    guestMealFixedPrice: 80,
    guestMealResponsibility: "MEMBER",
    defaultSeatRent: 3500,
    messRules: "1. Lock the main door when leaving.\n2. Turn off lights/AC/fans after use.\n3. Keep dining area and kitchen clean after meals.",
  };

  try {
    const dbSettings = await prisma.messSettings.findUnique({ where: { id: "singleton" } });
    if (dbSettings) settings = dbSettings;
  } catch {}

  return (
    <div>
      <PageHeader title="Settings" description="Configure your mess preferences" />
      <SettingsForm settings={settings} />
    </div>
  );
}
