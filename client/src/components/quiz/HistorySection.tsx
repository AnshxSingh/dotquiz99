import { useEffect, useState } from "react";
import { QuizResult } from "@/lib/quiz-types";
import { Clock, Trophy } from "lucide-react";
import { format } from "date-fns";

export function HistorySection() {
  const [history, setHistory] = useState<QuizResult[]>([]);

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
  }, []);

  if (history.length === 0) return null;

  return (
    <div className="mt-12 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5" /> Recent History
      </h2>
      <div className="space-y-3">
        {history.map((item, idx) => (
            <div key={item.id || idx} className="flex justify-between items-center p-4 bg-card rounded-xl border border-border hover:bg-secondary/50 transition-colors">
                <div>
                    <div className="font-semibold text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM d, yyyy h:mm a')}</div>
                </div>
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-foreground">{item.score}/{item.total}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
