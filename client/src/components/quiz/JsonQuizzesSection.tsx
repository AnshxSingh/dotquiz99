import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Play, FolderOpen, Plus, Copy, Check, Search } from "lucide-react";
import { QuizData, StoredJsonQuiz } from "@/lib/quiz-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JsonQuizzesSectionProps {
  onQuizStart: (data: QuizData, quizId?: string) => void;
}

export function JsonQuizzesSection({ onQuizStart }: JsonQuizzesSectionProps) {
  const [jsonText, setJsonText] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storedQuizzes, setStoredQuizzes] = useState<StoredJsonQuiz[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletePasswordInput, setDeletePasswordInput] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load stored quizzes on mount
  useEffect(() => {
    loadStoredQuizzes();
  }, []);

  const loadStoredQuizzes = async () => {
    try {
      const response = await fetch("/api/stored-quizzes");
      if (!response.ok) throw new Error("Failed to load quizzes");
      const data = await response.json();
      setStoredQuizzes(data);
    } catch (error) {
      console.error("Error loading stored quizzes:", error);
      // Silently fail - show empty state
    }
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
        setQuizTitle(file.name.replace(/\.json$/, ""));
        toast({
          title: "Success",
          description: "JSON file loaded successfully"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Invalid JSON file. Please check the format.",
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const jsonFiles = Array.from(files).filter(f => f.name.endsWith(".json"));
    if (jsonFiles.length === 0) {
      toast({
        title: "Error",
        description: "No JSON files found in the selected folder",
        variant: "destructive"
      });
      return;
    }

    processFile(jsonFiles[0]);
    toast({
      title: "Info",
      description: `Found ${jsonFiles.length} JSON file(s). Loaded first file.`
    });
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

  const validateJSON = (data: any): { valid: boolean; message: string } => {
    if (!data.data || !Array.isArray(data.data)) {
      return { valid: false, message: "JSON must have a 'data' array at root level" };
    }

    if (data.data.length === 0) {
      return { valid: false, message: "Quiz must have at least one question" };
    }

    for (let i = 0; i < data.data.length; i++) {
      const q = data.data[i];
      if (!q.question) {
        return { valid: false, message: `Question ${i + 1}: missing 'question' field` };
      }
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return { valid: false, message: `Question ${i + 1}: must have at least 2 options` };
      }
      if (!q.correct_answer) {
        return { valid: false, message: `Question ${i + 1}: missing 'correct_answer' field` };
      }
      if (!q.options.includes(q.correct_answer)) {
        return { valid: false, message: `Question ${i + 1}: correct_answer must be one of the options` };
      }
    }

    return { valid: true, message: "" };
  };

  const handleSaveQuiz = async () => {
    if (!jsonText.trim()) {
      toast({
        title: "Error",
        description: "Please paste JSON or upload a file",
        variant: "destructive"
      });
      return;
    }

    if (!quizTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a quiz name",
        variant: "destructive"
      });
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      const validation = validateJSON(parsed);

      if (!validation.valid) {
        toast({
          title: "Invalid JSON Format",
          description: validation.message,
          variant: "destructive"
        });
        return;
      }

      setIsLoading(true);
      const response = await fetch("/api/save-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: quizTitle.trim(),
          quizData: parsed
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save quiz");
      }

      toast({
        title: "Success",
        description: `Quiz "${quizTitle}" saved to cloud`
      });

      setJsonText("");
      setQuizTitle("");
      await loadStoredQuizzes();
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save quiz",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayQuiz = (quiz: StoredJsonQuiz) => {
    const quizData: QuizData = {
      title: quiz.title,
      data: quiz.data
    };
    onQuizStart(quizData, quiz.id);
  };

  const handleDeleteQuiz = (quizId: string) => {
    setQuizToDelete(quizId);
    setDeletePasswordInput("");
    setDeleteModalOpen(true);
  };

  const confirmDeleteQuiz = async () => {
    if (deletePasswordInput !== "Ansh123") {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive"
      });
      return;
    }

    if (!quizToDelete) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/delete-quiz/${quizToDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }

      toast({
        title: "Success",
        description: "Quiz deleted successfully"
      });

      await loadStoredQuizzes();
      setDeleteModalOpen(false);
      setQuizToDelete(null);
      setDeletePasswordInput("");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJSON = (quiz: StoredJsonQuiz) => {
    const quizJSON = JSON.stringify({ data: quiz.data }, null, 2);
    navigator.clipboard.writeText(quizJSON).then(() => {
      setCopiedId(quiz.id);
      toast({
        title: "Copied!",
        description: "JSON copied to clipboard"
      });
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Upload & Paste Section */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 border-b border-border/50">
          <h2 className="text-lg md:text-xl font-bold text-foreground flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Add & Save Quiz to Cloud
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload JSON files or paste JSON text. Quizzes are saved to cloud.
          </p>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quiz Name *
            </label>
            <Input
              type="text"
              placeholder="Enter quiz name"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragging 
                ? "border-primary bg-primary/5" 
                : "border-border/50 bg-secondary/30 hover:border-primary/50"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              onChange={handleFolderChange}
              className="hidden"
              multiple
            />

            <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drag and drop JSON files here
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              or click to browse
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => folderInputRef.current?.click()}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Upload Folder
              </Button>
            </div>
          </div>

          {/* JSON Editor */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              JSON Content *
            </label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Paste JSON here or drag & drop a file above...'
              className="w-full h-48 font-mono text-xs"
            />
            <div className="flex justify-between items-start mt-2">
              <p className="text-xs text-muted-foreground">
                {jsonText && (
                  <span className="text-green-600">✓ {jsonText.split('\n').filter(l => l.trim().startsWith('"question"')).length} questions detected</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {!jsonText ? "Need JSON text" : quizTitle ? "✓ Ready to save" : "Need quiz name"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleSaveQuiz}
              disabled={isLoading || !jsonText.trim() || !quizTitle.trim()}
              className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Save to Cloud
            </Button>
            {jsonText && (
              <Button
                variant="outline"
                onClick={() => setJsonText("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stored Quizzes Section */}
      {storedQuizzes.length > 0 && (
        <div className="bg-card rounded-xl md:rounded-2xl shadow-sm border border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 md:p-6 border-b border-border/50">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Cloud Quizzes ({storedQuizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())).length})
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your quizzes saved in the cloud
            </p>
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search quizzes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="divide-y divide-border/50 max-h-96 overflow-y-auto">
            {storedQuizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())).map((quiz) => (
              <div key={quiz.id} className="p-4 md:p-6 hover:bg-secondary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground break-words">{quiz.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quiz.data.length} questions • {new Date(quiz.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <Button
                      size="sm"
                      onClick={() => handlePlayQuiz(quiz)}
                      disabled={isLoading}
                      className="whitespace-nowrap"
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyJSON(quiz)}
                      title="Copy JSON to clipboard"
                      disabled={isLoading}
                    >
                      {copiedId === quiz.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && storedQuizzes.length === 0 && jsonText === "" && (
        <div className="bg-secondary/30 rounded-xl md:rounded-2xl p-8 text-center border border-border/50">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            No quizzes saved yet. Add your first quiz using the form above.
          </p>
        </div>
      )}

      {/* Delete Password Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Enter the password to delete this quiz permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={deletePasswordInput}
              onChange={(e) => setDeletePasswordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") confirmDeleteQuiz();
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteQuiz}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
