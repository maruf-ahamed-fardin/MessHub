"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import {
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
  Cpu,
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

const STORAGE_KEY = "messhub_ai_sessions_v2";

export function AIAssistantChat({ onClose, userName }: AIAssistantChatProps) {
  const { t, language } = usePreferences();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

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

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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

    // Default first session
    const first = createNewSession();
    setSessions([first]);
    setActiveSessionId(first.id);
  }, []);

  // Save sessions to localStorage
  const saveSessionsToStorage = (updatedSessions: ChatSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions.slice(0, 30)));
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

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isPending) return;

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

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      createdAt: new Date(),
    };

    // Auto-generate title if this is the first message
    const isFirstMessage = targetSession.messages.length === 0;
    const sessionTitle = isFirstMessage
      ? query.slice(0, 30) + (query.length > 30 ? "..." : "")
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

    startTransition(async () => {
      try {
        const historyForBackend = updatedMessages.slice(-5).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await processAIAssistantQueryAction(query, historyForBackend);

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

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden text-gray-900 dark:text-slate-100 relative">
      {/* 1. Header with Model Info and Controls */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          {/* History Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
            title={t("পূর্বের চ্যাট হিস্ট্রি দেখুন", "View Chat History")}
          >
            <History size={16} />
            <span className="hidden sm:inline-block text-[11px] font-semibold">{t("হিস্ট্রি", "History")}</span>
          </button>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
            title={t("নতুন কনভারসেশন শুরু করুন", "New Chat")}
          >
            <Plus size={14} />
            <span className="text-[11px] font-black">{t("নতুন চ্যাট", "New Chat")}</span>
          </button>
        </div>

        {/* Title and Model Badge */}
        <div className="flex items-center gap-1.5">
          {/* Active AI Model Badge */}
          <div
            className="flex items-center gap-1 bg-white/15 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white/90"
            title={t("বর্তমানে এই এআই ইঞ্জিনের মাধ্যমে প্রশ্নের উত্তর দেওয়া হচ্ছে", "Active AI Engine")}
          >
            <GeminiAiIcon size={12} className="text-amber-300" />
            <span className="truncate max-w-[120px]">{activeModel}</span>
          </div>

          {/* TTS Audio toggle */}
          <button
            type="button"
            onClick={() => setVoiceSpeechEnabled(!voiceSpeechEnabled)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            title={voiceSpeechEnabled ? "Voice Speech Enabled" : "Voice Speech Disabled"}
          >
            {voiceSpeechEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* 2. ChatGPT-Style History Sidebar Drawer */}
      {showHistorySidebar && (
        <div className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-slate-100 z-30 shadow-2xl border-r border-slate-800 flex flex-col animate-in slide-in-from-left duration-200">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <History size={14} className="text-violet-400" />
              <span>{t("চ্যাট হিস্ট্রি (Sessions)", "Chat History")}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistorySidebar(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md"
            >
              <ChevronLeft size={16} />
            </button>
          </div>

          {/* New Chat Action */}
          <div className="p-2">
            <Button
              type="button"
              onClick={handleStartNewChat}
              className="w-full h-8 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <Plus size={14} />
              <span>{t("+ নতুন চ্যাট শুরু করুন", "+ Start New Chat")}</span>
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((sess) => {
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
                      ? "bg-violet-600/30 text-white border border-violet-500/40 font-bold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <MessageSquare size={13} className={isActive ? "text-violet-400 shrink-0" : "text-slate-500 shrink-0"} />
                    <div className="min-w-0">
                      <p className="truncate text-xs leading-tight">{sess.title}</p>
                      <p className="text-[10px] text-slate-500">{dateStr} • {sess.messages.length} msgs</p>
                    </div>
                  </div>

                  {/* Delete conversation */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(sess.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                    title={t("ডিলিট করুন", "Delete Chat")}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom Engine Info */}
          <div className="p-3 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1 font-bold text-slate-300">
              <GeminiAiIcon size={12} className="text-amber-400" />
              <span>MessMate Intelligence</span>
            </div>
            <p className="text-[9px] text-slate-500">
              {t("রিয়েলটাইম মেস হিসাব, ব্যালেন্স ও শিডিউলের সাথে সংযুক্ত।", "Connected with live mess calculations & schedules.")}
            </p>
          </div>
        </div>
      )}

      {/* 3. Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="py-6 px-2 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 dark:from-violet-500/30 dark:to-indigo-500/30 mx-auto flex items-center justify-center text-violet-600 dark:text-violet-400 shadow-inner">
              <GeminiAiIcon size={30} />
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                {userName ? `আসসালামু আলাইকুম, ${userName}!` : t("আসসালামু আলাইকুম!", "Welcome!")}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-xs mx-auto">
                {t(
                  "বাজার এন্ট্রি, মিল পরিবর্তন, গেস্ট মিল বুকিং বা মেসের হিসাব জানতে আমাকে বাংলায় বা ইংরেজিতে বলুন।",
                  "Ask anything about your mess in Bangla or English — add bazar, toggle meals, book guest meals, or check balance."
                )}
              </p>
            </div>

            {/* Quick Starters */}
            <div className="pt-2 text-left space-y-2">
              <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-1">
                {t("💡 দ্রুত শুরু করুন (Quick Prompts)", "💡 Quick Prompts")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {QUICK_STARTERS.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(q.prompt)}
                    className="p-2.5 rounded-xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-300 dark:hover:border-violet-700/60 text-left transition-all text-xs font-semibold text-gray-700 dark:text-slate-200 group flex items-center justify-between shadow-2xs cursor-pointer active:scale-98"
                  >
                    <span>{q.label}</span>
                    <ChevronRight size={13} className="text-gray-400 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5" />
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
                    : "bg-gradient-to-tr from-violet-600 to-indigo-600 text-white"
                )}
              >
                {isUser ? <User size={13} /> : <GeminiAiIcon size={14} className="text-amber-300" />}
              </div>

              {/* Message Bubble & Cards */}
              <div className={cn("max-w-[85%] space-y-2", isUser ? "items-end" : "items-start")}>
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
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300 hover:bg-violet-100 transition-all cursor-pointer shadow-2xs active:scale-95"
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
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <GeminiAiIcon size={14} className="text-amber-300" />
            </div>
            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-800 px-3 py-2 rounded-2xl">
              <Loader2 size={12} className="animate-spin text-violet-600" />
              <span className="text-[11px] font-medium">{t("MessMate চিন্তা করছে…", "MessMate is thinking…")}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 4. Composer Section */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60 shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center gap-1.5"
        >
          {/* Memo OCR / List Parser Trigger */}
          <Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
            <DialogTrigger asChild>
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-violet-600 transition-colors shrink-0"
                title={t("বাজারের মেমো বা ফর্দ পেস্ট করুন", "Paste Bazar Memo/List")}
              >
                <ClipboardList size={16} />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm font-bold">
                  <Receipt size={16} className="text-violet-600" />
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
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold"
                >
                  <GeminiAiIcon size={14} className="mr-1.5 text-amber-300" />
                  <span>{t("এআই দিয়ে পার্স ও বাজার তৈরি করুন", "Parse with AI & Prepare Bazar")}</span>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Voice Input Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0",
              isListening
                ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30"
                : "text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-violet-600"
            )}
            title={isListening ? "Listening... (Click to stop)" : "Voice Input (Bangla/English)"}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          {/* Text Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? t("শুনছি... বাংলায় বা ইংরেজিতে বলুন...", "Listening... Speak in Bangla or English...")
                  : t("কমান্ড লিখুন (যেমন: ৫০০ টাকার বাজার যোগ করো)...", "Type a message (e.g. Add 500 tk chicken bazar)...")
              }
              className="w-full h-9 rounded-xl border border-gray-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 px-3 pr-9 text-xs text-gray-900 dark:text-slate-100 shadow-2xs focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || isPending}
            className="w-8 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white p-0 flex items-center justify-center shadow-xs shrink-0 cursor-pointer disabled:opacity-40"
          >
            <Send size={14} />
          </Button>
        </form>
      </div>
    </div>
  );
}
