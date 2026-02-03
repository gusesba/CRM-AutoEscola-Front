const PHONE_MESSAGE_ALLOWED = /^\s*\+?[\d()\s.-]+\s*$/;
const PHONE_IN_TEXT = /(\+?\d[\d()\s.-]{8,}\d)/g;

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

export function extractPhoneNumbers(text: string) {
  if (!text) return [];
  const matches = text.matchAll(PHONE_IN_TEXT);
  const results: { raw: string; digits: string }[] = [];

  for (const match of matches) {
    const raw = match[0];
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) continue;
    results.push({ raw, digits });
  }

  return results;
}

export function normalizePhoneDigits(text: string) {
  const digits = getPhoneDigits(text);
  if (!digits) return null;

  return digits.replace(/^(00)?55/, "");
}

export function buildPhoneVariants(digits: string) {
  const normalized = digits.replace(/\D/g, "").replace(/^(00)?55/, "");
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);
  variants.add(`55${normalized}`);

  if (normalized.length === 11 && normalized[2] === "9") {
    const withoutNine = `${normalized.slice(0, 2)}${normalized.slice(3)}`;
    variants.add(withoutNine);
    variants.add(`55${withoutNine}`);
  }

  if (normalized.length === 10) {
    const withNine = `${normalized.slice(0, 2)}9${normalized.slice(2)}`;
    variants.add(withNine);
    variants.add(`55${withNine}`);
  }

  return Array.from(variants);
}

export function isPhoneMatch(candidate: string, reference: string) {
  const candidateVariants = buildPhoneVariants(candidate);
  const referenceVariants = buildPhoneVariants(reference);

  return candidateVariants.some((variant) => referenceVariants.includes(variant));
}

export function isPhoneNumberMessage(text: string) {
  return Boolean(getPhoneDigits(text));
}
