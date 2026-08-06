'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

const DECLARATION_ITEMS = [
  {
    title: '服务性质',
    body: '易凡文化提供的是基于中国传统文化资料与 AI 技术生成的内容整理服务，包含八字文化分析、六爻文化参考、情绪记录等功能。相关内容仅用于文化学习、娱乐体验与个人思考参考，不构成医疗、法律、投资、心理咨询、婚恋决策或其他专业建议。',
  },
  {
    title: '内容边界',
    body: '平台不会承诺预测结果，也不以“注定”“必然”等方式替你作出人生判断。传统文化分析可以帮助你从另一种角度理解性格、关系、节奏和选择，但最终判断应结合现实信息、专业意见和你自己的理性决定。',
  },
  {
    title: '结果差异',
    body: 'AI 生成内容会受到出生信息完整度、输入问题、资料来源、模型理解和表达方式等因素影响。相同主题在不同时间或不同提问方式下，可能出现侧重点不同的解读，请把它视为辅助阅读材料，而不是唯一依据。',
  },
  {
    title: '敏感事项',
    body: '如果你正在面对疾病、严重心理压力、财务风险、法律纠纷、婚姻家庭冲突或其他重大问题，请优先咨询对应领域的专业人士。平台内容不能替代医生、律师、心理咨询师、财务顾问等专业服务。',
  },
  {
    title: '隐私保护',
    body: '为了完成排盘、生成分析和保存记录，我们可能需要处理你的出生信息、提问内容和账号信息。我们会按照隐私政策采取必要的安全措施保护数据，并提供资料管理和删除入口。',
  },
  {
    title: '使用责任',
    body: '点击同意并继续使用，即表示你已理解本服务的参考性质、内容限制与个人使用责任，并同意遵守服务条款和隐私政策。',
  },
] as const;

export function DisclaimerModal({ open, onAccept }: DisclaimerModalProps) {
  // 禁用 body 滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* 背景遮罩 - 不可点击关闭 */}
      <div
        className="absolute inset-0 backdrop-blur-[2px]"
        style={{ background: 'rgba(42, 37, 34, 0.66)' }}
      />

      {/* 弹窗内容 */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        className="relative flex h-[78dvh] max-h-[680px] min-h-0 w-full max-w-3xl animate-scale-in flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-lg)] sm:h-auto sm:max-h-[min(760px,calc(100dvh-3rem))]"
      >
        {/* 标题 */}
        <div className="flex-shrink-0 border-b border-[var(--color-border)] px-4 py-3 sm:px-8 sm:py-7">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-bg)] sm:h-9 sm:w-9">
              <AlertTriangle className="h-4 w-4 text-[var(--color-primary)] sm:h-5 sm:w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 space-y-1.5 sm:space-y-2">
              <p className="hidden text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)] sm:block">
                Before You Continue
              </p>
              <h2
                id="disclaimer-title"
                className="text-[1.375rem] font-medium leading-[1.25] text-[var(--color-text-primary)] sm:text-[1.875rem]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                服务声明
              </h2>
              <p className="max-w-2xl text-[0.875rem] leading-[1.55] text-[var(--color-text-secondary)] sm:text-[0.9375rem] sm:leading-[1.75]">
                欢迎使用易凡文化。继续使用前，请先了解本服务的内容性质、适用边界和数据处理方式。
              </p>
            </div>
          </div>
        </div>

        {/* 可滚动声明内容 */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-8 sm:py-6">
          <ol className="space-y-4 sm:space-y-5">
            {DECLARATION_ITEMS.map((item, index) => (
              <li
                key={item.title}
                className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0 sm:gap-x-4 sm:pt-5"
              >
                <span className="pt-1 font-mono text-[0.75rem] text-[var(--color-primary)] tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="space-y-2">
                  <h3 className="text-[1rem] font-medium text-[var(--color-text-primary)]">
                    {item.title}
                  </h3>
                  <p className="text-[0.9375rem] leading-[1.7] text-[var(--color-text-secondary)] sm:leading-[1.8]">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:mt-6 sm:p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-mist-deep)]" aria-hidden="true" />
              <p className="text-[0.875rem] leading-[1.75] text-[var(--color-text-secondary)]">
                你可以在
                <Link href="/terms" className="mx-1 text-[var(--color-primary)] underline-offset-2 hover:underline">
                  服务条款
                </Link>
                和
                <Link href="/privacy" className="mx-1 text-[var(--color-primary)] underline-offset-2 hover:underline">
                  隐私政策
                </Link>
                中查看更完整的规则说明。
              </p>
            </div>
          </div>
        </div>

        {/* 同意按钮 */}
        <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-5">
          <button
            onClick={onAccept}
            className="btn btn-primary min-h-11 w-full text-[1rem] font-medium"
          >
            我已阅读并同意
          </button>
          <p className="mt-2 text-center text-[0.75rem] leading-5 text-[var(--color-text-hint)] sm:mt-3">
            点击同意后，本声明将记录在当前浏览器中；清除浏览器数据后可能会再次提示。
          </p>
        </div>
      </div>
    </div>
  );
}
