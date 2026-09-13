import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuizData } from "@/lib/quiz-types";
import { sanitizeHTML } from "@/lib/quiz-utils";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";

interface CbtQuestionPaperModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: QuizData;
  onSelectQuestion?: (index: number) => void;
}

export function CbtQuestionPaperModal({
  open,
  onOpenChange,
  data,
  onSelectQuestion,
}: CbtQuestionPaperModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden">
        <DialogHeader className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" />
            <DialogTitle className="text-sm sm:text-base md:text-lg font-bold text-slate-100 truncate">
              Question Paper — {data.title || "Examination"} ({data.data.length} Qs)
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6 divide-y divide-slate-800">
          {data.data.map((q, idx) => (
            <div key={idx} className={idx > 0 ? "pt-6" : ""}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-blue-600/30 text-blue-300 font-bold text-xs rounded border border-blue-500/30">
                    Question {idx + 1}
                  </span>
                  <span className="text-xs text-slate-400">MCQ Single</span>
                </div>
                {onSelectQuestion && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
                    onClick={() => {
                      onSelectQuestion(idx);
                      onOpenChange(false);
                    }}
                  >
                    Jump to Question →
                  </Button>
                )}
              </div>

              <div
                className="text-sm md:text-base text-slate-200 mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHTML(q.question) }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                {q.options.map((opt, oIdx) => {
                  const label = String.fromCharCode(65 + oIdx);
                  return (
                    <div
                      key={oIdx}
                      className="flex items-start gap-2 p-2.5 rounded bg-slate-800/60 border border-slate-700/50 text-slate-300"
                    >
                      <span className="font-bold text-blue-400 shrink-0">({label})</span>
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHTML(opt) }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Close Question Paper
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
