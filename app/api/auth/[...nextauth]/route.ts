import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // Importamos la config del paso 1

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };