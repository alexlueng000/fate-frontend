'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText, History, Loader2, LogOut, MessageSquare, Settings } from 'lucide-react';
import type { User } from '@/app/lib/auth';
import styles from './account.module.css';

export type AccountQuota = {
  total: number;
  used: number;
  remaining: number;
  is_unlimited: boolean;
};

type Props = {
  user: User;
  quota: AccountQuota | null;
  quotaLoading: boolean;
  quotaError: string;
  loggingOut: boolean;
  logoutError: string;
  onRetry: () => void;
  onLogout: () => void;
};

const actions = [
  { href: '/profile/edit', title: '个人档案', description: '管理出生信息与个人资料', icon: FileText },
  { href: '/history', title: '我的解读记录', description: '回顾过往解读与对话', icon: History },
  { href: '/feedback', title: '意见反馈', description: '告诉我们你的建议与遇到的问题', icon: MessageSquare },
];

export default function AccountOverview({ user, quota, quotaLoading, quotaError, loggingOut, logoutError, onRetry, onLogout }: Props) {
  const name = user.nickname || user.username || '我的账户';
  const remaining = Math.max(0, quota?.remaining ?? 0);
  const lowQuota = quota && !quota.is_unlimited && remaining <= 3;

  return (
    <div className={styles.content}>
      <header className={styles.heading}>
        <h1>我的账户</h1>
        <p>个人信息、解读额度与常用设置</p>
      </header>

      <section className={styles.overview} aria-label="账户概览">
        <div className={styles.profile}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{Array.from(name)[0].toUpperCase()}</span>
            <div className={styles.identityText}>
              <h2>{name}</h2>
              {user.nickname && user.nickname !== user.username && <p className={styles.username}>@{user.username}</p>}
              <p className={styles.role}>{user.is_admin ? '管理员账户' : '易凡文化账户'}</p>
            </div>
          </div>
          <dl className={styles.details}>
            <div>
              <dt>邮箱</dt>
              <dd>{user.email || <span className={styles.secondary}>未设置邮箱</span>}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.quota} aria-busy={quotaLoading}>
          <h2 className={styles.sectionTitle}>解读额度</h2>
          <div className={styles.quotaBody} aria-live="polite">
            {quotaLoading ? (
              <div role="status" className={styles.quotaPlaceholder}>
                <span className={styles.skeleton} aria-hidden="true" />
                <span className={styles.secondary}>正在加载额度…</span>
              </div>
            ) : quotaError || !quota ? (
              <div className={styles.quotaPlaceholder}>
                <p className={styles.secondary}>{quotaError || '暂时无法获取额度'}</p>
                <button type="button" className={styles.textButton} onClick={onRetry}>重新加载</button>
              </div>
            ) : quota.is_unlimited ? (
              <>
                <p className={styles.balance}>不限次数</p>
                <p className={styles.quotaDetail}>当前账户可持续使用解读服务</p>
              </>
            ) : (
              <>
                <p className={`${styles.balance} ${lowQuota ? styles.lowQuota : ''}`}>
                  <span className={styles.balanceLabel}>剩余</span>
                  <strong>{remaining.toLocaleString('zh-CN')}</strong>
                  <span className={styles.balanceLabel}>次</span>
                </p>
                <p className={styles.quotaDetail}>共 {quota.total.toLocaleString('zh-CN')} 次<span aria-hidden="true"> · </span>已用 {quota.used.toLocaleString('zh-CN')} 次</p>
              </>
            )}
          </div>
          <div className={styles.quotaFooter}>
            <Link href="/pricing" className={styles.purchase}>
              {quota?.is_unlimited ? '查看套餐' : '购买次数'}<ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            {lowQuota && !quotaLoading && !quotaError && <span className={styles.quotaHint}>{remaining === 0 ? '额度已用完' : '剩余次数较少'}</span>}
          </div>
        </div>
      </section>

      <section className={styles.actions} aria-labelledby="account-actions-title">
        <h2 id="account-actions-title" className={styles.sectionTitle}>常用功能</h2>
        <div className={styles.actionList}>
          {actions.map(({ href, title, description, icon: Icon }) => (
            <Link href={href} className={styles.action} key={href}>
              <Icon className={styles.actionIcon} size={21} strokeWidth={1.6} aria-hidden="true" />
              <span className={styles.actionCopy}><span className={styles.actionTitle}>{title}</span><span className={styles.actionDescription}>{description}</span></span>
              <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
            </Link>
          ))}
          {user.is_admin && (
            <Link href="/admin" className={styles.action}>
              <Settings className={styles.actionIcon} size={21} strokeWidth={1.6} aria-hidden="true" />
              <span className={styles.actionCopy}><span className={styles.actionTitle}>管理后台</span><span className={styles.actionDescription}>管理平台内容与配置</span></span>
              <ChevronRight className={styles.chevron} size={18} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <footer className={styles.accountFooter}>
        <Link href="/" className={styles.back}><ArrowLeft size={16} aria-hidden="true" />返回首页</Link>
        <button type="button" className={styles.logout} onClick={onLogout} disabled={loggingOut}>
          {loggingOut ? <Loader2 size={16} className={styles.spinner} aria-hidden="true" /> : <LogOut size={16} aria-hidden="true" />}
          {loggingOut ? '正在退出…' : '退出登录'}
        </button>
        {logoutError && <p className={styles.logoutError} role="alert">{logoutError}</p>}
      </footer>
    </div>
  );
}
