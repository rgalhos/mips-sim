import { ThemeProvider } from "@/components/theme-provider.tsx";
import { TooltipProvider } from "@/components/ui/tooltip.tsx";
import { EditorProvider } from "@/lib/contexts/editor.context.tsx";
import { SimulatorProvider } from "@/lib/contexts/simulator.context.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <EditorProvider>
        <SimulatorProvider>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </SimulatorProvider>
      </EditorProvider>
    </ThemeProvider>
  </StrictMode>
);
