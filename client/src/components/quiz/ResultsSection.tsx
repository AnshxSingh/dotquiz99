import { useEffect, useState } from "react";
import { QuizData, QuestionResult } from "@/lib/quiz-types";
import { categorizeQuestion, sanitizeHTML } from "@/lib/quiz-utils";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface ResultsSectionProps {
  data: QuizData;
  userAnswers: (string | null)[];
  onRestart: () => void;
}

export function ResultsSection({ data, userAnswers, onRestart }: ResultsSectionProps) {
  const [stats, setStats] = useState<{
    correctCount: number;
    incorrectCount: number;
    total: number;
    percentage: number;
    topicStats: Record<string, { correct: number; total: number }>;
    incorrectQuestions: QuestionResult[];
  } | null>(null);

  useEffect(() => {
    let correctCount = 0;
    let answeredCount = 0;
    const incorrectQuestions: QuestionResult[] = [];
    const topicStats: Record<string, { correct: number; total: number }> = {};

    data.data.forEach((question, index) => {
      const topic = categorizeQuestion(question.question);
      
      if (!topicStats[topic]) {
        topicStats[topic] = { correct: 0, total: 0 };
      }

      if (userAnswers[index] !== null) {
        answeredCount++;
        topicStats[topic].total++;

        if (userAnswers[index] === question.correct_answer) {
          correctCount++;
          topicStats[topic].correct++;
        } else {
          incorrectQuestions.push({
            question: question.question,
            userAnswer: userAnswers[index],
            correctAnswer: question.correct_answer,
            topic: topic,
            isCorrect: false
          });
        }
      }
    });

    const total = data.data.length;
    const percentage = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    setStats({
      correctCount,
      incorrectCount: answeredCount - correctCount,
      total: answeredCount, // actually answered, or just total questions? Original used answeredCount / total
      percentage,
      topicStats,
      incorrectQuestions
    });

  }, [data, userAnswers]);

  if (!stats) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 lg:p-10 text-center animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 md:mb-8">{stats.percentage}%</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-5 mb-8 md:mb-10">
        <div className="p-4 md:p-6 bg-card rounded-lg md:rounded-xl border border-border shadow-sm">
          <h3 className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-2">Correct</h3>
          <p className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{stats.correctCount}</p>
        </div>
        <div className="p-4 md:p-6 bg-card rounded-lg md:rounded-xl border border-border shadow-sm">
          <h3 className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-2">Incorrect</h3>
          <p className="text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{stats.incorrectCount}</p>
        </div>
        <div className="p-4 md:p-6 bg-card rounded-lg md:rounded-xl border border-border shadow-sm">
          <h3 className="text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-2">Attempted</h3>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{stats.total}/{data.data.length}</p>
        </div>
      </div>

      {Object.keys(stats.topicStats).length > 0 && (
        <div className="mb-8 md:mb-10 text-left">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">📊 Performance by Topic</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
            {Object.entries(stats.topicStats)
                .filter(([_, s]) => s.total > 0)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([topic, s]) => {
                    const pct = Math.round((s.correct / s.total) * 100);
                    let barColor = "bg-green-500";
                    if (pct < 50) barColor = "bg-red-500";
                    else if (pct < 75) barColor = "bg-orange-500";

                    return (
                        <div key={topic} className="bg-card p-3 md:p-4 rounded-lg md:rounded-xl border border-border shadow-sm">
                            <div className="font-medium text-foreground mb-1 line-clamp-1 text-sm md:text-base" title={topic}>{topic}</div>
                            <div className="text-muted-foreground text-xs md:text-sm mb-2">{s.correct}/{s.total} correct ({pct}%)</div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div>
                            </div>
                        </div>
                    );
                })
            }
          </div>
        </div>
      )}

      <div className="text-left mb-8 md:mb-10">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-3 md:mb-4">
            {stats.incorrectQuestions.length > 0 ? "❌ Review Incorrect Answers" : "🎯 Perfect Score!"}
        </h2>
        
        {stats.incorrectQuestions.length === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 p-6 md:p-8 rounded-lg md:rounded-xl border border-green-100 dark:border-green-800 text-center">
                <p className="text-green-700 dark:text-green-400 font-medium text-base md:text-lg">You answered all questions correctly!</p>
            </div>
        )}

        {stats.incorrectQuestions.map((item, idx) => (
            <div key={idx} className="bg-card border-l-4 border-l-red-500 rounded-r-lg md:rounded-r-xl p-4 md:p-6 mb-3 md:mb-4 shadow-sm border-y border-r border-border">
                <div className="font-semibold text-foreground mb-2 md:mb-3 text-sm md:text-lg">
                    <span className="text-muted-foreground mr-2">Q:</span>
                    <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.question) }} />
                </div>
                <div className="inline-block px-2 md:px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full mb-2 md:mb-3">
                    {item.topic}
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 md:p-3 rounded text-xs md:text-sm mb-2">
                    <strong>Your Answer:</strong> <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.userAnswer || "Skipped") }} />
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 md:p-3 rounded text-xs md:text-sm">
                    <strong>Correct Answer:</strong> <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(item.correctAnswer) }} />
                </div>
            </div>
        ))}
      </div>

      <div className="flex justify-center pb-8 md:pb-10">
        <Button onClick={onRestart} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <RotateCcw className="w-4 h-4 mr-2" /> Start New Quiz
        </Button>
      </div>
    </div>
  );
}
