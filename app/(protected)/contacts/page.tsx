import type { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { ContactsDirectory } from "@/components/contacts/ContactsDirectory";
import { getContactsAction } from "@/app/actions/contacts.actions";

export const metadata: Metadata = {
  title: "Contacts Directory",
  description: "Important contact numbers – bua, landlord, WiFi, caretaker, water supplier etc.",
};

export default async function ContactsPage() {
  const [session, contacts] = await Promise.all([auth(), getContactsAction()]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-24">
      <PageHeader
        title="📞 কন্ট্যাক্ট ডিরেক্টরি"
        description="বুয়া, মালিক, WiFi, পানি সরবরাহকারীসহ সকল গুরুত্বপূর্ণ নম্বর এক জায়গায়"
      />
      <ContactsDirectory contacts={contacts} isAdmin={isAdmin} />
    </div>
  );
}
