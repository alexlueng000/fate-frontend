'use client';

import { useEffect, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

import { useUser } from '@/app/lib/auth';
import { emotionApi } from '@/app/lib/emotion/api';
import { getBirthSeason } from '@/app/lib/xinji/calendar';
import {
  deriveWuxingDominance,
  getMingliPersonaSentence,
  getPlainPersonaSentence,
  type WuxingDominance,
} from '@/app/lib/xinji/persona';
import {
  getXinjiVersion,
  setXinjiVersion,
  getPersonaOverride,
  setPersonaOverride,
  type XinjiVersion,
} from '@/app/lib/xinji/storage';

/**
 * 天性小像（镜厅首页）
 *
 * - 命理版：根据五行主导渲染（emotionApi.getCharacterProfile）
 * - 非命理版：根据出生季节渲染（user.profile_brief.birth_date）
 * - 用户可点击修改：「我觉得我更像：______」
 * - 顶部小切换：命理 / 非命理
 */
export default function PersonaCard() {
  const { user } = useUser();
  const [version, setVersionState] = useState<XinjiVersion>('mingli');
  const [override, setOverrideState] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [dominance, setDominance] = useState<WuxingDominance | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // 从 localStorage 读偏好
  useEffect(() => {
    const v = getXinjiVersion();
    if (v) setVersionState(v);
    setOverrideState(getPersonaOverride());
  }, []);

  // 命理版需要拉 character-profile 拿五行数据
  useEffect(() => {
    if (!user) {
      setDominance(null);
      return;
    }
    if (version !== 'mingli') return;
    if (dominance) return; // 已有就不重复拉

    let alive = true;
    setLoadingProfile(true);
    setProfileError(null);
    emotionApi
      .getCharacterProfile()
      .then((p) => {
        if (!alive) return;
        const d = deriveWuxingDominance(
          p.wuxing_balance?.wuxing_count,
          p.wuxing_balance?.balance_score,
        );
        setDominance(d);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        // 命理数据拿不到（无档案 / 接口异常）静默回落到非命理版
        setProfileError(e instanceof Error ? e.message : '加载性格档案失败');
      })
      .finally(() => {
        if (alive) setLoadingProfile(false);
      });

    return () => { alive = false; };
  }, [user, version, dominance]);

  const handleVersionChange = (v: XinjiVersion) => {
    setVersionState(v);
    setXinjiVersion(v);
  };

  const handleStartEdit = () => {
    setDraft(override ?? '');
    setEditing(true);
  };

  const handleSaveOverride = () => {
    const v = draft.trim();
    setPersonaOverride(v);
    setOverrideState(v || null);
    setEditing(false);
  };

  const handleClearOverride = () => {
    setPersonaOverride('');
    setOverrideState(null);
    setEditing(false);
  };

  // 渲染主句
  let mainSentence: string;
  if (override) {
    mainSentence = override;
  } else if (version === 'mingli') {
    if (loadingProfile && !dominance) {
      mainSentence = '——';
    } else if (dominance) {
      mainSentence = getMingliPersonaSentence(dominance);
    } else if (user?.profile_brief?.birth_date) {
      // 命理拉不到 → 平滑回落到季节
      mainSentence = getPlainPersonaSentence(getBirthSeason(user.profile_brief.birth_date));
    } else {
      mainSentence = '你像四季。有时暖，有时冷。';
    }
  } else {
    if (user?.profile_brief?.birth_date) {
      mainSentence = getPlainPersonaSentence(getBirthSeason(user.profile_brief.birth_date));
    } else {
      mainSentence = '你像四季。有时暖，有时冷。';
    }
  }

  return (
    <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/60 px-8 py-7">
      {/* 顶部 label + 版本切换 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] tracking-[0.4em] text-slate-400 uppercase">
          天性小像
        </span>
        <div className="inline-flex rounded-full bg-slate-100/70 p-0.5 text-[11px]">
          {(['mingli', 'plain'] as const).map((v) => {
            const active = version === v;
            return (
              <button
                key={v}
                onClick={() => handleVersionChange(v)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  active
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v === 'mingli' ? '命理' : '节气'}
              </button>
            );
          })}
        </div>
      </div>

      {/* 主句 */}
      {editing ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">我觉得我更像：</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="写下一句你觉得更贴近自己的话"
            maxLength={80}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 bg-white/80 text-slate-800 text-base font-light leading-relaxed focus:outline-none focus:border-slate-400 resize-none"
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            {override && (
              <button
                onClick={handleClearOverride}
                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1.5"
              >
                还原默认
              </button>
            )}
            <button
              onClick={() => setEditing(false)}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
            >
              <X className="w-3 h-3" /> 取消
            </button>
            <button
              onClick={handleSaveOverride}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1 text-xs text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5"
            >
              <Check className="w-3 h-3" /> 保存
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleStartEdit}
          className="group/edit w-full text-left"
          aria-label="点击修改"
        >
          <p className="text-xl sm:text-2xl font-serif text-slate-800 leading-relaxed">
            {mainSentence}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 opacity-0 group-hover/edit:opacity-100 transition-opacity">
            <Pencil className="w-3 h-3" />
            <span>点击修改 · 我觉得我更像</span>
          </div>
        </button>
      )}

      {/* 错误提示（仅命理版且失败时） */}
      {version === 'mingli' && profileError && !dominance && (
        <p className="mt-3 text-[11px] text-slate-400">
          暂时无法读取命理数据，已用节气句子代替。
        </p>
      )}
    </div>
  );
}
