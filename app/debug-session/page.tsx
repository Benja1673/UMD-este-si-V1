"use client"
import { useSession } from "next-auth/react"

export default function DebugSessionPage() {
  const { data: session, status } = useSession()

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-xl font-bold">Debug de sesión</h1>
      <p>Estado: <strong>{status}</strong></p>
      {status === "authenticated" && (
        <div className="bg-gray-100 p-4 rounded">
          <p>Email: {session.user.email}</p>
          <p>Rol: {session.user.role}</p>
        </div>
      )}
      {status === "unauthenticated" && (
        <p className="text-red-600">No hay sesión activa</p>
      )}
    </div>
  )
}
