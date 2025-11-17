"use client"

import { useEffect, useState } from "react"
import { FileText, ArrowRight, Loader2, ExternalLink } from "lucide-react"

type Evaluacion = {
  id: string
  titulo: string
  descripcion: string
  tipo?: string
  fechaInicio?: string
  fechaFin?: string
  activa?: boolean
  obligatoria?: boolean
}

export default function EvaluacionesList() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvaluaciones()
  }, [])

  const fetchEvaluaciones = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/servicios-disponibles?tipo=EVALUACION')
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Debes iniciar sesión para ver las evaluaciones")
        }
        throw new Error("Error al cargar evaluaciones")
      }

      const data = await res.json()
      setEvaluaciones(data)
    } catch (err: any) {
      console.error("Error cargando evaluaciones:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRealizarEvaluacion = (evaluacion: Evaluacion) => {
    // Aquí puedes agregar la lógica para abrir la evaluación
    // Por ahora, si tiene descripción con URL, la abrimos
    if (evaluacion.descripcion && evaluacion.descripcion.startsWith('http')) {
      window.open(evaluacion.descripcion, '_blank', 'noopener,noreferrer')
    } else {
      // O redirigir a una página interna
      console.log("Realizar evaluación:", evaluacion.id)
      alert(`Abriendo evaluación: ${evaluacion.titulo}`)
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

  const evaluacionDisponible = (evaluacion: Evaluacion) => {
    if (evaluacion.activa === false) return false
    
    // Verificar fechas si existen
    const ahora = new Date()
    if (evaluacion.fechaInicio && new Date(evaluacion.fechaInicio) > ahora) {
      return false
    }
    if (evaluacion.fechaFin && new Date(evaluacion.fechaFin) < ahora) {
      return false
    }
    
    return true
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Cargando evaluaciones disponibles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">Error al cargar evaluaciones</p>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={fetchEvaluaciones}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (evaluaciones.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="font-medium text-gray-900 mb-2">No hay evaluaciones disponibles</h4>
        <p className="text-sm text-gray-500">
          En este momento no tienes acceso a ninguna evaluación. 
          Puede que necesites completar ciertos cursos o cumplir requisitos específicos.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {evaluaciones.map((evaluacion) => {
        const disponible = evaluacionDisponible(evaluacion)
        const ultimaActualizacion = evaluacion.fechaFin || evaluacion.fechaInicio

        return (
          <div
            key={evaluacion.id}
            className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
              !disponible ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center flex-1">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{evaluacion.titulo}</h4>
                  {evaluacion.obligatoria && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Obligatoria
                    </span>
                  )}
                  {!disponible && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      No disponible
                    </span>
                  )}
                </div>
                
                {evaluacion.descripcion && !evaluacion.descripcion.startsWith('http') && (
                  <p className="text-sm text-gray-500 mt-1">{evaluacion.descripcion}</p>
                )}
                
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {evaluacion.tipo && (
                    <span className="capitalize">{evaluacion.tipo}</span>
                  )}
                  {ultimaActualizacion && (
                    <span>Última actualización: {formatearFecha(ultimaActualizacion)}</span>
                  )}
                  {evaluacion.fechaFin && new Date(evaluacion.fechaFin) > new Date() && (
                    <span className="text-orange-600 font-medium">
                      Vence: {formatearFecha(evaluacion.fechaFin)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleRealizarEvaluacion(evaluacion)}
              className={`flex items-center px-4 py-2 rounded-md whitespace-nowrap ml-4 ${
                disponible
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!disponible}
            >
              <span className="mr-2">Realizar evaluación</span>
              {disponible ? <ArrowRight className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
            </button>
          </div>
        )
      })}
    </div>
  )
}