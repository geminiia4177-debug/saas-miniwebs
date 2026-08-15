import { PrismaClient } from '@prisma/client';
import { ownerBusinessUpdateSchema, adminBusinessUpdateSchema } from './lib/validations';

const prisma = new PrismaClient();

async function run() {
  const biz = await prisma.business.findUnique({
    where: { id: "cmsuh0l8t00057hzx8wase2tz" }
  });

  if (!biz) {
    console.log("Business not found");
    return;
  }

  // Simulate what the frontend does
  const payload = {
    ...biz,
    bannerUrl: "https://i.ibb.co/example.png",
    layoutConfig: {
      ...(biz.layoutConfig as any || {}),
      sections: [],
      media: [],
      bannerOpacity: 40,
    },
    publish: false
  };

  console.log("PAYMENT AMOUNT:", typeof payload.paymentAmount, payload.paymentAmount);
  console.log("DEMO EXPIRES AT:", typeof payload.demoExpiresAt, payload.demoExpiresAt);
  console.log("NEXT PAYMENT:", typeof payload.nextPayment, payload.nextPayment);

  const parseResult = adminBusinessUpdateSchema.safeParse(payload);
  if (!parseResult.success) {
    console.error("ZOD PARSE ERROR", JSON.stringify(parseResult.error.format(), null, 2));
  } else {
    console.log("No errors in frontend payload!");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
