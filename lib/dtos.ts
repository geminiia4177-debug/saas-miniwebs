import { User, Business } from "@prisma/client";

export const toSafeUserDTO = (user: Partial<User>) => {
  const { password, sessionVersion, failedLoginCount, lockedUntil, ...safeUser } = user as any;
  return safeUser;
};

export const toSafeBusinessDTO = (business: Partial<Business>) => {
  const { callMeBotApiKey, bankDetails, paymentData, ...safeBusiness } = business as any;
  return safeBusiness;
};
