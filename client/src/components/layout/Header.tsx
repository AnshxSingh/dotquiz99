import { useEffect, useState } from "react";
import { initializeVisitorCounter } from "@/lib/visitor-counter";

export function Header() {
  const [visitorCount, setVisitorCount] = useState(0);

  useEffect(() => {
    // Initialize counter and get the current count
    const count = initializeVisitorCounter();
    setVisitorCount(count);
  }, []);

  return (
    <div className="relative text-center mb-8 md:mb-10 p-4 md:p-8 bg-card rounded-xl md:rounded-2xl shadow-sm border border-border/50">
      {/* Visitor Counter - Top Right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm">
        <span className="text-base md:text-lg leading-none">👁</span>
        <span className="text-sm md:text-base font-bold text-blue-300">
          {visitorCount}
        </span>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold mb-2 md:mb-3 text-foreground">📚 DotQuiz</h1>
      <p className="text-muted-foreground text-sm md:text-base">
        Upload your JSON quiz file or paste JSON text to start
      </p>
    </div>
  );
}
