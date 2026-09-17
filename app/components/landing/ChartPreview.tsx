'use client';

import { useState } from 'react';
import { getWuxing, wuxingColor } from '@/app/components/WuXing';
import styles from './Homepage.module.css';

export default function ChartPreview() {
  const [mode, setMode] = useState<'bazi' | 'liuyao'>('bazi');
  return <section className={styles.preview} aria-label="命盘与卦象展示示例">
    <div className={styles.previewTop}><span>解读，从看见依据开始</span><span className={styles.example}>展示示例</span></div>
    <div className={styles.switcher} aria-label="选择展示示例">
      <button type="button" aria-pressed={mode === 'bazi'} onClick={() => setMode('bazi')}>八字命盘</button>
      <button type="button" aria-pressed={mode === 'liuyao'} onClick={() => setMode('liuyao')}>六爻卦象</button>
    </div>
    <div className={styles.previewBody} key={mode}>
      {mode === 'bazi' ? <>
        <div className={styles.previewHeading}><h2>四柱之间，看见关联。</h2><p>年、月、日、时，组成一张命盘。</p></div>
        <div className={styles.pillars}>
          {['庚午', '壬午', '甲寅', '己巳'].map((pair, i) => <div key={pair} className={i === 2 ? styles.day : ''}>
            <span className={styles.pillarLabel}>{['年柱', '月柱', '日柱', '时柱'][i]}</span>
            {Array.from(pair).map(char => <span key={char} className={styles.character} style={{ color: wuxingColor(getWuxing(char)) }}>{char}<small>{getWuxing(char)}</small></span>)}
          </div>)}
        </div>
        <div className={styles.interpretation}><span>如何阅读</span><p>先看四柱与五行，再读性格、做事方式与关系倾向。每个判断，都值得与真实经历核对。</p></div>
      </> : <>
        <div className={styles.previewHeading}><h2>一件具体的事，逐层看清。</h2><p>示例问题：这次合作有哪些条件需要确认？</p></div>
        <div className={styles.hexagram} aria-label="地天泰静卦示意，从下至上为三阳爻、三阴爻">
          <div className={styles.lines}>{[false, false, false, true, true, true].map((yang, i) => <div className={styles.lineRow} key={i}><span>{['上爻', '五爻', '四爻', '三爻', '二爻', '初爻'][i]}</span><div className={yang ? styles.yang : styles.yin}><i /><i /></div></div>)}</div>
          <div className={styles.guaName}><span>卦象示意</span><strong>地天泰</strong><p>观察关系<br />理解变化</p></div>
        </div>
        <div className={styles.interpretation}><span>如何阅读</span><p>围绕一个问题，结合卦象说明传统分析依据，再核对合作条件、时间安排与现实限制。</p></div>
      </>}
    </div>
    <p className={styles.previewNote}>固定示例，非个人排盘或预测结果。</p>
  </section>;
}
