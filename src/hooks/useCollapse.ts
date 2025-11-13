/* eslint-env browser */
/* global HTMLDivElement */
import { useEffect, useLayoutEffect, useRef } from "react";

export function useCollapse(open: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      const height = el.scrollHeight;
      el.style.maxHeight = `${height}px`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.pointerEvents = "auto";
    } else {
      el.style.maxHeight = "0px";
      el.style.opacity = "0";
      el.style.transform = "translateY(-0.5rem)";
      el.style.pointerEvents = "none";
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    const ResizeObs =
      typeof window !== "undefined" && "ResizeObserver" in window ? window.ResizeObserver : undefined;

    if (!el || !open || !ResizeObs) {
      return;
    }

    const observer = new ResizeObs(() => {
      const node = ref.current;
      if (!node) return;
      node.style.maxHeight = `${node.scrollHeight}px`;
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [open]);

  return ref;
}
