"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Curso = {
  id: number
  codigo: string
  nivel: string
  categoria: string
  curso: string
  descripcion: string
  cupos: number
  tipo: string
  ano: number
  rut: string
  correo: string
  departamento: string
  estado: string
}

export default function GestionCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch("/api/cursos")
        if (!res.ok) throw new Error("Error al obtener los cursos")
        const data = await res.json()

        const adaptados: Curso[] = data.map((c: any) => ({
          id: c.id,
          codigo: c.codigo ?? "",
          nivel: c.nivel ?? "",
          categoria: c.categoria ?? "",
          curso: c.nombre ?? "",
          descripcion: c.descripcion ?? "",
          cupos: c.cupos ?? 0,
          tipo: c.tipo ?? "",
          ano: c.ano ?? new Date().getFullYear(),
          rut: c.rut ?? "",
          correo: c.correo ?? "",
          departamento: c.departamento?.nombre ?? "",
          estado: c.estado ?? "Activo",
        }))

        setCursos(adaptados)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCursos()
  }, [])

  if (loading) return <div className="p-6">Cargando cursos...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Cursos</h1>

      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Perfil curso</th>
            <th className="border px-4 py-2">Código</th>
            <th className="border px-4 py-2">Curso</th>
            <th className="border px-4 py-2">Descripción</th>
            <th className="border px-4 py-2">Nivel</th>
            <th className="border px-4 py-2">Categoría</th>
            <th className="border px-4 py-2">Inscritos</th>
            <th className="border px-4 py-2">Tipo</th>
            <th className="border px-4 py-2">Año</th>
            <th className="border px-4 py-2">Departamento</th>
            <th className="border px-4 py-2">Estado</th>
          </tr>
        </thead>
        <tbody>
          {cursos.map((curso) => (
            <tr key={curso.id} className="text-center">
              <td className="border px-4 py-2">
                <Link
                  href={`/gestion-cursos/${curso.id}`}
                  className="text-blue-600 hover:underline"
                >
                  Ver curso
                </Link>
              </td>
              <td className="border px-4 py-2">{curso.codigo}</td>
              <td className="border px-4 py-2">{curso.curso}</td>
              <td className="border px-4 py-2">{curso.descripcion}</td>
              <td className="border px-4 py-2">{curso.nivel}</td>
              <td className="border px-4 py-2">{curso.categoria}</td>
              <td className="border px-4 py-2">{curso.cupos}</td>
              <td className="border px-4 py-2">{curso.tipo}</td>
              <td className="border px-4 py-2">{curso.ano}</td>
              <td className="border px-4 py-2">{curso.departamento}</td>
              <td className="border px-4 py-2">{curso.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
