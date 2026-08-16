import { prisma } from "../lib/db";
import { AppointmentService } from "../lib/appointment-service";

async function runRealConcurrencyTest() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("REAL CONCURRENT APPOINTMENT INTEGRATION TEST (P0-002)");
  console.log("════════════════════════════════════════════════════════════\n");

  const testSubdomain = `test-concurrency-${Date.now()}`;
  let testBusiness: any = null;

  try {
    // 1. Create a real test business in the database
    console.log("1. Creating test business with published 60-min service...");
    testBusiness = await prisma.business.create({
      data: {
        name: "Concurrency Test Barber",
        subdomain: testSubdomain,
        status: "ACTIVE",
        timezone: "America/Mexico_City",
        publishedConfig: {
          hours: {
            lunes: { open: true, from: "09:00", to: "18:00" },
            martes: { open: true, from: "09:00", to: "18:00" },
            miercoles: { open: true, from: "09:00", to: "18:00" },
            jueves: { open: true, from: "09:00", to: "18:00" },
            viernes: { open: true, from: "09:00", to: "18:00" },
            sabado: { open: true, from: "09:00", to: "18:00" },
            domingo: { open: true, from: "09:00", to: "18:00" },
          },
          barberiaServices: [
            { id: "srv-corte-vip", name: "Corte VIP", duration: 60, price: 500, active: true },
          ],
        },
      },
    });

    console.log(`   Created test business: ${testBusiness.id}`);

    // Pick a future date (next Monday at 10:00:00 UTC)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    futureDate.setUTCHours(16, 0, 0, 0); // 10:00 AM Mexico City (UTC-6)

    console.log(`2. Launching 2 simultaneous booking requests for ${futureDate.toISOString()} via Promise.all...`);

    const requestA = AppointmentService.createAppointment({
      businessId: testBusiness.id,
      clientName: "Cliente Concurrente 1",
      clientPhone: "5512345678",
      clientEmail: "cliente1@test.com",
      serviceId: "srv-corte-vip",
      serviceName: "Corte VIP",
      date: futureDate,
      source: "WEB",
    });

    const requestB = AppointmentService.createAppointment({
      businessId: testBusiness.id,
      clientName: "Cliente Concurrente 2",
      clientPhone: "5587654321",
      clientEmail: "cliente2@test.com",
      serviceId: "srv-corte-vip",
      serviceName: "Corte VIP",
      date: futureDate,
      source: "WEB",
    });

    const [resA, resB] = await Promise.all([requestA, requestB]);

    console.log("3. Responses received:");
    console.log("   Request A status:", resA.success ? "SUCCESS" : `ERROR ${resA.status}: ${resA.error}`);
    console.log("   Request B status:", resB.success ? "SUCCESS" : `ERROR ${resB.status}: ${resB.error}`);

    // Assertions
    const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
    const conflictCount = (resA.status === 409 ? 1 : 0) + (resB.status === 409 ? 1 : 0);

    console.log("\n4. Verifying database state...");
    const dbAppointments = await prisma.appointment.findMany({
      where: { businessId: testBusiness.id },
    });

    console.log(`   Total appointments in DB for this business: ${dbAppointments.length}`);

    if (successCount === 1 && conflictCount === 1 && dbAppointments.length === 1) {
      console.log("\n✅ PASS: Concurrency protection verified!");
      console.log("   - Exactly 1 appointment succeeded");
      console.log("   - Exactly 1 appointment received 409 conflict");
      console.log("   - Exactly 1 appointment persisted in database");
    } else {
      console.error("\n❌ FAIL: Concurrency anomaly detected!");
      console.error(`   - Expected 1 success, got ${successCount}`);
      console.error(`   - Expected 1 conflict (409), got ${conflictCount}`);
      console.error(`   - Expected 1 DB record, got ${dbAppointments.length}`);
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    // Cleanup
    if (testBusiness) {
      console.log("5. Cleaning up test data...");
      try {
        await prisma.appointment.deleteMany({ where: { businessId: testBusiness.id } });
        await prisma.whatsappMessageQueue.deleteMany({ where: { businessId: testBusiness.id } });
        await prisma.business.delete({ where: { id: testBusiness.id } });
        console.log("   Cleanup completed.");
      } catch (cleanErr) {
        console.warn("   Cleanup warning:", cleanErr);
      }
    }
    await prisma.$disconnect();
  }
}

runRealConcurrencyTest();
