import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import "./Toast.css";

const ToastContext = createContext(null);

const TOAST_DURATION = 3500;

function createToastId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    (type = "info", message = "") => {
      if (!message) {
        return null;
      }

      /*
       * Create the ID BEFORE updating state so the timeout
       * always receives the correct toast ID.
       */
      const id = createToastId();

      setToasts((current) => {
        /*
         * Prevent duplicate identical messages.
         */
        const alreadyVisible = current.some(
          (toast) =>
            toast.type === type &&
            toast.message === message
        );

        if (alreadyVisible) {
          return current;
        }

        return [
          ...current,
          {
            id,
            type,
            message,
          },
        ];
      });

      /*
       * Automatically remove this exact toast.
       */
      window.setTimeout(() => {
        removeToast(id);
      }, TOAST_DURATION);

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message) => {
      return showToast(
        "success",
        message
      );
    },
    [showToast]
  );

  const error = useCallback(
    (message) => {
      return showToast(
        "error",
        message
      );
    },
    [showToast]
  );

  const warning = useCallback(
    (message) => {
      return showToast(
        "warning",
        message
      );
    },
    [showToast]
  );

  const info = useCallback(
    (message) => {
      return showToast(
        "info",
        message
      );
    },
    [showToast]
  );

  /*
   * Global toast events from services.
   */
  useEffect(() => {
    const handleGlobalToast = (event) => {
      const detail = event.detail || {};

      if (!detail.message) {
        return;
      }

      showToast(
        detail.type || "info",
        detail.message
      );
    };

    window.addEventListener(
      "resumeiq:toast",
      handleGlobalToast
    );

    return () => {
      window.removeEventListener(
        "resumeiq:toast",
        handleGlobalToast
      );
    };
  }, [showToast]);

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
    }),
    [
      toasts,
      showToast,
      success,
      error,
      warning,
      info,
      removeToast,
    ]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="resumeiq-toast-container"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`resumeiq-toast resumeiq-toast--${toast.type}`}
            role="status"
          >
            <div className="resumeiq-toast__content">
              <span className="resumeiq-toast__indicator" />

              <p className="resumeiq-toast__message">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              className="resumeiq-toast__close"
              onClick={() =>
                removeToast(toast.id)
              }
              aria-label="Close notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(
    ToastContext
  );

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider."
    );
  }

  return context;
}