// app/lib/phone.ts
/**
 * Phone number validation and formatting utilities
 */

/**
 * Validate Chinese mainland phone number (11 digits, starts with 1)
 */
export function validateChinaPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * Format phone number for display (138 0013 8000)
 */
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
}

/**
 * Remove all non-digit characters from phone number
 */
export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
