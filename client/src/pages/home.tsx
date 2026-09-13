import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UploadSection } from "@/components/quiz/UploadSection";
import { QuizGenerator } from "@/components/quiz/QuizGenerator";
import { JsonQuizzesSection } from "@/components/quiz/JsonQuizzesSection";
import { QuizSection, CbtQuizResult } from "@/components/quiz/QuizSection";
import { ResultsSection } from "@/components/quiz/ResultsSection";
import { HistorySection } from "@/components/quiz/HistorySection";
import { CbtExamStartModal, CbtExamConfig } from "@/components/quiz/CbtExamStartModal";
import { QuizData, StoredQuiz } from "@/lib/quiz-types";
import { nanoid } from "nanoid";

type ViewState = "upload" | "quiz" | "results";

export default function Home() {
  const [view, setView] = useState<ViewState>("upload");
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  // Pre-exam modal state
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [pendingQuizData, setPendingQuizData] = useState<QuizData | null>(null);
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);
  const [examConfig, setExamConfig] = useState<CbtExamConfig>({
    durationMinutes: 60,
    candidateName: "Candidate Name",
    markingScheme: { correct: 1, incorrect: 0.25 },
    autoFullscreen: true,
  });

  // Result state
  const [cbtResult, setCbtResult] = useState<CbtQuizResult | null>(null);

  const handleRequestQuizStart = (data: QuizData, quizId?: string) => {
    setPendingQuizData(data);
    setPendingQuizId(quizId || null);
    setShowStartModal(true);
  };

  const handleConfirmStartExam = (config: CbtExamConfig) => {
    if (!pendingQuizData) return;

    setQuizData(pendingQuizData);
    setCurrentQuizId(pendingQuizId);
    setExamConfig(config);
    setShowStartModal(false);

    if (config.autoFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    setView("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleQuizComplete = (result: CbtQuizResult) => {
    setCbtResult(result);
    setView("results");

    if (quizData) {
      let correctCount = 0;
      result.answers.forEach((ans, idx) => {
        if (ans === quizData.data[idx].correct_answer) {
          correctCount++;
        }
      });

      const historyItem = {
        id: nanoid(),
        title: quizData.title || `Quiz ${new Date().toLocaleDateString()}`,
        score: correctCount,
        total: quizData.data.length,
        date: new Date().toISOString(),
      };

      const existing = localStorage.getItem("quizHistory");
      const history = existing ? JSON.parse(existing) : [];
      history.push(historyItem);
      localStorage.setItem("quizHistory", JSON.stringify(history));

      // Persist the quiz if it's new
      if (!currentQuizId) {
        const newQuizId = nanoid();
        const storedQuiz: StoredQuiz = {
          id: newQuizId,
          title: quizData.title || `Quiz ${new Date().toLocaleDateString()}`,
          data: quizData.data,
          createdAt: new Date().toISOString(),
          attempts: 1,
        };

        const existingQuizzes = localStorage.getItem("savedQuizzes");
        const quizzes = existingQuizzes ? JSON.parse(existingQuizzes) : [];
        quizzes.push(storedQuiz);
        localStorage.setItem("savedQuizzes", JSON.stringify(quizzes));
        setCurrentQuizId(newQuizId);
      } else {
        // Increment attempts for existing quiz
        const existingQuizzes = localStorage.getItem("savedQuizzes");
        const quizzes = existingQuizzes ? JSON.parse(existingQuizzes) : [];
        const quizIndex = quizzes.findIndex((q: StoredQuiz) => q.id === currentQuizId);
        if (quizIndex !== -1) {
          quizzes[quizIndex].attempts += 1;
          localStorage.setItem("savedQuizzes", JSON.stringify(quizzes));
        }
      }
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRestart = () => {
    setView("upload");
    setQuizData(null);
    setCbtResult(null);
    setCurrentQuizId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 py-6 md:py-10 px-3 md:px-4">
      {/* Hide header and theme toggle during active quiz */}
      {view !== "quiz" && (
        <>
          <ThemeToggle />
          <div className="container mx-auto max-w-4xl">
            <Header />
          </div>
        </>
      )}

      <div className={view === "quiz" ? "" : "container mx-auto max-w-4xl"}>
        <main>
          {view === "upload" && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex justify-center">
                <QuizGenerator onGeneratedQuiz={handleRequestQuizStart} />
              </div>
              <UploadSection onQuizStart={handleRequestQuizStart} />
              <JsonQuizzesSection onQuizStart={handleRequestQuizStart} />
              <HistorySection onReattempt={handleRequestQuizStart} />
            </div>
          )}

          {view === "quiz" && quizData && (
            <QuizSection
              data={quizData}
              durationMinutes={examConfig.durationMinutes}
              candidateName={examConfig.candidateName}
              markingScheme={examConfig.markingScheme}
              onComplete={handleQuizComplete}
              onExit={handleRestart}
            />
          )}

          {view === "results" && quizData && cbtResult && (
            <ResultsSection
              data={quizData}
              userAnswers={cbtResult.answers}
              statuses={cbtResult.statuses}
              timeTakenSeconds={cbtResult.timeTakenSeconds}
              markingScheme={cbtResult.markingScheme}
              candidateName={cbtResult.candidateName}
              onRestart={handleRestart}
            />
          )}

        </main>
      </div>


      {/* CBT Pre-Exam Setup Modal */}
      <CbtExamStartModal
        open={showStartModal}
        onOpenChange={setShowStartModal}
        quizData={pendingQuizData}
        onConfirmStart={handleConfirmStartExam}
      />
    </div>
  );
}
