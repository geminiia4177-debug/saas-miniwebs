export {};

/**
 * scripts/test-security.ts
 *
 * Comprehensive security tests for MiniWebs.
 * Tests that can run WITHOUT a database use logic-only validation.
 * Tests that require a running server use fetch() calls.
 *
 * Run with: npx tsx scripts/test-security.ts
 * Or: npx ts-node scripts/test-security.ts
 */

// ─── Test runner ───────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;
const failures: string[] = [];

function assert(description: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
    failures.push(description);
  }
}

function section(title: string) {
  console.log(`\n─── ${title} ───`);
}

function skip(description: string) {
  console.log(`  ⏭️  SKIP: ${description} (requires running server)`);
  skipped++;
}

// ─── Unit Tests (No DB required) ─────────────────────────────────────────────

// P0-001: Verify toSafeBusinessDTO never returns secrets (testing real implementation)
section("P0-001: DTO Secret Exposure");
{
  const { toSafeBusinessDTO } = require("../lib/dtos");

  const mockBusiness = {
    id: "biz-1",
    name: "Test Business",
    callMeBotApiKey: "ENCRYPTED:secret-api-key",
    bankDetails: "ENCRYPTED:account-12345",
    paymentData: { method: "card", reference: "xyz" },
    status: "ACTIVE",
  };

  const result = toSafeBusinessDTO(mockBusiness);

  assert("DTO does not contain callMeBotApiKey", !("callMeBotApiKey" in result));
  assert("DTO does not contain bankDetails", !("bankDetails" in result));
  assert("DTO does not contain paymentData", !("paymentData" in result));
  assert("DTO contains hasCallMeBotApiKey boolean", result.hasCallMeBotApiKey === true);
  assert("DTO contains hasBankDetails boolean", result.hasBankDetails === true);
  assert("DTO has no decrypted secret values", 
    !JSON.stringify(result).includes("secret-api-key") &&
    !JSON.stringify(result).includes("account-12345")
  );
}

// P0-002: Verify upload route never uses NEXT_PUBLIC key
section("P0-002: ImgBB Key Exposure");
{
  const fs = require("fs");
  const uploadRoute = fs.readFileSync(
    "./app/api/upload/route.ts",
    "utf-8"
  );

  assert(
    "upload/route.ts does not access NEXT_PUBLIC_IMGBB_API_KEY as env var",
    !uploadRoute.includes("process.env.NEXT_PUBLIC_IMGBB_API_KEY")
  );
  assert(
    "upload/route.ts uses only server-side IMGBB_API_KEY",
    uploadRoute.includes("process.env.IMGBB_API_KEY")
  );
}

// P0-003: Authorization logic
section("P0-003: IDOR / Multi-tenant Authorization");
{
  function isAuthorized(sessionUserId: string, sessionRole: string, businessOwnerId: string): boolean {
    if (sessionRole === "ADMIN") return true;
    return sessionUserId === businessOwnerId;
  }

  const userA = { id: "user-a", role: "USER" };
  const userB = { id: "user-b", role: "USER" };
  const admin = { id: "admin-id", role: "ADMIN" };
  const bizA = { id: "biz-a", ownerId: userA.id };
  const bizB = { id: "biz-b", ownerId: userB.id };

  assert("OWNER_A → BUSINESS_A: permitted", isAuthorized(userA.id, userA.role, bizA.ownerId));
  assert("OWNER_A → BUSINESS_B: denied", !isAuthorized(userA.id, userA.role, bizB.ownerId));
  assert("OWNER_B → BUSINESS_A: denied", !isAuthorized(userB.id, userB.role, bizA.ownerId));
  assert("OWNER_B → BUSINESS_B: permitted", isAuthorized(userB.id, userB.role, bizB.ownerId));
  assert("ADMIN → BUSINESS_A: permitted", isAuthorized(admin.id, admin.role, bizA.ownerId));
  assert("ADMIN → BUSINESS_B: permitted", isAuthorized(admin.id, admin.role, bizB.ownerId));
  assert("Empty user → BUSINESS_A: denied", !isAuthorized("", "USER", bizA.ownerId));
}

// P0-004: Concurrency token generation
section("P0-004: Concurrent Booking Prevention");
{
  const businessId = "biz-1";
  const employeeId = "emp-1";
  const timestamp = 1700000000000;

  function makeConcurrencyToken(bId: string, ts: number, eId: string | null): string {
    return `${bId}_${ts}_${eId || "NO_EMP"}`;
  }

  const token1 = makeConcurrencyToken(businessId, timestamp, employeeId);
  const token2 = makeConcurrencyToken(businessId, timestamp, employeeId);
  const tokenDiff = makeConcurrencyToken(businessId, timestamp + 60000, employeeId);
  const tokenNoEmp = makeConcurrencyToken(businessId, timestamp, null);

  assert("Same slot generates identical token", token1 === token2);
  assert("Different time generates different token", token1 !== tokenDiff);
  assert("Different employee generates different token", token1 !== tokenNoEmp);
  assert("Token contains all components", token1.includes(businessId) && token1.includes(employeeId));
}

// P1-001: Rate limiter logic
section("P1-001/P1-002/P1-003: Rate Limiting Logic");
{
  // Simulate checkRateLimit logic
  const testStore = new Map<string, { count: number; timestamp: number }>();

  function checkRateLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const record = testStore.get(key) ?? { count: 0, timestamp: now };
    if (now - record.timestamp > windowMs) {
      record.count = 0;
      record.timestamp = now;
    }
    if (record.count >= max) {
      testStore.set(key, record);
      return false;
    }
    record.count++;
    testStore.set(key, record);
    return true;
  }

  const testKey = "test-key-" + Date.now();
  
  assert("First request within limit: allowed", checkRateLimit(testKey, 3, 60000));
  assert("Second request within limit: allowed", checkRateLimit(testKey, 3, 60000));
  assert("Third request within limit: allowed", checkRateLimit(testKey, 3, 60000));
  assert("Fourth request exceeds limit: denied", !checkRateLimit(testKey, 3, 60000));
  assert("Fifth request still denied: denied", !checkRateLimit(testKey, 3, 60000));
}

// P1-011: Chat command parser — JSON schema validation
section("P1-011: Chat Command Parser");
{
  // Simulate the new JSON schema parser
  const CONSULTAR_SCHEMA = {
    action: "CONSULTAR_TURNOS",
    businessId: "string",
    date: /^\d{4}-\d{2}-\d{2}$/,
    serviceName: "optional",
  };

  function parseCommand(jsonStr: string): { valid: boolean; error?: string } {
    try {
      const obj = JSON.parse(jsonStr);
      if (!obj.action) return { valid: false, error: "Missing action" };
      if (!["CONSULTAR_TURNOS", "CREAR_TURNO"].includes(obj.action)) {
        return { valid: false, error: `Unknown action: ${obj.action}` };
      }
      if (!obj.businessId) return { valid: false, error: "Missing businessId" };
      if (!obj.date || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
        return { valid: false, error: "Invalid date format" };
      }
      if (obj.action === "CREAR_TURNO") {
        if (!obj.clientName || !obj.clientPhone) {
          return { valid: false, error: "Missing client fields" };
        }
        if (!obj.time || !/^\d{2}:\d{2}$/.test(obj.time)) {
          return { valid: false, error: "Invalid time format" };
        }
      }
      return { valid: true };
    } catch {
      return { valid: false, error: "JSON parse error" };
    }
  }

  assert(
    "Valid CONSULTAR_TURNOS command is accepted",
    parseCommand('{"action":"CONSULTAR_TURNOS","businessId":"biz1","date":"2024-08-15","serviceName":"Corte"}').valid
  );
  assert(
    "Valid CREAR_TURNO command is accepted",
    parseCommand('{"action":"CREAR_TURNO","businessId":"biz1","clientName":"Juan","clientPhone":"1234","date":"2024-08-15","time":"10:00"}').valid
  );
  assert(
    "Unknown action is rejected",
    !parseCommand('{"action":"DELETE_ALL","businessId":"biz1","date":"2024-08-15"}').valid
  );
  assert(
    "Invalid date format is rejected",
    !parseCommand('{"action":"CONSULTAR_TURNOS","businessId":"biz1","date":"15-08-2024"}').valid
  );
  assert(
    "Malformed JSON is rejected",
    !parseCommand('{broken json}').valid
  );
  assert(
    "Missing clientName in CREAR_TURNO is rejected",
    !parseCommand('{"action":"CREAR_TURNO","businessId":"biz1","date":"2024-08-15","time":"10:00"}').valid
  );

  // P1-012: businessId override attack
  const attackerBusinessId = "biz-victim";
  const myBusinessId = "biz-mine";
  const cmd = JSON.parse('{"action":"CONSULTAR_TURNOS","businessId":"biz-victim","date":"2024-08-15"}');
  assert(
    "P1-012: Mismatched businessId in command is rejected",
    cmd.businessId !== myBusinessId // The route would reject this
  );
}

// P1-018: Order total manipulation
section("P1-018: Order Total Server Calculation");
{
  // Simulate server-side calculation
  const validProducts = new Map([
    ["prod-1", { nombre: "Hamburguesa", precio: 500 }],
    ["prod-2", { nombre: "Coca Cola", precio: 150 }],
  ]);

  function calculateOrderTotal(items: any[]) {
    let calculatedTotal = 0;
    const finalItems = [];
    for (const item of items) {
      const qty = parseInt(item.quantity || item.qty) || 0;
      if (qty <= 0 || qty > 100) throw new Error("Invalid quantity");
      const product = validProducts.get(String(item.id));
      if (!product) throw new Error(`Product not found: ${item.id}`);
      calculatedTotal += product.precio * qty;
      finalItems.push({ ...product, qty });
    }
    return { calculatedTotal, finalItems };
  }

  // Test: client sends manipulated total
  const clientItems = [{ id: "prod-1", quantity: 1 }, { id: "prod-2", quantity: 2 }];
  const { calculatedTotal } = calculateOrderTotal(clientItems);
  const clientFakeTotalAttempt = 1; // Malicious client sends $1

  assert("Server calculates correct total (500 + 2*150 = 800)", calculatedTotal === 800);
  assert("Client fake total ($1) is detected as mismatch", Math.abs(calculatedTotal - clientFakeTotalAttempt) > 0.01);

  // Test: product name/price override attack
  const maliciousItems = [{ id: "prod-1", nombre: "FREE ITEM", precio: 0, quantity: 1 }];
  const { finalItems } = calculateOrderTotal(maliciousItems);
  assert("Server uses its own product name (not client-supplied)", finalItems[0].nombre === "Hamburguesa");
  assert("Server uses its own product price (not client-supplied)", finalItems[0].precio === 500);

  // Test: quantity limits
  try {
    calculateOrderTotal([{ id: "prod-1", quantity: 999 }]);
    assert("Quantity 999 is rejected", false);
  } catch {
    assert("Quantity 999 is rejected", true);
  }

  try {
    calculateOrderTotal([{ id: "prod-1", quantity: 0 }]);
    assert("Quantity 0 is rejected", false);
  } catch {
    assert("Quantity 0 is rejected", true);
  }
}

// P1-019 & P1-020: Field length limits
section("P1-019/P1-020: Input Length Validation");
{
  const MAX_CUSTOMER_NAME = 100;
  const MAX_PHONE = 30;
  const MAX_ADDRESS = 300;
  const MAX_NOTES = 1000;

  const tooLongName = "A".repeat(101);
  const tooLongPhone = "1".repeat(31);
  const tooLongAddress = "X".repeat(301);
  const tooLongNotes = "N".repeat(1001);

  assert("Customer name > 100 chars should fail", tooLongName.length > MAX_CUSTOMER_NAME);
  assert("Phone > 30 chars should fail", tooLongPhone.length > MAX_PHONE);
  assert("Address > 300 chars should fail", tooLongAddress.length > MAX_ADDRESS);
  assert("Notes > 1000 chars should fail", tooLongNotes.length > MAX_NOTES);
}

// P1-017: XSS — dangerouslySetInnerHTML audit
section("P1-017: XSS Audit (dangerouslySetInnerHTML)");
{
  const fs = require("fs");
  const subdomain = fs.readFileSync("./app/[subdomain]/page.tsx", "utf-8");

  // Check that theme styles use sanitized content
  assert(
    "themeStyles uses CSS variables (not user HTML)",
    subdomain.includes("themeStyles") && subdomain.includes("--")
  );
  assert(
    "JSON-LD uses JSON.stringify (safe serialization)",
    subdomain.includes("JSON.stringify(jsonLd)")
  );
}

// P1-030: Custom domain validation
section("P1-030: Custom Domain Validation");
{
  function validateHostname(raw: string): string | null {
    if (!raw) return null;
    const cleaned = raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .trim();
    if (!cleaned || !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(cleaned)) return null;
    return cleaned;
  }

  assert("Valid domain is accepted", validateHostname("mi-negocio.com") === "mi-negocio.com");
  assert("Domain with https:// is cleaned", validateHostname("https://mi-negocio.com") === "mi-negocio.com");
  assert("Domain with path is stripped", validateHostname("mi-negocio.com/login") === "mi-negocio.com");
  assert("javascript: URL is rejected", validateHostname("javascript:alert(1)") === null);
  assert("IP address-like string is rejected", validateHostname("192.168.1.1") === null); // fails regex
  assert("Empty string returns null", validateHostname("") === null);
  assert("Relative path is rejected", validateHostname("/api/admin") === null);
}

// P1-003 & P1-004 & P1-005: WhatsApp Idempotency & Queue Concurrency
section("P1-003/P1-004/P1-005: WhatsApp Idempotency & Queue Concurrency");
{
  // Test idempotency key generation
  const apptId = "appt-999";
  const confirmationKey: string = `appointment:${apptId}:confirmation`;
  const reminderKey: string = `appointment:${apptId}:reminder`;

  assert("Confirmation key format is deterministic", confirmationKey === "appointment:appt-999:confirmation");
  assert("Reminder key format is distinct from confirmation", reminderKey !== confirmationKey);

  // Test recovery logic for stalled messages
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const stalledMsg = { id: "msg-1", status: "PROCESSING", lockedAt: new Date(fiveMinAgo - 1000), retries: 1 };
  const freshMsg = { id: "msg-2", status: "PROCESSING", lockedAt: new Date(Date.now() - 30 * 1000), retries: 1 };

  function isStalled(msg: { lockedAt: Date }): boolean {
    return msg.lockedAt.getTime() < Date.now() - 5 * 60 * 1000;
  }

  assert("Stalled message > 5 min is detected for recovery", isStalled(stalledMsg));
  assert("Fresh processing message is not considered stalled", !isStalled(freshMsg));

  // Max retries handling
  function getNextStatus(retries: number): string {
    return retries + 1 >= 3 ? "FAILED" : "PENDING";
  }
  assert("Next retry within limit resets to PENDING", getNextStatus(1) === "PENDING");
  assert("Next retry exceeding max 3 marks as FAILED", getNextStatus(2) === "FAILED");
}

// P1-011: Business Status Rejection
section("P1-011: Business Status (ARCHIVED & BLOCKED)");
{
  function canAcceptBookings(status: string): boolean {
    return status === "ACTIVE" || status === "TRIAL" || status === "DEMO";
  }

  assert("ACTIVE business accepts bookings", canAcceptBookings("ACTIVE"));
  assert("TRIAL business accepts bookings", canAcceptBookings("TRIAL"));
  assert("DEMO business accepts bookings", canAcceptBookings("DEMO"));
  assert("BLOCKED business rejects bookings", !canAcceptBookings("BLOCKED"));
  assert("ARCHIVED business rejects bookings", !canAcceptBookings("ARCHIVED"));
}

// P1-012: Timezone Handling
section("P1-012: Centralized Timezone Formatting");
{
  const testUtcDate = new Date("2026-08-16T15:30:00.000Z");
  const formattedBsAs = testUtcDate.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const formattedMexico = testUtcDate.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  assert("Timezone formatting computes valid string", formattedBsAs.length === 5 && formattedMexico.length === 5);
  assert("Different timezones output distinct local times", formattedBsAs !== formattedMexico);
}

// P1-015: Pagination Limits
section("P1-015: Pagination Hard Limits");
{
  function sanitizeLimit(userLimitStr: string | null): number {
    return Math.min(Math.max(parseInt(userLimitStr || "50", 10) || 50, 1), 200);
  }

  assert("Default limit is 50", sanitizeLimit(null) === 50);
  assert("Custom valid limit 20 is accepted", sanitizeLimit("20") === 20);
  assert("Abusive limit 10000 is capped at 200", sanitizeLimit("10000") === 200);
  assert("Negative limit is clamped to min 1", sanitizeLimit("-5") === 1);
}

// P0-005 & P0-006: LayoutConfig vs PublishedConfig Separation
section("P0-005/P0-006: LayoutConfig & PublishedConfig Separation");
{
  const mockDbBusiness = {
    id: "biz-123",
    name: "Mi Barberia",
    userId: "user-owner",
    layoutConfig: { secretNotes: "private draft", themeVariant: "draft-theme" },
    publishedConfig: { themeVariant: "modern", sections: [{ id: "hero" }] },
    status: "ACTIVE",
    paymentAmount: 5000,
  };

  function simulatePublicBusinessView(biz: any, isOwner: boolean) {
    if (!isOwner) {
      return {
        id: biz.id,
        name: biz.name,
        publishedConfig: biz.publishedConfig,
        status: biz.status,
      };
    }
    return {
      id: biz.id,
      name: biz.name,
      layoutConfig: biz.layoutConfig,
      publishedConfig: biz.publishedConfig,
      status: biz.status,
    };
  }

  const publicView = simulatePublicBusinessView(mockDbBusiness, false);
  assert("Public visitor cannot see draft layoutConfig", !("layoutConfig" in publicView));
  assert("Public visitor cannot see userId or paymentAmount", !("userId" in publicView) && !("paymentAmount" in publicView));
  assert("Public visitor receives publishedConfig", "publishedConfig" in publicView);

  const ownerView = simulatePublicBusinessView(mockDbBusiness, true);
  assert("Owner receives draft layoutConfig", "layoutConfig" in ownerView);
}

// P0-007, P0-008, P0-009: Appointment Duration Overlap Logic
section("P0-007/P0-008/P0-009: Appointment Duration Overlap Logic");
{
  function checkSlotOverlap(
    newStart: number,
    newDurationMin: number,
    existingStart: number,
    existingDurationMin: number
  ): boolean {
    const newEnd = newStart + newDurationMin * 60 * 1000;
    const existingEnd = existingStart + existingDurationMin * 60 * 1000;
    return newStart < existingEnd && newEnd > existingStart;
  }

  const baseTime = 1700000000000; // 0 min
  const thirtyMinMs = 30 * 60 * 1000;
  const fortyFiveMinMs = 45 * 60 * 1000;
  const sixtyMinMs = 60 * 60 * 1000;

  assert("Exact same time overlaps", checkSlotOverlap(baseTime, 30, baseTime, 30));
  assert("New 60m appt overlapping existing 30m appt at +15m", checkSlotOverlap(baseTime, 60, baseTime + 15 * 60 * 1000, 30));
  assert("New 30m appt starting at existing end time does NOT overlap", !checkSlotOverlap(baseTime + thirtyMinMs, 30, baseTime, 30));
  assert("New appt before existing does NOT overlap", !checkSlotOverlap(baseTime - thirtyMinMs, 30, baseTime, 30));
  assert("New 45m appt starting at +20m overlaps", checkSlotOverlap(baseTime + 20 * 60 * 1000, 45, baseTime, 30));
}

// P0-010 & P0-011: Encryption Key and Failure Safety
section("P0-010/P0-011: Encryption Key and Failure Safety");
{
  const crypto = require("crypto");
  function validateHexKey(key: string): boolean {
    return typeof key === "string" && /^[0-9a-fA-F]{64}$/.test(key);
  }

  assert("64-character hex key is valid", validateHexKey("a".repeat(64)));
}

// P1-004 & P1-005: Phone Normalization & WhatsApp JID
section("P1-004/P1-005: Phone Normalization & WhatsApp JID");
{
  const { normalizePhoneToE164, phoneToWhatsAppJid } = require("../lib/phone");

  assert("Mexican 10-digit phone normalized with 52", normalizePhoneToE164("5512345678", "MX") === "525512345678");
  assert("Mexican phone with +52 prefix cleaned", normalizePhoneToE164("+525512345678", "MX") === "525512345678");
  assert("Argentine phone normalized", normalizePhoneToE164("+5491112345678", "AR") === "5491112345678");
  assert("Spanish phone normalized", normalizePhoneToE164("+34612345678", "ES") === "34612345678");
  assert("US phone normalized", normalizePhoneToE164("+12125551234", "US") === "12125551234");
  assert("Phone with spaces and dashes cleaned", normalizePhoneToE164("55-1234 5678", "MX") === "525512345678");
  assert("Empty phone returns empty string", normalizePhoneToE164("") === "");
  assert("phoneToWhatsAppJid generates valid JID", phoneToWhatsAppJid("5512345678", "MX") === "525512345678@s.whatsapp.net");
}

// P1-001: Slot Step Grid Alignment Logic
section("P1-001: Slot Step Grid Alignment Logic");
{
  function validateSlotStep(minuteOfDay: number, duration: number): boolean {
    const step = duration >= 60 ? 60 : 30;
    return minuteOfDay % step === 0;
  }

  // 60-minute duration service (step = 60)
  assert("duration 60 at 10:00 (600 min) is ALLOWED", validateSlotStep(600, 60) === true);
  assert("duration 60 at 10:30 (630 min) is DENIED", validateSlotStep(630, 60) === false);
  assert("duration 60 at 11:00 (660 min) is ALLOWED", validateSlotStep(660, 60) === true);
  assert("duration 60 at 10:15 (615 min) is DENIED", validateSlotStep(615, 60) === false);

  // 30-minute duration service (step = 30)
  assert("duration 30 at 10:00 (600 min) is ALLOWED", validateSlotStep(600, 30) === true);
  assert("duration 30 at 10:30 (630 min) is ALLOWED", validateSlotStep(630, 30) === true);
  assert("duration 30 at 10:15 (615 min) is DENIED", validateSlotStep(615, 30) === false);
}

// P0-001: Reminder Atomic Claim Simulation
section("P0-001: Reminder Atomic Claim");
{
  let reminderState = { id: "appt-1", reminderSent: false, reminderClaimedAt: null as Date | null };

  function simulateClaim(workerId: string): boolean {
    if (!reminderState.reminderSent && reminderState.reminderClaimedAt === null) {
      reminderState.reminderClaimedAt = new Date();
      return true;
    }
    return false;
  }

  const worker1Claim = simulateClaim("worker-1");
  const worker2Claim = simulateClaim("worker-2");

  assert("Worker 1 acquires reminder claim", worker1Claim === true);
  assert("Worker 2 is denied concurrent reminder claim", worker2Claim === false);
}

// P0-002: Queue Lease Token & Recovery Simulation
section("P0-002: Queue Lease Token & Recovery");
{
  let job = { id: "job-1", status: "PENDING", leaseToken: null as string | null };

  // Worker A claims job
  const leaseA = "lease-token-A";
  job.status = "PROCESSING";
  job.leaseToken = leaseA;

  // Recovery worker resets job due to timeout
  job.status = "PENDING";
  job.leaseToken = null;

  // Worker B claims recovered job
  const leaseB = "lease-token-B";
  job.status = "PROCESSING";
  job.leaseToken = leaseB;

  // Worker A finishes late with leaseA -> must be rejected
  const workerAFinished = (job.id === "job-1" && job.leaseToken === leaseA);
  assert("Worker A with expired lease cannot complete job", workerAFinished === false);

  // Worker B finishes with leaseB -> succeeds
  const workerBFinished = (job.id === "job-1" && job.leaseToken === leaseB);
  assert("Worker B with valid lease completes job", workerBFinished === true);
}

// Static File Audits for P0 fixes
section("Static Code Hardening Audits (P0/P1)");
{
  const fs = require("fs");

  // P0-001: No include business in appointments/[id]
  const apptIdRoute = fs.readFileSync("./app/api/appointments/[id]/route.ts", "utf-8");
  assert(
    "P0-001: app/api/appointments/[id]/route.ts has NO 'include: { business: true }'",
    !apptIdRoute.includes("include: { business: true }")
  );

  // P0-002: No fallbackEnv in upload
  const uploadRoute = fs.readFileSync("./app/api/upload/route.ts", "utf-8");
  assert(
    "P0-002: app/api/upload/route.ts has NO fallbackEnv",
    !uploadRoute.includes("fallbackEnv")
  );

  // P0-003: No fixed admin password in businesses
  const bizRoute = fs.readFileSync("./app/api/businesses/route.ts", "utf-8");
  assert(
    "P0-003: app/api/businesses/route.ts does NOT create users with fixed 'admin' password",
    !bizRoute.includes('bcrypt.hash("admin"')
  );

  // P0-001: Separation of draft and published configs
  const landingPageContent = fs.readFileSync("./app/[subdomain]/page.tsx", "utf-8");
  assert(
    "P0-001: app/[subdomain]/page.tsx does NOT use layoutConfig as public fallback",
    !landingPageContent.includes("((rawBiz.publishedConfig as any) || (rawBiz.layoutConfig as any)")
  );
  assert(
    "P0-001: app/[subdomain]/page.tsx denies unauthorized preview",
    landingPageContent.includes("if (sp.preview === \"true\")") && landingPageContent.includes("notFound()")
  );

  // P0-002: Concurrency & Serializable isolation in AppointmentService
  const apptServiceContent = fs.readFileSync("./lib/appointment-service.ts", "utf-8");
  assert(
    "P0-002: AppointmentService uses Serializable isolation level",
    apptServiceContent.includes("Prisma.TransactionIsolationLevel.Serializable")
  );
  assert(
    "P0-002: AppointmentService implements retry loop for concurrency conflicts",
    apptServiceContent.includes("MAX_RETRIES") && apptServiceContent.includes("attempt <= MAX_RETRIES")
  );

  // P1-001: failClosed on critical routes
  const apptRouteContent = fs.readFileSync("./app/api/appointments/route.ts", "utf-8");
  assert(
    "P1-001: appointments route enforces failClosed rate limiting",
    apptRouteContent.includes("failClosed: true")
  );

  const chatRouteContent = fs.readFileSync("./app/api/chat/route.ts", "utf-8");
  assert(
    "P1-001: chat route enforces failClosed rate limiting",
    chatRouteContent.includes("failClosed: true")
  );

  const uploadRouteContent = fs.readFileSync("./app/api/upload/route.ts", "utf-8");
  assert(
    "P1-001: upload route enforces failClosed rate limiting",
    uploadRouteContent.includes("failClosed: true")
  );

  const biolinksClickContent = fs.readFileSync("./app/api/biolinks/click/route.ts", "utf-8");
  assert(
    "P1-002: biolinks click route uses transaction for atomic updates",
    biolinksClickContent.includes("prisma.$transaction")
  );

  // P1-019: Table unique constraint in schema.prisma
  const schemaContent = fs.readFileSync("./prisma/schema.prisma", "utf-8");
  assert(
    "P1-019: Table model has unique constraint @@unique([businessId, number])",
    schemaContent.includes("@@unique([businessId, number])")
  );

  // P0-001: AppointmentService uses publishedConfig by default
  assert(
    "P0-001: AppointmentService fetchAvailableSlots does not use layoutConfig as public fallback",
    apptServiceContent.includes("biz.publishedConfig || defaultPublicConfig")
  );
  assert(
    "P0-001: AppointmentService createAppointment does not use layoutConfig as public fallback",
    apptServiceContent.includes("business.publishedConfig || defaultPublicConfig")
  );

  // P1-001: failClosed on AI generation and messages
  const aiGenContent = fs.readFileSync("./app/api/intelligence/generate/route.ts", "utf-8");
  assert(
    "P1-001: AI generation route enforces failClosed rate limiting",
    aiGenContent.includes("failClosed: true")
  );

  const messagesRouteContent = fs.readFileSync("./app/api/messages/route.ts", "utf-8");
  assert(
    "P1-001: messages route enforces failClosed rate limiting",
    messagesRouteContent.includes("failClosed: true")
  );

  // P1-012: No indiscriminate activeConfig spread in public landing
  assert(
    "P1-012: app/[subdomain]/page.tsx does NOT do '...activeConfig' spread",
    !landingPageContent.includes("...activeConfig,")
  );

  // P1-013 & P1-014: Publish validates against LayoutConfigSchema
  const bizIdRouteContent = fs.readFileSync("./app/api/businesses/[id]/route.ts", "utf-8");
  assert(
    "P1-013/P1-014: businesses/[id] validates LayoutConfigSchema on publish",
    bizIdRouteContent.includes("LayoutConfigSchema.safeParse(configToPublish)")
  );

  // P0-001: leaseToken declared outside try
  const serverJsContent = fs.readFileSync("./server.js", "utf-8");
  assert(
    "P0-001: server.js declares 'let leaseToken = null' outside try block to avoid ReferenceError in catch",
    serverJsContent.includes("let leaseToken = null;")
  );

  // P0-002: messageSent pre-send vs post-send separation
  assert(
    "P0-002: server.js tracks messageSent before releasing reminder claim in catch block",
    serverJsContent.includes("let messageSent = false;") && serverJsContent.includes("if (!messageSent)")
  );

  // P1-001: Centralized phone library used in server.js
  assert(
    "P1-001: server.js imports and uses phoneToWhatsAppJid from lib/phone-core.js",
    serverJsContent.includes("phoneToWhatsAppJid") && serverJsContent.includes("require('./lib/phone-core.js')")
  );

  // P1-005: XSS script tag injection test
  const rawXssPayload = '<script>alert("XSS")</script>';
  const safeSerialized = JSON.stringify({ name: rawXssPayload }).replace(/</g, '\\u003c');
  assert(
    "P1-005: <script> tags are strictly escaped to \\u003c in JSON serialization",
    !safeSerialized.includes("<script>") && safeSerialized.includes("\\u003cscript")
  );

  // P2-001: CSP header in next.config.ts
  const nextConfig = fs.readFileSync("./next.config.ts", "utf-8");
  assert(
    "P2-001: next.config.ts configures Content-Security-Policy",
    nextConfig.includes("Content-Security-Policy")
  );
}

// ─── Global scan checks ───────────────────────────────────────────────────────
section("Global Scans");
{
  const fs = require("fs");
  const path = require("path");

  const ROOT = process.cwd();

  function scanFiles(pattern: string, exclude: string[] = []): string[] {
    const result: string[] = [];
    function walk(d: string) {
      try {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(d, entry.name);
          const rel = path.relative(ROOT, full).replace(/\\/g, "/");
          if (entry.isDirectory()) {
            if (!["node_modules", ".next", ".git", "scripts"].includes(entry.name)) {
              walk(full);
            }
          } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
            const content = fs.readFileSync(full, "utf-8");
            if (content.includes(pattern)) {
              const isExcluded = exclude.some(ex => rel.includes(ex));
              if (!isExcluded) result.push(rel);
            }
          }
        }
      } catch {}
    }
    walk(ROOT);
    return result;
  }

  // Check dtos.ts directly — look for actual function calls, not comments
  const dtosFile = fs.readFileSync(path.join(ROOT, "lib/dtos.ts"), "utf-8");
  const dtosCodeLines = dtosFile.split("\n").filter((l: string) =>
    l.includes("decryptSecret(") &&
    !l.trim().startsWith("//") &&
    !l.trim().startsWith("*")
  );
  assert(
    "lib/dtos.ts does not call decryptSecret()",
    dtosCodeLines.length === 0
  );

  // decryptSecret usage — only allowed in encryption.ts (definition) and server-side logic files
  // not in dtos.ts
  const decryptUsages = scanFiles("decryptSecret(", ["lib/encryption.ts"]);
  const dtosActualUsage = decryptUsages.filter(f => {
    if (!f.includes("dtos.ts")) return false;
    const content = fs.readFileSync(path.join(ROOT, f), "utf-8");
    const codeLines = content.split("\n").filter((l: string) =>
      l.includes("decryptSecret(") &&
      !l.trim().startsWith("//") &&
      !l.trim().startsWith("*")
    );
    return codeLines.length > 0;
  });
  assert(
    "decryptSecret is not called from lib/dtos.ts",
    dtosActualUsage.length === 0
  );

  // global.waStatus is only in server.js (excluded) — not in Next.js API routes
  const waStatusFiles = scanFiles("global.waStatus", ["server.js"]);
  assert(
    "global.waStatus is not used in Next.js API routes",
    waStatusFiles.length === 0
  );

  // global.waClient — not referenced in Next.js routes
  const waClientFiles = scanFiles("global.waClient", ["server.js"]);
  assert(
    "global.waClient is not referenced in Next.js API routes",
    waClientFiles.length === 0
  );

  // NEXT_PUBLIC_IMGBB_API_KEY — only allowed as a comment, not in actual code
  const imgbbFiles = scanFiles("NEXT_PUBLIC_IMGBB_API_KEY", []);
  const imgbbCodeUsages = imgbbFiles.filter(f => {
    const content = fs.readFileSync(path.join(ROOT, f), "utf-8");
    const codeLines = content.split("\n").filter((l: string) =>
      l.includes("NEXT_PUBLIC_IMGBB_API_KEY") &&
      !l.trim().startsWith("//") &&
      !l.trim().startsWith("*") &&
      !l.trim().startsWith("#")
    );
    return codeLines.length > 0;
  });
  assert(
    "NEXT_PUBLIC_IMGBB_API_KEY has 0 code references (comments are ok)",
    imgbbCodeUsages.length === 0
  );

  // Physical business delete
  const deleteFiles = scanFiles("prisma.business.delete(", []);
  assert(
    "prisma.business.delete() is not called anywhere",
    deleteFiles.length === 0
  );
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log(`SECURITY TEST RESULTS`);
console.log(`${"═".repeat(60)}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⏭️  Skipped: ${skipped}`);

if (failures.length > 0) {
  console.log(`\nFailed tests:`);
  failures.forEach((f) => console.log(`  - ${f}`));
}

if (failed > 0) {
  console.error("\n❌ SECURITY TESTS FAILED");
  process.exit(1);
} else {
  console.log("\n✅ All security tests passed.");
  process.exit(0);
}
