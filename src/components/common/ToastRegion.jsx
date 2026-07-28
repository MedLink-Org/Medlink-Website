import { CircleAlert, CircleCheck, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function ToastRegion() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="toast-region" aria-live="polite" aria-atomic="true">
      {toasts.map(toast => {
        const Icon = toast.type === "error" ? CircleAlert : CircleCheck;
        return (
          <div className={`toast ${toast.type === "error" ? "error" : ""}`} key={toast.id}>
            <span><Icon /></span>
            <div>
              <strong>{toast.title}</strong>
              <p>{toast.message}</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)}>
              <X />
            </button>
          </div>
        );
      })}
    </div>
  );
}
