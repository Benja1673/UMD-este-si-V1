"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export type Curso = {
  id: string | number
  codigo: string
  curso: string
  descripcion: string
  nivel: string
  categoria: string
  cupos: number
  tipo: string
  ano: number
  departamento: string
  estado: string
  // ✅ Nuevos campos agregados
  duracion?: number | string
  semestre?: number | string
  modalidad?: string
  fechaInicio?: string
  fechaFin?: string
  instructor?: string
}

export type Docente = {
  id: string
  nombre: string
  rut: string
  email: string
  departamento: string
  estadoInscripcion?: string
}

interface CursoCardProps {
  curso: Curso
  docentes: Docente[]
}

export default function CursoCard({ curso, docentes }: CursoCardProps) {
  const [cursoState] = useState<Curso>(curso)

  // Función para formatear fechas de ISO a algo legible
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No definida"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getColor = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case "APROBADO":
        return "bg-green-100 text-green-800"
      case "REPROBADO":
        return "bg-red-100 text-red-800"
      case "INSCRITO":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header curso */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Lado izquierdo */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-gray-600 text-lg font-bold">
              {cursoState.curso.charAt(0)}
            </div>
            <h2 className="text-lg font-medium text-center">{cursoState.curso}</h2>
            <p className="text-gray-500 text-sm">{cursoState.codigo}</p>
            <p className="text-blue-600 font-medium mt-2">{cursoState.categoria}</p>
          </div>
        </div>

        {/* Lado derecho - Información Detallada */}
        <div className="w-full md:w-2/3">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4 border-b pb-2">Información del Curso</h3>
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Código</label>
                  <p className="font-semibold">{cursoState.codigo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nivel</label>
                  <p>{cursoState.nivel}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Descripción</label>
                <p className="text-sm">{cursoState.descripcion}</p>
              </div>

              {/* ✅ Fila de Instructor e Información Académica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Instructor Principal</label>
                  <p>{cursoState.instructor || "No asignado"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo de Curso</label>
                  <p>{cursoState.tipo}</p>
                </div>
              </div>

              {/* ✅ Fila de Duración, Semestre y Modalidad */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Duración</label>
                  <p>{cursoState.duracion ? `${cursoState.duracion} horas` : "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Semestre</label>
                  <p>{cursoState.semestre || "N/A"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Modalidad</label>
                  <p>{cursoState.modalidad || "N/A"}</p>
                </div>
              </div>

              {/* ✅ Fila de Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fecha de Inicio</label>
                  <p>{formatDate(cursoState.fechaInicio)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Fecha de Término</label>
                  <p>{formatDate(cursoState.fechaFin)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Cupos</label>
                  <p>{cursoState.cupos}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Año Académico</label>
                  <p>{cursoState.ano}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Departamento</label>
                  <p>{cursoState.departamento}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Estado</label>
                  <p className="font-bold">{cursoState.estado}</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Tabla docentes */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Docentes Inscritos</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>RUT</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Perfil</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {docentes.map((docente) => (
              <TableRow key={docente.id}>
                <TableCell className="font-medium">{docente.nombre}</TableCell>
                <TableCell>{docente.rut}</TableCell>
                <TableCell>{docente.email}</TableCell>
                <TableCell>{docente.departamento}</TableCell>

                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${getColor(
                      docente.estadoInscripcion ?? ""
                    )}`}
                  >
                    {docente.estadoInscripcion ?? "Sin estado"}
                  </span>
                </TableCell>

                <TableCell>
                  <Link
                    href={`/dashboard/perfil-docente/${docente.id}`}
                    className="text-blue-600 hover:underline font-medium text-sm"
                  >
                    Ver Perfil
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {docentes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No hay docentes inscritos en este curso.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}