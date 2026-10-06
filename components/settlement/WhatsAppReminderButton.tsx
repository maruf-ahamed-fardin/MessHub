"use client";

import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { MONTH_NAMES_BN, MONTH_NAMES_EN } from "@/lib/constants/categories";

interface WhatsAppReminderButtonProps {
  memberName: string;
  dueAmount: number;
  month: number;
  year: number;
  phone?: string | null;
  adminBkash?: string | null;
  adminNagad?: string | null;
  messName?: string;
}

export function WhatsAppReminderButton({
  memberName,
  dueAmount,
  month,
  year,
  phone,
  adminBkash,
  adminNagad,
  messName = "MessHub",
}: WhatsAppReminderButtonProps) {
  const { t, language } = usePreferences();
  const monthName = language === "bn" ? MONTH_NAMES_BN[month] : MONTH_NAMES_EN[month];

  const handleSendReminder = () => {
    let msg = "";
    if (language === "bn") {
      msg = `আসসালামু আলাইকুম ${memberName},\n\n*${messName}* থেকে জানানো হচ্ছে যে, *${monthName} ${year}* মাসের মেস হিসাবে আপনার বর্তমান বকেয়া *৳${Math.round(dueAmount)}*।\n\nঅনুগ্রহ করে দ্রুততম সময়ে মেসে জমা দিয়ে হিসাবটি সমন্বয় করে নেওয়ার অনুরোধ করা হলো।\n` +
        (adminBkash ? `📱 বিকাশ (Personal): ${adminBkash}\n` : "") +
        (adminNagad ? `📱 নগদ (Personal): ${adminNagad}\n` : "") +
        `\nধন্যবাদ!`;
    } else {
      msg = `Hello ${memberName},\n\nFrom *${messName}*, gentle reminder that your pending balance for *${monthName} ${year}* is *৳${Math.round(dueAmount)}*.\n\nPlease deposit and settle your mess account as soon as possible.\n` +
        (adminBkash ? `📱 bKash: ${adminBkash}\n` : "") +
        (adminNagad ? `📱 Nagad: ${adminNagad}\n` : "") +
        `\nThank you!`;
    }

    const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";
    const phoneParam = cleanPhone.length >= 10 ? (cleanPhone.startsWith("88") ? cleanPhone : `88${cleanPhone}`) : "";

    const url = phoneParam
      ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
  };

  return (
    <Button
      type="button"
      onClick={handleSendReminder}
      size="sm"
      variant="outline"
      className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shadow-2xs"
      title={t("WhatsApp এ বকেয়া রিমাইন্ডার পাঠান", "Send WhatsApp balance reminder")}
    >
      <MessageSquareText size={13} className="text-emerald-600 dark:text-emerald-400" />
      <span>{t("রিমাইন্ডার", "Reminder")}</span>
    </Button>
  );
}
