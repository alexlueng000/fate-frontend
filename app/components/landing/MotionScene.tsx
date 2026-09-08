"use client";

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import styles from "@/app/components/landing/LandingMotion.module.css";

export function motionDelay(delay: number): CSSProperties {
  return { "--motion-delay": `${delay}ms` } as CSSProperties;
}

/** Enhance visible server-rendered content with a single viewport-triggered sequence. */
export default function MotionScene({ children, className = "" }: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;

    const showImmediately = () => {
      if (!preference.matches) return;
      observer?.disconnect();
      node.dataset.motion = "static";
    };

    if (!preference.matches && "IntersectionObserver" in window) {
      node.dataset.motion = "pending";
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        node.dataset.motion = "running";
        observer?.disconnect();
      }, { threshold: 0.2 });
      observer.observe(node);
    }

    // Keyboard users never have to wait for content to become visible.
    const revealOnFocus = () => {
      observer?.disconnect();
      node.dataset.motion = "static";
    };
    node.addEventListener("focusin", revealOnFocus);
    preference.addEventListener("change", showImmediately);
    return () => {
      observer?.disconnect();
      preference.removeEventListener("change", showImmediately);
      node.removeEventListener("focusin", revealOnFocus);
      node.dataset.motion = "static";
    };
  }, []);

  return <div ref={ref} data-motion="static" className={`${styles.scene} ${className}`}>{children}</div>;
}
