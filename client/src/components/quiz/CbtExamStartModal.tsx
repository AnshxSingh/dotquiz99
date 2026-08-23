import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuizData } from "@/lib/quiz-types";
import { Clock, User, Award, Maximize2, ShieldCheck, Play } from "lucide-react";

export interface CbtExamConfig {
  durationMinutes: number; // 0 = no limit
  candidateName: string;
  markingScheme: { correct: number; incorrect: number };
  autoFullscreen: boolean;
}

interface CbtExamStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizData: QuizData | null;
  onConfirmStart: (config: CbtExamConfig) => void;
}

export function CbtExamStartModal({
  open,
  onOpenChange,
  quizData,
  onConfirmStart,
}: CbtExamStartModalProps) {
  const totalQuestions = quizData?.data?.length || 0;
  // Default duration recommendation: ~1.5 mins per question, rounded to nearest 5
  const defaultMinutes = Math.max(5, Math.ceil((totalQuestions * 1.5) / 5) * 5);

  const [durationMinutes, setDurationMinutes] = useState<number>(defaultMinutes);
  const [customMinutes, setCustomMinutes] = useState<string>("");
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);
  const [isNoTimer, setIsNoTimer] = useState<boolean>(false);
  const [candidateName, setCandidateName] = useState<string>("Candidate Name");
  const [markingType, setMarkingType] = useState<"mpesb_cbt" | "jee" | "ssc" | "standard">("mpesb_cbt");
  const [autoFullscreen, setAutoFullscreen] = useState<boolean>(true);

  if (!quizData) return null;

  const presets = [5, 10, 15, 30, 45, 60, 90, 180];

  const handlePresetClick = (mins: number) => {
    setDurationMinutes(mins);
    setIsCustomTime(false);
    setIsNoTimer(false);
  };

  const schemeMap = {
    mpesb_cbt: { correct: 1, incorrect: 0.25 },
    jee: { correct: 4, incorrect: 1 },
    ssc: { correct: 2, incorrect: 0.5 },
    standard: { correct: 1, incorrect: 0 },
  };

  const currentScheme = schemeMap[markingType];
  const maxMarks = totalQuestions * currentScheme.correct;

  const handleStartExam = () => {
    let finalDuration = durationMinutes;
    if (isNoTimer) {
      finalDuration = 0;
    } else if (isCustomTime) {
      const parsed = parseInt(customMinutes, 10);
      finalDuration = !isNaN(parsed) && parsed > 0 ? parsed : defaultMinutes;
    }

    onConfirmStart({
      durationMinutes: finalDuration,
      candidateName: candidateName.trim() || "Candidate Name",
      markingScheme: currentScheme,
      autoFullscreen,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-5 border-b border-slate-800 bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Official Govt CBT Exam Mode
          </div>
          <DialogTitle className="text-xl font-bold text-white">
            {quizData.title || "Examination"}
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs md:text-sm">
            Configure your exam timer, candidate info, and marking scheme before entering full-screen CBT mode.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Exam Summary Header */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-lg border border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400">Total Questions</div>
              <div className="text-lg font-bold text-blue-400">{totalQuestions} Qs</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Max Marks</div>
              <div className="text-lg font-bold text-green-400">{maxMarks}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Time Allowed</div>
              <div className="text-lg font-bold text-yellow-400">
                {isNoTimer ? "Unlimited" : isCustomTime ? `${customMinutes || 0} Mins` : `${durationMinutes} Mins`}
              </div>
            </div>
          </div>

          {/* 1. Candidate Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Candidate Name
            </label>
            <Input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter Candidate Name"
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* 2. Timing Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Exam Duration (Timer)
              </label>
              <span className="text-xs text-slate-400">Auto-submits when time expires</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {presets.map((mins) => {
                const isSelected = !isCustomTime && !isNoTimer && durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handlePresetClick(mins)}
                    className={`py-2 px-1 text-xs font-semibold rounded-md border transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>

            {/* Custom Time & No Limit Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div
                onClick={() => {
                  setIsCustomTime(true);
                  setIsNoTimer(false);
                }}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition-all ${
                  isCustomTime
                    ? "bg-blue-950/40 border-blue-500 text-white"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/70"
                }`}
              >
                <input
                  type="radio"
                  checked={isCustomTime}
                  onChange={() => {
                    setIsCustomTime(true);
                    setIsNoTimer(false);
                  }}
                  className="accent-blue-500"
                />
                <span className="text-xs font-medium text-slate-300">Custom Minutes:</span>
                <Input
                  type="number"
                  min="1"
                  max="600"
                  value={customMinutes}
                  onChange={(e) => {
                    setCustomMinutes(e.target.value);
                    setIsCustomTime(true);
                    setIsNoTimer(false);
                  }}
                  placeholder="e.g. 40"
                  className="h-7 w-24 text-xs bg-slate-950 border-slate-600 text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div
                onClick={() => {
                  setIsNoTimer(true);
                  setIsCustomTime(false);
                }}
                className={`p-2.5 rounded-md border flex items-center gap-2 cursor-pointer transition-all ${
                  isNoTimer
                    ? "bg-blue-950/40 border-blue-500 text-white"
                    : "bg-slate-800/40 border-slate-700 text-slate-400 hover:bg-slate-800/70"
                }`}
              >
                <input
                  type="radio"
                  checked={isNoTimer}
                  onChange={() => {
                    setIsNoTimer(true);
                    setIsCustomTime(false);
                  }}
                  className="accent-blue-500"
                />
                <span className="text-xs font-medium text-slate-300">No Timer (Practice Mode)</span>
              </div>
            </div>
          </div>

          {/* 3. Marking Scheme Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-green-400" /> Marking Scheme
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: MPESB / CBT Standard (+1, -0.25) */}
              <button
                type="button"
                onClick={() => setMarkingType("mpesb_cbt")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  markingType === "mpesb_cbt"
                    ? "bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500"
                    : "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>MPESB / Govt CBT (1/4 Negative)</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">Standard</span>
                </div>
                <div className="text-xs text-green-400 font-semibold mt-1">
                  +1 for Correct | -0.25 for Incorrect (1/4)
                </div>
              </button>

              {/* Option 2: JEE / NTA (+4, -1) */}
              <button
                type="button"
                onClick={() => setMarkingType("jee")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  markingType === "jee"
                    ? "bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500"
                    : "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>JEE / NTA Style</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">JEE/NEET</span>
                </div>
                <div className="text-xs text-green-400 font-semibold mt-1">
                  +4 for Correct | -1 for Incorrect (1/4)
                </div>
              </button>

              {/* Option 3: SSC / Banking (+2, -0.5) */}
              <button
                type="button"
                onClick={() => setMarkingType("ssc")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  markingType === "ssc"
                    ? "bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500"
                    : "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>SSC / Banking Style</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">CGL/CHSL</span>
                </div>
                <div className="text-xs text-green-400 font-semibold mt-1">
                  +2 for Correct | -0.5 for Incorrect (1/4)
                </div>
              </button>

              {/* Option 4: Standard (No Negative) */}
              <button
                type="button"
                onClick={() => setMarkingType("standard")}
                className={`p-3 rounded-lg border text-left transition-all ${
                  markingType === "standard"
                    ? "bg-blue-950/70 border-blue-500 text-white shadow-sm ring-1 ring-blue-500"
                    : "bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div className="font-bold text-xs flex items-center justify-between">
                  <span>Practice (No Negative)</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Practice</span>
                </div>
                <div className="text-xs text-green-400 font-semibold mt-1">
                  +1 for Correct | 0 for Incorrect
                </div>
              </button>
            </div>
          </div>

          {/* 4. Fullscreen Option */}
          <div className="flex items-center gap-3 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              id="fullscreen-toggle"
              checked={autoFullscreen}
              onChange={(e) => setAutoFullscreen(e.target.checked)}
              className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
            />
            <label htmlFor="fullscreen-toggle" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
              <strong>Auto Full-Screen Examination Window</strong> (Recommended for real CBT experience)
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white"
          >
            Cancel
          </Button>

          <Button
            onClick={handleStartExam}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 shadow-lg shadow-blue-600/30"
          >
            <Play className="w-5 h-5 mr-2" /> Start CBT Exam
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
