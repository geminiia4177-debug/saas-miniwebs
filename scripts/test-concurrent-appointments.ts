import { prisma } from "../lib/db";
import { AppointmentService } from "../lib/appointment-service";
import { Business } from "@prisma/client";

// P1-010 & P1-011: Strict production guard
if (process.env.NODE_ENV === "production") {
  console.error("FATAL: Cannot run integration/concurrency tests in production environment!");
  process.exit(1);
}

async function runRealConcurrencyTest() {
  console.log("\n════════════════════════════════════════════════════════════");
  console.log("REAL CONCURRENCY & INTEGRATION TEST (P0-001, P0-002, P1-001, P1-002)");
  console.log("════════════════════════════════════════════════════════════\n");

  const testSubdomain = `test-concurrency-${Date.now()}`;
  let testBusiness: Business | null = null;

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
            { id: "srv-barba", name: "Perfilado Barba", duration: 30, price: 250, active: true },
          ],
        },
      },
    });

    console.log(`   Created test business: ${testBusiness.id}`);

    // Pick a future date (next Monday at 10:00:00 UTC)
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    futureDate.setUTCHours(16, 0, 0, 0); // 10:00 AM Mexico City (UTC-6)

    console.log(`2. P0-002: Launching 2 simultaneous booking requests for ${futureDate.toISOString()} via Promise.all...`);

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

    // Assertions for P0-002
    const successCount = (resA.success ? 1 : 0) + (resB.success ? 1 : 0);
    const conflictCount = (resA.status === 409 ? 1 : 0) + (resB.status === 409 ? 1 : 0);

    const dbAppointments = await prisma.appointment.findMany({
      where: { businessId: testBusiness.id },
    });

    console.log(`   Total appointments in DB for this business: ${dbAppointments.length}`);

    if (successCount === 1 && conflictCount === 1 && dbAppointments.length === 1) {
      console.log("   ✅ PASS (P0-002): Concurrent appointment race condition prevented! Exactly 1 created, 1 rejected with 409.");
    } else {
      console.error("   ❌ FAIL (P0-002): Concurrency anomaly detected!");
      process.exit(1);
    }

    // 4. P0-001: Concurrent Reminder Claim Test with Recoverable Lease
    console.log("\n4. P0-001: Testing concurrent atomic reminder claims with recoverable lease...");
    const existingAppt = dbAppointments[0];
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const claim1Promise = prisma.appointment.updateMany({
      where: {
        id: existingAppt.id,
        reminderSent: false,
        OR: [
          { reminderClaimedAt: null },
          { reminderClaimedAt: { lt: fiveMinutesAgo } },
        ],
      },
      data: { reminderClaimedAt: new Date() },
    });
    const claim2Promise = prisma.appointment.updateMany({
      where: {
        id: existingAppt.id,
        reminderSent: false,
        OR: [
          { reminderClaimedAt: null },
          { reminderClaimedAt: { lt: fiveMinutesAgo } },
        ],
      },
      data: { reminderClaimedAt: new Date() },
    });

    const [claim1, claim2] = await Promise.all([claim1Promise, claim2Promise]);
    console.log(`   Worker 1 claim count: ${claim1.count}, Worker 2 claim count: ${claim2.count}`);

    if ((claim1.count === 1 && claim2.count === 0) || (claim1.count === 0 && claim2.count === 1)) {
      console.log("   ✅ PASS (P0-001): Reminder atomic claim verified! Exactly 1 worker acquired the reminder.");
    } else {
      console.error("   ❌ FAIL (P0-001): Reminder double claim anomaly detected!");
      process.exit(1);
    }

    // 4b. Test lease recovery for reminder (simulating worker crash > 5 min ago)
    console.log("\n4b. P0-001: Testing reminder lease recovery after 6-minute timeout...");
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    await prisma.appointment.update({
      where: { id: existingAppt.id },
      data: { reminderClaimedAt: sixMinutesAgo },
    });

    const recoveryClaim = await prisma.appointment.updateMany({
      where: {
        id: existingAppt.id,
        reminderSent: false,
        OR: [
          { reminderClaimedAt: null },
          { reminderClaimedAt: { lt: fiveMinutesAgo } },
        ],
      },
      data: { reminderClaimedAt: new Date() },
    });

    if (recoveryClaim.count === 1) {
      console.log("   ✅ PASS (P0-001): Stalled reminder successfully recovered by new worker after lease timeout!");
    } else {
      console.error("   ❌ FAIL (P0-001): Stalled reminder was NOT recovered!");
      process.exit(1);
    }

    // 5. P1-001: Step Grid Alignment Validation
    console.log("\n5. P1-001: Testing step grid alignment for 60-min service at 10:30...");
    const nonAlignedDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    nonAlignedDate.setUTCHours(16, 30, 0, 0); // 10:30 AM (not aligned to 60-min grid)

    const stepTestRes = await AppointmentService.createAppointment({
      businessId: testBusiness.id,
      clientName: "Cliente Step Test",
      clientPhone: "5512345678",
      serviceId: "srv-corte-vip", // 60 min
      serviceName: "Corte VIP",
      date: nonAlignedDate,
      source: "WEB",
    });

    if (stepTestRes.status === 400) {
      console.log("   ✅ PASS (P1-001): 60-min service at 10:30 correctly rejected with 400!");
    } else {
      console.error(`   ❌ FAIL (P1-001): Expected 400 for 10:30 slot on 60m service, got:`, stepTestRes);
      process.exit(1);
    }

    // 6. P1-002: Nonexistent Service Rejection
    console.log("\n6. P1-002: Testing nonexistent service rejection...");
    const nonexistentDate = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
    nonexistentDate.setUTCHours(17, 0, 0, 0); // 11:00 AM

    const nonexistentRes = await AppointmentService.createAppointment({
      businessId: testBusiness.id,
      clientName: "Cliente Inexistente Test",
      clientPhone: "5512345678",
      serviceId: "srv-fantasma-999",
      serviceName: "Servicio Fantasma",
      date: nonexistentDate,
      source: "WEB",
    });

    if (nonexistentRes.status === 400) {
      console.log("   ✅ PASS (P1-002): Nonexistent service correctly rejected with 400!");
    } else {
      console.error(`   ❌ FAIL (P1-002): Expected 400 for nonexistent service, got:`, nonexistentRes);
      process.exit(1);
    }

    console.log("\n════════════════════════════════════════════════════════════");
    console.log("ALL REAL DATABASE INTEGRATION TESTS PASSED SUCCESSFULLY! ✅");
    console.log("════════════════════════════════════════════════════════════\n");

  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    // Cleanup
    if (testBusiness) {
      console.log("Cleaning up test data...");
      try {
        await prisma.appointment.deleteMany({ where: { businessId: testBusiness.id } });
        await prisma.whatsappMessageQueue.deleteMany({ where: { businessId: testBusiness.id } });
        await prisma.business.delete({ where: { id: testBusiness.id } });
        console.log("Cleanup completed.");
      } catch (cleanErr) {
        console.warn("Cleanup warning:", cleanErr);
      }
    }
    await prisma.$disconnect();
  }
}

runRealConcurrencyTest();
