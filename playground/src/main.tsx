import { createRoot } from "react-dom/client";
import "@kreiseck/design/fonts.css";
import "@kreiseck/design/tokens.css";
import "./styles.css";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(<App />);
