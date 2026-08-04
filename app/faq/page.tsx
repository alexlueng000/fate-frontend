"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Mail } from "lucide-react";
import Footer from "@/app/components/Footer";

const FAQ_GROUPS = [
  {
    label: "使用前",
    title: "开始之前",
    items: [
      {
        question: "我不懂八字，可以用吗？",
        answer:
          "可以。你不需要先学习天干地支、五行、十神这些术语，直接用自然语言提问即可。系统会尽量把传统文化概念翻译成更容易理解的表达，帮助你先看懂内容，再决定哪些部分对自己有参考价值。",
      },
      {
        question: "易凡文化适合什么样的问题？",
        answer:
          "更适合用来整理自我认知、情绪节奏、关系模式和具体选择中的思路。例如：最近为什么容易焦虑、适合怎样的工作方式、某个选择可以从哪些角度比较。它不适合替你做重大决定，也不应该被当作唯一依据。",
      },
      {
        question: "第一次使用需要准备什么？",
        answer:
          "如果你要生成八字文化分析，需要准备出生日期、出生时间和出生地点。时间越准确，排盘结果越稳定；如果暂时不确定具体时间，也可以先用大致时段体验，再根据需要补充修正。",
      },
    ],
  },
  {
    label: "文化分析",
    title: "关于八字、六爻与 AI 解读",
    items: [
      {
        question: "什么是八字？",
        answer:
          "八字又称四柱，由出生年、月、日、时对应的天干地支组成。传统文化会通过五行、十神、格局等概念观察一个人的特质、节奏与关系结构。我们会尽量用白话解释这些概念，避免让术语成为理解门槛。",
      },
      {
        question: "解读结果准确吗？",
        answer:
          "平台内容基于传统文化资料与 AI 生成能力整理而成，只能作为参考视角。它可以帮助你发现一些值得思考的线索，但不能保证结果，也不能替代你的经验、理性判断和现实信息。",
      },
      {
        question: "为什么需要精确的出生时间？",
        answer:
          "出生时间会影响八字中的时柱。时柱变化后，部分分析内容也可能随之变化。精确时间有助于减少排盘误差；如果你不确定具体出生时间，可以先记录为大致时段，并在后续分析中保留这种不确定性。",
      },
      {
        question: "出生地点有什么作用？",
        answer:
          "出生地点主要用于辅助计算真太阳时。不同地区与北京时间可能存在偏差，地点信息可以帮助系统更细致地处理出生时辰，让排盘结果更接近传统计算方式。",
      },
      {
        question: "支持哪些日历类型？",
        answer:
          "目前支持公历和农历输入。你可以按照自己知道的生日类型填写，系统会进行相应转换和计算。如果只知道农历生日，选择农历输入即可。",
      },
    ],
  },
  {
    label: "账号额度",
    title: "注册、体验与隐私",
    items: [
      {
        question: "如何注册账号？",
        answer:
          "点击页面右上角的注册按钮，按提示填写邮箱、用户名和密码即可完成注册。注册后可以保存命盘、查看历史记录，并继续围绕同一份分析进行多轮提问。",
      },
      {
        question: "免费体验包含什么？",
        answer:
          "新注册账户可获得 10 次八字 AI 解读和 10 次六爻 AI 解卦额度。免费额度用完后，可以前往套餐与会员页面查看可选方案。",
      },
      {
        question: "我的隐私会泄露吗？",
        answer:
          "我们重视个人资料和使用记录的保护，不会出售你的个人数据。你可以在账户相关页面管理自己的资料与记录；涉及出生信息、对话内容等敏感信息时，也建议只填写完成服务所需的必要内容。",
      },
      {
        question: "数据会保存多久？",
        answer:
          "命盘数据和对话记录会用于支持历史查看与连续对话，直到你主动删除或注销账户。删除后，相关内容将按平台规则处理。",
      },
      {
        question: "忘记密码怎么办？",
        answer:
          "在登录页面点击忘记密码，输入注册邮箱后，按邮件中的指引重置密码。如果没有收到邮件，可以检查垃圾邮件箱，或稍后重试。",
      },
    ],
  },
  {
    label: "技术支持",
    title: "设备、网络与反馈",
    items: [
      {
        question: "支持哪些设备？",
        answer:
          "你可以通过电脑、手机和平板浏览器访问，也可以使用对应的小程序端。不同设备上的体验会尽量保持一致，方便你随时查看记录和继续提问。",
      },
      {
        question: "页面加载很慢怎么办？",
        answer:
          "可以先检查网络连接，尝试刷新页面，或清除浏览器缓存后重试。如果问题持续存在，请记录出现问题的页面、时间和设备信息，再联系我们排查。",
      },
      {
        question: "AI 回复中断了怎么办？",
        answer:
          "回复中断通常与网络波动或服务响应有关。你可以尝试重新发送问题，或刷新页面后继续对话。已经保存的历史记录不会因为单次回复中断而自动丢失。",
      },
    ],
  },
] as const;

type FaqKey = `${number}-${number}`;

export default function FaqPage() {
  const [openFaq, setOpenFaq] = useState<FaqKey | null>("0-0");

  return (
    <main className="min-h-screen pt-20" style={{ background: "var(--color-bg)" }}>
      <section className="px-6 pt-16 pb-14 md:pt-24 md:pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-5">
            <p className="text-[0.75rem] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              FAQ
            </p>
            <h1
              className="max-w-3xl text-[2rem] leading-[1.22] font-medium text-[var(--color-text-primary)] md:text-[3rem] lg:text-[3.5rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              一些使用前，
              <span className="block text-[var(--color-primary)]">会自然想问的问题。</span>
            </h1>
          </div>

          <div className="border-t border-[var(--color-border)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            <p className="text-[1rem] leading-[1.8] text-[var(--color-text-body)] md:text-[1.0625rem]">
              这里整理了关于传统文化分析、AI 解读、账号额度、隐私边界和技术问题的说明。我们尽量把规则讲清楚，也把平台不能替你完成的部分讲清楚。
            </p>
            <p className="mt-5 text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)]">
              如果你带着具体问题而来，可以先读使用前与文化分析两组；如果已经注册使用，账号额度和技术支持会更快帮你定位问题。
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 md:pb-24">
        <div className="mx-auto max-w-6xl space-y-12">
          {FAQ_GROUPS.map((group, groupIndex) => (
            <section
              key={group.label}
              className="grid gap-6 border-t border-[var(--color-border)] pt-8 lg:grid-cols-[0.32fr_1fr]"
            >
              <header className="space-y-3">
                <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                  {group.label}
                </p>
                <h2
                  className="text-[1.375rem] leading-[1.35] font-medium text-[var(--color-text-primary)] md:text-[1.625rem]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {group.title}
                </h2>
              </header>

              <div className="border border-[var(--color-border)] bg-[var(--color-bg-card)]">
                {group.items.map((faq, itemIndex) => {
                  const key: FaqKey = `${groupIndex}-${itemIndex}`;
                  const isOpen = openFaq === key;

                  return (
                    <div key={faq.question} className="border-t border-[var(--color-border)] first:border-t-0">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : key)}
                        className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-[var(--color-bg-hover)] focus-visible:bg-[var(--color-bg-hover)] focus-visible:outline-none md:px-6"
                        aria-expanded={isOpen}
                      >
                        <span className="font-mono text-[0.75rem] text-[var(--color-text-hint)] tabular-nums">
                          {String(itemIndex + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[1rem] font-medium text-[var(--color-text-primary)]">
                          {faq.question}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${isOpen ? "rotate-180 text-[var(--color-primary)]" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                      {isOpen && (
                        <div className="grid grid-cols-[auto_1fr_auto] gap-4 px-5 pb-6 text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)] animate-fade-in md:px-6">
                          <span className="w-[1.75rem]" aria-hidden="true" />
                          <p>{faq.answer}</p>
                          <span className="w-5" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="px-6 py-16 md:py-20" style={{ background: "var(--color-bg-alt)" }}>
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1fr] lg:items-center">
          <div className="space-y-3">
            <p className="text-[0.6875rem] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Still Curious
            </p>
            <h2
              className="text-[1.75rem] leading-[1.3] font-medium text-[var(--color-text-primary)] md:text-[2.25rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              还有具体问题？
            </h2>
            <p className="max-w-xl text-[0.9375rem] leading-[1.8] text-[var(--color-text-secondary)]">
              如果你的问题和个人资料、订单、额度或使用异常有关，可以直接联系我们处理。
            </p>
          </div>

          <div className="space-y-5 lg:justify-self-end">
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-primary group">
                联系我们
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link href="/register" className="btn btn-secondary group">
                开始个人分析
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
            <a
              href="mailto:windy46825@163.com"
              className="flex items-center gap-3 text-[0.875rem] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>客服邮箱：windy46825@163.com</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
