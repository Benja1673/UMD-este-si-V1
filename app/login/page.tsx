"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image" // 1. Importamos el componente de imagen optimizado

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

    // Limpieza de datos (fix para celulares)
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const res = await signIn("credentials", {
      redirect: false,
      email: cleanEmail,
      password: cleanPassword,
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
        
        {/* LOGO TIPO SIDEBAR (Centrado) */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            {/* Imagen del Logo */}
            <div className="relative h-16 w-14 mr-3"> {/* Un poco más grande que el sidebar para que destaque */}
              <Image 
                src="/Logoutem-1.png" 
                alt="Logo UTEM"
                fill
                className="object-contain"
                priority
              />
            </div>
            
            {/* Texto UMD */}
            <span className="text-3xl font-bold text-blue-800">UMD</span>
          </div>
        </div>

        {/* MENSAJE ACTUALIZADO */}
        <div className="text-center mb-6">
          <p className="text-gray-600">
            Por favor ingresa con tu correo electrónico.
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
              // Fix para teclados móviles
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
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
      </div>
    </div>
  )
}

export default LoginPage