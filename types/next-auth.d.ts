// types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      role?: string // 👈 aquí defines que la sesión incluye `role`
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role?: string // 👈 aquí defines que el user puede tener `role`
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string // 👈 y aquí que el token JWT también puede tener `role`
  }
}
