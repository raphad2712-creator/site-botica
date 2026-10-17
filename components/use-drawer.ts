"use client";

import { useEffect, useRef } from "react";

let locks = 0;
let previousOverflow = "";
export function useDrawer(open: boolean, close: () => void) {
  const ref = useRef<HTMLElement>(null);
  const onClose = useRef(close);
  onClose.current = close;
  useEffect(() => {
    if (!open || !ref.current) return;
    const panel = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (locks++ === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(el => el.getClientRects().length);
    (focusable()[0] ?? panel).focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose.current(); }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      if (--locks === 0) document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open]);
  return ref;
}
