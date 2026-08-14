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
  if (record.attempts >= 5) {
    record.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 mins
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
          throw new Error("Usuario no encontrado o registrado con Google");
        }
        
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          recordLoginFail(email);
          throw new Error("Contraseña incorrecta");
        }

        // Success: clear failures
        LOGIN_RATE_LIMIT.delete(email);
        
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
        if (user.forcePasswordChange) {
          token.forcePasswordChange = true;
        }
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