import { PrismaClient } from "../generated/prisma/index.js";

const base = process.env.TEST_URL || "http://localhost:3102";
const json = { "Content-Type": "application/json" };
const login = await fetch(`${base}/api/auth/login`, {
  method: "POST", headers: json,
  body: JSON.stringify({ email: "ignacio.ypezoa@gmail.com", password: "sherift09" })
});
if (!login.ok) throw new Error(`Login falló: ${login.status}`);
const cookie = login.headers.getSetCookie()[0].split(";")[0];
const headers = { ...json, Cookie: cookie };

const password = `smtp-secret-${Date.now()}`;
const save = await fetch(`${base}/api/admin/email-config`, {
  method: "PATCH", headers,
  body: JSON.stringify({
    smtpHost: "smtp.example.com", smtpPort: 587, smtpUser: "mailer@example.com",
    smtpPassword: password, smtpSecure: false, fromEmail: "reservas@vikingos.cl",
    fromName: "Vikingos", adminEmail: "ignacio.ypezoa@gmail.com", enabled: false
  })
});
if (!save.ok) throw new Error(`Guardar configuración falló: ${await save.text()}`);

const publicConfig = await (await fetch(`${base}/api/admin/email-config`, { headers: { Cookie: cookie } })).json();
const prisma = new PrismaClient();
const stored = await prisma.emailConfig.findUnique({ where: { id: "main" } });

const result = {
  saved: save.ok,
  passwordNotExposed: !("smtpPassword" in publicConfig),
  passwordEncrypted: Boolean(stored?.smtpPassword && stored.smtpPassword !== password && stored.smtpPassword.split(".").length === 3),
  automaticSendingDisabled: stored?.enabled === false
};
await prisma.emailConfig.update({
  where: { id: "main" },
  data: { smtpHost: "", smtpPort: 587, smtpUser: "", smtpPassword: "", smtpSecure: false, fromEmail: "reservas@vikingos.cl", fromName: "Vikingos", adminEmail: "ignacio.ypezoa@gmail.com", enabled: false }
});
await prisma.$disconnect();
console.log(JSON.stringify(result, null, 2));
if (Object.values(result).some((value) => !value)) process.exitCode = 1;
