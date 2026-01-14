"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import CursoCard, { Curso, Docente } from "@/components/curso-card"

export default function CursoPage() {
  const params = useParams()
  const [curso, setCurso] = useState<Curso | null>(null)
  const [docentes, setDocentes] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si no hay ID en los parámetros, no intentamos buscar
    if (!params.id) return

    const fetchCurso = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/cursos/${params.id}`)
        
        // Manejo específico para el Soft Delete (la API devuelve 404 si deletedAt no es null)
        if (res.status === 404) {
          throw new Error("El curso no existe o ha sido eliminado del sistema.")
        }
        
        if (!res.ok) throw new Error("Error al cargar la información del curso")

        const data = await res.json()

        // 🔹 Adaptar los datos del curso incluyendo los campos nuevos para que se vean en el card
        setCurso({
          id: data.id,
          codigo: data.codigo ?? "",
          curso: data.nombre ?? "",
          descripcion: data.descripcion ?? "",
          nivel: data.nivel ?? "",
          categoria: data.categoria?.nombre ?? "",
          cupos: data.cupos ?? 0,
          tipo: data.tipo ?? "",
          ano: data.ano ?? new Date().getFullYear(),
          departamento: data.departamento?.nombre ?? "",
          estado: data.activo ? "Activo" : "Inactivo",
          // ✅ MEJORA: Pasamos los nuevos campos recibidos de la API
          duracion: data.duracion ?? "",
          semestre: data.semestre ?? "",
          modalidad: data.modalidad ?? "",
          fechaInicio: data.fechaInicio ?? "",
          fechaFin: data.fechaFin ?? "",
          instructor: data.instructor ?? "",
        })

        // 🔹 Adaptar los docentes
        const docentesAdaptados: Docente[] = (data.inscripciones || []).map((i: any) => ({
          id: i.usuario.id,
          nombre: `${i.usuario.name ?? ""} ${i.usuario.apellido ?? ""}`.trim(),
          rut: i.usuario.rut ?? "",
          email: i.usuario.email ?? "",
          departamento: i.usuario.departamento?.nombre ?? "",
          estadoInscripcion: i.estado ?? "Pendiente",
        }))

        setDocentes(docentesAdaptados)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCurso()
  }, [params.id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-500 animate-pulse">Cargando detalles del curso...</div>
    </div>
  )

  if (error) return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
      </div>
    </div>
  )

  if (!curso) return <div className="p-6 text-gray-500">No se encontró el curso.</div>

  // Renderizamos el card con la data completa (incluyendo los campos nuevos)
  return <CursoCard curso={curso} docentes={docentes} />
}