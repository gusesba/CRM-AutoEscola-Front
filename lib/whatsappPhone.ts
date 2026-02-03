const PHONE_MESSAGE_ALLOWED = /^\s*\+?[\d()\s.-]+\s*$/;

export function getPhoneDigits(text: string) {
  if (!text || !PHONE_MESSAGE_ALLOWED.test(text)) {
    return null;
  }

  const digits = text.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

export function normalizePhoneDigits(text: string) {
  const digits = getPhoneDigits(text);
  if (!digits) return null;

  return digits.replace(/^(00)?55/, "");
}

export function isPhoneNumberMessage(text: string) {
  return Boolean(getPhoneDigits(text));
}
