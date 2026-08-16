/**
 * Centralized Phone Normalization & WhatsApp JID Utilities (P1-004 & P1-005)
 */

/**
 * Normalizes a given phone string into a clean digit-only E.164-compatible format.
 * - Handles leading '+' or non-digit characters.
 * - For 10-digit numbers with defaultCountry 'MX', prepends Mexico country code '52'.
 * - Preserves existing country codes for international numbers.
 */
export function normalizePhoneToE164(rawPhone: string | null | undefined, defaultCountry: "MX" | "AR" | "ES" | "US" = "MX"): string {
  if (!rawPhone || typeof rawPhone !== "string") return "";

  const trimmed = rawPhone.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) return "";

  // 10 digits: Mexican local number standard
  if (digitsOnly.length === 10) {
    if (defaultCountry === "MX") {
      return `52${digitsOnly}`;
    }
    if (defaultCountry === "US") {
      return `1${digitsOnly}`;
    }
  }

  // Already prefixed with Mexican country code (52 + 10 digits = 12 digits, or mobile 521 = 13 digits)
  if (digitsOnly.startsWith("52") && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    return digitsOnly;
  }

  // Argentine format (54 + 9 + 10 digits = 13 digits, or 54 + 10 digits = 12 digits)
  if (digitsOnly.startsWith("54")) {
    return digitsOnly;
  }

  // Spanish format (34 + 9 digits = 11 digits)
  if (digitsOnly.startsWith("34") && digitsOnly.length === 11) {
    return digitsOnly;
  }

  // US/Canada format (1 + 10 digits = 11 digits)
  if (digitsOnly.startsWith("1") && digitsOnly.length === 11) {
    return digitsOnly;
  }

  // Return cleaned digits for other international formats
  return digitsOnly;
}

/**
 * Converts a phone number to WhatsApp JID (@s.whatsapp.net) format.
 */
export function phoneToWhatsAppJid(rawPhone: string | null | undefined, defaultCountry: "MX" | "AR" | "ES" | "US" = "MX"): string {
  const normalized = normalizePhoneToE164(rawPhone, defaultCountry);
  if (!normalized) return "";
  return `${normalized}@s.whatsapp.net`;
}
