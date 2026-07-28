import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { MedLinkProvider } from "./context/MedLinkContext";
import { ToastProvider } from "./context/ToastContext";
import "../style.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MedLinkProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </MedLinkProvider>
  </StrictMode>
);
