'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* <Image
            src="/yifan_logo.png"
            alt="易凡文化"
            width={32}
            height={32}
            className="rounded-lg"
          /> */}
          <span className="text-[var(--color-text-secondary)] text-sm">
            © 2026 广州乐与学文化旅游有限公司 All copyright reserved.
          </span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
          <Link href="/about" className="hover:text-[var(--color-gold)] transition-colors">
            关于我们
          </Link>
          <Link href="/privacy" className="hover:text-[var(--color-gold)] transition-colors">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-[var(--color-gold)] transition-colors">
            使用条款
          </Link>
          <Link href="/contact" className="hover:text-[var(--color-gold)] transition-colors">
            联系我们
          </Link>
        </nav>
      </div>
    </footer>
  );
}
