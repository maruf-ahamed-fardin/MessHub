"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, ShieldCheck, Database, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { exportDatabaseBackupAction, importDatabaseBackupAction } from "@/app/actions/backup.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";

export function DataBackupSection() {
  const { t } = usePreferences();
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const handleExportBackup = async () => {
    setDownloading(true);
    setStatusMsg(null);
    try {
      const res = await exportDatabaseBackupAction();
      if (!res.success || !res.data) {
        setStatusMsg({ type: "error", text: res.error || t("ব্যাকআপ এক্সপোর্ট করতে সমস্যা হয়েছে", "Failed to export backup") });
        return;
      }

      const jsonStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `messhub-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({ type: "success", text: t("✓ ডাটাবেজ ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে!", "✓ Database backup downloaded successfully!") });
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: err?.message || t("ব্যাকআপ ডাউনলোড ব্যর্থ হয়েছে", "Failed to download backup") });
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || !parsed.users || !parsed.memberProfiles) {
          setStatusMsg({ type: "error", text: t("অকার্যকর ব্যাকআপ ফাইল", "Invalid backup file format") });
          return;
        }
        setPendingPayload(parsed);
        setConfirmOpen(true);
      } catch (err) {
        setStatusMsg({ type: "error", text: t("ফাইলটি সঠিক JSON ফরম্যাটে নেই", "File is not a valid JSON") });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmRestore = async () => {
    if (!pendingPayload) return;
    setRestoring(true);
    setStatusMsg(null);
    try {
      const res = await importDatabaseBackupAction(pendingPayload);
      if (!res.success) {
        setStatusMsg({ type: "error", text: res.error || t("রিস্টোর করতে সমস্যা হয়েছে", "Failed to restore backup") });
        return;
      }
      setConfirmOpen(false);
      setPendingPayload(null);
      setStatusMsg({ type: "success", text: t("✓ ডাটাবেজ সফলভাবে রিস্টোর হয়েছে!", "✓ Database restored successfully!") });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: err?.message || t("রিস্টোর ব্যর্থ হয়েছে", "Restore failed") });
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-center shrink-0 shadow-2xs">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 dark:text-slate-100">{t("ডাটাবেজ ব্যাকআপ ও নিরাপত্তা", "Database Backup & Safety")}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t("আপনার মেসের সমস্ত ডাটা নিরাপদে এক্সপোর্ট বা রিস্টোর করুন", "Safely export or restore all mess data")}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-1.5 shadow-2xs w-fit">
          <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" /> {t("লোকাল স্টোরেজ সুরক্ষিত", "Local DB Protected")}
        </span>
      </div>

      {/* Status feedback message */}
      {statusMsg && (
        <div
          className={cn(
            "p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in duration-200",
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200 border-rose-200 dark:border-rose-800"
          )}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Action buttons (Harmonized light & dark styles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* 1. Export JSON */}
        <button
          type="button"
          onClick={handleExportBackup}
          disabled={downloading}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-indigo-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-slate-800/50 hover:bg-indigo-50/80 dark:hover:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left cursor-pointer group shadow-2xs active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t("১-ক্লিক সম্পূর্ণ ব্যাকআপ (.JSON)", "1-Click Full Backup (.JSON)")}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">
                {t("সব টেবিল ও সেটিংস ডাউনলোড করুন", "Download all tables and settings")}
              </p>
            </div>
          </div>
        </button>

        {/* 2. Restore JSON */}
        <label className="w-full flex items-center justify-between p-3 rounded-xl border border-amber-100 dark:border-slate-800 bg-amber-50/40 dark:bg-slate-800/50 hover:bg-amber-50/80 dark:hover:bg-slate-800/80 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all text-left cursor-pointer group shadow-2xs active:scale-[0.99]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
              {restoring ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                {t("ব্যাকআপ ফাইল রিস্টোর করুন", "Restore from Backup File")}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium truncate">
                {t(".json ফাইল আপলোড করুন", "Upload .json file to restore")}
              </p>
            </div>
          </div>
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={restoring}
            className="sr-only"
          />
        </label>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold">
              <AlertTriangle size={18} />
              {t("ডাটাবেজ রিস্টোর নিশ্চিতকরণ", "Confirm Database Restore")}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-slate-400 pt-1">
              {t(
                "এই ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান ডাটাবেজের রেকর্ডগুলো আপডেট বা প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?",
                "Restoring this backup file will update and restore records in your database. Are you sure you want to proceed?"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-700/60 text-xs space-y-1.5 text-gray-700 dark:text-slate-200">
            <p><strong>{t("মেসের নাম:", "Mess Name:")}</strong> {pendingPayload?.messSettings?.messName || "N/A"}</p>
            <p><strong>{t("মোট মেম্বার:", "Total Members:")}</strong> {pendingPayload?.memberProfiles?.length || 0}</p>
            <p><strong>{t("এক্সপোর্ট সময়:", "Exported At:")}</strong> {pendingPayload?.exportedAt ? new Date(pendingPayload.exportedAt).toLocaleString() : "N/A"}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(false)} disabled={restoring}>
              {t("বাতিল", "Cancel")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmRestore}
              disabled={restoring}
              className="gap-1.5"
            >
              {restoring ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {t("হ্যাঁ, রিস্টোর করুন", "Yes, Restore Database")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
