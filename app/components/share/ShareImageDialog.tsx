'use client';

import { useEffect, useState } from 'react';
import { Download, EyeOff, ImageDown, Loader2, X } from 'lucide-react';
import { buildShareSvgDataUrl, downloadSharePng } from './share-utils';
import {
  DEFAULT_SHARE_PRIVACY,
  type ShareImageSource,
  type SharePrivacy,
} from './types';

type ShareImageDialogProps = {
  open: boolean;
  source: ShareImageSource;
  onClose: () => void;
};

const privacyOptions: Array<{
  key: keyof SharePrivacy;
  label: string;
  appliesTo: Array<ShareImageSource['kind']>;
}> = [
  { key: 'hideName', label: '隐藏姓名', appliesTo: ['bazi'] },
  { key: 'hideBirthTime', label: '隐藏时柱', appliesTo: ['bazi'] },
  { key: 'hideLocation', label: '隐藏地点', appliesTo: ['bazi', 'liuyao'] },
  { key: 'hideQuestion', label: '隐藏问题原文', appliesTo: ['bazi', 'liuyao'] },
];

export function ShareImageDialog({ open, source, onClose }: ShareImageDialogProps) {
  const [privacy, setPrivacy] = useState<SharePrivacy>(DEFAULT_SHARE_PRIVACY);
  const [svgDataUrl, setSvgDataUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setGenerating(true);
    setError('');
    buildShareSvgDataUrl(source, privacy)
      .then((url) => {
        if (alive) setSvgDataUrl(url);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : '分享图生成失败');
      })
      .finally(() => {
        if (alive) setGenerating(false);
      });
    return () => { alive = false; };
  }, [open, privacy, source]);

  if (!open) return null;

  const title = source.kind === 'bazi' ? '保存八字分享图' : '保存六爻分享图';
  const filename = `${source.kind === 'bazi' ? 'bazi' : 'liuyao'}-fateinsight-${Date.now()}.png`;

  const handleDownload = async () => {
    if (!svgDataUrl) return;
    setDownloading(true);
    setError('');
    try {
      await downloadSharePng(svgDataUrl, filename);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '图片下载失败');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-5 py-4">
          <div>
            <h2 className="font-serif text-lg text-[color:var(--color-text-primary)]">{title}</h2>
            <p className="mt-1 text-xs text-[color:var(--color-text-secondary)]">
              图片底部带 fateinsight.site 二维码，可保存后自行转发。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[3px] text-[color:var(--color-text-secondary)] transition hover:bg-[color:var(--color-bg-hover)] hover:text-[color:var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]/30"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-78px)] grid-cols-1 overflow-y-auto md:grid-cols-[280px_1fr]">
          <aside className="border-b border-[color:var(--color-border)] p-5 md:border-b-0 md:border-r">
            <div className="mb-5 flex items-center gap-2 text-sm font-medium text-[color:var(--color-text-primary)]">
              <EyeOff className="h-4 w-4 text-[color:var(--color-primary)]" aria-hidden="true" />
              隐私设置
            </div>
            <div className="space-y-3">
              {privacyOptions
                .filter((item) => item.appliesTo.includes(source.kind))
                .map((item) => (
                  <label
                    key={item.key}
                    className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm text-[color:var(--color-text-body)]"
                  >
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={privacy[item.key]}
                      onChange={(event) =>
                        setPrivacy((prev) => ({ ...prev, [item.key]: event.target.checked }))
                      }
                      className="h-4 w-4 accent-[color:var(--color-primary)]"
                    />
                  </label>
                ))}
            </div>

            {error && (
              <div className="mt-4 border border-[color:var(--color-primary)]/30 bg-[color:var(--color-primary)]/[0.06] px-3 py-2 text-xs leading-5 text-[color:var(--color-primary)]">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleDownload}
              disabled={!svgDataUrl || generating || downloading}
              className="btn btn-primary mt-5 w-full"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              下载 PNG
            </button>
          </aside>

          <div className="bg-[color:var(--color-bg)] p-4 md:p-6">
            <div className="mx-auto flex min-h-[520px] max-w-[450px] items-center justify-center">
              {generating ? (
                <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  正在生成预览
                </div>
              ) : svgDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={svgDataUrl}
                  alt="分享图预览"
                  className="h-auto w-full border border-[color:var(--color-border)] bg-[color:var(--color-bg-elevated)] shadow-[var(--shadow-md)]"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-[color:var(--color-text-secondary)]">
                  <ImageDown className="h-4 w-4" aria-hidden="true" />
                  暂无预览
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
