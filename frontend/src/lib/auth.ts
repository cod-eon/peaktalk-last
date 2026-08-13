import "server-only";
import { betterAuth } from "better-auth";
import { admin, createAccessControl } from "better-auth/plugins";
import { Pool } from "pg";
import { sendAuthMail } from "@/lib/mail";

// Keep this distinct from FastAPI's `DATABASE_URL`: node-postgres requires a
// standard PostgreSQL URI, not SQLAlchemy's `postgresql+asyncpg://` dialect.
const databaseUrl = process.env.BETTER_AUTH_DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = process.env.BETTER_AUTH_URL;
if (!databaseUrl || !secret || !baseURL) throw new Error("Better Auth server configuration is incomplete");
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? baseURL).split(",").map(v => v.trim()).filter(Boolean);

const adminAccess = createAccessControl({
  user: ["list", "get", "set-role", "ban"],
  session: ["list", "revoke"],
} as const);
const adminRole = adminAccess.newRole({
  user: ["list", "get", "set-role", "ban"],
  session: ["list", "revoke"],
});
const userRole = adminAccess.newRole({ user: [], session: [] });

export const auth = betterAuth({
  database: new Pool({ connectionString: databaseUrl, max: 10 }),
  secret,
  baseURL,
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    resetPasswordTokenExpiresIn: 3600,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthMail({ to: user.email, subject: "Восстановление доступа к PeakTalk", heading: "Восстановите пароль", text: "Ссылка действует ограниченное время. После смены пароля остальные сессии будут завершены.", action: "Задать новый пароль", url });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthMail({ to: user.email, subject: "Подтвердите email в PeakTalk", heading: "Подтвердите email", text: "Подтвердите адрес, чтобы открыть защищённые возможности PeakTalk.", action: "Подтвердить email", url });
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 10 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 300, max: 5 },
      "/send-verification-email": { window: 300, max: 5 },
    },
  },
  advanced: { useSecureCookies: process.env.NODE_ENV === "production" },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      roles: { admin: adminRole, user: userRole },
    }),
  ],
});
