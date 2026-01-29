'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Footer from '@/app/components/Footer';

// 示例八字数据
const DEMO_PAIPAN = {
  name: '示例用户',
  gender: '女',
  birthDate: '1990年8月15日',
  birthTime: '14:30',
  birthPlace: '北京',
  fourPillars: {
    year: { gan: '庚', zhi: '午' },
    month: { gan: '甲', zhi: '申' },
    day: { gan: '丙', zhi: '寅' },
    hour: { gan: '乙', zhi: '未' },
  },
};

// 示例解读内容
const DEMO_READING = `### 命盘概述

您的八字为：**庚午年 甲申月 丙寅日 乙未时**

日主丙火生于申月，虽处休囚之地，但得寅木生扶，时干乙木透出，形成木火相生之势。整体命局呈现出聪慧灵动、热情开朗的特质。

### 性格特点

- **热情开朗**：丙火为太阳之火，天生具有温暖他人的能力，善于社交，人缘极佳
- **聪明敏锐**：甲木透出，思维活跃，学习能力强，对新事物接受度高
- **独立自主**：寅木坐支，有主见，不喜欢被约束，追求自由的生活方式
- **感性细腻**：乙木时干，内心柔软，对艺术和美有独特的感知力

### 事业方向

根据您的命局特点，以下领域较为适合：

1. **创意产业**：广告、设计、媒体等需要创造力的工作
2. **教育培训**：丙火照耀四方，适合传道授业
3. **公关营销**：善于沟通，能够建立良好的人际关系
4. **自由职业**：独立性强，适合有一定自主权的工作模式

### 感情婚姻

- 感情上较为主动，容易吸引异性关注
- 理想伴侣类型：稳重踏实、能给予安全感的人
- 婚姻宫寅木，配偶可能从事与木相关的行业（教育、医疗、环保等）

### 大运分析

当前大运：**壬辰运（2020-2030）**

- 壬水财星透出，事业财运有上升趋势
- 辰土湿土，有利于调和命局，整体运势平稳向好
- 建议把握这十年的发展机遇，在事业上有所突破

### 流年提示（2024甲辰年）

- 甲木印星当头，学习进修的好时机
- 辰土财库，有积累财富的机会
- 注意劳逸结合，避免过度操劳

### 温馨提示

以上解读仅供参考，命理分析是帮助我们更好地认识自己的工具，而非决定命运的枷锁。人生的精彩在于我们如何把握当下，创造未来。`;

export default function DemoPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['overview', 'personality', 'career'])
  );

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF8F0] to-white">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
          <Link
            href="/"
            className="btn btn-primary px-4 py-2 text-sm"
          >
            <Sparkles className="w-4 h-4" />
            获取我的解读
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold-dark)] text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            示例报告
          </div>
          <h1
            className="text-3xl font-bold text-[var(--color-text-primary)] mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            命理解读报告
          </h1>
          <p className="text-[var(--color-text-muted)]">
            以下是一份示例报告，展示我们的解读风格和内容深度
          </p>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[var(--color-border)] mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-gold)] flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-text-primary)]">
                {DEMO_PAIPAN.name}
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                {DEMO_PAIPAN.gender}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Calendar className="w-4 h-4 text-[var(--color-primary)]" />
              {DEMO_PAIPAN.birthDate}
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <Clock className="w-4 h-4 text-[var(--color-gold)]" />
              {DEMO_PAIPAN.birthTime}
            </div>
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
              <MapPin className="w-4 h-4 text-[var(--color-tech)]" />
              {DEMO_PAIPAN.birthPlace}
            </div>
          </div>
        </div>

        {/* 八字展示 */}
        <div className="bg-gradient-to-r from-[var(--color-primary)]/5 to-[var(--color-gold)]/5 rounded-2xl p-6 mb-8">
          <h3 className="text-center text-sm font-medium text-[var(--color-text-muted)] mb-4">
            四柱八字
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {(['year', 'month', 'day', 'hour'] as const).map((pillar, index) => {
              const labels = ['年柱', '月柱', '日柱', '时柱'];
              const data = DEMO_PAIPAN.fourPillars[pillar];
              return (
                <div key={pillar} className="text-center">
                  <div className="text-xs text-[var(--color-text-hint)] mb-2">
                    {labels[index]}
                  </div>
                  <div className="bg-white rounded-xl p-3 shadow-sm">
                    <div className="text-2xl font-bold text-[var(--color-primary)]">
                      {data.gan}
                    </div>
                    <div className="text-2xl font-bold text-[var(--color-gold-dark)]">
                      {data.zhi}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 解读内容 */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--color-border)] overflow-hidden">
          {/* 解读区块 */}
          {[
            { id: 'overview', title: '命盘概述', icon: '📋' },
            { id: 'personality', title: '性格特点', icon: '🎭' },
            { id: 'career', title: '事业方向', icon: '💼' },
            { id: 'love', title: '感情婚姻', icon: '💕' },
            { id: 'fortune', title: '大运分析', icon: '🌟' },
            { id: 'yearly', title: '流年提示', icon: '📅' },
          ].map((section, index) => {
            const isExpanded = expandedSections.has(section.id);
            // 根据 section id 提取对应内容
            const sectionContent = getSectionContent(section.id);

            return (
              <div
                key={section.id}
                className={index > 0 ? 'border-t border-[var(--color-border)]' : ''}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--color-bg-deep)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {section.title}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[var(--color-text-muted)]" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-6 pb-6">
                    <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] leading-relaxed">
                      {sectionContent}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 底部提示 */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm mb-4">
            💡 这只是示例报告
          </div>
          <p className="text-[var(--color-text-muted)] mb-6">
            想要获取属于你的专属命理解读？
          </p>
          <Link
            href="/"
            className="btn btn-primary px-8 py-4 text-lg"
          >
            <Sparkles className="w-5 h-5" />
            立即免费体验
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}

// 根据 section id 获取对应内容
function getSectionContent(sectionId: string): React.ReactNode {
  const contents: Record<string, React.ReactNode> = {
    overview: (
      <>
        <p>您的八字为：<strong>庚午年 甲申月 丙寅日 乙未时</strong></p>
        <p>
          日主丙火生于申月，虽处休囚之地，但得寅木生扶，时干乙木透出，形成木火相生之势。
          整体命局呈现出聪慧灵动、热情开朗的特质。
        </p>
      </>
    ),
    personality: (
      <ul className="space-y-2 list-none pl-0">
        <li><strong>热情开朗</strong>：丙火为太阳之火，天生具有温暖他人的能力，善于社交，人缘极佳</li>
        <li><strong>聪明敏锐</strong>：甲木透出，思维活跃，学习能力强，对新事物接受度高</li>
        <li><strong>独立自主</strong>：寅木坐支，有主见，不喜欢被约束，追求自由的生活方式</li>
        <li><strong>感性细腻</strong>：乙木时干，内心柔软，对艺术和美有独特的感知力</li>
      </ul>
    ),
    career: (
      <>
        <p>根据您的命局特点，以下领域较为适合：</p>
        <ol className="space-y-2 list-decimal pl-5">
          <li><strong>创意产业</strong>：广告、设计、媒体等需要创造力的工作</li>
          <li><strong>教育培训</strong>：丙火照耀四方，适合传道授业</li>
          <li><strong>公关营销</strong>：善于沟通，能够建立良好的人际关系</li>
          <li><strong>自由职业</strong>：独立性强，适合有一定自主权的工作模式</li>
        </ol>
      </>
    ),
    love: (
      <ul className="space-y-2 list-none pl-0">
        <li>感情上较为主动，容易吸引异性关注</li>
        <li>理想伴侣类型：稳重踏实、能给予安全感的人</li>
        <li>婚姻宫寅木，配偶可能从事与木相关的行业（教育、医疗、环保等）</li>
      </ul>
    ),
    fortune: (
      <>
        <p><strong>当前大运：壬辰运（2020-2030）</strong></p>
        <ul className="space-y-2 list-none pl-0">
          <li>壬水财星透出，事业财运有上升趋势</li>
          <li>辰土湿土，有利于调和命局，整体运势平稳向好</li>
          <li>建议把握这十年的发展机遇，在事业上有所突破</li>
        </ul>
      </>
    ),
    yearly: (
      <>
        <p><strong>2024甲辰年</strong></p>
        <ul className="space-y-2 list-none pl-0">
          <li>甲木印星当头，学习进修的好时机</li>
          <li>辰土财库，有积累财富的机会</li>
          <li>注意劳逸结合，避免过度操劳</li>
        </ul>
        <p className="mt-4 text-[var(--color-text-hint)] text-sm italic">
          以上解读仅供参考，命理分析是帮助我们更好地认识自己的工具，而非决定命运的枷锁。
        </p>
      </>
    ),
  };

  return contents[sectionId] || null;
}
