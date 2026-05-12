"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Options = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type State =
  | { open: false }
  | (Options & { open: true; resolve: (v: boolean) => void });

export function useConfirm() {
  const [state, setState] = useState<State>({ open: false });

  const confirm = useCallback((opts: Options) => {
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        confirmLabel: "Delete",
        cancelLabel: "Cancel",
        destructive: true,
        ...opts,
        resolve,
      });
    });
  }, []);

  const close = useCallback((v: boolean) => {
    setState((s) => {
      if (s.open) s.resolve(v);
      return { open: false };
    });
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open, close]);

  const dialog =
    state.open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-poly-navyDark/55 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={() => close(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-2xl border border-ink-200 shadow-[0_24px_60px_-20px_rgba(10,35,66,0.35)] animate-slide-up p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id="confirm-title"
                className="font-display text-xl leading-snug text-ink-900 mb-2"
              >
                {state.title}
              </h2>
              {state.body && (
                <p className="text-sm text-ink-600 leading-relaxed mb-5">
                  {state.body}
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="btn-ghost"
                >
                  {state.cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={() => close(true)}
                  autoFocus
                  className={
                    state.destructive
                      ? "btn bg-poly-orangeDark text-white hover:bg-[#b13d09] active:scale-[0.98]"
                      : "btn-primary"
                  }
                >
                  {state.confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return { confirm, dialog };
}
