export function validateEmail(value: string) {
  if (value.length === 0) return '';
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return valid ? '' : 'Enter a valid email address';
}
