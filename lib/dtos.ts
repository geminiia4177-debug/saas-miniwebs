import { User, Business } from "@prisma/client";

// ─── USER DTO ─────────────────────────────────────────────────────────────────
// SECURITY: Never return password, sessionVersion, failedLoginCount, or lockedUntil.
export const toSafeUserDTO = (user: Partial<User> & { lockedUntil?: number | Date }) => {
  const {
    password: _password,
    sessionVersion: _sessionVersion,
    failedLoginCount: _failedLoginCount,
    lockedUntil: _lockedUntil,
    ...safeUser
  } = user;
  return safeUser;
};

// ─── BUSINESS DTO ─────────────────────────────────────────────────────────────
// SECURITY (P0-001): NEVER decrypt or return secrets to the frontend.
// The frontend may only know IF a secret exists (boolean), not its value.
export const toSafeBusinessDTO = (
  business: Partial<Business>,
  _isOwnerOrAdmin = false
) => {
  const {
    callMeBotApiKey,
    bankDetails,
    paymentData: _paymentData,
    domainVerificationTokenHash: _domainVerificationTokenHash,
    ...safeBusiness
  } = business;

  return {
    ...safeBusiness,
    // Frontend can only know IF the secret exists, never its value.
    hasCallMeBotApiKey: !!callMeBotApiKey,
    hasBankDetails: !!bankDetails,
  };
};
