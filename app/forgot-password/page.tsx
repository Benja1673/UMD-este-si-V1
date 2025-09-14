"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)  
    setError("")
    setMessage("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Error al enviar correo")
      }

      setIsSubmitted(true)
      setMessage(data.message)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center">
            <div className="mr-2">
              <img src="/placeholder.svg?height=60&width=60" alt="Logo UTEM" className="h-14" />
            </div>
            <div>
              <div className="text-3xl font-bold">
                <span className="text-blue-600">m</span>
                <span className="text-red-500">i</span>
                <span className="text-yellow-500">u</span>
                <span className="text-blue-800">t</span>
                <span className="text-green-500">e</span>
                <span className="text-black">m</span>
              </div>
              <div className="text-sm uppercase tracking-wider text-gray-700">
                TERRITORIO VIRTUAL
              </div>
            </div>
          </div>
        </div>

        {/* Título */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h1>
          <p className="text-gray-600">
            Ingresa tu correo electrónico y te enviaremos un código de recuperación.
          </p>
        </div>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-500 text-sm uppercase mb-2" htmlFor="email">
                Correo Electrónico
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
                id="email"
                type="email"
                placeholder="usuario@utem.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-md transition duration-300"
            >
              {isLoading ? "Enviando..." : "Enviar Código de Recuperación"}
            </button>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
                {error}
              </div>
            )}
          </form>
        ) : (
          <div className="text-center">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
            <p className="text-gray-600 mb-4">
              Revisa tu bandeja de entrada y sigue las instrucciones del correo.
            </p>
          </div>
        )}

        {/* Link de regreso */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-gray-500 hover:text-gray-700 text-sm">
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
