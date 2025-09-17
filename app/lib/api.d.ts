declare module '@/lib/api' {
  export function api(path: string): string;
  export function postJSON<T>(url: string, body: unknown): Promise<T>;
}
