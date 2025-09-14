"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 🚀 Extraemos email y code desde la URL
  useEffect(() => {
    const emailParam = searchParams.get("email")
    const codeParam = searchParams.get("code")
    if (emailParam) setEmail(emailParam)
    if (codeParam) setCode(codeParam)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage("Las contraseñas no coinciden")
      return
    }

    if (newPassword.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
      } else {
        setMessage(data.message || "Error al actualizar contraseña")
      }
    } catch (error) {
      setMessage("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Restablecer Contraseña</h1>
      {message && <p className="mb-4 text-red-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Correo</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-1">Código de recuperación</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>
        <div>
          <label className="block mb-1">Nueva contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-sm text-gray-500"
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
        <div>
          <label className="block mb-1">Confirmar contraseña</label>
          <input
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? "Actualizando..." : "Restablecer contraseña"}
        </button>
      </form>

      {/* ✅ Link al login */}
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push("/login")}
          className="text-blue-600 hover:underline"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  )
}
