import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

import { checkRateLimit } from "@/lib/rate-limit";

// P1-003: Distributed Login Rate Limiting (5 attempts per 15 minutes)
const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

import type { Adapter } from "next-auth/adapters";

interface ExtendedAuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
  mustChangePassword?: boolean;
  forcePasswordChange?: boolean;
  sessionVersion?: number;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
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

        const email = credentials.email.toLowerCase().trim();

        // P1-003: Check distributed rate limit
        const rateLimitKey = `login:email:${email}`;
        const isAllowed = await checkRateLimit(rateLimitKey, LOGIN_MAX_ATTEMPTS, LOGIN_RATE_WINDOW_MS, { failClosed: true });
        if (!isAllowed) {
          throw new Error("Demasiados intentos fallidos. Cuenta bloqueada temporalmente por 15 minutos.");
        }
        
        const user = await prisma.user.findUnique({
          where: { email }
        });
        
        if (!user || !user.password) {
          // Fake delay to prevent timing attacks
          await new Promise(r => setTimeout(r, 1000));
          if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } } });
          }
          // P1-005: Do not reveal if user exists
          throw new Error("Credenciales inválidas");
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: { increment: 1 } } });
          // P1-005: Do not reveal if user exists (use same generic message)
          throw new Error("Credenciales inválidas");
        }

        // Success: reset failures and update login timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), failedLoginCount: 0 }
        });
        
        const authUser: ExtendedAuthUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
          forcePasswordChange: user.mustChangePassword,
          sessionVersion: user.sessionVersion,
        };

        return authUser;
      }
    })
  ],
  pages: {
    signIn: '/login', 
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedAuthUser;
        token.role = u.role;
        token.sessionVersion = u.sessionVersion || 1;
        if (u.forcePasswordChange) {
          token.forcePasswordChange = true;
        }
      } else if (token.sub) {
        // SEC-P1-015 Fix: Verify session version to allow remote logout/password change invalidation
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub }, select: { sessionVersion: true, role: true } });
        
        // BACKWARDS COMPATIBILITY: Si el JWT es viejo y no tiene versión, asumimos 1
        const currentTokenVersion = token.sessionVersion || 1;
        
        if (!dbUser || dbUser.sessionVersion !== currentTokenVersion) {
          token.sub = "";
          token.role = "";
          return token;
        }
        token.role = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.sub as string;
        if (token.forcePasswordChange) {
          session.user.forcePasswordChange = true;
        }
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};