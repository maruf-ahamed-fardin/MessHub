"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { MONTH_NAMES_BN, MONTH_NAMES_EN } from "@/lib/constants/categories";
import { downloadCsv, generateBazarCsv } from "@/lib/utils/export-csv";

interface BazarExportButtonProps {
  bazars: any[];
  month: number;
  year: number;
  messName?: string;
  currency?: string;
}

export function BazarExportButton({
  bazars,
  month,
  year,
  messName = "MessHub",
  currency = "৳",
}: BazarExportButtonProps) {
  const { t, language } = usePreferences();
  const monthName = language === "bn" ? MONTH_NAMES_BN[month] : MONTH_NAMES_EN[month];

  const handleExport = () => {
    const csv = generateBazarCsv({
      messName,
      monthName,
      year,
      currency,
      bazars,
    });
    const filename = `Bazar_${messName.replace(/\s+/g, "_")}_${month}_${year}.csv`;
    downloadCsv(filename, csv);
  };

  return (
    <Button
      onClick={handleExport}
      size="sm"
      variant="outline"
      className="h-9 px-3 gap-1.5 font-bold text-xs rounded-xl border-border hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-300 cursor-pointer shadow-2xs"
    >
      <Download size={14} className="text-emerald-600" />
      <span>{t("বাজার রিপোর্ট এক্সপোর্ট (CSV)", "Export Bazar (CSV)")}</span>
    </Button>
  );
}
