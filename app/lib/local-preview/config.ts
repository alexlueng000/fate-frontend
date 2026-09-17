// Both conditions are required: production builds can never enable preview auth.
export const LOCAL_PREVIEW = process.env.NODE_ENV === 'development'
  && process.env.NEXT_PUBLIC_LOCAL_PREVIEW === '1';

export const previewUser = {
  id: 90001,
  username: '本地演示用户',
  nickname: '本地演示用户',
  email: 'preview@example.invalid',
  is_admin: true,
  has_profile: true,
  profile_brief: {
    id: 90001, gender: 'male', birth_date: '1990-06-15', birth_time: '10:30:00',
    birth_location: '上海（示例）', display_info: '演示档案 · 1990-06-15 · 上海',
  },
};
