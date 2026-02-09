import { useState, useRef } from "react";
import { Copy, Trash2, Play } from "lucide-react";
import { QuizData } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface UploadSectionProps {
  onQuizStart: (data: QuizData) => void;
}

const SAMPLE_JSON = {
  data: [
    {
      question: "What is CPU?",
      options: [
        "Central Processing Unit",
        "Computer Personal Unit",
        "Central Process Utility",
        "Central Program Unit"
      ],
      correct_answer: "Central Processing Unit"
    }
  ]
};

export function UploadSection({ onQuizStart }: UploadSectionProps) {
  const [jsonText, setJsonText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    if (!file.type.includes("json") && !file.name.endsWith(".json")) {
      toast({
        title: "Error",
        description: "Please upload a JSON file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        setJsonText(content);
        validateAndStart(parsed);
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid JSON file. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive"
      });
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const handleLoadQuiz = () => {
    try {
      if (!jsonText.trim()) {
        toast({
          title: "Error",
          description: "Please paste JSON or upload a file",
          variant: "destructive"
        });
        return;
      }
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
        const isValid = data.data.every((q: any) => q.question && q.options && q.correct_answer);
        if (isValid) {
            onQuizStart(data as QuizData);
        } else {
            toast({ title: "Invalid Data", description: "Each question needs: question, options (array), and correct_answer", variant: "destructive" });
        }
    } else {
        toast({ title: "Invalid Format", description: "JSON must have a 'data' array at root level", variant: "destructive" });
    }
  };

  const handleCopySample = () => {
    const sampleString = JSON.stringify(SAMPLE_JSON, null, 2);
    navigator.clipboard.writeText(sampleString).then(() => {
      setJsonText(sampleString);
      toast({
        title: "Sample Loaded!",
        description: "Sample JSON loaded into the editor",
      });
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="bg-card rounded-xl md:rounded-2xl shadow-sm border border-border/50 overflow-hidden mb-4 md:mb-5">
      <div className="p-4 md:p-6 lg:p-10">
        {/* Unified Input Area - File Drop + Text */}
        <div className="mb-6 md:mb-8">
          <h3 className="text-foreground font-medium text-base md:text-lg mb-3 md:mb-4">📝 Enter Your Quiz Data</h3>
          
          {/* File Drop Zone */}
          <div 
            className={`border-2 md:border-3 border-dashed rounded-lg md:rounded-xl p-4 md:p-8 mb-3 md:mb-4 cursor-pointer transition-all duration-300 text-center group ${
              isDragging
                ? "border-primary bg-primary/10 dark:bg-primary/5"
                : "border-border bg-secondary/20 hover:bg-secondary/40 hover:border-primary"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className={`text-2xl md:text-3xl mb-2 transition-transform duration-300 ${isDragging ? "scale-110" : "group-hover:scale-110"}`}>📁</div>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">
              {isDragging ? "Drop your JSON file here" : "Drag JSON file here or click to browse"}
            </p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json" 
              onChange={handleFileChange}
              data-testid="input-file-upload"
            />
          </div>

          {/* Text Input */}
          <Textarea 
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="w-full min-h-[200px] md:min-h-[250px] p-3 md:p-4 border-2 border-border rounded-lg font-mono text-xs md:text-sm bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-primary transition-all"
            placeholder='Paste JSON here or drag & drop a file above...'
            data-testid="textarea-json-input"
          />

          {/* Action Buttons */}
          <div className="mt-3 md:mt-4 flex justify-center gap-2 md:gap-3 flex-wrap">
            <Button onClick={handleLoadQuiz} className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm md:text-base" data-testid="button-load-quiz">
              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Start Quiz
            </Button>
            <Button 
              onClick={handleCopySample}
              variant="outline" 
              className="border-border text-foreground hover:bg-secondary text-sm md:text-base"
              data-testid="button-copy-sample"
            >
              <Copy className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Load Sample
            </Button>
            <Button variant="outline" onClick={() => setJsonText("")} className="border-border text-foreground hover:bg-secondary text-sm md:text-base" data-testid="button-clear">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" /> Clear
            </Button>
          </div>
        </div>

        {/* Sample JSON Format Display */}
        <div className="pt-6 md:pt-8 border-t border-border">
          <h3 className="text-foreground font-medium text-base md:text-lg mb-3 md:mb-4">📋 JSON Format:</h3>
          <div className="bg-background rounded-lg border border-border/50 overflow-hidden">
            <pre className="p-3 md:p-4 overflow-x-auto text-xs text-muted-foreground">
              <code>{JSON.stringify(SAMPLE_JSON, null, 2)}</code>
            </pre>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mt-2 md:mt-3">
            <strong>Required:</strong> <code className="bg-secondary px-1 md:px-1.5 py-0.5 rounded text-xs">question</code>, <code className="bg-secondary px-1 md:px-1.5 py-0.5 rounded text-xs">options</code> (array), <code className="bg-secondary px-1 md:px-1.5 py-0.5 rounded text-xs">correct_answer</code>
          </p>
        </div>
      </div>
    </div>
  );
}
