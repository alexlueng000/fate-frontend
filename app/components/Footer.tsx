'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] py-8 px-4 mt-auto">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Copyright + 备案号 */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
          <span className="text-[var(--color-text-secondary)] text-sm">
            © 2026 广州乐与学文化旅游有限公司 All copyright reserved.
          </span>
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

        {/* Right: Links */}
        <nav className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
          <Link href="/contact" className="hover:text-[var(--color-gold)] transition-colors">
            联系我们
          </Link>
          <Link href="/pricing" className="hover:text-[var(--color-gold)] transition-colors">
            会员服务
          </Link>
          <Link href="/privacy" className="hover:text-[var(--color-gold)] transition-colors">
            隐私政策
          </Link>
          <Link href="/terms" className="hover:text-[var(--color-gold)] transition-colors">
            使用条款
          </Link>
        </nav>
      </div>
    </footer>
  );
}
