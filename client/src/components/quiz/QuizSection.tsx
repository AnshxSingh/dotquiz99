import React, { useState, useEffect, useRef } from "react";
import { 
  Maximize2, 
  Minimize2, 
  FileText, 
  Info, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { QuizData } from "@/lib/quiz-types";
import { sanitizeHTML } from "@/lib/quiz-utils";
import { Button } from "@/components/ui/button";
import { CbtStatusIcon, CbtStatus, CbtLegendItem } from "./CbtStatusIcon";
import { CbtQuestionPaperModal } from "./CbtQuestionPaperModal";
import { CbtInstructionsModal } from "./CbtInstructionsModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export interface CbtQuizResult {
  answers: (string | null)[];
  statuses: CbtStatus[];
  timeTakenSeconds: number;
  markingScheme: { correct: number; incorrect: number };
  candidateName: string;
}

interface QuizSectionProps {
  data: QuizData;
  durationMinutes?: number; // 0 = unlimited
  candidateName?: string;
  markingScheme?: { correct: number; incorrect: number };
  onComplete: (result: CbtQuizResult) => void;
  onExit?: () => void;
}

export function QuizSection({
  data,
  durationMinutes = 60,
  candidateName = "Candidate Name",
  markingScheme = { correct: 1, incorrect: 0.25 },
  onComplete,
  onExit,
}: QuizSectionProps) {
  const totalQuestions = data.data.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(totalQuestions).fill(null));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Track status for each question
  const [statuses, setStatuses] = useState<CbtStatus[]>(() => {
    const init: CbtStatus[] = new Array(totalQuestions).fill("not_visited");
    if (totalQuestions > 0) init[0] = "not_answered"; // Question 1 is initially visited
    return init;
  });

  // UI state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [fontSizeOffset, setFontSizeOffset] = useState(0); // -1: small, 0: normal, 1: large, 2: xl
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isTimeUpModal, setIsTimeUpModal] = useState(false);

  // Timer
  const totalSeconds = durationMinutes > 0 ? durationMinutes * 60 : 0;
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen state listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Timer Countdown
  useEffect(() => {
    if (durationMinutes === 0) {
      // Stopwatch mode for unlimited timer
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [durationMinutes]);

  // Sync selectedOption with answers array whenever currentIndex changes
  useEffect(() => {
    setSelectedOption(answers[currentIndex]);
  }, [currentIndex, answers]);

  // Auto submit when time is up
  const handleAutoSubmit = () => {
    setIsTimeUpModal(true);
    setTimeout(() => {
      finalSubmit();
    }, 2500);
  };

  // Format seconds to HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Navigate to a specific question index
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= totalQuestions) return;

    // Update status of current question if it was left un-saved
    setStatuses((prev) => {
      const next = [...prev];
      if (next[currentIndex] === "not_visited") {
        next[currentIndex] = "not_answered";
      }
      // Target question becomes at least not_answered if it was not_visited
      if (next[targetIndex] === "not_visited") {
        next[targetIndex] = "not_answered";
      }
      return next;
    });

    setCurrentIndex(targetIndex);
  };

  // Action: Save & Next (Green)
  const handleSaveAndNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedOption;
    setAnswers(newAnswers);

    setStatuses((prev) => {
      const next = [...prev];
      if (selectedOption !== null) {
        next[currentIndex] = "answered";
      } else {
        next[currentIndex] = "not_answered";
      }
      return next;
    });

    if (currentIndex < totalQuestions - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Action: Mark for Review & Next (Purple)
  const handleMarkForReviewAndNext = () => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = selectedOption;
    setAnswers(newAnswers);

    setStatuses((prev) => {
      const next = [...prev];
      if (selectedOption !== null) {
        next[currentIndex] = "answered_marked_for_review";
      } else {
        next[currentIndex] = "marked_for_review";
      }
      return next;
    });

    if (currentIndex < totalQuestions - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Action: Clear Response
  const handleClearResponse = () => {
    setSelectedOption(null);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = null;
    setAnswers(newAnswers);

    setStatuses((prev) => {
      const next = [...prev];
      if (next[currentIndex] === "answered") {
        next[currentIndex] = "not_answered";
      } else if (next[currentIndex] === "answered_marked_for_review") {
        next[currentIndex] = "marked_for_review";
      }
      return next;
    });
  };

  // Final Submit
  const finalSubmit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowSubmitModal(false);
    onComplete({
      answers,
      statuses,
      timeTakenSeconds: timeElapsed,
      markingScheme,
      candidateName,
    });
  };

  // Status counts for palette
  const answeredCount = statuses.filter((s) => s === "answered").length;
  const notAnsweredCount = statuses.filter((s) => s === "not_answered").length;
  const notVisitedCount = statuses.filter((s) => s === "not_visited").length;
  const markedReviewCount = statuses.filter((s) => s === "marked_for_review").length;
  const ansMarkedReviewCount = statuses.filter((s) => s === "answered_marked_for_review").length;

  const currentQuestion = data.data[currentIndex];

  // Font size classes based on Text Size adjuster
  const fontSizes = [
    "text-sm",       // -1: A-
    "text-base",     // 0: Normal
    "text-lg",       // 1: A+
    "text-xl",       // 2: A++
  ];
  const currentFontSizeClass = fontSizes[fontSizeOffset + 1] || "text-base";

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0f19] text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ──────────────────────────────────────────────────────────────────────── */}
      <header className="h-12 md:h-14 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-3 md:px-5 shrink-0 shadow-md">
        {/* Left: Exam Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h1 className="text-sm md:text-base font-bold text-yellow-400 truncate tracking-wide">
            {data.title || "National Level Examination (CBT Mode)"}
          </h1>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQuestionPaper(true)}
            className="h-8 text-xs bg-emerald-950/40 border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 font-semibold"
          >
            <FileText className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Question Paper</span>
            <span className="sm:hidden">Paper</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInstructions(true)}
            className="h-8 text-xs bg-blue-950/40 border-blue-600/50 hover:bg-blue-900/60 text-blue-300 font-semibold"
          >
            <Info className="w-3.5 h-3.5 mr-1" />
            <span className="hidden sm:inline">Instructions</span>
            <span className="sm:hidden">Guide</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          {onExit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExitModal(true)}
              title="Exit Exam"
              className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────
          2. SUB-HEADER / SECTION & TIMER BAR
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="h-12 md:h-13 bg-[#1e293b] border-b border-slate-700/80 flex items-center justify-between px-3 md:px-5 shrink-0">
        {/* Left: Section Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-sky-600 text-white text-xs md:text-sm font-bold rounded shadow-sm flex items-center gap-1.5">
            <span>All Questions</span>
            <span className="w-3.5 h-3.5 rounded-full bg-sky-700 text-[10px] flex items-center justify-center font-mono">
              i
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            (Section 1 of 1)
          </span>
        </div>

        {/* Center / Right: Countdown Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/90 px-3 py-1 rounded border border-slate-700 shadow-inner">
            <Clock className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Time Left:</span>
            <span
              className={`font-mono text-sm md:text-base font-bold tracking-wider ${
                durationMinutes === 0
                  ? "text-blue-400"
                  : timeLeft < 60
                  ? "text-red-400 animate-pulse"
                  : timeLeft < 300
                  ? "text-orange-400"
                  : "text-emerald-400"
              }`}
            >
              {durationMinutes === 0 ? formatTime(timeElapsed) : formatTime(timeLeft)}
            </span>
          </div>

          {/* Far Right: Candidate Profile Box */}
          <div className="flex items-center gap-2 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/60">
            <div className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px] md:max-w-[160px]">
              {candidateName}
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          3. MAIN TWO-COLUMN WORKSPACE
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Left Column: Question Area ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] border-r border-slate-800">
          {/* Question Meta Bar */}
          <div className="h-11 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="font-bold text-sm text-white">
                Q.No: <span className="text-yellow-400 text-base">{currentIndex + 1}</span>
                <span className="text-slate-500 font-normal ml-1">/ {totalQuestions}</span>
              </span>

              {/* Text Size Adjuster */}
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                <span className="text-[11px] text-slate-400 mr-1">Text Size:</span>
                <button
                  type="button"
                  onClick={() => setFontSizeOffset((prev) => Math.min(2, prev + 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                  title="Increase font size"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeOffset((prev) => Math.max(-1, prev - 1))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-xs"
                  title="Decrease font size"
                >
                  A-
                </button>
              </div>

              <span className="text-slate-400 hidden sm:inline">
                Q.Type: <strong className="text-orange-400">MCQ Single</strong>
              </span>
            </div>

            {/* Marks Tag */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">Marks:</span>
              <span className="px-1.5 py-0.5 bg-green-600 text-white font-bold rounded">
                +{markingScheme.correct}
              </span>
              <span className="px-1.5 py-0.5 bg-red-600 text-white font-bold rounded">
                {markingScheme.incorrect > 0 ? `-${markingScheme.incorrect}` : "0"}
              </span>
            </div>
          </div>

          {/* Question & Options Scrollable View */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            {/* Question Text */}
            <div className="p-4 md:p-6 bg-slate-900/60 rounded-lg border border-slate-800/80 shadow-sm">
              <div
                className={`font-medium text-slate-100 leading-relaxed ${currentFontSizeClass}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentQuestion.question) }}
              />
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === option;

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedOption(option)}
                    className={`flex items-start gap-3 p-3.5 md:p-4 rounded-lg border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? "bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10 text-white"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    {/* Radio Bubble */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-blue-400 bg-blue-600 text-white"
                          : "border-slate-500 bg-slate-950"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>

                    {/* Option Text */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-sm text-blue-400 shrink-0">
                        ({label})
                      </span>
                      <span
                        className={`${currentFontSizeClass} leading-normal`}
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(option) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              BOTTOM FIXED ACTION BAR
          ────────────────────────────────────────────────────────────────── */}
          <footer className="h-16 bg-[#111827] border-t border-slate-800 px-3 md:px-5 flex items-center justify-between gap-2 shrink-0 shadow-lg">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkForReviewAndNext}
                className="text-xs md:text-sm bg-purple-950/40 border-purple-600/60 hover:bg-purple-900/60 text-purple-300 font-semibold"
              >
                Mark for Review & Next
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearResponse}
                disabled={selectedOption === null}
                className="text-xs md:text-sm bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Clear Response
              </Button>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="text-xs md:text-sm bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAndNext}
                className="text-xs md:text-sm bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 md:px-6 shadow-md shadow-blue-600/30"
              >
                Save & Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              <Button
                size="sm"
                onClick={() => setShowSubmitModal(true)}
                className="text-xs md:text-sm bg-sky-600 hover:bg-sky-500 text-white font-bold px-4 md:px-5 shadow-md shadow-sky-600/30 ml-1 md:ml-3"
              >
                Submit Test
              </Button>
            </div>
          </footer>
        </div>

        {/* ── Palette Collapse Tab Toggle ──────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setPaletteCollapsed(!paletteCollapsed)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-slate-800 hover:bg-slate-700 border border-r-0 border-slate-600 rounded-l-md flex items-center justify-center text-slate-300 shadow-md md:hidden"
          style={{ right: paletteCollapsed ? "0px" : "280px" }}
        >
          {paletteCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {/* ── Right Column: Question Palette ───────────────────────────────── */}
        <aside
          className={`w-72 sm:w-80 md:w-84 bg-[#111827] border-l border-slate-800 flex flex-col shrink-0 transition-all duration-200 overflow-hidden ${
            paletteCollapsed ? "w-0 hidden" : "w-72 sm:w-80 md:w-84"
          }`}
        >
          {/* Status Legend Box */}
          <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 space-y-2 shrink-0">
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              <CbtLegendItem status="answered" label="Answered" count={answeredCount} />
              <CbtLegendItem status="not_answered" label="Not Answered" count={notAnsweredCount} />
              <CbtLegendItem status="not_visited" label="Not Visited" count={notVisitedCount} />
              <CbtLegendItem status="marked_for_review" label="Marked for Review" count={markedReviewCount} />
            </div>
            <div className="pt-1 border-t border-slate-800">
              <CbtLegendItem
                status="answered_marked_for_review"
                label="Ans & Marked for Review"
                count={ansMarkedReviewCount}
              />
            </div>
          </div>

          {/* Section Banner */}
          <div className="h-8 bg-sky-700 px-3 flex items-center justify-between text-xs font-bold text-white shrink-0 shadow-inner">
            <span>SECTION: All Questions</span>
            <span className="text-[11px] font-normal text-sky-200">{totalQuestions} Qs</span>
          </div>

          {/* Question Numbers Grid Palette */}
          <div className="flex-1 overflow-y-auto p-3.5">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Choose a Question:
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {statuses.map((status, idx) => (
                <CbtStatusIcon
                  key={idx}
                  status={status}
                  number={idx + 1}
                  isActive={currentIndex === idx}
                  onClick={() => goToQuestion(idx)}
                />
              ))}
            </div>
          </div>

          {/* Submit Test Button at Bottom of Palette */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
            <Button
              onClick={() => setShowSubmitModal(true)}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-2 text-sm shadow-md"
            >
              Submit Test (CBT)
            </Button>
          </div>
        </aside>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          4. MODALS (Question Paper, Instructions, Submit Confirm, Time-Up)
      ──────────────────────────────────────────────────────────────────────── */}
      <CbtQuestionPaperModal
        open={showQuestionPaper}
        onOpenChange={setShowQuestionPaper}
        data={data}
        onSelectQuestion={(idx) => goToQuestion(idx)}
      />

      <CbtInstructionsModal
        open={showInstructions}
        onOpenChange={setShowInstructions}
        markingScheme={markingScheme}
      />

      {/* CBT Submit Summary Confirmation Dialog */}
      <Dialog open={showSubmitModal} onOpenChange={setShowSubmitModal}>
        <DialogContent className="max-w-xl bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-5 border-b border-slate-800 bg-slate-950">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              📋 Examination Summary
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Review your attempt summary before final submission.
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-4">
            {/* Summary Table */}
            <div className="rounded-lg border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Status Description</th>
                    <th className="p-2.5 text-right">No. of Questions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Answered
                    </td>
                    <td className="p-2.5 text-right font-bold text-green-400">{answeredCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Not Answered
                    </td>
                    <td className="p-2.5 text-right font-bold text-orange-400">{notAnsweredCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Marked for Review
                    </td>
                    <td className="p-2.5 text-right font-bold text-purple-400">{markedReviewCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Answered & Marked for Review
                    </td>
                    <td className="p-2.5 text-right font-bold text-purple-300">{ansMarkedReviewCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Not Visited
                    </td>
                    <td className="p-2.5 text-right font-bold text-slate-400">{notVisitedCount}</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="p-2.5">Total Questions</td>
                    <td className="p-2.5 text-right text-blue-400">{totalQuestions}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Are you sure you want to submit your examination? You will not be able to modify your answers once submitted.
              </span>
            </div>
          </div>

          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowSubmitModal(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs"
            >
              ← Resume Examination
            </Button>
            <Button
              onClick={finalSubmit}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-5 shadow-lg shadow-green-600/30"
            >
              Yes, Submit Examination
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Submit / Time-up Modal */}
      <Dialog open={isTimeUpModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-slate-900 border-red-500/50 text-slate-100 text-center p-6 shadow-2xl">
          <div className="w-12 h-12 bg-red-950/60 border border-red-500 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
            <Clock className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-red-400 mb-1">
            Time's Up!
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-sm">
            Your examination time has expired. Submitting your test automatically...
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Exit Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-700 text-slate-100 p-5">
          <DialogTitle className="text-base font-bold text-white mb-2">
            Quit Examination?
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mb-4">
            Are you sure you want to exit the exam? Your current progress will be lost.
          </DialogDescription>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExitModal(false)}
              className="border-slate-700 text-slate-300"
            >
              Stay
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen().catch(() => {});
                }
                setShowExitModal(false);
                if (onExit) onExit();
              }}
            >
              Exit Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
