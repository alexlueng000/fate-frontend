"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import MotionScene, { motionDelay } from "@/app/components/landing/MotionScene";
import styles from "@/app/components/landing/LandingMotion.module.css";

/** A fixed example, never a live request or a personalized reading. */
export default function HeroConversation() {
  const [playback, setPlayback] = useState(0);

  return (
    <section aria-label="对话示例" className={styles.conversation}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[0.6875rem] tracking-[0.1em] text-[var(--color-text-muted)]">对话示例 · 非实时解读</p>
        <button type="button" className={styles.replay} onClick={() => setPlayback((value) => value + 1)} aria-label="重播对话示例">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          重播
        </button>
      </div>
      <MotionScene key={playback}>
        <p data-reveal className={styles.question} style={motionDelay(100)}>
          为什么我总是想得很多，却迟迟不敢开始？
        </p>
        <div className={styles.reply}>
          <div className="mb-2 flex items-center gap-2 text-[0.6875rem] tracking-[0.08em] text-[var(--color-text-muted)]">
            一起理清
            <span className={styles.thinking} aria-hidden="true"><i /><i /><i /></span>
          </div>
          <p data-reveal style={motionDelay(1100)}>也许，你在意的不只是结果，还有做错之后该如何面对自己。</p>
          <p data-reveal className="mt-2" style={motionDelay(1750)}>我们可以先从最近那件让你犹豫的事开始，把担心一件件说清楚。</p>
        </div>
      </MotionScene>
    </section>
  );
}
