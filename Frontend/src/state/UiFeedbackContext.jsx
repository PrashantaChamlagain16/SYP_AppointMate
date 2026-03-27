import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const UiFeedbackContext = createContext(null);

let toastCounter = 0;

export function UiFeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const resolverRef = useRef(null);
  const timeoutRefs = useRef(new Set());

  const showMessage = ({
    type = "info",
    title = "Notice",
    message = "",
    duration = 5000,
  }) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    const safeDuration = Math.min(5000, Math.max(800, Number(duration) || 5000));
    const timeoutId = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timeoutRefs.current.delete(timeoutId);
    }, safeDuration);
    timeoutRefs.current.add(timeoutId);
  };

  useEffect(
    () => () => {
      timeoutRefs.current.forEach((id) => clearTimeout(id));
      timeoutRefs.current.clear();
    },
    [],
  );

  const showConfirm = ({
    title = "Please Confirm",
    message = "Are you sure you want to continue?",
    confirmText = "Confirm",
    cancelText = "Cancel",
  }) =>
    new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmDialog({ title, message, confirmText, cancelText });
    });

  const closeConfirm = (result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setConfirmDialog(null);
  };

  const value = useMemo(
    () => ({
      showMessage,
      showConfirm,
    }),
    [],
  );

  return (
    <UiFeedbackContext.Provider value={value}>
      {children}

      <div className="feedback-panel">
        {toasts.map((toast) => (
          <article key={toast.id} className={`feedback-toast ${toast.type}`}>
            <strong>{toast.title}</strong>
            {toast.message && <p>{toast.message}</p>}
          </article>
        ))}
      </div>

      {confirmDialog && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="confirm-actions">
              <button className="ghost-btn" onClick={() => closeConfirm(false)}>
                {confirmDialog.cancelText}
              </button>
              <button className="primary-btn" onClick={() => closeConfirm(true)}>
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiFeedbackContext.Provider>
  );
}

export function useUiFeedback() {
  const ctx = useContext(UiFeedbackContext);
  if (!ctx) throw new Error("useUiFeedback must be used within UiFeedbackProvider");
  return ctx;
}
