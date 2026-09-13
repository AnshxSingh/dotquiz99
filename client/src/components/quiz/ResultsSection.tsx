import { useEffect, useState, useMemo } from "react";
import { QuizData } from "@/lib/quiz-types";
import { sanitizeHTML } from "@/lib/quiz-utils";
import { Button } from "@/components/ui/button";
import { 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  HelpCircle, 
  FileCheck
} from "lucide-react";
import { CbtStatus } from "./CbtStatusIcon";

interface ResultsSectionProps {
  data: QuizData;
  userAnswers: (string | null)[];
  statuses?: CbtStatus[];
  timeTakenSeconds?: number;
  markingScheme?: { correct: number; incorrect: number };
  candidateName?: string;
  onRestart: () => void;
}

export function ResultsSection({
  data,
  userAnswers,
  statuses = [],
  timeTakenSeconds = 0,
  markingScheme = { correct: 1, incorrect: 0.25 },
  candidateName = "Candidate",
  onRestart,
}: ResultsSectionProps) {
  // Compute question review
  const allQuestionsReview = useMemo(() => {
    const rawList = data?.data && Array.isArray(data.data) ? data.data : [];
    return rawList.map((question, index) => {
      const userAnswer = userAnswers ? userAnswers[index] : null;
      const status = (statuses && statuses[index]) || (userAnswer ? "answered" : "not_visited");
      const isAttempted = userAnswer !== null && userAnswer !== undefined;
      const isCorrect = isAttempted && String(userAnswer).trim() === String(question?.correct_answer || "").trim();

      return {
        question: String(question?.question || ""),
        options: Array.isArray(question?.options) ? question.options : [],
        userAnswer,
        correctAnswer: String(question?.correct_answer || ""),
        isCorrect,
        isAttempted,
        status,
      };
    });
  }, [data, userAnswers, statuses]);

  // Compute aggregate stats
  const stats = useMemo(() => {
    let correctCount = 0;
    let incorrectCount = 0;
    let unattemptedCount = 0;

    allQuestionsReview.forEach((item) => {
      if (!item.isAttempted) {
        unattemptedCount++;
      } else if (item.isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const total = allQuestionsReview.length;
    const correctMark = Number(markingScheme?.correct ?? 1);
    const incorrectMark = Number(markingScheme?.incorrect ?? 0.25);

    const rawScore = (correctCount * correctMark) - (incorrectCount * incorrectMark);
    const score = Number(rawScore.toFixed(2));
    const maxScore = Number((total * correctMark).toFixed(2));
    const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
    const attempted = correctCount + incorrectCount;
    const accuracy = attempted > 0 ? Math.round((correctCount / attempted) * 100) : 0;

    return {
      correctCount,
      incorrectCount,
      unattemptedCount,
      total,
      score,
      maxScore,
      percentage,
      accuracy,
      correctMark,
      incorrectMark,
    };
  }, [allQuestionsReview, markingScheme]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* 1. Scorecard Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award className="w-48 h-48 text-yellow-400" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <FileCheck className="w-3.5 h-3.5" /> Official CBT Result Scorecard
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
          {data.title || "Examination Results"}
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mb-6">
          Candidate: <strong className="text-slate-200">{candidateName}</strong> • Completed in{" "}
          <strong className="text-slate-200">{formatTime(timeTakenSeconds)}</strong>
        </p>

        {/* Score Numbers Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 max-w-2xl mx-auto">
          {/* Total Score */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 shadow-md">
            <div className="text-xs text-slate-400 uppercase font-semibold">Total Score</div>
            <div className="text-2xl md:text-3xl font-extrabold text-blue-400 mt-1">
              {stats.score} <span className="text-xs text-slate-500 font-normal">/ {stats.maxScore}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{stats.percentage}% Score</div>
          </div>

          {/* Accuracy */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 shadow-md">
            <div className="text-xs text-slate-400 uppercase font-semibold">Accuracy</div>
            <div className="text-2xl md:text-3xl font-extrabold text-emerald-400 mt-1">
              {stats.accuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Attempted Precision</div>
          </div>

          {/* Correct */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 shadow-md">
            <div className="text-xs text-slate-400 uppercase font-semibold">Correct</div>
            <div className="text-2xl md:text-3xl font-extrabold text-green-400 mt-1">
              {stats.correctCount}
            </div>
            <div className="text-[11px] text-green-400/80 mt-0.5">+{stats.correctCount * stats.correctMark} marks</div>
          </div>

          {/* Incorrect */}
          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-700/80 shadow-md">
            <div className="text-xs text-slate-400 uppercase font-semibold">Incorrect</div>
            <div className="text-2xl md:text-3xl font-extrabold text-red-400 mt-1">
              {stats.incorrectCount}
            </div>
            <div className="text-[11px] text-red-400/80 mt-0.5">
              {stats.incorrectCount > 0 ? `-${stats.incorrectCount * stats.incorrectMark}` : "0"} marks
            </div>
          </div>
        </div>
      </div>

      {/* 2. Detailed Performance Breakdown */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 md:p-6 shadow-md">
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          📊 CBT Status Breakdown
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-slate-300 font-medium">Answered Correct</span>
            </div>
            <span className="font-bold text-green-400 text-sm">{stats.correctCount}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300 font-medium">Wrong Answers</span>
            </div>
            <span className="font-bold text-red-400 text-sm">{stats.incorrectCount}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-slate-300 font-medium">Unattempted</span>
            </div>
            <span className="font-bold text-slate-400 text-sm">{stats.unattemptedCount}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-slate-300 font-medium">Time Taken</span>
            </div>
            <span className="font-bold text-yellow-400 text-sm">{formatTime(timeTakenSeconds)}</span>
          </div>
        </div>
      </div>

      {/* 3. Question-by-Question Detailed Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            📝 Question Review ({allQuestionsReview.length} Questions)
          </h2>
          <span className="text-xs text-slate-400">
            {stats.correctCount} Correct • {stats.incorrectCount} Incorrect • {stats.unattemptedCount} Unattempted
          </span>
        </div>

        <div className="space-y-4">
          {allQuestionsReview.map((item, idx) => {
            const isCorrect = item.isCorrect;
            const isSkipped = !item.isAttempted;

            // Distinctive unsaturated styling for unattempted questions
            const cardContainerStyle = isCorrect
              ? "bg-green-950/15 border-green-800/40 text-slate-100"
              : isSkipped
              ? "bg-slate-900/30 border-slate-800/50 text-slate-400 opacity-80 saturate-0 hover:opacity-100 hover:saturate-100 transition-all duration-200"
              : "bg-red-950/15 border-red-800/40 text-slate-100";

            return (
              <div
                key={idx}
                className={`p-4 md:p-5 rounded-xl border transition-all ${cardContainerStyle}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 font-bold text-xs rounded border ${
                      isSkipped 
                        ? "bg-slate-900 text-slate-400 border-slate-800" 
                        : "bg-slate-800 text-slate-200 border-slate-700"
                    }`}>
                      Q.{idx + 1}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-600/20 text-green-400 font-bold text-xs rounded-full border border-green-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct (+{stats.correctMark})
                      </span>
                    ) : isSkipped ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-slate-800/80 text-slate-400 font-medium text-xs rounded-full border border-slate-700/60">
                        <HelpCircle className="w-3.5 h-3.5" /> Unattempted (0)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-600/20 text-red-400 font-bold text-xs rounded-full border border-red-500/30">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect (-{stats.incorrectMark})
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div
                  className={`text-sm md:text-base font-medium mb-3 leading-relaxed ${isSkipped ? "text-slate-300" : "text-slate-100"}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.question) }}
                />

                {/* Options List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                  {(item.options || []).map((opt, oIdx) => {
                    const label = String.fromCharCode(65 + oIdx);
                    const isUserChoice = String(item.userAnswer || "").trim() === String(opt || "").trim();
                    const isRightAnswer = String(item.correctAnswer || "").trim() === String(opt || "").trim();

                    let optBg = "bg-slate-900/60 border-slate-800 text-slate-400";
                    if (isSkipped) {
                      // Unsaturated neutral look for unattempted questions
                      if (isRightAnswer) {
                        optBg = "bg-slate-800/60 border-slate-600 text-slate-300 font-medium";
                      } else {
                        optBg = "bg-slate-950/40 border-slate-800/50 text-slate-500";
                      }
                    } else if (isRightAnswer) {
                      optBg = "bg-green-950/60 border-green-500/60 text-green-200 font-semibold";
                    } else if (isUserChoice && !isRightAnswer) {
                      optBg = "bg-red-950/60 border-red-500/60 text-red-200 font-semibold";
                    }

                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-lg border flex items-start gap-2 ${optBg}`}
                      >
                        <span className="font-bold shrink-0">({label})</span>
                        <span
                          className="flex-1"
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(opt) }}
                        />
                        {isRightAnswer && (
                          <span className={`text-[10px] uppercase font-bold shrink-0 ${isSkipped ? "text-slate-400" : "text-green-400"}`}>
                            ✓ Correct Answer
                          </span>
                        )}
                        {isUserChoice && !isRightAnswer && (
                          <span className="text-[10px] uppercase font-bold text-red-400 shrink-0">
                            ✗ Your choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Bottom Action */}
      <div className="flex justify-center pt-4 pb-8">
        <Button
          onClick={onRestart}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-8 shadow-lg shadow-blue-600/30"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> Start Another CBT Exam
        </Button>
      </div>
    </div>
  );
}
