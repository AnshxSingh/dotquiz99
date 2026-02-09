import { useEffect, useState } from "react";
import { QuizResult, StoredQuiz, QuizData } from "@/lib/quiz-types";
import { Clock, Trophy, RotateCw, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface HistorySectionProps {
  onReattempt?: (data: QuizData, quizId: string) => void;
}

export function HistorySection({ onReattempt }: HistorySectionProps) {
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [savedQuizzes, setSavedQuizzes] = useState<StoredQuiz[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('quizHistory');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
            // Sort by date desc
            setHistory(parsed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    const quizzesStored = localStorage.getItem('savedQuizzes');
    if (quizzesStored) {
      try {
        const parsed = JSON.parse(quizzesStored);
        if (Array.isArray(parsed)) {
            setSavedQuizzes(parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        }
      } catch (e) {
        console.error("Failed to parse quizzes", e);
      }
    }
  }, []);

  const handleReattempt = (quiz: StoredQuiz) => {
    if (onReattempt) {
      const quizData: QuizData = {
        title: quiz.title,
        data: quiz.data
      };
      onReattempt(quizData, quiz.id);
    }
  };

  const handleDeleteQuiz = (quizId: string) => {
    const updated = savedQuizzes.filter(q => q.id !== quizId);
    setSavedQuizzes(updated);
    localStorage.setItem('savedQuizzes', JSON.stringify(updated));
    toast({
      title: "Quiz Deleted",
      description: "Quiz has been removed from your saved quizzes"
    });
  };

  if (history.length === 0 && savedQuizzes.length === 0) return null;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Saved Quizzes */}
      {savedQuizzes.length > 0 && (
        <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center gap-2">
            📚 Saved Quizzes
          </h2>
          <div className="space-y-2 md:space-y-3">
            {savedQuizzes.map((quiz) => (
                <div key={quiz.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-card rounded-lg md:rounded-xl border border-border hover:bg-secondary/50 transition-colors gap-3 sm:gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground text-sm md:text-base truncate">{quiz.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {quiz.data.length} question{quiz.data.length !== 1 ? 's' : ''} • {quiz.attempts} attempt{quiz.attempts !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReattempt(quiz)}
                          className="text-xs md:text-sm"
                        >
                          <RotateCw className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Reattempt
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-xs md:text-sm text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        </Button>
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent History */}
      {history.length > 0 && (
        <div className="mt-8 md:mt-12 max-w-2xl mx-auto">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 md:w-5 md:h-5" /> Recent History
          </h2>
          <div className="space-y-2 md:space-y-3">
            {history.map((item, idx) => (
                <div key={item.id || idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 md:p-4 bg-card rounded-lg md:rounded-xl border border-border hover:bg-secondary/50 transition-colors gap-2 sm:gap-0">
                    <div className="flex-1">
                        <div className="font-semibold text-foreground text-sm md:text-base">{item.title}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy h:mm a')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold text-foreground text-sm md:text-base">{item.score}/{item.total}</span>
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
