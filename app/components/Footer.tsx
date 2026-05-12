'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 w-full md:justify-between">
          <div className="flex items-center gap-3">
            {/* <Image
              src="/yifan_logo.png"
              alt="易凡文化"
              width={32}
              height={32}
              className="rounded-lg"
            /> */}
            <span className="text-[var(--color-text-secondary)] text-sm text-center md:text-left">
              © 2026 广州乐与学文化旅游有限公司 All copyright reserved.
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <Link href="/knowledge" className="hover:text-[var(--color-gold)] transition-colors">
              命理学堂
            </Link>
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

        {/* 备案号 */}
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Image
            src="/beian.png"
            alt="备案图标"
            width={16}
            height={16}
            className="opacity-80"
          />
          <a
            href="https://beian.miit.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-gold)] transition-colors"
          >
            粤ICP备2026028177号-1
          </a>
        </div>
      </div>
    </footer>
  );
}
