"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, Loader2, Copy, AlertCircle, PhoneCall, Hash, CheckCircle2 } from "lucide-react";
import { approvePaymentRequestAction, rejectPaymentRequestAction } from "@/app/actions/finance.actions";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { useRouter } from "next/navigation";

interface PendingPaymentRequestsCardProps {
  requests: any[];
  isAdmin: boolean;
}

export function PendingPaymentRequestsCard({ requests, isAdmin }: PendingPaymentRequestsCardProps) {
  const { t } = usePreferences();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [copiedTrx, setCopiedTrx] = useState<string | null>(null);

  if (!isAdmin || requests.length === 0) {
    return null;
  }

  const handleCopy = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrx(trx);
    setTimeout(() => setCopiedTrx(null), 2000);
  };

  const handleApprove = async (id: string, memberName: string, amount: number) => {
    if (!confirm(t(`${memberName}-এর ৳${amount} টাকা জমা অনুমোদন করবেন?`, `Approve deposit of ৳${amount} for ${memberName}?`))) {
      return;
    }

    setLoadingId(id);
    try {
      const res = await approvePaymentRequestAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to approve");
      }
    } catch (err: any) {
      alert(err?.message || "Error approving payment");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string, memberName: string) => {
    const reason = prompt(t(`${memberName}-এর জমার অনুরোধ বাতিলের কারণ লিখুন:`, `Enter reason for rejecting ${memberName}'s deposit:`));
    if (reason === null) return;

    setLoadingId(id);
    try {
      const res = await rejectPaymentRequestAction(id, reason);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "Failed to reject");
      }
    } catch (err: any) {
      alert(err?.message || "Error rejecting payment");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-950 dark:text-amber-200">
              {t("পেন্ডিং ডিপোজিট রিকোয়েস্ট", "Pending Deposit Requests")}
            </h3>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
              {t(`${requests.length}টি জমার অনুরোধ এডমিন অনুমোদনের অপেক্ষায় রয়েছে`, `${requests.length} deposit requests waiting for admin verification`)}
            </p>
          </div>
        </div>

        <Badge className="bg-amber-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full">
          {requests.length} {t("টি পেন্ডিং", "Pending")}
        </Badge>
      </div>

      <div className="space-y-2.5">
        {requests.map((req) => {
          const memberName = req.member?.user?.name || "মেম্বার";
          const isLoading = loadingId === req.id;

          return (
            <div
              key={req.id}
              className="bg-card border border-border/80 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
            >
              {/* Left: Member & Transaction Info */}
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border">
                  <AvatarImage src={req.member?.user?.image || undefined} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {memberName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm text-foreground truncate">{memberName}</p>
                    <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary bg-primary/5">
                      {req.method}
                    </Badge>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      ৳{Number(req.amount).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {req.senderPhone && (
                      <span className="inline-flex items-center gap-1 font-mono">
                        <PhoneCall size={11} className="text-muted-foreground" />
                        {req.senderPhone}
                      </span>
                    )}

                    {req.trxId && (
                      <span className="inline-flex items-center gap-1 font-mono bg-muted px-1.5 py-0.5 rounded-md font-bold text-foreground">
                        <Hash size={11} className="text-muted-foreground" />
                        <span>TrxID: {req.trxId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(req.trxId)}
                          className="hover:text-primary cursor-pointer p-0.5"
                          title="Copy TrxID"
                        >
                          {copiedTrx === req.trxId ? <CheckCircle2 size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        </button>
                      </span>
                    )}

                    <span className="text-[11px] text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {req.note && (
                    <p className="text-xs text-muted-foreground italic">
                      &ldquo;{req.note}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Approve / Reject Controls */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  onClick={() => handleReject(req.id, memberName)}
                  disabled={isLoading}
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs font-bold gap-1 rounded-xl text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  <X size={13} />
                  <span>{t("বাতিল", "Reject")}</span>
                </Button>

                <Button
                  onClick={() => handleApprove(req.id, memberName, Number(req.amount))}
                  disabled={isLoading}
                  size="sm"
                  className="h-8 px-3 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-2xs cursor-pointer"
                >
                  {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>{t("অ্যাপ্রুভ ✓", "Approve ✓")}</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
