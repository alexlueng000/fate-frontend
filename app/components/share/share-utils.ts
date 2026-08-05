import QRCode from 'qrcode';
import type { Msg } from '@/app/lib/chat/types';
import type { HexagramLine } from '@/app/lib/liuyao/api';
import type { ShareImageSource, SharePrivacy } from './types';

const SITE_URL = 'https://fateinsight.site';
const CARD_WIDTH = 900;
const H_PADDING = 64;
const CONTENT_WIDTH = CARD_WIDTH - H_PADDING * 2;

type SvgLine = { text: string; size: number; color: string; weight?: number; family?: string };

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripMarkdown(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, (match) => match.replace(/^\[|\]\([^)]*\)$/g, ''))
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/[*_`>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value: string, max: number) {
  const text = stripMarkdown(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function latestMessage(messages: Msg[], role: Msg['role']) {
  return [...messages].reverse().find((msg) => msg.role === role && msg.content.trim() && !msg.streaming)?.content || '';
}

function extractPoints(text: string, count = 4) {
  const cleaned = stripMarkdown(text);
  if (!cleaned) return [];
  const split = text
    .split(/\n+/)
    .map((line) => stripMarkdown(line).replace(/^\d+[.、]\s*/, '').trim())
    .filter((line) => line.length >= 8);
  const points = split.length > 1 ? split : cleaned.split(/[。；;.!?！？]/).map((line) => line.trim());
  return points.filter(Boolean).slice(0, count).map((line) => truncate(line, 52));
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) return [];
  const lines: string[] = [];
  let current = '';
  for (const char of text) {
    const width = /[\u0000-\u00ff]/.test(char) ? 0.55 : 1;
    const currentWidth = [...current].reduce((sum, item) => sum + (/[\u0000-\u00ff]/.test(item) ? 0.55 : 1), 0);
    if (currentWidth + width > maxChars && current) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function textBlock(lines: SvgLine[], x: number, y: number, maxChars: number, lineGap = 12) {
  let currentY = y;
  const parts: string[] = [];
  for (const line of lines) {
    const wrapped = wrapText(line.text, maxChars);
    for (const wrappedLine of wrapped) {
      parts.push(
        `<text x="${x}" y="${currentY}" font-size="${line.size}" fill="${line.color}" font-weight="${line.weight ?? 400}" font-family="${line.family ?? 'Noto Sans SC, Microsoft YaHei, sans-serif'}">${escapeXml(wrappedLine)}</text>`,
      );
      currentY += line.size + lineGap;
    }
  }
  return { svg: parts.join(''), y: currentY };
}

function pill(x: number, y: number, label: string, value: string, width: number) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="74" rx="4" fill="#FBF8F4" stroke="#E2D8CE"/>
    <text x="${x + 22}" y="${y + 29}" font-size="18" fill="#9B9087" letter-spacing="3" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">${escapeXml(label)}</text>
    <text x="${x + 22}" y="${y + 56}" font-size="24" fill="#2A2522" font-weight="600" font-family="Noto Serif SC, STSong, serif">${escapeXml(value || '未记录')}</text>
  `;
}

function yaoLines(lines: HexagramLine[] | undefined | null, x: number, y: number, width: number) {
  if (!lines?.length) return '';
  const parts: string[] = [];
  const lineWidth = width - 78;
  [...lines].reverse().forEach((line, idx) => {
    const lineMeta = line as HexagramLine & { liuqin?: string; wuxing?: string };
    const lineY = y + idx * 38;
    const color = line.is_dong ? '#B54434' : '#2A2522';
    parts.push(`<text x="${x}" y="${lineY + 7}" font-size="16" fill="#7A7068" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">${escapeXml(lineMeta.liuqin || '')}</text>`);
    if (line.is_yang) {
      parts.push(`<rect x="${x + 54}" y="${lineY}" width="${lineWidth}" height="5" fill="${color}"/>`);
    } else {
      parts.push(`<rect x="${x + 54}" y="${lineY}" width="${lineWidth / 2 - 9}" height="5" fill="${color}"/>`);
      parts.push(`<rect x="${x + 54 + lineWidth / 2 + 9}" y="${lineY}" width="${lineWidth / 2 - 9}" height="5" fill="${color}"/>`);
    }
    parts.push(`<text x="${x + width - 8}" y="${lineY + 7}" text-anchor="end" font-size="16" fill="#9B9087" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">${escapeXml(line.dizhi || '')}</text>`);
  });
  return parts.join('');
}

function buildBaziContent(source: Extract<ShareImageSource, { kind: 'bazi' }>, privacy: SharePrivacy) {
  const pillars = source.paipan?.four_pillars;
  const assistant = latestMessage(source.messages, 'assistant');
  const userQuestion = latestMessage(source.messages, 'user');
  const points = extractPoints(assistant);

  return {
    title: '八字文化分析',
    eyebrow: 'BAZI READING',
    summary: truncate(assistant || '已生成八字排盘，可结合当下问题继续做文化分析。', 120),
    question: privacy.hideQuestion ? '' : truncate(userQuestion, 70),
    points: points.length ? points : ['从四柱结构观察长期倾向', '结合现实处境理解优势与卡点', '重要选择仍建议保留自我判断'],
    chartSvg: pillars
      ? [
          pill(H_PADDING, 300, '年柱', pillars.year?.join('') || '', 178),
          pill(H_PADDING + 194, 300, '月柱', pillars.month?.join('') || '', 178),
          pill(H_PADDING + 388, 300, '日柱', pillars.day?.join('') || '', 178),
          pill(H_PADDING + 582, 300, '时柱', privacy.hideBirthTime ? '已隐藏' : (pillars.hour?.join('') || ''), 178),
        ].join('')
      : '',
  };
}

function buildLiuyaoContent(source: Extract<ShareImageSource, { kind: 'liuyao' }>, privacy: SharePrivacy) {
  const assistant = latestMessage(source.messages, 'assistant');
  const points = extractPoints(assistant);
  const hexagram = source.hexagram;
  return {
    title: '六爻文化占问',
    eyebrow: 'LIUYAO READING',
    summary: truncate(assistant || '卦象已生成，可结合问题继续查看文化分析与行动参考。', 120),
    question: privacy.hideQuestion ? '问题已隐藏' : truncate(hexagram.question, 76),
    points: points.length ? points : ['一事一问，先看趋势与阻力', '结合动爻变化观察下一步', '结果只作文化参考，不替代现实判断'],
    chartSvg: `
      <rect x="${H_PADDING}" y="300" width="${CONTENT_WIDTH}" height="260" rx="4" fill="#FBF8F4" stroke="#E2D8CE"/>
      <text x="${H_PADDING + 36}" y="354" font-size="38" fill="#2A2522" font-weight="600" font-family="Noto Serif SC, STSong, serif">${escapeXml(hexagram.main_gua || '本卦')}</text>
      <text x="${H_PADDING + 36}" y="390" font-size="18" fill="#9B9087" letter-spacing="4" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">本卦</text>
      ${hexagram.change_gua ? `<text x="${CARD_WIDTH - H_PADDING - 36}" y="354" text-anchor="end" font-size="38" fill="#2A2522" font-weight="600" font-family="Noto Serif SC, STSong, serif">${escapeXml(hexagram.change_gua)}</text><text x="${CARD_WIDTH - H_PADDING - 36}" y="390" text-anchor="end" font-size="18" fill="#9B9087" letter-spacing="4" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">变卦</text>` : ''}
      ${yaoLines(hexagram.lines?.lines, H_PADDING + 36, 430, CONTENT_WIDTH - 72)}
    `,
  };
}

export async function buildShareSvgDataUrl(source: ShareImageSource, privacy: SharePrivacy) {
  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    margin: 1,
    width: 180,
    color: { dark: '#2A2522', light: '#FBF8F4' },
  });
  const content = source.kind === 'bazi'
    ? buildBaziContent(source, privacy)
    : buildLiuyaoContent(source, privacy);

  let y = source.kind === 'bazi' ? 430 : 610;
  let bodySvg = content.chartSvg;

  if (content.question) {
    const block = textBlock([
      { text: '本次关注', size: 18, color: '#9B9087', weight: 600 },
      { text: content.question, size: 25, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' },
    ], H_PADDING, y, 30, 12);
    bodySvg += block.svg;
    y = block.y + 22;
  }

  const summary = textBlock([
    { text: '核心摘要', size: 18, color: '#9B9087', weight: 600 },
    { text: content.summary, size: 24, color: '#4B433D' },
  ], H_PADDING, y, 34, 12);
  bodySvg += summary.svg;
  y = summary.y + 22;

  bodySvg += `<text x="${H_PADDING}" y="${y}" font-size="18" fill="#9B9087" font-weight="600" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">关键提示</text>`;
  y += 34;
  content.points.slice(0, 4).forEach((point, index) => {
    const block = textBlock([
      { text: `${index + 1}. ${point}`, size: 23, color: '#4B433D' },
    ], H_PADDING + 18, y, 33, 8);
    bodySvg += block.svg;
    y = block.y + 8;
  });

  const footerY = y + 34;
  const height = Math.max(footerY + 190, 980);
  const createdAt = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
      <rect width="${CARD_WIDTH}" height="${height}" fill="#F7F3EE"/>
      <rect x="26" y="26" width="${CARD_WIDTH - 52}" height="${height - 52}" rx="6" fill="#FBF8F4" stroke="#D2C4B7"/>
      <text x="${H_PADDING}" y="92" font-size="20" fill="#B54434" letter-spacing="6" font-weight="700" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">FATE INSIGHT</text>
      <text x="${H_PADDING}" y="150" font-size="48" fill="#2A2522" font-weight="600" font-family="Noto Serif SC, STSong, serif">${escapeXml(content.title)}</text>
      <text x="${H_PADDING}" y="190" font-size="18" fill="#9B9087" letter-spacing="5" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">${content.eyebrow} · ${escapeXml(createdAt)}</text>
      <line x1="${H_PADDING}" y1="234" x2="${CARD_WIDTH - H_PADDING}" y2="234" stroke="#E2D8CE"/>
      ${bodySvg}
      <line x1="${H_PADDING}" y1="${footerY}" x2="${CARD_WIDTH - H_PADDING}" y2="${footerY}" stroke="#E2D8CE"/>
      <image href="${qrDataUrl}" x="${CARD_WIDTH - H_PADDING - 124}" y="${footerY + 34}" width="124" height="124"/>
      <text x="${H_PADDING}" y="${footerY + 74}" font-size="30" fill="#2A2522" font-weight="600" font-family="Noto Serif SC, STSong, serif">易凡文化</text>
      <text x="${H_PADDING}" y="${footerY + 112}" font-size="22" fill="#7A7068" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">扫码访问 fateinsight.site</text>
      <text x="${H_PADDING}" y="${footerY + 146}" font-size="18" fill="#9B9087" font-family="Noto Sans SC, Microsoft YaHei, sans-serif">内容仅作传统文化学习与个人思考参考</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function downloadSharePng(svgDataUrl: string, filename: string) {
  const image = new Image();
  image.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('分享图生成失败'));
    image.src = svgDataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth * 2;
  canvas.height = image.naturalHeight * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('当前浏览器不支持生成图片');
  ctx.fillStyle = '#F7F3EE';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 0.96));
  if (!blob) throw new Error('图片导出失败');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
