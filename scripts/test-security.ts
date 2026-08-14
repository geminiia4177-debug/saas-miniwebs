import { NextRequest } from "next/server";
import { prisma } from "../lib/db";
import { GET as getCrmData } from "../app/api/crm/route";

// Hack to mock getServerSession in the test environment
let mockSession: any = null;
const nextAuthModule = require("next-auth/next");
nextAuthModule.getServerSession = async () => mockSession;

async function runTests() {
  console.log("Iniciando pruebas de aislamiento multi-tenant en API real...");
  try {
    // 1. Setup Test Users and Businesses
    const userA = await prisma.user.create({
      data: { email: `userA_${Date.now()}@test.com`, name: "User A", password: "pwd", role: "OWNER" }
    });
    const userB = await prisma.user.create({
      data: { email: `userB_${Date.now()}@test.com`, name: "User B", password: "pwd", role: "OWNER" }
    });

    const businessA = await prisma.business.create({
      data: { userId: userA.id, name: "Biz A", subdomain: `biza-${Date.now()}`, type: "general", email: "a@test.com", primaryColor: "#000", secondaryColor: "#fff", layoutConfig: {} }
    });
    
    const businessB = await prisma.business.create({
      data: { userId: userB.id, name: "Biz B", subdomain: `bizb-${Date.now()}`, type: "general", email: "b@test.com", primaryColor: "#000", secondaryColor: "#fff", layoutConfig: {} }
    });

    // Create a sale for Biz A
    await prisma.sale.create({
      data: { businessId: businessA.id, amount: 100, type: "SERVICE", itemName: "Service A" }
    });

    // 2. TEST: User B trying to access Biz A's CRM data
    console.log("Test: User B intenta acceder a ventas de Biz A...");
    mockSession = { user: { id: userB.id, role: "OWNER" } };
    
    // Using standard Request if NextRequest is problematic in node without Next.js server, but NextRequest should work if polyfilled
    const req1 = new Request(`http://localhost/api/crm?businessId=${businessA.id}&type=sales`);
    const res1 = await getCrmData(req1 as any);
    const body1 = await res1.json();
    
    if (res1.status === 403 || res1.status === 401 || body1.error) {
      console.log("✅ Aislamiento OK: User B no pudo acceder a Biz A.");
    } else {
      throw new Error(`User B pudo acceder a datos de Biz A: ${JSON.stringify(body1)}`);
    }

    // 3. TEST: User A accessing Biz A's CRM data
    console.log("Test: User A accede a ventas de Biz A...");
    mockSession = { user: { id: userA.id, role: "OWNER" } };
    const req2 = new Request(`http://localhost/api/crm?businessId=${businessA.id}&type=sales`);
    const res2 = await getCrmData(req2 as any);
    const body2 = await res2.json();
    
    if (res2.status === 200 && Array.isArray(body2) && body2.length === 1) {
      console.log("✅ Acceso OK: User A vio sus ventas correctamente.");
    } else {
      throw new Error(`User A no pudo acceder a sus ventas o datos incorrectos: ${JSON.stringify(body2)}`);
    }

    // Cleanup
    await prisma.business.deleteMany({ where: { id: { in: [businessA.id, businessB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
    
    console.log("✅ Todas las pruebas de seguridad pasaron correctamente.");
  } catch (error) {
    console.error("❌ Error en pruebas:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
