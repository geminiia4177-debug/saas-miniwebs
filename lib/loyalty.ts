import { prisma } from "@/lib/db";

export interface LoyaltyCardData {
  clientPhone: string;
  clientName: string;
  totalVisits: number;
  currentStamps: number;
  goal: number;
  reward: string;
  isRewardUnlocked: boolean;
  referralCode: string;
  referralShareUrl: string;
}

/**
 * Calculates real loyalty card status for a customer based on completed/confirmed appointments or orders.
 */
export async function getClientLoyaltyStatus(
  businessId: string,
  clientPhone: string,
  clientName?: string
): Promise<LoyaltyCardData | null> {
  try {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        subdomain: true,
        customDomain: true,
        layoutConfig: true,
        publishedConfig: true,
      },
    });

    if (!biz) return null;
    const config = (biz.publishedConfig || biz.layoutConfig || {}) as any;
    if (config.loyaltyEnabled === false) return null;

    const goal = Number(config.loyaltyGoal) || 6;
    const reward = config.loyaltyReward || "¡Corte o servicio de cortesía en tu próxima visita!";

    // Clean phone query
    const cleanDigits = clientPhone.replace(/\D/g, "");
    const searchSuffix = cleanDigits.slice(-8);

    // Count completed appointments
    const completedAppts = await prisma.appointment.count({
      where: {
        businessId,
        clientPhone: { contains: searchSuffix },
        status: { in: ["COMPLETED", "CONFIRMED"] },
      },
    });

    // Count completed orders
    const completedOrders = await prisma.order.count({
      where: {
        businessId,
        customerPhone: { contains: searchSuffix },
        status: { in: ["COMPLETED", "CONFIRMED"] },
      },
    });

    const totalVisits = completedAppts + completedOrders;
    const currentStamps = totalVisits % goal;
    const isRewardUnlocked = totalVisits > 0 && currentStamps === 0;

    // Build referral code
    const refCode = `ref_${searchSuffix || "vip"}`;
    const domain = biz.customDomain || `${biz.subdomain}.saas-miniwebs.com`;
    const referralShareUrl = `https://${domain}?ref=${refCode}`;

    return {
      clientPhone,
      clientName: clientName || "Cliente",
      totalVisits,
      currentStamps: isRewardUnlocked ? goal : currentStamps,
      goal,
      reward,
      isRewardUnlocked,
      referralCode: refCode,
      referralShareUrl,
    };
  } catch (err: any) {
    console.error("Error calculando estado de fidelización:", err?.message || err);
    return null;
  }
}
