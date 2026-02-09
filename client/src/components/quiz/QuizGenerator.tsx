import { useState, useRef } from "react";
import { Sparkles, Upload, Loader, X } from "lucide-react";
import { QuizData, Question } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuizGeneratorProps {
  onGeneratedQuiz: (data: QuizData) => void;
}

type GeneratorType = "prompt" | "image" | "pdf" | null;

export function QuizGenerator({ onGeneratedQuiz }: QuizGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [generatorType, setGeneratorType] = useState<GeneratorType>(null);
  const [prompt, setPrompt] = useState("");
  const [numQuestions, setNumQuestions] = useState("5");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 20MB",
        variant: "destructive",
      });
      return;
    }

    if (generatorType === "image" && !file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (generatorType === "pdf" && file.type !== "application/pdf") {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
  };

  const generateQuizFromPrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic or prompt",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(Number(numQuestions)) || Number(numQuestions) < 1 || Number(numQuestions) > 50) {
      toast({
        title: "Error",
        description: "Number of questions must be between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Call the local Express API endpoint
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "prompt",
          prompt,
          numQuestions: Number(numQuestions),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", response.status, errorData);
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response format
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from API");
      }
      
      onGeneratedQuiz(data);
      setOpen(false);
      resetForm();

      toast({
        title: "Success!",
        description: `Generated ${data.data.length} questions`,
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error 
            ? error.message 
            : "Failed to generate quiz. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateQuizFromFile = async () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please upload a file",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(Number(numQuestions)) || Number(numQuestions) < 1 || Number(numQuestions) > 50) {
      toast({
        title: "Error",
        description: "Number of questions must be between 1 and 50",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("type", generatorType || "");
      formData.append("numQuestions", numQuestions);

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("API Error:", response.status, errorData);
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response format
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("Invalid response format from API");
      }
      
      onGeneratedQuiz(data);
      setOpen(false);
      resetForm();

      toast({
        title: "Success!",
        description: `Generated ${data.data.length} questions`,
      });
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error 
            ? error.message 
            : "Failed to generate quiz. Please check your API configuration.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setGeneratorType(null);
    setPrompt("");
    setNumQuestions("5");
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    setOpen(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Quiz with AI
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Quiz Generator
          </DialogTitle>
          <DialogDescription>
            Generate quiz questions from prompts, images, or PDFs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Type Selection */}
          {!generatorType ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                onClick={() => setGeneratorType("prompt")}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center hover:bg-purple-50 dark:hover:bg-purple-950"
              >
                <span className="text-2xl mb-2">💬</span>
                <span className="font-semibold">From Prompt</span>
                <span className="text-xs text-muted-foreground">
                  Enter a topic
                </span>
              </Button>

              <Button
                onClick={() => setGeneratorType("image")}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-950"
              >
                <span className="text-2xl mb-2">🖼️</span>
                <span className="font-semibold">From Image</span>
                <span className="text-xs text-muted-foreground">
                  Upload image
                </span>
              </Button>

              <Button
                onClick={() => setGeneratorType("pdf")}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center hover:bg-red-50 dark:hover:bg-red-950"
              >
                <span className="text-2xl mb-2">📄</span>
                <span className="font-semibold">From PDF</span>
                <span className="text-xs text-muted-foreground">
                  Upload PDF
                </span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back Button */}
              <Button
                onClick={() => setGeneratorType(null)}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                ← Back
              </Button>

              {/* Number of Questions */}
              <div>
                <label className="text-sm font-medium block mb-2">
                  Number of Questions
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Between 1 and 50 questions
                </p>
              </div>

              {/* Prompt Input */}
              {generatorType === "prompt" && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Topic or Prompt
                  </label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="E.g., 'JavaScript ES6 features', 'Biology photosynthesis', 'World capitals'"
                    className="min-h-24"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific for better results. Include details like level
                    (beginner/advanced)
                  </p>
                </div>
              )}

              {/* File Upload */}
              {(generatorType === "image" || generatorType === "pdf") && (
                <div>
                  <label className="text-sm font-medium block mb-2">
                    {generatorType === "image" ? "Select Image" : "Select PDF"}
                  </label>

                  {uploadedFile ? (
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {generatorType === "image" ? "🖼️" : "📄"}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setUploadedFile(null)}
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {generatorType === "image"
                          ? "PNG, JPG, GIF up to 20MB"
                          : "PDF up to 20MB"}
                      </p>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={
                      generatorType === "image" ? "image/*" : "application/pdf"
                    }
                    className="hidden"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={
                  generatorType === "prompt"
                    ? generateQuizFromPrompt
                    : generateQuizFromFile
                }
                disabled={
                  isLoading ||
                  (generatorType === "prompt" && !prompt.trim()) ||
                  (generatorType !== "prompt" && !uploadedFile)
                }
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Quiz
                  </>
                )}
              </Button>

              {/* Info Box */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  <strong>Note:</strong> This feature requires an API key. See
                  setup guide for configuration.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <Button
          onClick={handleClose}
          variant="outline"
          className="absolute right-4 top-4"
          size="sm"
        >
          <X className="w-4 h-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
