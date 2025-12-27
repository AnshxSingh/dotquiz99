import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { QuizData, Question } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { sanitizeHTML } from "@/lib/quiz-utils";

interface QuizSectionProps {
  data: QuizData;
  onComplete: (answers: (string | null)[]) => void;
}

export function QuizSection({ data, onComplete }: QuizSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(new Array(data.data.length).fill(null));
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  const question = data.data[currentIndex];
  const totalQuestions = data.data.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleOptionSelect = (option: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = option;
    setAnswers(newAnswers);

    // Auto advance after short delay
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setDirection(1);
        setCurrentIndex(prev => prev + 1);
      } else {
        // Last question, maybe prompt before completing? 
        // For now, let's just complete if they click next or we can auto-complete.
        // The original app used confirm dialogue. Let's just wait for user to click next/finish.
      }
    }, 300);
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else {
        if (confirm('Quiz complete! View results?')) {
            onComplete(answers);
        }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
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
    <div className="max-w-3xl mx-auto py-10 px-5">
      <div className="text-center text-muted-foreground mb-5 font-medium">
        Question <span className="text-foreground">{currentIndex + 1}</span> of <span className="text-foreground">{totalQuestions}</span>
      </div>

      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-primary transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="relative overflow-hidden min-h-[400px]">
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
            className="bg-card rounded-2xl p-10 shadow-lg border border-border/50"
          >
            <div 
              className="text-2xl font-medium text-foreground mb-10 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(question.question) }}
            />

            <div className="flex flex-col gap-3">
              {question.options.map((option, idx) => {
                const label = String.fromCharCode(65 + idx); // A, B, C...
                const isSelected = answers[currentIndex] === option;

                return (
                  <div
                    key={idx}
                    onClick={() => handleOptionSelect(option)}
                    className={`
                      p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-4 text-lg group
                      ${isSelected 
                        ? "border-primary bg-primary/5 dark:bg-primary/10" 
                        : "border-border bg-card hover:bg-secondary hover:border-border/80"
                      }
                    `}
                  >
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors
                      ${isSelected 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-muted-foreground group-hover:bg-secondary/80"
                      }
                    `}>
                      {label}
                    </div>
                    <div className="text-foreground" dangerouslySetInnerHTML={{ __html: sanitizeHTML(option) }} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center gap-6 mt-10">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center text-xl text-muted-foreground transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:text-muted-foreground disabled:hover:border-border"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={handleNext}
          className="w-12 h-12 rounded-full border-2 border-border bg-card flex items-center justify-center text-xl text-muted-foreground transition-all hover:bg-primary hover:border-primary hover:text-primary-foreground"
        >
            {currentIndex === totalQuestions - 1 ? (
                <span className="text-base font-bold">✓</span>
            ) : (
                <ChevronRight size={24} />
            )}
        </button>
      </div>
    </div>
  );
}
