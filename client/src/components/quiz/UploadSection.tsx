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
      question: "What is the full form of CPU?",
      options: [
        "Central Processing Unit",
        "Central Process Utility",
        "Central Processor Unit",
        "Computer Personal Unit"
      ],
      correct_answer: "Central Processing Unit"
    },
    {
      question: "Which of the following is an operating system?",
      options: [
        "Windows",
        "Mac OS",
        "Linux",
        "All of the above"
      ],
      correct_answer: "All of the above"
    },
    {
      question: "What does HTML stand for?",
      options: [
        "Hyper Text Markup Language",
        "High Tech Modern Language",
        "Home Tool Markup Language",
        "Hyperlinks and Text Markup Language"
      ],
      correct_answer: "Hyper Text Markup Language"
    }
  ]
};

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

  const handleCopySample = () => {
    const sampleString = JSON.stringify(SAMPLE_JSON, null, 2);
    navigator.clipboard.writeText(sampleString).then(() => {
      toast({
        title: "Copied!",
        description: "Sample JSON copied to clipboard",
      });
      // Auto-fill the textarea with sample
      setJsonText(sampleString);
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    });
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
            data-testid="input-file-upload"
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
            data-testid="textarea-json-input"
          />
          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <Button onClick={handlePasteLoad} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-load-quiz">
              <Play className="w-4 h-4 mr-2" /> Load Quiz from Text
            </Button>
            <Button 
              onClick={handleCopySample}
              variant="outline" 
              className="border-border text-foreground hover:bg-secondary"
              data-testid="button-copy-sample"
            >
              <Copy className="w-4 h-4 mr-2" /> Copy Sample JSON
            </Button>
            <Button variant="outline" onClick={() => setJsonText("")} className="border-border text-foreground hover:bg-secondary" data-testid="button-clear">
              <Trash2 className="w-4 h-4 mr-2" /> Clear
            </Button>
          </div>
        </div>

        {/* Sample JSON Format Display */}
        <div className="mt-10 pt-8 border-t border-border">
          <h3 className="text-foreground font-medium text-lg mb-4">📋 JSON Format Example:</h3>
          <div className="bg-background rounded-lg border border-border/50 overflow-hidden">
            <pre className="p-6 overflow-x-auto text-xs md:text-sm text-muted-foreground">
              <code>{JSON.stringify(SAMPLE_JSON, null, 2)}</code>
            </pre>
          </div>
          <p className="text-muted-foreground text-sm mt-3">
            ✓ <strong>Required fields:</strong> <code className="bg-secondary px-2 py-1 rounded text-xs">question</code>, <code className="bg-secondary px-2 py-1 rounded text-xs">options</code> (array), <code className="bg-secondary px-2 py-1 rounded text-xs">correct_answer</code> (must match one option)
          </p>
        </div>
      </div>
    </div>
  );
}
