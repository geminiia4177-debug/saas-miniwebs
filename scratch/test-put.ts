import { ownerBusinessUpdateSchema } from "../lib/validations";

const biz = {
  id: "cmsuh0l8t00057hzx8wase2tz",
  name: "Negocio Test",
  subdomain: "negociotest",
  customDomain: "", // THIS IS LIKELY THE CULPRIT IF IT IS ""
  logoUrl: null,
  bannerUrl: null,
  primaryColor: "#6366f1",
  secondaryColor: "#a855f7",
  accentColor: null,
  fontFamily: null,
  type: "general",
  status: "TRIAL",
  description: null,
  email: "test@test.com",
  phone: "",
  timezone: "America/Argentina/Buenos_Aires",
  layoutConfig: { onboarded: true },
  publishedConfig: null,
  callMeBotApiKey: null,
  bankDetails: null,
  paymentAmount: 0,
  paymentStatus: "pending",
  demoExpiresAt: "2026-08-18T14:24:20.354Z",
  nextPayment: null,
  createdAt: "2026-08-15T14:24:20.354Z",
  updatedAt: "2026-08-15T14:24:20.354Z",
  userId: "user123"
};

const payload = {
  ...biz,
  phone: "5555455",
  paymentData: { cbu: "00000", alias: "MI.ALIAS", titular: "" },
  layoutConfig: { ...biz.layoutConfig, onboarded: true }
};

const result = ownerBusinessUpdateSchema.safeParse(payload);
if (!result.success) {
  console.log("REJECTED:", JSON.stringify(result.error.format(), null, 2));
} else {
  console.log("ACCEPTED!");
}
