"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
  Menu,
  SquarePen,
  Send,
  Mic,
  MicOff,
  RotateCcw,
  X,
  User,
  ShoppingBag,
  Utensils,
  Receipt,
  Volume2,
  VolumeX,
  Loader2,
  ChevronRight,
  ClipboardList,
  Plus,
  History,
  Trash2,
  MessageSquare,
  ChevronLeft,
  ImageIcon,
  Paperclip,
  CheckCircle2,
  Lock,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { processAIAssistantQueryAction, AIAssistantResponse } from "@/app/actions/ai-assistant.actions";
import { AIBazarActionCard } from "./AIBazarActionCard";
import { AIMealActionCard } from "./AIMealActionCard";
import { AIGuestMealCard } from "./AIGuestMealCard";
import { AIMessStatsCard } from "./AIMessStatsCard";
import { GeminiAiIcon } from "./GeminiAiIcon";
import { usePreferences } from "@/lib/context/PreferencesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  actionCard?: AIAssistantResponse["actionCard"];
  suggestedQuestions?: string[];
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  modelName?: string;
}

interface AIAssistantChatProps {
  onClose?: () => void;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    role: string;
  };
  userName?: string;
}

const QUICK_STARTERS = [
  { label: "🛒 ৫০০ টাকার বাজার যোগ করো", prompt: "আজকে ৫০০ টাকার মুরগি আর ১০০ টাকার আলু বাজার করেছি" },
  { label: "🍽️ কালকে দুপুরের মিল অফ করো", prompt: "কালকে দুপুরের মিল বন্ধ করো আর রাতের মিল অন রাখো" },
  { label: "📊 বর্তমান মিল রেট কত?", prompt: "আমাদের বর্তমান মিল রেট এবং চলতি মাসের মোট খরচ কত?" },
  { label: "💰 আমার ব্যালেন্স কত টাকা আছে?", prompt: "আমার বর্তমান ব্যালেন্স, ডিপোজিট এবং মিল হিসাব দেখাও" },
  { label: "👥 ২টা গেস্ট মিল অ্যাড করো", prompt: "কালকে দুপুরের জন্য ২টা গেস্ট মিল বুক করো (বন্ধু)" },
  { label: "📅 কার কার বাজার ডিউটি?", prompt: "এই সপ্তাহে কার কার বাজার ডিউটি আছে?" },
  { label: "🍳 আজকে মোট মিল কতটি চালু?", prompt: "আজকে সকাল, দুপুর ও রাতের মেসের মোট মিল কাউন্ট কতটি?" },
  { label: "💵 মেসের মোট খরচ ও মিল হিসাব", prompt: "চলতি মাসে মেসে সর্বমোট কত টাকা বাজার হয়েছে এবং মোট কত মিল খাওয়া হয়েছে?" },
  { label: "🧹 রুম ও কিচেন ক্লিনিং শিডিউল", prompt: "মেসের রুম ও কিচেন পরিষ্কারের ডিউটি শিডিউল দেখাও" },
  { label: "📝 বাজার মেমো / ফর্দ হিসাব করো", prompt: "আমি বাজারের একটি ফর্দ দিচ্ছি, সব পণ্যের দাম আলাদা করে মোট হিসাব বের করো" },
];

export function AIAssistantChat({ onClose, user, userName }: AIAssistantChatProps) {
  const { t, language } = usePreferences();
  const activeUserId = user?.id || "guest";
  const userStorageKey = `messhub_ai_sessions_${activeUserId}_v3`;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  // Image upload state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceSpeechEnabled, setVoiceSpeechEnabled] = useState(false);
  const [memoDialogOpen, setMemoDialogOpen] = useState(false);
  const [memoText, setMemoText] = useState("");
  const [activeModel, setActiveModel] = useState("MessHub Smart NLU Engine");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Helper to create a new session
  const createNewSession = (): ChatSession => {
    const id = `session-${Date.now()}`;
    const newSess: ChatSession = {
      id,
      title: t("নতুন কনভারসেশন", "New Conversation"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      modelName: "MessHub Smart NLU Engine",
    };
    return newSess;
  };

  // Load user-specific private sessions from localStorage on mount or user change
  useEffect(() => {
    try {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        const parsed: ChatSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const loadedSessions = parsed.map((s) => ({
            ...s,
            messages: s.messages.map((m) => ({ ...m, createdAt: new Date(m.createdAt) })),
          }));
          setSessions(loadedSessions);
          setActiveSessionId(loadedSessions[0].id);
          return;
        }
      }
    } catch {
      // Ignore
    }

    // Default first session for this specific user
    const first = createNewSession();
    setSessions([first]);
    setActiveSessionId(first.id);
  }, [userStorageKey]);

  // Save sessions to user-specific private localStorage key
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem(userStorageKey, JSON.stringify(updatedSessions.slice(0, 30)));
    } catch {
      // Ignore
    }
  };

  const currentSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  const messages = currentSession?.messages ?? [];

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  // Setup Web Speech API for voice recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === "bn" ? "bn-BD" : "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(t("আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না।", "Speech recognition is not supported in your browser."));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = language === "bn" ? "bn-BD" : "en-US";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech start error:", err);
        setIsListening(false);
      }
    }
  };

  const handleStartNewChat = () => {
    const newSess = createNewSession();
    const nextList = [newSess, ...sessions];
    setSessions(nextList);
    setActiveSessionId(newSess.id);
    setShowHistorySidebar(false);
    setAttachedImage(null);
    setImageFileName(null);
    saveSessionsToStorage(nextList);
  };

  const handleDeleteSession = (idToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = sessions.filter((s) => s.id !== idToDelete);
    if (remaining.length === 0) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      saveSessionsToStorage([fresh]);
    } else {
      setSessions(remaining);
      if (activeSessionId === idToDelete) {
        setActiveSessionId(remaining[0].id);
      }
      saveSessionsToStorage(remaining);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm(t("আপনি কি আপনার সমস্ত চ্যাট হিস্ট্রি মুছে ফেলতে চান?", "Are you sure you want to delete all chat history?"))) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      saveSessionsToStorage([fresh]);
      setShowHistorySidebar(false);
    }
  };

  // Image Upload handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(t("দয়া করে একটি সঠিক ইমেজ ফাইল নির্বাচন করুন।", "Please select a valid image file."));
      return;
    }

    // Check size limit (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      alert(t("ছবির সাইজ ৮ মেগাবাইটের কম হতে হবে।", "Image size must be under 8MB."));
      return;
    }

    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeAttachedImage = () => {
    setAttachedImage(null);
    setImageFileName(null);
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !attachedImage) || isPending) return;

    // Ensure we have an active session
    let targetSessionId = activeSessionId;
    let targetSession = currentSession;

    if (!targetSession) {
      const created = createNewSession();
      targetSessionId = created.id;
      targetSession = created;
      setSessions([created, ...sessions]);
      setActiveSessionId(created.id);
    }

    const currentImage = attachedImage;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query || (currentImage ? t("📸 বাজারের মেমো / ফর্দ ছবি", "📸 Bazar Memo / Receipt Image") : ""),
      imageUrl: currentImage || undefined,
      createdAt: new Date(),
    };

    // Auto-generate title if this is the first message
    const isFirstMessage = targetSession.messages.length === 0;
    const sessionTitle = isFirstMessage
      ? (query ? (query.slice(0, 28) + (query.length > 28 ? "..." : "")) : "📸 মেমো ছবি বিশ্লেষণ")
      : targetSession.title;

    const updatedMessages = [...targetSession.messages, userMsg];

    // Optimistically update session
    const updatedSessions = sessions.map((s) =>
      s.id === targetSessionId
        ? { ...s, title: sessionTitle, updatedAt: new Date().toISOString(), messages: updatedMessages }
        : s
    );
    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);
    setInput("");
    setAttachedImage(null);
    setImageFileName(null);

    startTransition(async () => {
      try {
        const historyForBackend = updatedMessages.slice(-5).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await processAIAssistantQueryAction(query, historyForBackend, currentImage || undefined);

        if (res.modelName) {
          setActiveModel(res.modelName);
        }

        const aiContent = language === "bn" && res.replyBengali ? res.replyBengali : res.replyText;

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: aiContent,
          actionCard: res.actionCard,
          suggestedQuestions: res.suggestedQuestions,
          createdAt: new Date(),
        };

        const finalMessages = [...updatedMessages, aiMsg];
        const finalSessions = sessions.map((s) =>
          s.id === targetSessionId
            ? { ...s, title: sessionTitle, updatedAt: new Date().toISOString(), messages: finalMessages, modelName: res.modelName || activeModel }
            : s
        );

        setSessions(finalSessions);
        saveSessionsToStorage(finalSessions);

        // Optional Text-To-Speech
        if (voiceSpeechEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
          const cleanText = aiContent.replace(/[•*#]/g, "").slice(0, 150);
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = language === "bn" ? "bn-BD" : "en-US";
          window.speechSynthesis.speak(utterance);
        }
      } catch (err) {
        console.error("AI processing error:", err);
        const errorMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: t(
            "দুঃখিত, কোনো একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
            "Sorry, an error occurred. Please try again."
          ),
          createdAt: new Date(),
        };
        const finalMessages = [...updatedMessages, errorMsg];
        const finalSessions = sessions.map((s) =>
          s.id === targetSessionId
            ? { ...s, messages: finalMessages }
            : s
        );
        setSessions(finalSessions);
        saveSessionsToStorage(finalSessions);
      }
    });
  };

  const handleProcessMemo = () => {
    if (!memoText.trim()) return;
    setMemoDialogOpen(false);
    handleSend(`বাজার মেমো থেকে যোগ করো:\n${memoText}`);
    setMemoText("");
  };

  const filteredSessions = sessions.filter((s) =>
    searchFilter.trim() ? s.title.toLowerCase().includes(searchFilter.toLowerCase()) : true
  );

  // Close drawer on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && showHistorySidebar) {
        setShowHistorySidebar(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showHistorySidebar]);

  return (
    <div className="flex flex-col h-full bg-white/95 dark:bg-slate-900/95 overflow-hidden text-gray-900 dark:text-slate-100 relative select-none">
      {/* Mobile Top Pill Handle Indicator */}
      <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mt-2 -mb-0.5 md:hidden shrink-0" />

      {/* 1. Ultra-Clean Header with 3-Dash Menu Bar & Controls */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0 shadow-2xs z-10">
        {/* Left: 3-Dash Bar + New Chat + Branding */}
        <div className="flex items-center gap-1.5">
          {/* 3-Dash Menu Button (Hamburger) */}
          <button
            type="button"
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors cursor-pointer"
            title={t("মেনু ও চ্যাট হিস্ট্রি (3-Dash Menu)", "Open Menu & History Drawer")}
            aria-label="Open 3-Dash Menu"
          >
            <Menu size={18} />
          </button>

          {/* New Chat Quick Icon (ChatGPT style) */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="p-2 rounded-xl text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition-colors cursor-pointer"
            title={t("নতুন চ্যাট শুরু করুন", "New Chat")}
          >
            <SquarePen size={17} />
          </button>

          {/* Branding Title */}
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-2xs">
              <GeminiAiIcon size={16} gradient={true} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="font-extrabold text-xs tracking-tight text-gray-900 dark:text-slate-100">
                  MessMate AI
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-slate-500 truncate max-w-[130px]">
                {activeModel}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Audio TTS & Close */}
        <div className="flex items-center gap-1">
          {/* Audio TTS toggle */}
          <button
            type="button"
            onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
            className={cn(
              "p-2 rounded-xl transition-colors cursor-pointer",
              voiceSpeechEnabled
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700"
            )}
            title={voiceSpeechEnabled ? "Voice Enabled" : "Voice Disabled"}
          >
            {voiceSpeechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Close modal */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 transition-colors cursor-pointer ml-0.5"
              title={t("বন্ধ করুন", "Close")}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. ChatGPT-Style 3-Dash Menu Drawer (Personal & Private Per User) */}
      {showHistorySidebar && (
        <>
          {/* Backdrop for closing drawer on click/touch outside */}
          <div
            onClick={() => setShowHistorySidebar(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-2xs z-20 animate-in fade-in duration-150 cursor-pointer"
            aria-label="Close Drawer"
          />

          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 text-slate-100 z-30 shadow-2xl border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
          {/* Drawer Top Header with User Info */}
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs truncate text-white">
                  {user?.name || userName || t("মেম্বার", "Member")}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <Lock size={10} />
                  <span>{t("ব্যক্তিগত ও সুরক্ষিত চ্যাট", "Private & Personal")}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHistorySidebar(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title={t("বন্ধ করুন", "Close Drawer")}
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat Primary Action */}
          <div className="p-2.5">
            <Button
              type="button"
              onClick={handleStartNewChat}
              className="w-full h-9 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold gap-2 shadow-sm rounded-xl cursor-pointer"
            >
              <Plus size={15} />
              <span>{t("+ নতুন চ্যাট শুরু করুন", "+ Start New Chat")}</span>
            </Button>
          </div>

          {/* Search Chats Input */}
          <div className="px-2.5 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder={t("আগের চ্যাট খুঁজুন...", "Search chats...")}
                className="w-full h-7 bg-slate-800/80 border border-slate-700/60 rounded-lg pl-7 pr-2 text-[11px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Conversation History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-2 py-1">
              {t("চ্যাট হিস্ট্রি (Personal History)", "Personal History")}
            </p>

            {filteredSessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const dateStr = new Date(sess.updatedAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={sess.id}
                  onClick={() => {
                    setActiveSessionId(sess.id);
                    setShowHistorySidebar(false);
                  }}
                  className={cn(
                    "group px-2.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between cursor-pointer select-none",
                    isActive
                      ? "bg-emerald-600/30 text-white border border-emerald-500/40 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <MessageSquare size={13} className={isActive ? "text-emerald-400 shrink-0" : "text-slate-500 shrink-0"} />
                    <div className="min-w-0">
                      <p className="truncate text-xs leading-tight">{sess.title}</p>
                      <p className="text-[10px] text-slate-500">{dateStr} • {sess.messages.length} msgs</p>
                    </div>
                  </div>

                  {/* Delete conversation */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity cursor-pointer"
                    title={t("ডিলিট করুন", "Delete Chat")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}

            {filteredSessions.length === 0 && (
              <div className="py-6 text-center text-xs text-slate-500">
                {t("কোনো চ্যাট পাওয়া যায়নি", "No chats found")}
              </div>
            )}
          </div>

          {/* Drawer Bottom Actions: Clear All & Security Badge */}
          <div className="p-3 border-t border-slate-800 text-[10px] space-y-2">
            <button
              type="button"
              onClick={handleClearAllHistory}
              className="w-full text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>{t("সমস্ত হিস্ট্রি মুছে ফেলুন", "Clear All History")}</span>
            </button>

            <div className="flex items-center justify-center gap-1 font-semibold text-slate-400 text-[9px] pt-1">
              <Lock size={10} className="text-emerald-400" />
              <span>{t("আপনার চ্যাট শুধুমাত্র আপনার অ্যাকাউন্টে সুরক্ষিত।", "Your conversations are 100% private to you.")}</span>
            </div>
          </div>
        </div>
        </>
      )}

      {/* 3. Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="py-5 px-1 text-center space-y-4 animate-in fade-in">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/15 to-cyan-500/15 dark:from-emerald-500/25 dark:to-teal-500/25 mx-auto flex items-center justify-center shadow-inner">
              <GeminiAiIcon size={30} gradient={true} />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-slate-100">
                {userName || user?.name ? `আসসালামু আলাইকুম, ${userName || user?.name}!` : t("আসসালামু আলাইকুম!", "Welcome!")}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                {t(
                  "বাজার যোগ, মেমোর ছবি আপলোড, মিল পরিবর্তন বা মেসের হিসাব জানতে আমাকে বলুন।",
                  "Ask anything — upload memo photo, toggle meals, record bazar, or check live mess stats."
                )}
              </p>
            </div>

            {/* Quick Starters */}
            <div className="pt-2 text-left space-y-2">
              <p className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">
                {t("💡 দ্রুত শুরু করুন (Quick Prompts)", "💡 Quick Prompts")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_STARTERS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q.prompt)}
                    className="p-2.5 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-gray-50/80 dark:bg-slate-800/40 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800/60 text-left transition-all text-xs font-semibold text-gray-700 dark:text-slate-200 group flex items-center justify-between shadow-2xs cursor-pointer active:scale-98"
                  >
                    <span className="truncate pr-1">{q.label}</span>
                    <ChevronRight size={13} className="text-gray-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg) => {
          const isUser = msg.role === "user";

          return (
            <div
              key={msg.id}
              className={cn("flex gap-2.5 items-start", isUser ? "flex-row-reverse" : "flex-row")}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-xs font-bold",
                  isUser
                    ? "bg-primary text-white"
                    : "bg-gradient-to-tr from-emerald-600 to-teal-600 text-white"
                )}
              >
                {isUser ? <User size={13} /> : <GeminiAiIcon size={14} gradient={true} />}
              </div>

              {/* Message Bubble & Cards */}
              <div className={cn("max-w-[85%] space-y-2", isUser ? "items-end" : "items-start")}>
                {/* Attached Image Preview if User uploaded one */}
                {msg.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm max-w-[200px]">
                    <img src={msg.imageUrl} alt="Attached receipt/memo" className="w-full h-auto object-cover" />
                  </div>
                )}

                <div
                  className={cn(
                    "p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap break-words shadow-2xs",
                    isUser
                      ? "bg-primary text-white rounded-tr-xs"
                      : "bg-gray-100 dark:bg-slate-800/90 text-gray-900 dark:text-slate-100 rounded-tl-xs border border-gray-200/70 dark:border-slate-700/60"
                  )}
                >
                  {msg.content}
                </div>

                {/* Render Interactive Action Card if returned */}
                {msg.actionCard && (
                  <div className="w-full">
                    {msg.actionCard.type === "BAZAR_CONFIRM" && (
                      <AIBazarActionCard data={msg.actionCard.data} />
                    )}
                    {msg.actionCard.type === "MEAL_CONFIRM" && (
                      <AIMealActionCard data={msg.actionCard.data} />
                    )}
                    {msg.actionCard.type === "GUEST_MEAL_CONFIRM" && (
                      <AIGuestMealCard data={msg.actionCard.data} />
                    )}
                    {msg.actionCard.type === "STATS_OVERVIEW" && (
                      <AIMessStatsCard data={msg.actionCard.data} />
                    )}
                  </div>
                )}

                {/* Suggested Follow-up Questions */}
                {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedQuestions.map((sq, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSend(sq)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        {sq}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing Loading Indicator */}
        {isPending && (
          <div className="flex gap-2.5 items-center text-xs text-gray-400 dark:text-slate-500 animate-in fade-in">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-2xs">
              <GeminiAiIcon size={14} gradient={true} />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-2xl">
              <Loader2 size={12} className="animate-spin text-emerald-600" />
              <span className="text-[11px] font-medium">{t("MessMate চিন্তা করছে…", "MessMate is thinking…")}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 4. Sleek Modern Input Composer */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shrink-0 space-y-2">
        {/* Hidden File Input for Image Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageSelect}
          accept="image/*"
          className="hidden"
        />

        {/* Floating Attached Image Thumbnail Pill (if image is selected) */}
        {attachedImage && (
          <div className="flex items-center gap-2 p-1.5 pr-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl w-fit animate-in zoom-in-95 duration-150">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700 shrink-0">
              <img src={attachedImage} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 truncate max-w-[160px]">
              {imageFileName || "memo_photo.jpg"}
            </div>
            <button
              type="button"
              onClick={removeAttachedImage}
              className="p-1 rounded-full text-emerald-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={t("ছবি সরান", "Remove Image")}
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Unified Input Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/70 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/50 transition-all shadow-2xs"
        >
          {/* Action 1: Upload Image (Gallery / Camera) */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer",
              attachedImage
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-500 dark:text-slate-400 hover:bg-gray-200/70 dark:hover:bg-slate-700/60 hover:text-emerald-600"
            )}
            title={t("মেমোর ছবি দিন (Image Upload)", "Upload Memo/Receipt Image")}
          >
            <ImageIcon size={16} />
          </button>

          {/* Action 2: Voice Input Microphone */}
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer",
              isListening
                ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30"
                : "text-gray-500 dark:text-slate-400 hover:bg-gray-200/70 dark:hover:bg-slate-700/60 hover:text-emerald-600"
            )}
            title={isListening ? "Listening... (Click to stop)" : "Voice Input (Bangla/English)"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Action 3: Memo Text Parser Dialog */}
          <Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200/70 dark:hover:bg-slate-700/60 hover:text-emerald-600 transition-colors shrink-0 cursor-pointer"
                title={t("বাজারের ফর্দ / মেমো পেস্ট করুন", "Paste Memo Text")}
              >
                <ClipboardList size={16} />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                  <Receipt size={16} className="text-emerald-600" />
                  <span>{t("বাজারের মেমো / ফর্দ টেক্সট পার্সার", "Bazar Memo Text Parser")}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {t(
                    "বাজারের রশিদ বা কাগজের ফর্দ দেখে টেক্সট এখানে পেস্ট করুন। এআই স্বয়ংক্রিয়ভাবে দাম ও আইটেম ভাগ করে নিবে।",
                    "Paste raw items and prices from your memo. AI will parse items and prices automatically."
                  )}
                </p>
                <Textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="যেমন:
মুরগি ২কেজি ৫০০ টাকা
আলু ২কেজি ৮০ টাকা
তেল ১লিটার ১৮০ টাকা"
                  rows={6}
                  className="text-xs"
                />
                <Button
                  type="button"
                  onClick={handleProcessMemo}
                  disabled={!memoText.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <GeminiAiIcon size={14} gradient={true} className="mr-1.5" />
                  <span>{t("এআই দিয়ে পার্স ও বাজার তৈরি করুন", "Parse with AI & Prepare Bazar")}</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Text Input Field */}
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? t("শুনছি... বাংলায় বা ইংরেজিতে বলুন...", "Listening... Speak in Bangla or English...")
                  : attachedImage
                  ? t("ছবির সাথে কোনো নির্দেশনা লিখুন (বা সরাসরি পাঠান)...", "Add optional instruction or send...")
                  : t("কমান্ড লিখুন (যেমন: ৫০০ টাকার বাজার যোগ করো)...", "Type a message (e.g. Add 500 tk chicken bazar)...")
              }
              className="w-full h-8 bg-transparent px-2 text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Send Action Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || isPending}
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white flex items-center justify-center shadow-xs shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all"
            title={t("পাঠান", "Send")}
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
