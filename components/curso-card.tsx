"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
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
}

export type Docente = {
  id: string
  nombre: string
  rut: string
  email: string
  departamento: string
}

interface CursoCardProps {
  curso: Curso
  docentes: Docente[]
}

export default function CursoCard({ curso, docentes }: CursoCardProps) {
  const [cursoState] = useState<Curso>(curso)

  return (
    <div className="space-y-6">
      {/* Header curso */}
      <div className="flex flex-col md:flex-row gap-6">
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

        <div className="w-full md:w-2/3">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Información del Curso</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Código</label>
                  <p>{cursoState.codigo}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nivel</label>
                  <p>{cursoState.nivel}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Descripción</label>
                <p>{cursoState.descripcion}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Cupos</label>
                  <p>{cursoState.cupos}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tipo</label>
                  <p>{cursoState.tipo}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Año</label>
                  <p>{cursoState.ano}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Departamento</label>
                  <p>{cursoState.departamento}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Estado</label>
                <p>{cursoState.estado}</p>
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
              <TableHead>Perfil</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docentes.map((docente) => (
              <TableRow key={docente.id}>
                <TableCell>{docente.nombre}</TableCell>
                <TableCell>{docente.rut}</TableCell>
                <TableCell>{docente.email}</TableCell>
                <TableCell>{docente.departamento}</TableCell>
                <TableCell>
                    <Link   href={`/perfil-docente/${docente.id}`} className="text-blue-600 hover:underline">
                      Ver Perfil
                    </Link>   
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
