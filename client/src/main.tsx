import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize dark mode immediately
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
