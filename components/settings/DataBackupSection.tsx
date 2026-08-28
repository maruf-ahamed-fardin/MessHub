"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, ShieldCheck, Database, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { exportDatabaseBackupAction, importDatabaseBackupAction } from "@/app/actions/backup.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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
    <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("ডাটাবেজ ব্যাকআপ ও নিরাপত্তা", "Database Backup & Safety")}</h3>
            <p className="text-xs text-muted-foreground">{t("আপনার মেসের সমস্ত ডাটা নিরাপদে এক্সপোর্ট বা রিস্টোর করুন", "Safely export or restore all mess data")}</p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
          <ShieldCheck size={13} /> {t("লোকাল স্টোরেজ সুরক্ষিত", "Local DB Protected")}
        </span>
      </div>

      {statusMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Export JSON */}
        <Button
          onClick={handleExportBackup}
          disabled={downloading}
          variant="outline"
          className="h-11 justify-start gap-2.5 font-bold text-xs rounded-xl border-border hover:bg-primary/5 hover:border-primary/40 cursor-pointer"
        >
          {downloading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Download size={16} className="text-primary" />}
          <div className="text-left">
            <div>{t("১-ক্লিক সম্পূর্ণ ব্যাকআপ (.JSON)", "1-Click Full Backup (.JSON)")}</div>
            <div className="text-[10px] text-muted-foreground font-normal">{t("সব টেবিল ও সেটিংস ডাউনলোড করুন", "Download all tables and settings")}</div>
          </div>
        </Button>

        {/* Restore JSON */}
        <label className="relative flex items-center h-11 px-3 gap-2.5 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/40 cursor-pointer text-xs font-bold transition-colors">
          <Upload size={16} className="text-amber-500 shrink-0" />
          <div className="text-left leading-tight">
            <div>{t("ব্যাকআপ ফাইল রিস্টোর করুন", "Restore from Backup File")}</div>
            <div className="text-[10px] text-muted-foreground font-normal">{t(".json ফাইল আপলোড করুন", "Upload .json file to restore")}</div>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle size={20} />
              {t("ডাটাবেজ রিস্টোর নিশ্চিতকরণ", "Confirm Database Restore")}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              {t(
                "এই ব্যাকআপ ফাইলটি রিস্টোর করলে বর্তমান ডাটাবেজের রেকর্ডগুলো আপডেট বা প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?",
                "Restoring this backup file will update and restore records in your database. Are you sure you want to proceed?"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-3 rounded-xl text-xs space-y-1">
            <p><strong>{t("মেসের নাম:", "Mess Name:")}</strong> {pendingPayload?.messSettings?.messName || "N/A"}</p>
            <p><strong>{t("মোট মেম্বার:", "Total Members:")}</strong> {pendingPayload?.memberProfiles?.length || 0}</p>
            <p><strong>{t("এক্সপোর্ট সময়:", "Exported At:")}</strong> {pendingPayload?.exportedAt ? new Date(pendingPayload.exportedAt).toLocaleString() : "N/A"}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
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
