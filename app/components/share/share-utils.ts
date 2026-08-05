import QRCode from 'qrcode';
import type { Msg } from '@/app/lib/chat/types';
import type { HexagramLine } from '@/app/lib/liuyao/api';
import type { ShareImageSource, SharePrivacy } from './types';

const SITE_URL = 'https://fateinsight.site';
const CARD_WIDTH = 900;
const H_PADDING = 64;
const CONTENT_WIDTH = CARD_WIDTH - H_PADDING * 2;

type TextStyle = {
  size: number;
  color: string;
  weight?: number;
  family?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripInlineMarkdown(value: string) {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function markdownParagraphs(value: string) {
  return value
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) =>
      stripInlineMarkdown(line)
        .replace(/^#{1,6}\s*/, '')
        .replace(/^\s*[-+]\s*/, '')
        .replace(/^\s*(\d+)[.、]\s*/, '$1. ')
        .trim(),
    )
    .filter(Boolean);
}

function latestMessage(messages: Msg[], role: Msg['role']) {
  return [...messages].reverse().find((msg) => msg.role === role && msg.content.trim() && !msg.streaming)?.content || '';
}

function visualLength(value: string) {
  return [...value].reduce((sum, char) => sum + (/[\u0000-\u00ff]/.test(char) ? 0.62 : 1.08), 0);
}

function wrapText(value: string, maxChars: number) {
  const text = value.trim();
  if (!text) return [];
  const lines: string[] = [];
  let current = '';

  for (const char of text) {
    if (visualLength(current + char) > maxChars && current) {
      lines.push(current);
      current = char;
    } else {
      current += char;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function textLine(x: number, y: number, text: string, style: TextStyle, extra = '') {
  return `<text x="${x}" y="${y}" font-size="${style.size}" fill="${style.color}" font-weight="${style.weight ?? 400}" font-family="${style.family ?? 'Noto Sans SC, Microsoft YaHei, sans-serif'}" ${extra}>${escapeXml(text)}</text>`;
}

function sectionBlock({
  title,
  paragraphs,
  x,
  y,
  width,
  maxChars,
  bodySize = 21,
}: {
  title: string;
  paragraphs: string[];
  x: number;
  y: number;
  width: number;
  maxChars: number;
  bodySize?: number;
}) {
  const titleY = y + 20;
  let currentY = y + 54;
  const textParts: string[] = [];

  for (const paragraph of paragraphs) {
    const wrapped = wrapText(paragraph, maxChars);
    for (const line of wrapped) {
      textParts.push(textLine(x, currentY, line, { size: bodySize, color: '#4B433D' }));
      currentY += bodySize + 8;
    }
    currentY += 8;
  }

  const height = Math.max(currentY - y + 4, 82);
  const svg = `
    ${textLine(x, titleY, title, { size: 18, color: '#B54434', weight: 700 })}
    <line x1="${x}" y1="${titleY + 14}" x2="${x + width}" y2="${titleY + 14}" stroke="#E2D8CE"/>
    ${textParts.join('')}
  `;

  return { svg, y: y + height };
}

function pillarCard(x: number, y: number, label: string, value: string, width: number) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="74" rx="4" fill="#FBF8F4" stroke="#E2D8CE"/>
    ${textLine(x + 22, y + 29, label, { size: 18, color: '#9B9087', weight: 600 })}
    ${textLine(x + 22, y + 56, value || '未记录', { size: 24, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' })}
  `;
}

function yaoLines(lines: HexagramLine[] | undefined | null, x: number, y: number, width: number) {
  if (!lines?.length) return '';
  const parts: string[] = [];
  const lineWidth = width - 86;

  [...lines].reverse().forEach((line, idx) => {
    const lineMeta = line as HexagramLine & { liuqin?: string; wuxing?: string };
    const lineY = y + idx * 42;
    const color = line.is_dong ? '#B54434' : '#2A2522';
    parts.push(textLine(x, lineY + 8, lineMeta.liuqin || '', { size: 16, color: '#7A7068' }));

    if (line.is_yang) {
      parts.push(`<rect x="${x + 58}" y="${lineY}" width="${lineWidth}" height="5" fill="${color}"/>`);
    } else {
      parts.push(`<rect x="${x + 58}" y="${lineY}" width="${lineWidth / 2 - 10}" height="5" fill="${color}"/>`);
      parts.push(`<rect x="${x + 58 + lineWidth / 2 + 10}" y="${lineY}" width="${lineWidth / 2 - 10}" height="5" fill="${color}"/>`);
    }

    parts.push(textLine(x + width - 8, lineY + 8, line.dizhi || '', { size: 16, color: '#9B9087' }, 'text-anchor="end"'));
  });

  return parts.join('');
}

function buildBaziChart(source: Extract<ShareImageSource, { kind: 'bazi' }>, privacy: SharePrivacy) {
  const pillars = source.paipan?.four_pillars;
  if (!pillars) return '';

  return [
    pillarCard(H_PADDING, 300, '年柱', pillars.year?.join('') || '', 178),
    pillarCard(H_PADDING + 194, 300, '月柱', pillars.month?.join('') || '', 178),
    pillarCard(H_PADDING + 388, 300, '日柱', pillars.day?.join('') || '', 178),
    pillarCard(H_PADDING + 582, 300, '时柱', privacy.hideBirthTime ? '已隐藏' : (pillars.hour?.join('') || ''), 178),
  ].join('');
}

function buildLiuyaoChart(source: Extract<ShareImageSource, { kind: 'liuyao' }>) {
  const hexagram = source.hexagram;
  return `
    <rect x="${H_PADDING}" y="300" width="${CONTENT_WIDTH}" height="330" rx="4" fill="#FBF8F4" stroke="#E2D8CE"/>
    ${textLine(H_PADDING + 36, 354, hexagram.main_gua || '本卦', { size: 38, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' })}
    ${textLine(H_PADDING + 36, 390, '本卦', { size: 18, color: '#9B9087' })}
    ${
      hexagram.change_gua
        ? `${textLine(CARD_WIDTH - H_PADDING - 36, 354, hexagram.change_gua, { size: 38, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' }, 'text-anchor="end"')}${textLine(CARD_WIDTH - H_PADDING - 36, 390, '变卦', { size: 18, color: '#9B9087' }, 'text-anchor="end"')}`
        : ''
    }
    ${yaoLines(hexagram.lines?.lines, H_PADDING + 36, 440, CONTENT_WIDTH - 72)}
  `;
}

export async function buildShareSvgDataUrl(source: ShareImageSource, privacy: SharePrivacy) {
  const qrDataUrl = await QRCode.toDataURL(SITE_URL, {
    margin: 1,
    width: 180,
    color: { dark: '#2A2522', light: '#FBF8F4' },
  });

  const isBazi = source.kind === 'bazi';
  const assistant = latestMessage(source.messages, 'assistant');
  const userQuestion = isBazi ? latestMessage(source.messages, 'user') : source.hexagram.question;
  const answerParagraphs = markdownParagraphs(assistant || (isBazi
    ? '已生成八字排盘，可结合当下问题继续做文化分析。'
    : '卦象已生成，可结合问题继续查看文化分析与行动参考。'));
  const questionParagraphs = isBazi && privacy.hideQuestion ? ['问题已隐藏'] : markdownParagraphs(userQuestion);

  let y = isBazi ? 430 : 680;
  let bodySvg = isBazi ? buildBaziChart(source, privacy) : buildLiuyaoChart(source);

  if (questionParagraphs.length > 0) {
    const question = sectionBlock({
      title: '本次关注',
      paragraphs: questionParagraphs,
      x: H_PADDING,
      y,
      width: CONTENT_WIDTH,
      maxChars: 34,
      bodySize: 22,
    });
    bodySvg += question.svg;
    y = question.y + 18;
  }

  const answer = sectionBlock({
    title: isBazi ? 'AI 解读' : 'AI 解卦',
    paragraphs: answerParagraphs,
    x: H_PADDING,
    y,
    width: CONTENT_WIDTH,
    maxChars: 35,
    bodySize: 20,
  });
  bodySvg += answer.svg;
  y = answer.y + 34;

  const footerY = y;
  const height = Math.max(footerY + 190, isBazi ? 980 : 1180);
  const title = isBazi ? '八字文化分析' : '六爻文化占问';
  const eyebrow = isBazi ? 'BAZI READING' : 'LIUYAO READING';
  const createdAt = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${height}" viewBox="0 0 ${CARD_WIDTH} ${height}">
      <rect width="${CARD_WIDTH}" height="${height}" fill="#F7F3EE"/>
      <rect x="26" y="26" width="${CARD_WIDTH - 52}" height="${height - 52}" rx="6" fill="#FBF8F4" stroke="#D2C4B7"/>
      ${textLine(H_PADDING, 92, 'FATE INSIGHT', { size: 20, color: '#B54434', weight: 700 })}
      ${textLine(H_PADDING, 150, title, { size: 48, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' })}
      ${textLine(H_PADDING, 190, `${eyebrow} · ${createdAt}`, { size: 18, color: '#9B9087' })}
      <line x1="${H_PADDING}" y1="234" x2="${CARD_WIDTH - H_PADDING}" y2="234" stroke="#E2D8CE"/>
      ${bodySvg}
      <line x1="${H_PADDING}" y1="${footerY}" x2="${CARD_WIDTH - H_PADDING}" y2="${footerY}" stroke="#E2D8CE"/>
      <image href="${qrDataUrl}" x="${CARD_WIDTH - H_PADDING - 124}" y="${footerY + 34}" width="124" height="124"/>
      ${textLine(H_PADDING, footerY + 74, '易凡文化', { size: 30, color: '#2A2522', weight: 600, family: 'Noto Serif SC, STSong, serif' })}
      ${textLine(H_PADDING, footerY + 112, '扫码访问 fateinsight.site', { size: 22, color: '#7A7068' })}
      ${textLine(H_PADDING, footerY + 146, '内容仅作传统文化学习与个人思考参考', { size: 18, color: '#9B9087' })}
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export async function renderSharePngDataUrl(svgDataUrl: string) {
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

  const pngDataUrl = canvas.toDataURL('image/png', 0.96);
  if (!pngDataUrl.startsWith('data:image/png')) {
    throw new Error('图片尺寸过大，请减少解读内容后重试');
  }
  return pngDataUrl;
}

export function downloadSharePng(pngDataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = pngDataUrl;
  link.download = filename;
  link.click();
}
