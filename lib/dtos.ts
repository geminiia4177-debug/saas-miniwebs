import { User, Business } from "@prisma/client";

export const toSafeUserDTO = (user: Partial<User>) => {
  const { password, sessionVersion, failedLoginCount, lockedUntil, ...safeUser } = user as any;
  return safeUser;
};

import { decryptSecret } from "@/lib/encryption";

export const toSafeBusinessDTO = (business: Partial<Business>, isOwnerOrAdmin = false) => {
  const { callMeBotApiKey, bankDetails, paymentData, ...safeBusiness } = business as any;
  
  if (isOwnerOrAdmin) {
    // Return decrypted secrets only to owner/admin
    return {
      ...safeBusiness,
      callMeBotApiKey: decryptSecret(callMeBotApiKey),
      bankDetails: decryptSecret(bankDetails),
      paymentData, // Usually JSON, maybe needs structured access
      hasBankDetails: !!bankDetails
    };
  }
  
  return {
    ...safeBusiness,
    hasBankDetails: !!bankDetails
  };
};
