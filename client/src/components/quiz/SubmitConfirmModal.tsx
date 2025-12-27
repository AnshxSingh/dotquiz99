import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SubmitConfirmModal({ isOpen, onConfirm, onCancel }: SubmitConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
            data-testid="modal-backdrop"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            data-testid="submit-confirm-modal"
          >
            <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-sm w-full p-8">
              <h2 className="text-2xl font-bold text-foreground mb-3">🎯 Submit Quiz?</h2>
              <p className="text-muted-foreground mb-8">
                You've completed all questions. Review your answers in the results page.
              </p>
              
              <div className="flex gap-3 justify-end">
                <Button 
                  onClick={onCancel}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary"
                  data-testid="button-modal-cancel"
                >
                  Review More
                </Button>
                <Button 
                  onClick={onConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  data-testid="button-modal-confirm"
                >
                  View Results
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
