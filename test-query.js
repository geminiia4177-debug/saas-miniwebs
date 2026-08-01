const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.business.findFirst({where:{subdomain:'lagorda'}})
  .then(b => console.log('IG:', b.instagram, 'WA:', b.whatsapp, 'FB:', b.facebook, 'TK:', b.tiktok))
  .catch(console.error)
  .finally(()=>prisma.$disconnect());
