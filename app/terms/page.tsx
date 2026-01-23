'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1
            className="text-4xl font-bold text-[var(--color-text-primary)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            服务条款
          </h1>
          <p className="text-[var(--color-text-muted)]">
            最后更新：2025年1月
          </p>
        </div>

        {/* 内容 */}
        <div className="card p-8 space-y-6 text-[var(--color-text-secondary)] leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              1. 服务说明
            </h2>
            <p>
              一盏大师是一个基于传统八字命理与现代AI技术的在线分析平台。
              我们提供的服务仅供娱乐和参考，不构成任何形式的专业建议。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              2. 用户责任
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>您需提供准确的出生信息以获得更准确的分析结果</li>
              <li>您理解分析结果仅供参考，不应作为重大决策的唯一依据</li>
              <li>您不得将本服务用于任何非法或不当目的</li>
              <li>您应妥善保管账户信息，对账户下的所有活动负责</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              3. 免责声明
            </h2>
            <p>
              我们不对分析结果的准确性、完整性或适用性做任何保证。
              使用本服务产生的任何后果由用户自行承担。我们不对因使用或无法使用本服务而导致的任何直接、间接、偶然、特殊或后果性损害承担责任。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              4. 知识产权
            </h2>
            <p>
              本平台的所有内容、设计、代码、商标等知识产权归一盏大师所有。
              未经授权，不得复制、修改、分发或用于商业目的。用户生成的内容（如提问记录）归用户所有，但用户授予我们使用这些内容以改进服务的权利。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              5. 服务变更与终止
            </h2>
            <p>
              我们保留随时修改、暂停或终止服务的权利，无需事先通知。
              我们也可能因违反本条款而终止您的账户。终止后，您应立即停止使用本服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              6. 条款变更
            </h2>
            <p>
              我们保留随时修改本服务条款的权利。修改后的条款将在网站上公布，
              继续使用服务即表示您接受修改后的条款。如果您不同意修改后的条款，请停止使用本服务。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              7. 适用法律
            </h2>
            <p>
              本条款受中华人民共和国法律管辖。因本条款引起的任何争议，应首先通过友好协商解决；
              协商不成的，应提交至本公司所在地有管辖权的人民法院诉讼解决。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
              8. 联系我们
            </h2>
            <p>
              如果您对本服务条款有任何疑问，请通过<Link href="/contact" className="text-[var(--color-primary)] hover:underline">联系我们</Link>页面与我们取得联系。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
