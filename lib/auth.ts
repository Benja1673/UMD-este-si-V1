// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });

        if (!user) return null;

        // Tu lógica exacta de hashedPassword
        const isValid = await bcrypt.compare(
          credentials!.password,
          user.hashedPassword 
        );

        if (!isValid) return null;

        // ✅ Retornamos id, email, role, etc.
        return { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          name: user.name,
          apellido: user.apellido,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-ignore
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // @ts-ignore
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

// Helper para verificar si la sesión pertenece a un admin o supervisor
export async function isAdminOrSupervisor(session: any) {
  const role = session?.user?.role?.toString().toUpperCase();
  return role === "ADMIN" || role === "SUPERVISOR";
}