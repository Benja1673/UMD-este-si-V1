  // app/api/auth/[...nextauth]/route.ts

  import NextAuth, { AuthOptions } from "next-auth";
  import CredentialsProvider from "next-auth/providers/credentials";
  import { PrismaAdapter } from "@next-auth/prisma-adapter";
  import { prisma } from "@/lib/prisma";
  import bcrypt from "bcryptjs";

  export const authOptions: AuthOptions = {
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

          const isValid = await bcrypt.compare(
            credentials!.password,
            user.hashedPassword
          );

          if (!isValid) return null;

          // Incluir el rol del usuario en el retorno
          return { id: user.id, email: user.email, role: user.role };
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
          // Guardar el rol en el token
          token.role = user.role;
        }
        return token;
      },
      async session({ session, token }) {
        // Guardar el rol en la sesión
        session.user.role = token.role;
        return session;
      },
    },
  };

  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };