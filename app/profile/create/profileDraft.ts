export type ProfileFields = {
  gender: '男' | '女';
  calendarType: '公历' | '农历';
  birthDate: string;
  birthTime: string;
  birthLocation: string;
};

export const EMPTY_PROFILE: ProfileFields = {
  gender: '男', calendarType: '公历', birthDate: '', birthTime: '', birthLocation: '',
};
export const DRAFT_LIFETIME = 7 * 24 * 60 * 60 * 1000;
export const draftKey = (userId: number) => `profile-onboarding:v1:${userId}`;

export type ProfileDraft = { started: boolean; fields: ProfileFields };

/** Expire birth details while remembering that the welcome step was completed. */
export function parseProfileDraft(raw: string | null, now = Date.now()): ProfileDraft {
  const empty = { started: false, fields: { ...EMPTY_PROFILE } };
  if (!raw) return empty;
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || data.started !== true) return empty;
    const blankStarted = { ...empty, started: true };
    if (!Number.isFinite(data.updatedAt) || data.updatedAt > now || now - data.updatedAt > DRAFT_LIFETIME) return blankStarted;
    const fields = data.fields;
    if (!fields || !['男', '女'].includes(fields.gender) || !['公历', '农历'].includes(fields.calendarType)) return blankStarted;
    if (!['birthDate', 'birthTime', 'birthLocation'].every((key) => typeof fields[key] === 'string' && fields[key].length <= 500)) return blankStarted;
    return {
      started: true,
      fields: {
        gender: fields.gender, calendarType: fields.calendarType,
        birthDate: fields.birthDate, birthTime: fields.birthTime, birthLocation: fields.birthLocation,
      },
    };
  } catch {
    return empty;
  }
}
