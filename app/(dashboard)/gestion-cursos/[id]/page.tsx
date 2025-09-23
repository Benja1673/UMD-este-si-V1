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
    const fetchCurso = async () => {
      try {
        const res = await fetch(`/api/cursos/${params.id}`)
        if (!res.ok) throw new Error("Curso no encontrado")
        const data = await res.json()

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
        })

        const docentesAdaptados: Docente[] = data.inscripciones.map((i: any) => ({
          id: i.usuario.id,
          nombre: `${i.usuario.name ?? ""} ${i.usuario.apellido ?? ""}`,
          rut: i.usuario.rut ?? "",
          email: i.usuario.email ?? "",
          departamento: i.usuario.departamento?.nombre ?? "",
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

  if (loading) return <div className="p-6">Cargando curso...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!curso) return <div className="p-6 text-red-600">Curso no encontrado</div>

  return <CursoCard curso={curso} docentes={docentes} />
}
