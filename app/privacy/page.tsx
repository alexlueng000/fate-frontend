'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Eye, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 返回链接 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>

        {/* 标题 */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-4xl font-bold text-[var(--color-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            隐私政策
          </h1>
          <p className="text-[var(--color-text-muted)]">
            我们重视并保护您的个人隐私
          </p>
        </div>

        {/* 内容 */}
        <div className="space-y-6">
          {/* 数据收集 */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-[var(--color-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                我们收集的信息
              </h2>
            </div>
            <div className="space-y-3 text-[var(--color-text-secondary)]">
              <p><strong>基本信息：</strong>出生日期、时间、地点（用于命理分析）</p>
              <p><strong>账户信息：</strong>邮箱、用户名、昵称（如果您选择注册）</p>
              <p><strong>使用数据：</strong>访问日志、交互记录、设备信息（用于改进服务）</p>
              <p><strong>通信记录：</strong>您与AI的对话内容（用于提供服务和改进模型）</p>
            </div>
          </div>

          {/* 数据使用 */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-[var(--color-gold)]" />
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                信息使用方式
              </h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-[var(--color-text-secondary)]">
              <li>提供个性化的命理分析服务</li>
              <li>改进和优化用户体验</li>
              <li>维护服务安全，防止欺诈和滥用</li>
              <li>发送服务相关通知（如果您同意）</li>
              <li>遵守法律法规要求</li>
              <li>进行数据分析以改进AI模型（匿名化处理）</li>
            </ul>
          </div>

          {/* 数据保护 */}
          <div className="card p-8">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-[var(--color-primary)]" />
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                数据保护措施
              </h2>
            </div>
            <div className="space-y-3 text-[var(--color-text-secondary)]">
              <p><strong>加密存储：</strong>所有敏感数据均经过加密处理，采用行业标准的加密算法</p>
              <p><strong>访问控制：</strong>仅授权人员可访问用户数据，实行严格的权限管理</p>
              <p><strong>安全传输：</strong>使用HTTPS协议确保数据传输安全</p>
              <p><strong>定期审计：</strong>定期进行安全审计和漏洞扫描</p>
              <p><strong>数据备份：</strong>定期备份数据以防止数据丢失</p>
              <p><strong>数据删除：</strong>您可随时要求删除个人数据</p>
            </div>
          </div>

          {/* 第三方共享 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              第三方共享
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              我们<strong>不会</strong>向第三方出售、交易或转让您的个人信息。
              仅在以下情况下可能共享：
            </p>
            <ul className="list-disc list-inside space-y-2 text-[var(--color-text-secondary)] mt-3">
              <li>获得您的明确同意</li>
              <li>法律法规要求或政府部门要求</li>
              <li>保护我们的合法权益、用户或公众的安全</li>
              <li>与服务提供商共享（如云服务提供商），但他们仅能按照我们的指示处理数据</li>
            </ul>
          </div>

          {/* Cookies 和追踪技术 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              Cookies 和追踪技术
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              我们使用 Cookies 和类似技术来改善用户体验：
            </p>
            <ul className="list-disc list-inside space-y-2 text-[var(--color-text-secondary)] mt-3">
              <li><strong>必要 Cookies：</strong>用于维持登录状态和基本功能</li>
              <li><strong>功能 Cookies：</strong>记住您的偏好设置</li>
              <li><strong>分析 Cookies：</strong>了解用户如何使用我们的服务</li>
            </ul>
            <p className="text-[var(--color-text-secondary)] mt-3">
              您可以通过浏览器设置管理 Cookies，但这可能影响某些功能的使用。
            </p>
          </div>

          {/* 用户权利 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              您的权利
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-3">
              根据相关法律法规，您享有以下权利：
            </p>
            <ul className="list-disc list-inside space-y-2 text-[var(--color-text-secondary)]">
              <li><strong>访问权：</strong>访问和查看您的个人数据</li>
              <li><strong>更正权：</strong>更正不准确或不完整的信息</li>
              <li><strong>删除权：</strong>要求删除您的账户和数据</li>
              <li><strong>撤回同意：</strong>撤回您之前给予的同意授权</li>
              <li><strong>数据可携带：</strong>以结构化格式获取您的数据</li>
              <li><strong>投诉权：</strong>向监管机构投诉和举报</li>
            </ul>
            <p className="text-[var(--color-text-secondary)] mt-3">
              如需行使这些权利，请通过<Link href="/contact" className="text-[var(--color-primary)] hover:underline">联系我们</Link>页面与我们联系。
            </p>
          </div>

          {/* 未成年人保护 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              未成年人保护
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              我们的服务面向成年人。如果您未满18周岁，请在监护人的陪同下使用本服务。
              我们不会故意收集未成年人的个人信息。如果我们发现无意中收集了未成年人的信息，
              将立即删除。
            </p>
          </div>

          {/* 政策更新 */}
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              政策更新
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              我们可能会不时更新本隐私政策。更新后的政策将在网站上公布，并注明"最后更新"日期。
              重大变更时，我们会通过显著方式通知您。继续使用服务即表示您接受更新后的政策。
            </p>
          </div>

          {/* 联系方式 */}
          <div className="card p-8 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-hover)]">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              联系我们
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              如果您对本隐私政策有任何疑问、意见或需要行使您的权利，
              请通过<Link href="/contact" className="text-[var(--color-primary)] hover:underline">联系我们</Link>页面与我们取得联系。
            </p>
            <p className="text-[var(--color-text-secondary)] mt-3">
              我们将在收到您的请求后15个工作日内予以回复。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
