import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize dark mode immediately by setting class on html element
const htmlElement = document.documentElement;
const storedTheme = localStorage.getItem("quiz-master-theme") || "dark";
htmlElement.classList.remove("light", "dark");
htmlElement.classList.add(storedTheme);

createRoot(document.getElementById("root")!).render(<App />);
