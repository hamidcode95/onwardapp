import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n/config";
import "vazirmatn/Vazirmatn-Variable-font-face.css";

createRoot(document.getElementById("root")!).render(<App />);
