import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { QuizData } from "@/lib/quiz-types";
import { sanitizeHTML } from "@/lib/quiz-utils";
import { SubmitConfirmModal } from "./SubmitConfirmModal";
import { Button } from "@/components/ui/button";

interface QuizSectionProps {
  data: QuizData;
  onComplete: (answers: (string | null)[]) => void;
  onExit?: () => void;
}

export function QuizSection({ data, onComplete, onExit }: QuizSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(data.data.length).fill(null));
  const [direction, setDirection] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const question = data.data[currentIndex];
  const totalQuestions = data.data.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalQuestions]);

  const handleOptionSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = option;
    setAnswers(newAnswers);

    // Auto advance after short delay
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setDirection(1);
        setCurrentIndex(prev => prev + 1);
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else if (isLastQuestion) {
      setShowSubmitModal(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmitConfirm = () => {
    setShowSubmitModal(false);
    onComplete(answers);
  };

  const handleExitConfirm = () => {
    setShowExitModal(false);
    if (onExit) {
      onExit();
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <>
      <div className="max-w-3xl mx-auto py-6 md:py-10 px-3 md:px-5">
        {/* Header with Exit Button */}
        <div className="flex justify-between items-center mb-4 md:mb-5">
          <div className="text-center text-muted-foreground font-medium text-sm md:text-base flex-1">
            Question <span className="text-foreground">{currentIndex + 1}</span> of <span className="text-foreground">{totalQuestions}</span>
          </div>
          <button
            onClick={() => setShowExitModal(true)}
            className="ml-4 p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Exit quiz"
          >
            <X size={20} className="md:w-5 md:h-5" />
          </button>
        </div>

        <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-6 md:mb-8">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="relative overflow-hidden min-h-[300px] sm:min-h-[400px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="bg-card rounded-xl md:rounded-2xl p-4 md:p-8 lg:p-10 shadow-lg border border-border/50"
            >
              <div 
                className="text-lg md:text-xl lg:text-2xl font-medium text-foreground mb-6 md:mb-8 lg:mb-10 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.question) }}
              />

              <div className="flex flex-col gap-2 md:gap-3">
                {question.options.map((option, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  const isSelected = answers[currentIndex] === option;

                  return (
                    <div
                      key={idx}
                      onClick={() => handleOptionSelect(option)}
                      className={`
                        p-3 md:p-4 lg:p-5 border-2 rounded-lg md:rounded-xl cursor-pointer transition-all duration-200 flex items-start md:items-center gap-3 md:gap-4 text-sm md:text-base lg:text-lg group
                        ${isSelected 
                          ? "border-primary bg-primary/5 dark:bg-primary/10" 
                          : "border-border bg-card hover:bg-secondary hover:border-border/80"
                        }
                      `}
                      data-testid={`option-${idx}`}
                    >
                      <div className={`
                        w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded flex items-center justify-center font-bold text-xs md:text-sm shrink-0 transition-colors flex-center
                        ${isSelected 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                        }
                      `}>
                        {label}
                      </div>
                      <div className="text-foreground break-words" dangerouslySetInnerHTML={{ __html: sanitizeHTML(option) }} />
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center gap-3 md:gap-6 mt-6 md:mt-10 flex-wrap">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border bg-card flex items-center justify-center text-lg md:text-xl text-muted-foreground transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border"
            title="Previous question (← Arrow Key)"
            data-testid="button-prev"
          >
            <ChevronLeft size={20} className="md:w-6 md:h-6" />
          </button>

          {/* Next/Submit Button */}
          <button
            onClick={handleNext}
            className={`
              w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center text-lg md:text-xl transition-all font-bold
              ${isLastQuestion
                ? "border-green-500 bg-green-600 text-white hover:bg-green-700 hover:border-green-600"
                : "border-border bg-card text-muted-foreground hover:bg-primary hover:border-primary hover:text-primary-foreground"
              }
            `}
            title={isLastQuestion ? "Submit quiz (→ Arrow Key)" : "Next question (→ Arrow Key)"}
            data-testid="button-next"
          >
            {isLastQuestion ? (
              <span>✓</span>
            ) : (
              <ChevronRight size={20} className="md:w-6 md:h-6" />
            )}
          </button>
        </div>

        {/* Keyboard hint */}
        <div className="text-center mt-4 md:mt-6 text-xs text-muted-foreground">
          ⌨️ Use arrow keys to navigate
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmModal
        isOpen={showSubmitModal}
        onConfirm={handleSubmitConfirm}
        onCancel={() => setShowSubmitModal(false)}
      />

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg border border-border shadow-lg max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">Exit Quiz?</h2>
            <p className="text-muted-foreground text-sm md:text-base mb-6">
              Are you sure you want to exit? Your progress will not be saved.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowExitModal(false)}
                className="text-sm md:text-base"
              >
                Continue Quiz
              </Button>
              <Button
                onClick={handleExitConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm md:text-base"
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
