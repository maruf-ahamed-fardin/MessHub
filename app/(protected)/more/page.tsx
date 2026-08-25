import type { Metadata } from "next";
import Link from "next/link";
import {
  BedDouble, ShoppingBasket, Receipt, CreditCard, BarChart3,
  Brush, Bell, Calendar, Settings, Megaphone, ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/auth/config";
import { PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils/cn";
import { PwaInstallButton } from "@/components/shared/PwaInstallButton";

export const metadata: Metadata = { title: "More Menu" };

const ALL_ITEMS = [
  {
    label: "Rooms & Members",
    bengaliLabel: "রুম ও মেম্বার তালিকা",
    href: "/rooms",
    icon: BedDouble,
    desc: "৩টি রুমের সিট বিবরণ ও ৭ জন মেম্বারের প্রোফাইল",
    badge: "৩ রুম",
    colorStyle: "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60",
  },
  {
    label: "Bazar Records",
    bengaliLabel: "বাজারের হিসাব ও শিডিউল",
    href: "/bazar",
    icon: ShoppingBasket,
    desc: "দৈনিক বাজার খরচ, ভাউচার ও মেম্বারদের বাজার রোটেশন",
    colorStyle: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
  },
  {
    label: "Expenses & Bills",
    bengaliLabel: "বাসা ভাড়া ও ইউটিলিটি বিল",
    href: "/expenses",
    icon: Receipt,
    desc: "ফ্ল্যাট ভাড়া, বিদ্যুৎ, ওয়াইফাই, পানি ও গ্যাস বিল বণ্টন",
    colorStyle: "bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
  },
  {
    label: "Money Transaction",
    bengaliLabel: "টাকা লেনদেন ও মেস ফান্ড",
    href: "/payments",
    icon: CreditCard,
    desc: "মেম্বারদের টাকা জমা (Money In), মোট ব্যয় ও ব্যালেন্স স্থিতি",
    badge: "টাকা ইন/আউট",
    colorStyle: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
  },
  {
    label: "Monthly Settlement",
    bengaliLabel: "মাসিক চূড়ান্ত মিল ও বিল সেটেলমেন্ট",
    href: "/settlement",
    icon: BarChart3,
    desc: "মাস শেষের মিল রেট ও মেম্বারদের লেনদেন নিষ্পত্তি",
    colorStyle: "bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60",
  },
  {
    label: "House & Tasks",
    bengaliLabel: "বাসার ডিউটি ও মেইনটেন্যান্স",
    href: "/house",
    icon: Brush,
    desc: "ক্লিনিং শিডিউল, গ্যাস সিলিন্ডার ও সার্ভিসিং টাস্ক",
    colorStyle: "bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60",
  },
  {
    label: "Notices Board",
    bengaliLabel: "মেস নোটিশ ও জরুরি মিটিং",
    href: "/notices",
    icon: Megaphone,
    desc: "জরুরি নোটিশ, মেস মিটিং ও অফিশিয়াল ঘোষণা",
    badge: "অ্যালার্ট",
    badgeColor: "bg-rose-500 text-white",
    colorStyle: "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-800/60",
  },
  {
    label: "Notifications",
    bengaliLabel: "নোটিফিকেশন সেন্টার",
    href: "/notifications",
    icon: Bell,
    desc: "বাজার, টাকা জমা, মিল ও ডিউটির সকল আপডেট",
    colorStyle: "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
  },
  {
    label: "Mess Calendar",
    bengaliLabel: "ক্যালেন্ডার ও ইভেন্ট শিডিউল",
    href: "/calendar",
    icon: Calendar,
    desc: "বাজারের শিডিউল, মিটিং ও গুরুত্বপূর্ণ তারিখ",
    colorStyle: "bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60",
  },
  {
    label: "Mess Settings",
    bengaliLabel: "মেস কনফিগারেশন ও সেটিংস",
    href: "/settings",
    icon: Settings,
    desc: "মেসের নাম, অ্যাডমিন নিয়ন্ত্রণ ও রুলস সেটআপ",
    colorStyle: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300/80 dark:border-slate-700",
  },
];

export default async function MorePage() {
  const session = await auth();
  const isAdmin = session?.user.role === "ADMIN";

  const items = isAdmin ? ALL_ITEMS : ALL_ITEMS.filter((i) => i.href !== "/settings");

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      <PageHeader
        title="More"
        description="মেসের সকল ফিচার ও সেটিংসের এক ক্লিকে তালিকা"
      />

      {/* PWA App Install Banner Card */}
      <PwaInstallButton variant="card" />

      {/* One-By-One Modern List */}
      <div className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3.5 shadow-2xs hover:shadow-xs hover:border-gray-300 dark:hover:border-slate-700 hover:scale-[1.005] active:scale-[0.99] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Colorful High-Contrast Icon Squircle */}
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform",
                    item.colorStyle
                  )}
                >
                  <Icon size={20} />
                </div>

                {/* Text Labels */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-extrabold text-gray-900 dark:text-slate-100 group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors leading-tight">
                      {item.label}
                    </p>
                    {"badge" in item && Boolean(item.badge) && (
                      <span
                        className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full border border-transparent shadow-2xs",
                          (item as any).badgeColor || "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200/60 dark:border-slate-700"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mt-0.5 truncate leading-relaxed">
                    {item.bengaliLabel} • {item.desc}
                  </p>
                </div>
              </div>

              {/* Right Arrow */}
              <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 flex items-center justify-center text-gray-400 dark:text-slate-400 group-hover:text-primary group-hover:bg-primary/10 transition-all shrink-0">
                <ChevronRight size={16} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
