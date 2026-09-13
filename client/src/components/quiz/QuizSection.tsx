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
  AlertTriangle,
  LayoutGrid,
  Menu
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
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);
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

  // Mutable refs to prevent stale closure bugs in timers and callbacks
  const answersRef = useRef<(string | null)[]>(answers);
  const statusesRef = useRef<CbtStatus[]>(statuses);
  const selectedOptionRef = useRef<string | null>(selectedOption);
  const currentIndexRef = useRef<number>(currentIndex);
  const timeElapsedRef = useRef<number>(timeElapsed);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    statusesRef.current = statuses;
  }, [statuses]);

  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    timeElapsedRef.current = timeElapsed;
  }, [timeElapsed]);

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
    selectedOptionRef.current = answers[currentIndex];
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
    setMobilePaletteOpen(false); // Close mobile drawer if opened
  };

  // Action: Save & Next (Green)
  const handleSaveAndNext = () => {
    const currentAns = selectedOptionRef.current;
    const newAnswers = [...answersRef.current];
    newAnswers[currentIndex] = currentAns;
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    setStatuses((prev) => {
      const next = [...prev];
      if (currentAns !== null) {
        next[currentIndex] = "answered";
      } else {
        next[currentIndex] = "not_answered";
      }
      statusesRef.current = next;
      return next;
    });

    if (currentIndex < totalQuestions - 1) {
      goToQuestion(currentIndex + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  // Action: Save & Previous (Saves response and moves to previous question)
  const handleSaveAndPrevious = () => {
    const currentAns = selectedOptionRef.current;
    const newAnswers = [...answersRef.current];
    newAnswers[currentIndex] = currentAns;
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    setStatuses((prev) => {
      const next = [...prev];
      if (currentAns !== null) {
        next[currentIndex] = "answered";
      } else {
        next[currentIndex] = "not_answered";
      }
      statusesRef.current = next;
      return next;
    });

    if (currentIndex > 0) {
      goToQuestion(currentIndex - 1);
    }
  };

  // Action: Mark for Review & Next (Purple)
  const handleMarkForReviewAndNext = () => {
    const currentAns = selectedOptionRef.current;
    const newAnswers = [...answersRef.current];
    newAnswers[currentIndex] = currentAns;
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    setStatuses((prev) => {
      const next = [...prev];
      if (currentAns !== null) {
        next[currentIndex] = "answered_marked_for_review";
      } else {
        next[currentIndex] = "marked_for_review";
      }
      statusesRef.current = next;
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
    selectedOptionRef.current = null;
    const newAnswers = [...answersRef.current];
    newAnswers[currentIndex] = null;
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    setStatuses((prev) => {
      const next = [...prev];
      if (next[currentIndex] === "answered") {
        next[currentIndex] = "not_answered";
      } else if (next[currentIndex] === "answered_marked_for_review") {
        next[currentIndex] = "marked_for_review";
      }
      statusesRef.current = next;
      return next;
    });
  };

  // Final Submit (Guaranteed to use latest refs)
  const finalSubmit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setShowSubmitModal(false);

    // Save active question choice if user selected an option but hasn't clicked Save & Next before submit/timeout
    const finalAnswers = [...answersRef.current];
    const finalStatuses = [...statusesRef.current];
    const currIdx = currentIndexRef.current;
    const currOpt = selectedOptionRef.current;

    if (currOpt !== null) {
      finalAnswers[currIdx] = currOpt;
      if (finalStatuses[currIdx] === "not_visited" || finalStatuses[currIdx] === "not_answered") {
        finalStatuses[currIdx] = "answered";
      } else if (finalStatuses[currIdx] === "marked_for_review") {
        finalStatuses[currIdx] = "answered_marked_for_review";
      }
    }

    onComplete({
      answers: finalAnswers,
      statuses: finalStatuses,
      timeTakenSeconds: timeElapsedRef.current,
      markingScheme,
      candidateName,
    });
  };

  // Keyboard navigation shortcuts: ArrowRight for Save & Next, ArrowLeft for Save & Previous
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toUpperCase();
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (showSubmitModal || showExitModal || showQuestionPaper || showInstructions || isTimeUpModal || mobilePaletteOpen) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleSaveAndNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleSaveAndPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, selectedOption, answers, statuses, showSubmitModal, showExitModal, showQuestionPaper, showInstructions, isTimeUpModal, mobilePaletteOpen]);

  // Status counts for palette
  const answeredCount = statuses.filter((s) => s === "answered").length;
  const notAnsweredCount = statuses.filter((s) => s === "not_answered").length;
  const notVisitedCount = statuses.filter((s) => s === "not_visited").length;
  const markedReviewCount = statuses.filter((s) => s === "marked_for_review").length;
  const ansMarkedReviewCount = statuses.filter((s) => s === "answered_marked_for_review").length;

  const currentQuestion = data.data[currentIndex];

  // Font size classes based on Text Size adjuster
  const fontSizes = [
    "text-xs sm:text-sm",       // -1: A-
    "text-sm sm:text-base",     // 0: Normal
    "text-base sm:text-lg",     // 1: A+
    "text-lg sm:text-xl",       // 2: A++
  ];
  const currentFontSizeClass = fontSizes[fontSizeOffset + 1] || "text-sm sm:text-base";

  // Reusable Question Palette Content (for Desktop Sidebar & Mobile Drawer)
  const renderPaletteContent = () => (
    <div className="flex flex-col h-full bg-[#111827]">
      {/* Status Legend Box */}
      <div className="p-3 bg-slate-900/95 border-b border-slate-800 space-y-2 shrink-0">
        <div className="grid grid-cols-2 gap-x-2 gap-y-2">
          <CbtLegendItem status="answered" label="Answered" count={answeredCount} />
          <CbtLegendItem status="not_answered" label="Not Answered" count={notAnsweredCount} />
          <CbtLegendItem status="not_visited" label="Not Visited" count={notVisitedCount} />
          <CbtLegendItem status="marked_for_review" label="Marked Review" count={markedReviewCount} />
        </div>
        <div className="pt-1.5 border-t border-slate-800">
          <CbtLegendItem
            status="answered_marked_for_review"
            label="Ans & Marked Review"
            count={ansMarkedReviewCount}
          />
        </div>
      </div>

      {/* Section Banner */}
      <div className="h-8 bg-sky-700 px-3 flex items-center justify-between text-xs font-bold text-white shrink-0 shadow-inner">
        <span>SECTION: Questions</span>
        <span className="text-[11px] font-normal text-sky-200">{totalQuestions} Qs</span>
      </div>

      {/* Question Numbers Grid Palette */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
          Choose a Question:
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {statuses.map((status, idx) => (
            <CbtStatusIcon
              key={idx}
              status={status}
              number={idx + 1}
              size="sm"
              isActive={currentIndex === idx}
              onClick={() => goToQuestion(idx)}
            />
          ))}
        </div>
      </div>

      {/* Submit Test Button at Bottom of Palette */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 shrink-0">
        <Button
          onClick={() => {
            setMobilePaletteOpen(false);
            setShowSubmitModal(true);
          }}
          className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-2 text-xs sm:text-sm shadow-md"
        >
          Submit Test (CBT)
        </Button>
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0f19] text-slate-100 font-sans select-none overflow-hidden"
    >
      {/* ────────────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR (Responsive)
      ──────────────────────────────────────────────────────────────────────── */}
      <header className="h-11 sm:h-13 md:h-14 bg-[#111827] border-b border-slate-800 flex items-center justify-between px-2.5 sm:px-4 shrink-0 shadow-md gap-2">
        {/* Left: Exam Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <h1 className="text-xs sm:text-sm md:text-base font-bold text-yellow-400 truncate tracking-wide">
            {data.title || "Examination (CBT Mode)"}
          </h1>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowQuestionPaper(true)}
            className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-emerald-950/40 border-emerald-600/50 hover:bg-emerald-900/60 text-emerald-300 font-semibold"
          >
            <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
            <span className="hidden xs:inline">Paper</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInstructions(true)}
            className="h-7 sm:h-8 px-2 sm:px-3 text-[11px] sm:text-xs bg-blue-950/40 border-blue-600/50 hover:bg-blue-900/60 text-blue-300 font-semibold"
          >
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
            <span className="hidden xs:inline">Guide</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-slate-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </Button>

          {onExit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExitModal(true)}
              title="Exit Exam"
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          )}
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────────────────────
          2. SUB-HEADER / SECTION & TIMER BAR (Responsive)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="h-10 sm:h-12 bg-[#1e293b] border-b border-slate-700/80 flex items-center justify-between px-2.5 sm:px-4 shrink-0 gap-2">
        {/* Left: Section Badge & Mobile Palette Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="px-2 sm:px-2.5 py-0.5 bg-sky-600 text-white text-[11px] sm:text-xs font-bold rounded shadow-sm flex items-center gap-1">
            <span>Section 1</span>
          </div>

          {/* Mobile Palette Button in Subheader */}
          <button
            type="button"
            onClick={() => setMobilePaletteOpen(true)}
            className="md:hidden flex items-center gap-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded text-[11px] font-semibold"
          >
            <LayoutGrid className="w-3 h-3 text-sky-400" />
            <span>Palette ({currentIndex + 1}/{totalQuestions})</span>
          </button>
        </div>

        {/* Center / Right: Countdown Timer & Candidate Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900/90 px-2 sm:px-2.5 py-0.5 rounded border border-slate-700 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-slate-400 font-medium hidden xs:inline">Time Left:</span>
            <span
              className={`font-mono text-xs sm:text-sm font-bold tracking-wider ${
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

          {/* Candidate Profile Badge (Hidden on very tiny screens) */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/60 text-xs text-slate-300">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[100px] md:max-w-[140px] font-medium">
              {candidateName}
            </span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          3. MAIN WORKSPACE (Question + Desktop Palette)
      ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── Left Column: Question Area ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f172a] border-r border-slate-800">
          {/* Question Meta Bar */}
          <div className="h-9 sm:h-10 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-3 sm:px-4 shrink-0 text-xs text-slate-300">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="font-bold text-xs sm:text-sm text-white">
                Q. <span className="text-yellow-400">{currentIndex + 1}</span>
                <span className="text-slate-500 font-normal">/{totalQuestions}</span>
              </span>

              {/* Text Size Adjuster */}
              <div className="flex items-center gap-0.5 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Text:</span>
                <button
                  type="button"
                  onClick={() => setFontSizeOffset((prev) => Math.min(2, prev + 1))}
                  className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[10px] sm:text-xs"
                  title="Increase font size"
                >
                  A+
                </button>
                <button
                  type="button"
                  onClick={() => setFontSizeOffset((prev) => Math.max(-1, prev - 1))}
                  className="px-1.5 py-0.2 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold text-[10px] sm:text-xs"
                  title="Decrease font size"
                >
                  A-
                </button>
              </div>

              <span className="text-slate-400 hidden md:inline text-[11px]">
                Q.Type: <strong className="text-orange-400">MCQ</strong>
              </span>
            </div>

            {/* Marks Tag */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs">
              <span className="text-slate-400 hidden xs:inline">Marks:</span>
              <span className="px-1.5 py-0.2 bg-green-600 text-white font-bold rounded text-[10px] sm:text-xs">
                +{markingScheme.correct}
              </span>
              <span className="px-1.5 py-0.2 bg-red-600 text-white font-bold rounded text-[10px] sm:text-xs">
                {markingScheme.incorrect > 0 ? `-${markingScheme.incorrect}` : "0"}
              </span>
            </div>
          </div>

          {/* Question & Options Scrollable View */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6">
            {/* Question Text */}
            <div className="p-3.5 sm:p-5 bg-slate-900/60 rounded-lg border border-slate-800/80 shadow-sm">
              <div
                className={`font-medium text-slate-100 leading-relaxed ${currentFontSizeClass}`}
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(currentQuestion.question) }}
              />
            </div>

            {/* Options List */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
              {currentQuestion.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === option;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedOption(option);
                      selectedOptionRef.current = option;
                    }}
                    className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 md:p-4 rounded-lg border cursor-pointer transition-all duration-150 active:scale-[0.99] ${
                      isSelected
                        ? "bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10 text-white ring-1 ring-blue-500/50"
                        : "bg-slate-900/40 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    {/* Radio Bubble */}
                    <div
                      className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-blue-400 bg-blue-600 text-white"
                          : "border-slate-500 bg-slate-950"
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />}
                    </div>

                    {/* Option Text */}
                    <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0">
                      <span className="font-bold text-xs sm:text-sm text-blue-400 shrink-0">
                        ({label})
                      </span>
                      <span
                        className={`${currentFontSizeClass} leading-normal break-words`}
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(option) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              BOTTOM FIXED ACTION BAR (Fully Responsive Layout)
          ────────────────────────────────────────────────────────────────── */}
          <footer className="bg-[#111827] border-t border-slate-800 p-2 sm:px-4 sm:py-2.5 shrink-0 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            {/* Mobile Top Sub-Row (Utility actions) / Desktop Left */}
            <div className="flex items-center gap-1.5 sm:gap-2 justify-between md:justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkForReviewAndNext}
                className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-sm h-8 md:h-9 bg-purple-950/40 border-purple-600/60 hover:bg-purple-900/60 text-purple-300 font-semibold px-2 sm:px-3"
              >
                Mark Review
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearResponse}
                disabled={selectedOption === null}
                className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-sm h-8 md:h-9 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300 font-medium px-2 sm:px-3"
              >
                Clear
              </Button>

              {/* Mobile Question Palette Drawer Opener */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobilePaletteOpen(true)}
                className="md:hidden flex-1 text-[11px] sm:text-xs h-8 bg-sky-950/40 border-sky-600/50 hover:bg-sky-900/60 text-sky-300 font-semibold px-2"
              >
                <LayoutGrid className="w-3 h-3 mr-1" />
                Palette
              </Button>
            </div>

            {/* Mobile Bottom Sub-Row (Primary Navigation & Submit) / Desktop Right */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAndPrevious}
                disabled={currentIndex === 0}
                className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-sm h-9 md:h-9 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 px-2 sm:px-3"
                title="Keyboard shortcut: Left Arrow (←)"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">Save & </span>Prev
              </Button>

              <Button
                size="sm"
                onClick={handleSaveAndNext}
                className="flex-1 md:flex-none text-[11px] sm:text-xs md:text-sm h-9 md:h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 sm:px-5 shadow-md shadow-blue-600/30"
                title="Keyboard shortcut: Right Arrow (→)"
              >
                Save & Next
                <ChevronRight className="w-3.5 h-3.5 ml-0.5 sm:ml-1" />
              </Button>

              <Button
                size="sm"
                onClick={() => setShowSubmitModal(true)}
                className="text-[11px] sm:text-xs md:text-sm h-9 md:h-9 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 sm:px-4 shadow-md shadow-sky-600/30 shrink-0"
              >
                Submit
              </Button>
            </div>
          </footer>
        </div>

        {/* ── Desktop Question Palette (Hidden on Mobile) ──────────────────── */}
        <aside
          className={`hidden md:flex w-72 lg:w-80 bg-[#111827] border-l border-slate-800 flex-col shrink-0 transition-all duration-200 overflow-hidden ${
            paletteCollapsed ? "w-0 hidden" : "w-72 lg:w-80"
          }`}
        >
          {renderPaletteContent()}
        </aside>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          4. MOBILE QUESTION PALETTE DRAWER (Slide-over Dialog)
      ──────────────────────────────────────────────────────────────────────── */}
      <Dialog open={mobilePaletteOpen} onOpenChange={setMobilePaletteOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] p-0 bg-[#111827] border-slate-700 text-slate-100 flex flex-col overflow-hidden shadow-2xl">
          <DialogHeader className="p-3 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-sky-400" />
              Question Palette ({totalQuestions} Questions)
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {renderPaletteContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────
          5. MODALS (Question Paper, Instructions, Submit Confirm, Time-Up)
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
        <DialogContent className="max-w-[95vw] sm:max-w-xl bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
            <DialogTitle className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              📋 Examination Summary
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Review your attempt summary before final submission.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 sm:p-5 space-y-3 sm:space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Summary Table */}
            <div className="rounded-lg border border-slate-800 overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2 sm:p-2.5">Status Description</th>
                    <th className="p-2 sm:p-2.5 text-right">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  <tr>
                    <td className="p-2 sm:p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Answered
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-bold text-green-400">{answeredCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Not Answered
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-bold text-orange-400">{notAnsweredCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Marked for Review
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-bold text-purple-400">{markedReviewCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Answered & Marked for Review
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-bold text-purple-300">{ansMarkedReviewCount}</td>
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-2.5 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Not Visited
                    </td>
                    <td className="p-2 sm:p-2.5 text-right font-bold text-slate-400">{notVisitedCount}</td>
                  </tr>
                  <tr className="bg-slate-950/80 font-bold text-white">
                    <td className="p-2 sm:p-2.5">Total Questions</td>
                    <td className="p-2 sm:p-2.5 text-right text-blue-400">{totalQuestions}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-2.5 sm:p-3 bg-amber-950/30 border border-amber-800/40 rounded text-xs text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Are you sure you want to submit your examination? You will not be able to modify your answers once submitted.
              </span>
            </div>
          </div>

          <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmitModal(false)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 text-xs px-2.5 sm:px-3"
            >
              Resume
            </Button>
            <Button
              size="sm"
              onClick={finalSubmit}
              className="bg-green-600 hover:bg-green-500 text-white font-bold text-xs px-3 sm:px-5 shadow-lg shadow-green-600/30"
            >
              Yes, Submit Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auto Submit / Time-up Modal */}
      <Dialog open={isTimeUpModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-slate-900 border-red-500/50 text-slate-100 text-center p-5 sm:p-6 shadow-2xl">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-950/60 border border-red-500 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <DialogTitle className="text-lg sm:text-xl font-bold text-red-400 mb-1">
            Time's Up!
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs sm:text-sm">
            Your examination time has expired. Submitting your test automatically...
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {/* Exit Modal */}
      <Dialog open={showExitModal} onOpenChange={setShowExitModal}>
        <DialogContent className="max-w-[90vw] sm:max-w-md bg-slate-900 border-slate-700 text-slate-100 p-4 sm:p-5">
          <DialogTitle className="text-base font-bold text-white mb-1.5">
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
              className="border-slate-700 text-slate-300 text-xs"
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
              className="text-xs"
            >
              Exit Exam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
