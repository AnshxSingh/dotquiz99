import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UploadSection } from "@/components/quiz/UploadSection";
import { QuizSection } from "@/components/quiz/QuizSection";
import { ResultsSection } from "@/components/quiz/ResultsSection";
import { HistorySection } from "@/components/quiz/HistorySection";
import { QuizData } from "@/lib/quiz-types";
import { nanoid } from "nanoid";

type ViewState = "upload" | "quiz" | "results";

export default function Home() {
  const [view, setView] = useState<ViewState>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);

  const handleQuizStart = (data: QuizData) => {
    setQuizData(data);
    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizComplete = (answers: (string | null)[]) => {
    setUserAnswers(answers);
    setView("results");
    
    // Save history
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
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setView("upload");
    setQuizData(null);
    setUserAnswers([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 py-10 px-4">
      <ThemeToggle />
      
      <div className="container mx-auto max-w-4xl">
        <Header />

        <main>
          {view === "upload" && (
            <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
              <UploadSection onQuizStart={handleQuizStart} />
              <HistorySection />
            </div>
          )}

          {view === "quiz" && quizData && (
            <QuizSection 
              data={quizData} 
              onComplete={handleQuizComplete} 
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
