import { User, Business } from "@prisma/client";

// ─── USER DTO ─────────────────────────────────────────────────────────────────
// SECURITY: Never return password, sessionVersion, failedLoginCount, or lockedUntil.
export const toSafeUserDTO = (user: Partial<User>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, sessionVersion, failedLoginCount, lockedUntil, ...safeUser } = user as any;
  return safeUser;
};

// ─── BUSINESS DTO ─────────────────────────────────────────────────────────────
// SECURITY (P0-001): NEVER decrypt or return secrets to the frontend.
// The frontend may only know IF a secret exists (boolean), not its value.
// decryptSecret() must NEVER be called here — only in server-side logic
// that calls the external provider directly (e.g. CallMeBot, WhatsApp).
export const toSafeBusinessDTO = (
  business: Partial<Business>,
  // isOwnerOrAdmin parameter is kept for API compatibility but no longer
  // grants access to decrypted secrets — both owner and admin only receive booleans.
  _isOwnerOrAdmin = false
) => {
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callMeBotApiKey,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    bankDetails,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    paymentData: _paymentData,
    ...safeBusiness
  } = business as any;

  return {
    ...safeBusiness,
    // Frontend can only know IF the secret exists, never its value.
    hasCallMeBotApiKey: !!callMeBotApiKey,
    hasBankDetails: !!bankDetails,
    // paymentData is intentionally excluded — it may contain sensitive billing info.
  };
};
