import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UploadSection } from "@/components/quiz/UploadSection";
import { QuizGenerator } from "@/components/quiz/QuizGenerator";
import { JsonQuizzesSection } from "@/components/quiz/JsonQuizzesSection";
import { QuizSection } from "@/components/quiz/QuizSection";
import { ResultsSection } from "@/components/quiz/ResultsSection";
import { HistorySection } from "@/components/quiz/HistorySection";
import { QuizData, StoredQuiz } from "@/lib/quiz-types";
import { nanoid } from "nanoid";

type ViewState = "upload" | "quiz" | "results";

export default function Home() {
  const [view, setView] = useState<ViewState>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const handleQuizStart = (data: QuizData, quizId?: string) => {
    setQuizData(data);
    setCurrentQuizId(quizId || null);
    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizComplete = (answers: (string | null)[]) => {
    setUserAnswers(answers);
    setView("results");
    
    // Save history and persist quiz
    if (quizData) {
        const correctCount = answers.reduce((acc, ans, idx) => {
            return ans === quizData.data[idx].correct_answer ? acc + 1 : acc;
        }, 0);
        
        const historyItem = {
            id: nanoid(),
            title: quizData.title || `Quiz ${new Date().toLocaleDateString()}`,
            score: correctCount as number,
            total: quizData.data.length,
            date: new Date().toISOString()
        };

        const existing = localStorage.getItem('quizHistory');
        const history = existing ? JSON.parse(existing) : [];
        history.push(historyItem);
        localStorage.setItem('quizHistory', JSON.stringify(history));

        // Persist the quiz if it's new
        if (!currentQuizId) {
            const newQuizId = nanoid();
            const storedQuiz: StoredQuiz = {
                id: newQuizId,
                title: quizData.title || `Quiz ${new Date().toLocaleDateString()}`,
                data: quizData.data,
                createdAt: new Date().toISOString(),
                attempts: 1
            };

            const existingQuizzes = localStorage.getItem('savedQuizzes');
            const quizzes = existingQuizzes ? JSON.parse(existingQuizzes) : [];
            quizzes.push(storedQuiz);
            localStorage.setItem('savedQuizzes', JSON.stringify(quizzes));
            setCurrentQuizId(newQuizId);
        } else {
            // Increment attempts for existing quiz
            const existingQuizzes = localStorage.getItem('savedQuizzes');
            const quizzes = existingQuizzes ? JSON.parse(existingQuizzes) : [];
            const quizIndex = quizzes.findIndex((q: StoredQuiz) => q.id === currentQuizId);
            if (quizIndex !== -1) {
                quizzes[quizIndex].attempts += 1;
                localStorage.setItem('savedQuizzes', JSON.stringify(quizzes));
            }
        }
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setView("upload");
    setQuizData(null);
    setUserAnswers([]);
    setCurrentQuizId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 py-6 md:py-10 px-3 md:px-4">
      <ThemeToggle />
      
      <div className="container mx-auto max-w-4xl">
        <Header />

        <main>
          {view === "upload" && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500 space-y-6">
              <div className="flex justify-center">
                <QuizGenerator onGeneratedQuiz={handleQuizStart} />
              </div>
              <UploadSection onQuizStart={handleQuizStart} />
              <JsonQuizzesSection onQuizStart={handleQuizStart} />
              <HistorySection onReattempt={handleQuizStart} />
            </div>
          )}

          {view === "quiz" && quizData && (
            <QuizSection 
              data={quizData} 
              onComplete={handleQuizComplete}
              onExit={handleRestart}
            />
          )}

          {view === "results" && quizData && (
            <ResultsSection 
              data={quizData} 
              userAnswers={userAnswers} 
              onRestart={handleRestart} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
