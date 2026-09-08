'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Send, Loader2, Check, CheckCircle, Bug, Lightbulb, CircleHelp, MessageSquareText, Mail } from 'lucide-react';
import Footer from '@/app/components/Footer';
import { getAuthToken } from '@/app/lib/auth';
import { api, postJSON } from '@/app/lib/api';
import styles from './feedback.module.css';

const FEEDBACK_TYPES = [
  { value: 'bug', label: '问题反馈', Icon: Bug, hint: '在哪个页面遇到了问题？当时进行了什么操作，出现了什么情况？' },
  { value: 'feature', label: '功能建议', Icon: Lightbulb, hint: '你希望增加或改进什么功能？它能帮你解决什么问题？' },
  { value: 'question', label: '使用咨询', Icon: CircleHelp, hint: '哪个功能或操作让你感到困惑？告诉我们你想完成的事情。' },
  { value: 'other', label: '其他', Icon: MessageSquareText, hint: '还有什么想告诉我们？欢迎写下你的体验和想法。' },
] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number]['value'];

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const length = content.trim().length;
  const canSubmit = length >= 10 && content.length <= 1000 && !submitting;
  const selectedType = FEEDBACK_TYPES.find((type) => type.value === feedbackType)!;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit || inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await postJSON<{ id: number }>(api('/feedback'), {
        type: feedbackType,
        content: content.trim(),
        contact: contact.trim() || null,
      }, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      setFeedbackId(response.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '提交失败，请稍后重试');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <Link href="/dashboard" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />返回命理首页</Link>
        {feedbackId !== null ? (
          <section className={styles.success} aria-labelledby="feedback-success-title">
            <CheckCircle size={40} strokeWidth={1.4} className={styles.successIcon} aria-hidden="true" />
            <div role="status">
              <h1 id="feedback-success-title">你的反馈，已收到</h1>
              <p>感谢你告诉我们使用中的感受。我们会认真阅读这份反馈。</p>
              <p className={styles.receipt}>反馈编号 <strong>#{feedbackId}</strong></p>
            </div>
            <div className={styles.successActions}>
              <Link href="/dashboard" className={styles.primary}>返回命理首页<ArrowRight size={17} aria-hidden="true" /></Link>
              <button type="button" className={styles.secondary} onClick={() => {
                setFeedbackId(null); setContent(''); setContact(''); setError(null);
              }}>再写一条反馈</button>
            </div>
          </section>
        ) : (
          <div className={styles.layout}>
            <header className={styles.intro}>
              <p className={styles.eyebrow}><MessageSquareText size={18} strokeWidth={1.5} aria-hidden="true" />我们在听</p>
              <h1>意见反馈</h1>
              <p className={styles.lead}>哪里不顺手，<br />或许可以更好？</p>
              <p className={styles.description}>遇到的问题、期待的功能，或使用中的一点感受，都可以在这里告诉我们。</p>
              <div className={styles.contact}>
                <span>也可以通过邮箱联系我们</span>
                <a href="mailto:windy46825@163.com"><Mail size={16} aria-hidden="true" />windy46825@163.com</a>
              </div>
            </header>
            <form onSubmit={handleSubmit} className={styles.form} aria-busy={submitting}>
              <fieldset className={styles.types} disabled={submitting}>
                <legend>你想反馈什么？</legend>
                <div className={styles.typeGrid}>
                  {FEEDBACK_TYPES.map(({ value, label, Icon }) => (
                    <label className={styles.typeOption} key={value}>
                      <input type="radio" name="feedback-type" value={value} checked={feedbackType === value} onChange={() => setFeedbackType(value)} />
                      <span className={styles.typeLabel}><Icon size={18} strokeWidth={1.5} aria-hidden="true" /><span>{label}</span><Check size={14} className={styles.selectedCheck} aria-hidden="true" /></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={styles.field}>
                <label htmlFor="feedback-content">具体说说<span className={styles.required}>必填</span></label>
                <p id="feedback-guidance" className={styles.hint}>{selectedType.hint}</p>
                <textarea id="feedback-content" name="content" value={content} disabled={submitting} required maxLength={1000} rows={7}
                  aria-describedby="feedback-guidance feedback-count" placeholder="从你遇到的情况开始说起…"
                  onChange={(event) => setContent(event.target.value)} />
                <div id="feedback-count" className={styles.counter}>
                  <span>{length > 0 && length < 10 ? `再写 ${10 - length} 个字，就可以提交` : '至少 10 个字，最多 1000 字'}</span>
                  <span>{content.length} / 1000</span>
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="feedback-contact">联系方式<span className={styles.optional}>选填</span></label>
                <input id="feedback-contact" name="contact" type="text" value={contact} disabled={submitting}
                  aria-describedby="contact-help" placeholder="邮箱或手机号" onChange={(event) => setContact(event.target.value)} />
                <p id="contact-help" className={styles.hint}>如果希望收到回复，请留下方便联系的方式。</p>
              </div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.submitRow}>
                <p>谢谢你，帮助我们把体验做得更好。</p>
                <button type="submit" className={styles.primary} disabled={!canSubmit}>
                  {submitting ? <Loader2 size={17} className={styles.spinner} aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
                  {submitting ? '正在提交…' : '提交反馈'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
