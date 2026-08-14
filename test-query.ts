import { prisma } from "./lib/db";
async function test() {
  const biz = await prisma.business.findFirst({
    where: {
      OR: [
        { subdomain: "test" },
        { customDomain: "test" }
      ]
    }
  });
  console.log(biz?.logoUrl);
}
