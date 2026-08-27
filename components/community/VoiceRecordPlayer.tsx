"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Volume2, Sparkles, FastForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { usePreferences } from "@/lib/context/PreferencesContext";

export interface VoiceNoteData {
  audioUrl: string; // base64 or blob URL
  duration: number; // in seconds
  fileName?: string;
  waveformData?: number[]; // simulated amplitude bars
}

// -------------------------------------------------------------
// 1. VOICE RECORDER COMPONENT (for composer)
// -------------------------------------------------------------
export function VoiceRecorder({
  onRecordingComplete,
  onCancel,
}: {
  onRecordingComplete: (data: VoiceNoteData) => void;
  onCancel: () => void;
}) {
  const { t } = usePreferences();
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording on mount
  useEffect(() => {
    startRecording();
    return () => {
      stopAndCleanup();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          // Generate sample waveform amplitudes
          const waveform = Array.from({ length: 24 }, () =>
            Math.floor(Math.random() * 80 + 20)
          );
          onRecordingComplete({
            audioUrl: base64Audio,
            duration: recordDuration || 1,
            fileName: `voice_note_${Date.now()}.webm`,
            waveformData: waveform,
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
      setHasPermission(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const stopAndCleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  if (hasPermission === false) {
    return (
      <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
        <span>{t("মাইক্রোফোনের অনুমতি পাওয়া যায়নি। ব্রাউজার পারমিশন চেক করুন।", "Microphone access denied. Check browser settings.")}</span>
        <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 text-xs">
          {t("বাতিল", "Cancel")}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-indigo-500/10 to-purple-500/10 border border-rose-300/80 dark:border-rose-800/80 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center gap-3">
        {/* Animated Recording Beacon */}
        <div className="relative flex items-center justify-center h-8 w-8 rounded-full bg-rose-600 text-white shadow-md">
          <Mic size={16} />
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-rose-700 dark:text-rose-300">
            <span>{t("🎙️ ভয়েস রেকর্ড হচ্ছে...", "🎙️ Recording Voice...")}</span>
            <span className="font-mono bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-md text-[11px]">
              {formatTime(recordDuration)}
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            {t("কথা বলা শেষে 'সম্পন্ন' বাটনে চাপুন", "Press done when finished speaking")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            stopAndCleanup();
            onCancel();
          }}
          className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
          title={t("বাতিল", "Cancel")}
        >
          <Trash2 size={15} />
        </button>

        <Button
          type="button"
          size="sm"
          onClick={stopRecording}
          className="h-8 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-2xs cursor-pointer"
        >
          <Square size={12} className="fill-white" />
          <span>{t("সম্পন্ন", "Done")}</span>
        </Button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. VOICE PLAYER COMPONENT (for post feed & preview)
// -------------------------------------------------------------
export function VoicePlayer({
  voice,
  onDelete,
}: {
  voice: VoiceNoteData;
  onDelete?: () => void;
}) {
  const { t } = usePreferences();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(voice.audioUrl);
    audioRef.current = audio;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [voice.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackRate(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  const waveform = voice.waveformData || [30, 45, 60, 80, 50, 40, 70, 90, 60, 30, 55, 75, 40, 65, 85, 50, 35, 70, 95, 60, 45, 80, 50, 30];
  const progressPercent = voice.duration > 0 ? (currentTime / voice.duration) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/90 dark:border-indigo-800/80 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className="h-10 w-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center justify-center shadow-md transition-all cursor-pointer shrink-0"
          >
            {isPlaying ? <Pause size={17} className="fill-white" /> : <Play size={17} className="fill-white ml-0.5" />}
          </button>

          {/* Dynamic Waveform Visualizer */}
          <div className="flex-1 flex items-center gap-1 h-8 px-1 min-w-[120px] overflow-hidden">
            {waveform.map((height, i) => {
              const barProgress = (i / waveform.length) * 100;
              const isPast = barProgress <= progressPercent;

              return (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-full transition-all duration-150",
                    isPast
                      ? "bg-indigo-600 dark:bg-indigo-400"
                      : "bg-indigo-200 dark:bg-slate-700",
                    isPlaying && isPast && "animate-pulse"
                  )}
                  style={{
                    height: `${Math.max(20, Math.min(100, height))}%`,
                    minWidth: "2.5px",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Speed Multiplier & Timestamp */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={changeSpeed}
            className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-[11px] font-black text-indigo-700 dark:text-indigo-300 hover:border-indigo-400 transition-all select-none cursor-pointer"
            title={t("প্লেব্যাক স্পিড পরিবর্তন", "Change playback speed")}
          >
            {playbackRate}x
          </button>

          <span className="font-mono text-xs font-bold text-gray-600 dark:text-slate-300 min-w-[34px] text-right">
            {isPlaying ? formatTime(currentTime) : formatTime(voice.duration)}
          </span>

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
