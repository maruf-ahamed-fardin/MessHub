"use client";

import { useState, useTransition } from "react";
import { Phone, Mail, MapPin, Plus, Pencil, Trash2, X, Save, ChevronDown, ChevronUp, User2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createContactAction, updateContactAction, deleteContactAction } from "@/app/actions/contacts.actions";

type Contact = {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  phone2: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  emoji: string | null;
  sortOrder: number;
};

interface Props {
  contacts: Contact[];
  isAdmin: boolean;
}

const PRESET_ROLES = [
  { role: "বুয়া / কাজের মানুষ", emoji: "🧹" },
  { role: "বাড়ির মালিক", emoji: "🏠" },
  { role: "WiFi / Internet", emoji: "📡" },
  { role: "কেয়ারটেকার", emoji: "🔑" },
  { role: "পানি সরবরাহকারী", emoji: "💧" },
  { role: "গ্যাস সরবরাহকারী", emoji: "🔥" },
  { role: "বিদ্যুৎ / Electric", emoji: "⚡" },
  { role: "ডাক্তার", emoji: "🏥" },
  { role: "দোকান / Shop", emoji: "🛒" },
  { role: "অন্যান্য", emoji: "📞" },
];

const EMPTY_FORM = {
  name: "",
  role: "",
  phone: "",
  phone2: "",
  email: "",
  address: "",
  note: "",
  emoji: "",
  sortOrder: 0,
};

function ContactCard({
  contact,
  isAdmin,
  onEdit,
  onDelete,
}: {
  contact: Contact;
  isAdmin: boolean;
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = usePreferences();
  const [expanded, setExpanded] = useState(false);

  const hasExtra = !!(contact.phone2 || contact.email || contact.address || contact.note);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all">
      {/* Main Row */}
      <div className="flex items-center gap-3 p-4">
        {/* Emoji Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 border border-primary/20 flex items-center justify-center shrink-0 text-2xl shadow-2xs">
          {contact.emoji || "👤"}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
              {contact.name}
            </p>
            <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
              {contact.role}
            </span>
          </div>
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center gap-1.5 mt-1 group"
            >
              <Phone size={11} className="text-emerald-500 shrink-0" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 group-hover:underline">
                {contact.phone}
              </span>
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center justify-center hover:bg-emerald-100 transition-colors"
              title={t("কল করুন", "Call")}
            >
              <Phone size={14} />
            </a>
          )}
          {hasExtra && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200/80 dark:border-slate-700 flex items-center justify-center hover:bg-gray-100 transition-colors"
              title={expanded ? t("কম দেখুন", "Collapse") : t("আরো দেখুন", "Expand")}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => onEdit(contact)}
                className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                title={t("সম্পাদনা করুন", "Edit")}
              >
                <Pencil size={13} />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 flex items-center justify-center hover:bg-rose-100 transition-colors"
                    title={t("মুছে ফেলুন", "Delete")}
                  >
                    <Trash2 size={13} />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("কন্ট্যাক্ট মুছবেন?", "Delete Contact?")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t(`"${contact.name}" কে কন্ট্যাক্ট তালিকা থেকে সরানো হবে।`, `"${contact.name}" will be removed from contacts.`)}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("বাতিল", "Cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(contact.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      {t("মুছে ফেলুন", "Delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && hasExtra && (
        <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-100 dark:border-slate-800 mt-0">
          {contact.phone2 && (
            <a href={`tel:${contact.phone2}`} className="flex items-center gap-2 group">
              <Phone size={12} className="text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold group-hover:underline">
                {contact.phone2}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                ({t("বিকল্প নম্বর", "Alt. number")})
              </span>
            </a>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 group">
              <Mail size={12} className="text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 dark:text-blue-400 font-semibold group-hover:underline">
                {contact.email}
              </span>
            </a>
          )}
          {contact.address && (
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-rose-500 shrink-0 mt-0.5" />
              <span className="text-xs text-gray-600 dark:text-slate-400">{contact.address}</span>
            </div>
          )}
          {contact.note && (
            <div className="flex items-start gap-2">
              <span className="text-[11px] shrink-0 mt-0.5">📝</span>
              <span className="text-xs text-gray-500 dark:text-slate-500 italic">{contact.note}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Contact | null;
  onSave: (data: typeof EMPTY_FORM) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = usePreferences();
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(initial
      ? {
          name: initial.name,
          role: initial.role,
          phone: initial.phone ?? "",
          phone2: initial.phone2 ?? "",
          email: initial.email ?? "",
          address: initial.address ?? "",
          note: initial.note ?? "",
          emoji: initial.emoji ?? "",
          sortOrder: initial.sortOrder,
        }
      : {}),
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handlePreset = (preset: { role: string; emoji: string }) => {
    setForm((f) => ({ ...f, role: preset.role, emoji: f.emoji || preset.emoji }));
  };

  return (
    <div className="space-y-4">
      {/* Preset Role Pills */}
      <div>
        <Label className="text-xs text-gray-500 dark:text-slate-400 mb-2 block">
          {t("দ্রুত বিভাগ নির্বাচন করুন", "Quick category pick")}
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_ROLES.map((p) => (
            <button
              key={p.role}
              type="button"
              onClick={() => handlePreset(p)}
              className={cn(
                "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all",
                form.role === p.role
                  ? "bg-primary text-white border-primary"
                  : "bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-primary/60"
              )}
            >
              {p.emoji} {p.role}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cname">{t("নাম *", "Name *")}</Label>
          <Input id="cname" value={form.name} onChange={set("name")} placeholder={t("যেমন: রহিমা বেগম", "e.g. Rahima")} required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="crole">{t("পরিচয় / ভূমিকা *", "Role *")}</Label>
          <Input id="crole" value={form.role} onChange={set("role")} placeholder={t("যেমন: বুয়া", "e.g. Maid")} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cphone">{t("ফোন নম্বর", "Phone")}</Label>
          <Input id="cphone" value={form.phone} onChange={set("phone")} type="tel" placeholder="017XXXXXXXX" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cphone2">{t("বিকল্প নম্বর", "Alt Phone")}</Label>
          <Input id="cphone2" value={form.phone2} onChange={set("phone2")} type="tel" placeholder="018XXXXXXXX" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cemoji">{t("ইমোজি (ঐচ্ছিক)", "Emoji (optional)")}</Label>
          <Input id="cemoji" value={form.emoji} onChange={set("emoji")} placeholder="🧹 🏠 📡 …" maxLength={4} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cemail">{t("ইমেইল (ঐচ্ছিক)", "Email (optional)")}</Label>
          <Input id="cemail" value={form.email} onChange={set("email")} type="email" placeholder="email@example.com" />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="caddress">{t("ঠিকানা (ঐচ্ছিক)", "Address (optional)")}</Label>
        <Input id="caddress" value={form.address} onChange={set("address")} placeholder={t("বাসস্থান বা কর্মস্থল", "Home or work address")} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="cnote">{t("নোট (ঐচ্ছিক)", "Note (optional)")}</Label>
        <Input id="cnote" value={form.note} onChange={set("note")} placeholder={t("অতিরিক্ত তথ্য…", "Additional info…")} />
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          <X size={14} className="mr-1.5" />
          {t("বাতিল", "Cancel")}
        </Button>
        <Button
          type="button"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim() || !form.role.trim()}
          className="flex-1 bg-primary hover:bg-primary/90 text-white"
        >
          {saving ? (
            <span className="animate-spin mr-1.5">⏳</span>
          ) : (
            <Save size={14} className="mr-1.5" />
          )}
          {t("সংরক্ষণ করুন", "Save")}
        </Button>
      </div>
    </div>
  );
}

export function ContactsDirectory({ contacts: initialContacts, isAdmin }: Props) {
  const { t } = usePreferences();
  const [contacts, setContacts] = useState(initialContacts);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Contact | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (form: typeof EMPTY_FORM) => {
    startTransition(async () => {
      try {
        if (editTarget) {
          await updateContactAction(editTarget.id, form);
          setContacts((prev) =>
            prev.map((c) => (c.id === editTarget.id ? { ...c, ...form } : c))
          );
        } else {
          await createContactAction(form);
          // Refresh by re-loading from server
          const mod = await import("@/app/actions/contacts.actions");
          const fresh = await mod.getContactsAction();
          setContacts(fresh as Contact[]);
        }
        setDialogOpen(false);
        setEditTarget(null);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleEdit = (c: Contact) => {
    setEditTarget(c);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteContactAction(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    });
  };

  const openAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditTarget(null); }}>
            <DialogTrigger asChild>
              <Button
                onClick={openAdd}
                className="gap-2 h-9 text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
              >
                <Plus size={15} />
                {t("নতুন কন্ট্যাক্ট যোগ করুন", "Add Contact")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editTarget
                    ? t("কন্ট্যাক্ট সম্পাদনা করুন", "Edit Contact")
                    : t("নতুন কন্ট্যাক্ট যোগ করুন", "Add New Contact")}
                </DialogTitle>
              </DialogHeader>
              <ContactForm
                initial={editTarget}
                onSave={handleSave}
                onCancel={() => { setDialogOpen(false); setEditTarget(null); }}
                saving={isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Empty State */}
      {contacts.length === 0 && (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-3xl">📞</div>
          <div>
            <p className="font-bold text-gray-700 dark:text-slate-300">
              {t("কোনো কন্ট্যাক্ট নেই", "No contacts yet")}
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
              {isAdmin
                ? t("উপরের বাটনে ক্লিক করে বুয়া, মালিক, WiFi ইত্যাদির নম্বর যোগ করুন।", "Click above to add bua, landlord, WiFi etc.")
                : t("Admin এখনো কোনো কন্ট্যাক্ট যোগ করেননি।", "Admin has not added any contacts yet.")}
            </p>
          </div>
        </div>
      )}

      {/* Contact Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {contacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            isAdmin={isAdmin}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Member Contacts Hint */}
      {contacts.length > 0 && (
        <p className="text-center text-[11px] text-gray-400 dark:text-slate-600 pt-1">
          {t("কার্ডে ক্লিক করে সরাসরি ফোন করুন", "Tap phone icon to call directly")}
        </p>
      )}
    </div>
  );
}
