"use client"

import { useEffect, useState } from "react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Loader2, ExternalLink, Monitor } from "lucide-react"

type Sistema = {
  id: string
  titulo: string
  descripcion: string
  ubicacion?: string
  modalidad?: string
  estado?: string
}

export default function Sistemas() {
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSistemas()
  }, [])

  const fetchSistemas = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/servicios-disponibles?tipo=SISTEMA")
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Debes iniciar sesión para ver los sistemas")
        }
        throw new Error("Error al cargar sistemas")
      }

      const data = await res.json()
      console.log("🔹 Sistemas disponibles:", data)
      setSistemas(data)
    } catch (err: any) {
      console.error("❌ Error cargando sistemas:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceder = (sistema: Sistema) => {
    if (sistema.ubicacion) {
      window.open(sistema.ubicacion, '_blank', 'noopener,noreferrer')
    }
  }

  const sistemaDisponible = (sistema: Sistema) => {
    return sistema.estado !== 'INACTIVO' && sistema.estado !== 'DESHABILITADO'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav current="SISTEMAS" />
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Sistemas</h1>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando sistemas disponibles...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav current="SISTEMAS" />
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Sistemas</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Error al cargar sistemas</p>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <button
              onClick={fetchSistemas}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="SISTEMAS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Sistemas</h1>

        {sistemas.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
            <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-medium text-gray-900 mb-2">No hay sistemas disponibles</h4>
            <p className="text-sm text-gray-500">
              En este momento no tienes acceso a ningún sistema. 
              Puede que necesites completar ciertos cursos o cumplir requisitos específicos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sistemas.map((sistema) => {
              const disponible = sistemaDisponible(sistema)

              return (
                <div
                  key={sistema.id}
                  className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                    !disponible ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center flex-1">
                    <div className="bg-blue-100 p-3 rounded-full">
                      <Monitor className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{sistema.titulo}</h4>
                        
                        {sistema.estado && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            sistema.estado === 'ACTIVO'
                              ? 'bg-green-100 text-green-800'
                              : sistema.estado === 'MANTENIMIENTO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sistema.estado}
                          </span>
                        )}
                        
                        {!disponible && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            No disponible
                          </span>
                        )}
                      </div>
                      
                      {sistema.descripcion && (
                        <p className="text-sm text-gray-500 mt-1">{sistema.descripcion}</p>
                      )}
                      
                      {sistema.modalidad && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span className="capitalize">{sistema.modalidad}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAcceder(sistema)}
                    className={`flex items-center px-4 py-2 rounded-md whitespace-nowrap ml-4 ${
                      disponible && sistema.ubicacion
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!disponible || !sistema.ubicacion}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acceder
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}