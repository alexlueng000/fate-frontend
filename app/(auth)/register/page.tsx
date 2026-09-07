import { redirect } from 'next/navigation';
import EmailRegisterClient from './EmailRegisterClient';

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ method?: string; redirect?: string }>;
}) {
  const params = await searchParams;
  if (params.method !== 'email') {
    const target = params.redirect;
    const query = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
      ? `?redirect=${encodeURIComponent(target)}`
      : '';
    redirect(`/login${query}`);
  }
  return <EmailRegisterClient />;
}
