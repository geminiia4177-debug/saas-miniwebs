/**
 * Centralized Phone Normalization & WhatsApp JID Utilities (CommonJS for server.js)
 */

function normalizePhoneToE164(rawPhone, defaultCountry = "MX") {
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

function phoneToWhatsAppJid(rawPhone, defaultCountry = "MX") {
  const normalized = normalizePhoneToE164(rawPhone, defaultCountry);
  if (!normalized) return "";
  return `${normalized}@s.whatsapp.net`;
}

module.exports = {
  normalizePhoneToE164,
  phoneToWhatsAppJid,
};
