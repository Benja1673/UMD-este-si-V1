"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Loader2, ExternalLink, Calendar, MapPin } from "lucide-react"

type Capacitacion = {
  id: string
  titulo: string
  descripcion: string
  ubicacion?: string
  fechaInicio?: string
  fechaFin?: string
  modalidad?: string
  estado?: string
  cupos?: number
}

export default function CapacitacionesCard() {
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCapacitaciones()
  }, [])

  const fetchCapacitaciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/servicios-disponibles?tipo=CAPACITACION')
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Debes iniciar sesión para ver las capacitaciones")
        }
        throw new Error("Error al cargar capacitaciones")
      }

      const data = await res.json()
      setCapacitaciones(data)
    } catch (err: any) {
      console.error("Error cargando capacitaciones:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceder = (capacitacion: Capacitacion) => {
    if (capacitacion.ubicacion) {
      window.open(capacitacion.ubicacion, '_blank', 'noopener,noreferrer')
    }
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const capacitacionDisponible = (capacitacion: Capacitacion) => {
    if (capacitacion.estado === 'CANCELADA' || capacitacion.estado === 'FINALIZADA') {
      return false
    }
    
    // Si tiene fecha de fin y ya pasó, no está disponible
    if (capacitacion.fechaFin) {
      const ahora = new Date()
      if (new Date(capacitacion.fechaFin) < ahora) {
        return false
      }
    }
    
    return true
  }

  const estadoActivo = (capacitacion: Capacitacion) => {
    return capacitacion.estado === 'ACTIVO' || capacitacion.estado === 'PROGRAMADA' || capacitacion.estado === 'EN_PROGRESO'
  }

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Capacitaciones Disponibles</h3>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Cargando capacitaciones disponibles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Capacitaciones Disponibles</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-semibold mb-2">Error al cargar capacitaciones</p>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={fetchCapacitaciones}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (capacitaciones.length === 0) {
    return (
      <div className="bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Capacitaciones Disponibles</h3>
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="font-medium text-gray-900 mb-2">No hay capacitaciones disponibles</h4>
          <p className="text-sm text-gray-500">
            En este momento no tienes acceso a ninguna capacitación. 
            Puede que necesites completar ciertos cursos o cumplir requisitos específicos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Capacitaciones Disponibles</h3>

      <div className="space-y-4">
        {capacitaciones.map((capacitacion) => {
          const disponible = capacitacionDisponible(capacitacion)
          const activo = estadoActivo(capacitacion)

          return (
            <div
              key={capacitacion.id}
              className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
                !disponible ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center flex-1">
                <div className="bg-blue-100 p-3 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{capacitacion.titulo}</h4>
                    
                    {capacitacion.estado && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        activo
                          ? 'bg-green-100 text-green-800'
                          : capacitacion.estado === 'CANCELADA'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {capacitacion.estado.replace('_', ' ')}
                      </span>
                    )}
                    
                    {!disponible && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        No disponible
                      </span>
                    )}
                  </div>
                  
                  {capacitacion.descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{capacitacion.descripcion}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                    {capacitacion.modalidad && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="capitalize">{capacitacion.modalidad}</span>
                      </div>
                    )}
                    
                    {capacitacion.cupos !== undefined && capacitacion.cupos > 0 && (
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{capacitacion.cupos} participantes</span>
                      </div>
                    )}
                    
                    {capacitacion.fechaInicio && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>Inicia: {formatearFecha(capacitacion.fechaInicio)}</span>
                      </div>
                    )}
                    
                    {capacitacion.fechaFin && (
                      <span>
                        Finaliza: {formatearFecha(capacitacion.fechaFin)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleAcceder(capacitacion)}
                className={`flex items-center px-4 py-2 rounded-md whitespace-nowrap ml-4 ${
                  disponible && capacitacion.ubicacion
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
                disabled={!disponible || !capacitacion.ubicacion}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Acceder
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}