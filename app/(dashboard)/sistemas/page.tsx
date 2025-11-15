"use client"

import { useEffect, useState } from "react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Loader2, ExternalLink } from "lucide-react"

type Sistema = {
  id: string
  titulo: string
  descripcion: string
  ubicacion: string
}

export default function Sistemas() {
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSistemas() {
      try {
        const res = await fetch("/api/servicios-disponibles?tipo=SISTEMA")
        const data = await res.json().catch(() => ({}))

        console.log("🔹 /api/servicios-disponibles status:", res.status)
        console.log("🔹 /api/servicios-disponibles response:", data)

        if (res.ok) {
          setSistemas(data)
        } else {
          console.error("Error al cargar sistemas", data)
        }
      } catch (error) {
        console.error("Error fetchSistemas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSistemas()
  }, [])

  const colores = [
    { bg: "bg-blue-100", text: "text-blue-600", button: "bg-blue-600 hover:bg-blue-700" },
    { bg: "bg-green-100", text: "text-green-600", button: "bg-green-600 hover:bg-green-700" },
    { bg: "bg-purple-100", text: "text-purple-600", button: "bg-purple-600 hover:bg-purple-700" },
    { bg: "bg-orange-100", text: "text-orange-600", button: "bg-orange-600 hover:bg-orange-700" },
    { bg: "bg-pink-100", text: "text-pink-600", button: "bg-pink-600 hover:bg-pink-700" },
  ]

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="SISTEMAS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sistemas</h1>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : sistemas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay sistemas disponibles para ti en este momento.</p>
            <p className="text-sm text-gray-400 mt-2">
              Los sistemas estarán disponibles según los cursos que hayas completado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sistemas.map((sistema, index) => {
              const color = colores[index % colores.length]
              
              return (
                <div key={sistema.id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start">
                      <div className={`${color.bg} p-3 rounded-lg`}>
                        <ExternalLink className={`h-6 w-6 ${color.text}`} />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="font-semibold text-lg text-gray-800">{sistema.titulo}</h3>
                        {sistema.descripcion && (
                          <p className="text-sm text-gray-600 mt-1">{sistema.descripcion}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <a
                        href={sistema.ubicacion || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${color.button} text-white px-6 py-2 rounded-md inline-flex items-center gap-2 transition-colors`}
                      >
                        Acceder
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}