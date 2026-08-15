import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// SEC-020 Fix: Login rate limiting (in-memory)
const LOGIN_RATE_LIMIT = new Map<string, { attempts: number, lockUntil: number }>();

function checkLoginRateLimit(email: string) {
  const record = LOGIN_RATE_LIMIT.get(email);
  const now = Date.now();
  if (record && record.lockUntil > now) return false;
  return true;
}

function recordLoginFail(email: string) {
  const record = LOGIN_RATE_LIMIT.get(email) || { attempts: 0, lockUntil: 0 };
  record.attempts++;
  
  // P1-005: Progressive backoff. 1st=none, 3rd=1min, 4th=5min, 5th+=15min+
  if (record.attempts >= 3) {
    const backoffMinutes = Math.pow(5, record.attempts - 3); // 3rd=1, 4th=5, 5th=25...
    const maxLock = 60 * 24; // max 24 hours
    const lockMins = Math.min(backoffMinutes, maxLock);
    record.lockUntil = Date.now() + lockMins * 60 * 1000;
  }
  
  LOGIN_RATE_LIMIT.set(email, record);
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Faltan datos");
        }

        const email = credentials.email.toLowerCase();

        // SEC-020 Fix: Check lockout
        if (!checkLoginRateLimit(email)) {
          throw new Error("Demasiados intentos fallidos. Cuenta bloqueada temporalmente por 15 minutos.");
        }
        
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        if (!user || !user.password) {
          // Fake delay to prevent timing attacks
          await new Promise(r => setTimeout(r, 1000));
          recordLoginFail(email);
          if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } } });
          }
          // P1-005: Do not reveal if user exists
          throw new Error("Credenciales inválidas");
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          recordLoginFail(email);
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } } });
          // P1-005: Do not reveal if user exists (use same generic message)
          throw new Error("Credenciales inválidas");
        }

        // Success: clear failures
        LOGIN_RATE_LIMIT.delete(email);
        
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), failedLoginCount: 0 }
        });
        
        if ((user as any).mustChangePassword) {
          (user as any).forcePasswordChange = true;
        }

        return user as any;
      }
    })
  ],
  // 👇 ESTA ES LA LÍNEA QUE FALTABA
  pages: {
    signIn: '/login', 
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sessionVersion = (user as any).sessionVersion || 1;
        if ((user as any).forcePasswordChange) {
          token.forcePasswordChange = true;
        }
      } else if (token.sub) {
        // SEC-P1-015 Fix: Verify session version to allow remote logout/password change invalidation
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub }, select: { sessionVersion: true, role: true } });
        
        // BACKWARDS COMPATIBILITY: Si el JWT es viejo y no tiene versión, asumimos 1
        const currentTokenVersion = token.sessionVersion || 1;
        
        if (!dbUser || dbUser.sessionVersion !== currentTokenVersion) {
          return {} as any; // Invalidate token si no coinciden
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.sub;
        if (token.forcePasswordChange) {
          session.user.forcePasswordChange = true;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};