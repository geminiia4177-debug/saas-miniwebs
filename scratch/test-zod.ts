import { businessSchema } from "../lib/validations";

const rawData = {
  name: "Prueba Cliente",
  subdomain: "pruebacliente",
  customDomain: "",
  email: "admin@test.com",
  phone: "",
  type: "barberia",
  status: "DEMO",
  description: "",
  nextPayment: "",
  paymentAmount: 0,
  paymentStatus: "pending",
  id: "abc12345",
  createdAt: "2026-08-15",
  demoExpiresAt: "2026-08-18",
  notes: [],
  paymentHistory: []
};

const result = businessSchema.safeParse(rawData);
if (!result.success) {
  console.log("VALIDATION FAILED!");
  console.log(JSON.stringify(result.error.format(), null, 2));
} else {
  console.log("VALIDATION SUCCESS!");
}
