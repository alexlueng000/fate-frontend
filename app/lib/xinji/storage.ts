// 心镜灯 · localStorage 偏好（命理/非命理版本切换 + 用户自定义"天性小像"覆盖）
// 严格本地存储：所有 心镜灯 用户偏好与记录均不上传，遵循"数据主权"。

const KEY_VERSION = 'xinji:version';
const KEY_PERSONA_OVERRIDE = 'xinji:persona_override';

export type XinjiVersion = 'mingli' | 'plain';

export function getXinjiVersion(): XinjiVersion | null {
  try {
    const raw = localStorage.getItem(KEY_VERSION);
    if (raw === 'mingli' || raw === 'plain') return raw;
    return null;
  } catch {
    return null;
  }
}

export function setXinjiVersion(v: XinjiVersion): void {
  try {
    localStorage.setItem(KEY_VERSION, v);
  } catch {
    /* no-op */
  }
}

export function getPersonaOverride(): string | null {
  try {
    const raw = localStorage.getItem(KEY_PERSONA_OVERRIDE);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
}

export function setPersonaOverride(text: string): void {
  try {
    const v = text.trim();
    if (v) localStorage.setItem(KEY_PERSONA_OVERRIDE, v);
    else localStorage.removeItem(KEY_PERSONA_OVERRIDE);
  } catch {
    /* no-op */
  }
}
