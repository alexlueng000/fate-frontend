import type { Msg, Paipan } from '@/app/lib/chat/types';
import type { HexagramDetail } from '@/app/lib/liuyao/api';

export type ShareKind = 'bazi' | 'liuyao';

export type SharePrivacy = {
  hideName: boolean;
  hideBirthTime: boolean;
  hideLocation: boolean;
  hideQuestion: boolean;
};

export type ShareImageSource =
  | {
      kind: 'bazi';
      paipan: Paipan | null;
      messages: Msg[];
    }
  | {
      kind: 'liuyao';
      hexagram: HexagramDetail;
      messages: Msg[];
    };

export const DEFAULT_SHARE_PRIVACY: SharePrivacy = {
  hideName: true,
  hideBirthTime: true,
  hideLocation: true,
  hideQuestion: false,
};
