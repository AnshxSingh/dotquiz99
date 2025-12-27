import { useState, useRef } from "react";
import { Upload, FileText, Trash2, Play } from "lucide-react";
import { QuizData } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { clsx } from "clsx";

interface UploadSectionProps {
  onQuizStart: (data: QuizData) => void;
}

export function UploadSection({ onQuizStart }: UploadSectionProps) {
  const [jsonText, setJsonText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        validateAndStart(parsed);
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid JSON file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const handlePasteLoad = () => {
    try {
      if (!jsonText.trim()) return;
      const parsed = JSON.parse(jsonText);
      validateAndStart(parsed);
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format",
        variant: "destructive"
      });
    }
  };

  const validateAndStart = (data: any) => {
    if (data.data && Array.isArray(data.data)) {
        // Basic validation
        const isValid = data.data.every((q: any) => q.question && q.options && q.correct_answer);
        if (isValid) {
            onQuizStart(data as QuizData);
        } else {
            toast({ title: "Invalid Data", description: "Questions must have question, options, and correct_answer", variant: "destructive" });
        }
    } else {
        toast({ title: "Invalid Format", description: "Root object must have a 'data' array", variant: "destructive" });
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-hidden mb-5">
      <div className="p-10">
        <div 
          className="border-3 border-dashed border-border rounded-xl p-12 mb-8 cursor-pointer transition-all duration-300 bg-secondary/20 hover:bg-secondary/40 hover:border-primary text-center group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">📁</div>
          <h2 className="text-xl font-semibold mb-2 text-foreground">Drop your JSON file here</h2>
          <p className="text-muted-foreground my-4">or</p>
          <Button variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
            Browse Files
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json,application/json,text/plain" 
            onChange={handleFileChange}
          />
          <p className="mt-5 text-muted-foreground text-sm">
            Accepted format: JSON with questions, options, and correct_answer
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-foreground font-medium text-lg text-center mb-4">Or paste your JSON text here:</h3>
          <Textarea 
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full min-h-[200px] p-4 border-2 border-border rounded-lg font-mono text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            placeholder='{ "data": [ ... ] }'
          />
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={handlePasteLoad} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" /> Load Quiz from Text
            </Button>
            <Button variant="outline" onClick={() => setJsonText("")} className="border-border text-foreground hover:bg-secondary">
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
