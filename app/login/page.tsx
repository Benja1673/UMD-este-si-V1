"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const LoginPage = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res?.ok) {
      router.push("/dashboard")
    } else {
      setError("Correo o contraseña inválidos")
    }

    setLoading(false)
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <img src="/placeholder.svg?height=60&width=60" alt="Logo UTEM" className="h-14 mr-2" />
            <div>
              <div className="text-3xl font-bold">
                <span className="text-blue-600">m</span>
                <span className="text-red-500">i</span>
                <span className="text-yellow-500">u</span>
                <span className="text-blue-800">t</span>
                <span className="text-green-500">e</span>
                <span className="text-black">m</span>
              </div>
              <div className="text-sm uppercase tracking-wider text-gray-700">TERRITORIO VIRTUAL</div>
            </div>
          </div>
        </div>

        {/* MENSAJE */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Por favor ingresa con tus credenciales de
            <br />
            Pasaporte.UTEM.
          </p>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-500 text-sm uppercase mb-2">
              Usuario o Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="usuario@utem.cl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-500 text-sm uppercase mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-4 rounded-md transition duration-300"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </form>

        {/* LINK CONTRASEÑA */}
        <div className="text-center mt-6">
          <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700 text-sm">
            ¿Olvidó su contraseña?
          </Link>
        </div>

        {/* DATOS DE PRUEBA */}
        <div className="mt-8 p-4 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800 font-medium mb-2">Credenciales de prueba:</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Admin:</strong> admin@utem.cl / 123456</p>
            <p><strong>Docente Inicial:</strong> supervisor@utem.cl / 1234</p>
            <p><strong>Docente Intermedio:</strong> docente@utem.cl / 1234</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
