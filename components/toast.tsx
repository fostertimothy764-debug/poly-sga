"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";

export type ToastVariant = "success" | "error";

export type ToastState = {
  message: string;
  variant: ToastVariant;
  id: number;
} | null;

/** Drop this in a client component to get a show() helper + the state to pass to <Toast /> */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);

  function show(message: string, variant: ToastVariant = "success") {
    const id = Date.now();
    setToast({ message, variant, id });
  }

  function dismiss() {
    setToast(null);
  }

  return { toast, show, dismiss };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isOk = toast.variant === "success";

  return (
    <div
      key={toast.id}
      className={`fixed bottom-20 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-slide-up max-w-xs ${
        isOk
          ? "bg-white border-green-200 text-green-800"
          : "bg-white border-red-200 text-red-700"
      }`}
    >
      <span
        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
          isOk ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        }`}
      >
        {isOk ? <Check size={13} /> : <AlertCircle size={13} />}
      </span>
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="text-ink-400 hover:text-ink-700 flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
