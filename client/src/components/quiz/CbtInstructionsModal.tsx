import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, HelpCircle } from "lucide-react";
import { CbtStatusIcon } from "./CbtStatusIcon";

interface CbtInstructionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  markingScheme?: { correct: number; incorrect: number };
}

export function CbtInstructionsModal({
  open,
  onOpenChange,
  markingScheme = { correct: 1, incorrect: 0.25 },
}: CbtInstructionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-slate-900 border-slate-700 text-slate-100 p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-slate-800 bg-slate-950 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-yellow-400" />
            <DialogTitle className="text-lg font-bold text-slate-100">
              General Instructions & CBT Navigation Guide
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          {/* General Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              ⏱️ 1. General Timing & Submission
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>The countdown timer at the top right displays the remaining time for the examination.</li>
              <li>When the timer reaches zero, the examination will <strong>automatically submit</strong> and your responses will be evaluated.</li>
              <li>You can also click <strong>"Submit Test"</strong> at any time once you have completed all questions.</li>
            </ul>
          </div>

          {/* Question Palette Symbols */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              🎨 2. Question Palette Symbols & Color Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <CbtStatusIcon status="not_visited" number="1" size="sm" />
                <span className="text-xs text-slate-300">You have not visited the question yet.</span>
              </div>
              <div className="flex items-center gap-3">
                <CbtStatusIcon status="not_answered" number="2" size="sm" />
                <span className="text-xs text-slate-300">You have visited but not answered the question.</span>
              </div>
              <div className="flex items-center gap-3">
                <CbtStatusIcon status="answered" number="3" size="sm" />
                <span className="text-xs text-slate-300">You have answered the question (Saved).</span>
              </div>
              <div className="flex items-center gap-3">
                <CbtStatusIcon status="marked_for_review" number="4" size="sm" />
                <span className="text-xs text-slate-300">Marked for review without answering.</span>
              </div>
              <div className="flex items-center gap-3 md:col-span-2">
                <CbtStatusIcon status="answered_marked_for_review" number="5" size="sm" />
                <span className="text-xs text-slate-300">
                  Answered & Marked for Review (<strong>Will be considered for evaluation</strong>).
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              🧭 3. Action Buttons & Navigation
            </h3>
            <ul className="space-y-2 text-xs md:text-sm">
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded shrink-0">Save & Next</span>
                <span>Saves your selected response, marks question Green, and advances to the next question.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded shrink-0">Mark for Review & Next</span>
                <span>Marks the question for review (and saves the option if chosen), advancing to the next question.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-slate-700 text-white font-bold rounded shrink-0">Clear Response</span>
                <span>Clears your currently selected option for the active question.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-cyan-600 text-white font-bold rounded shrink-0">Submit Test</span>
                <span>Opens the examination summary dialog to finalize and submit your test.</span>
              </li>
            </ul>
          </div>

          {/* Marking Scheme */}
          <div>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              📊 4. Marking Scheme
            </h3>
            <div className="flex items-center gap-4 bg-slate-800/60 p-3 rounded border border-slate-700">
              <div>
                <span className="text-green-400 font-bold text-base">+{markingScheme.correct}</span>
                <span className="text-xs text-slate-300 ml-1.5">For Correct Answer</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-red-400 font-bold text-base">{markingScheme.incorrect > 0 ? `-${markingScheme.incorrect}` : "0"}</span>
                <span className="text-xs text-slate-300 ml-1.5">For Incorrect Answer</span>
              </div>
              <div className="w-px h-6 bg-slate-700" />
              <div>
                <span className="text-slate-400 font-bold text-base">0</span>
                <span className="text-xs text-slate-300 ml-1.5">Unattempted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            I Understand — Return to Exam
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
