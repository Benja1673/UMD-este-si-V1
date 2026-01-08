"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge" // Asegúrate de tener este componente o usa un span con clases de tailwind
import { GraduationCap, User as UserIcon, Mail, Phone, MapPin, Award } from "lucide-react"

// Tipos
export type Curso = {
  id: string | number
  nivel: "Inicial" | "Intermedio" | "Avanzado"
  categoria: string
  descripcion: string
  nombre: string
  estado: "Aprobado" | "Reprobado" | "Inscrito"
}

export type UserProfile = {
  id: string
  name: string
  apellido: string
  rut: string
  carrera?: string
  email: string
  telefono?: string
  direccion?: string
  nivelActual?: string // ✅ Nuevo campo añadido
}

interface ProfileCardProps {
  user: UserProfile
  cursos: Curso[]
}

export default function ProfileCard({ user, cursos }: ProfileCardProps) {
  const [cursosState] = useState<Curso[]>(cursos)

  // 🎨 Colores según estado del curso
  const getEstadoColor = (estado: string) => {
    switch (estado?.toUpperCase()) {
      case "APROBADO": return "bg-green-100 text-green-800 border-green-200"
      case "REPROBADO": return "bg-red-100 text-red-800 border-red-200"
      case "INSCRITO": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // 🏆 Colores según Nivel del Docente
  const getNivelColor = (nivel: string | undefined) => {
    switch (nivel?.toUpperCase()) {
      case "AVANZADO": return "bg-green-600 text-white shadow-sm"
      case "INTERMEDIO": return "bg-blue-600 text-white shadow-sm"
      case "INICIAL": return "bg-orange-500 text-white shadow-sm"
      default: return "bg-gray-400 text-white"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Perfil */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Lado Izquierdo: Resumen Visual */}
        <div className="w-full md:w-1/3">
          <div className="bg-white border rounded-xl p-6 flex flex-col items-center shadow-sm">
            <div className="h-32 w-32 rounded-full bg-blue-50 mb-4 overflow-hidden border-4 border-white shadow-md">
              <img
                src="/placeholder.svg?height=128&width=128"
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center uppercase">
              {user.name} {user.apellido}
            </h2>
            <p className="text-gray-500 text-sm font-mono mb-2">{user.rut}</p>
            
            <div className="flex flex-col items-center gap-2 mt-2 w-full">
              <span className="text-blue-700 bg-blue-50 px-3 py-1 rounded-full text-xs font-semibold text-center">
                {user.carrera}
              </span>
              
              {/* ✅ MOSTRAR NIVEL ACTUAL AQUÍ */}
              <div className={`mt-2 px-4 py-1.5 rounded-lg text-sm font-bold uppercase flex items-center gap-2 ${getNivelColor(user.nivelActual)}`}>
                <Award className="h-4 w-4" />
                {user.nivelActual || "SIN NIVEL"}
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Detalles Informativos */}
        <div className="w-full md:w-2/3">
          <div className="bg-white border rounded-xl p-8 shadow-sm h-full">
            <div className="flex items-center gap-2 mb-6 border-b pb-4">
              <UserIcon className="text-gray-400 h-5 w-5" />
              <h3 className="text-lg font-bold text-gray-800 uppercase italic">Información Personal</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nombre completo</label>
                <p className="text-gray-700 font-medium">{user.name} {user.apellido}</p>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Identificación (RUT)</label>
                <p className="text-gray-700 font-medium font-mono">{user.rut}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Departamento / Carrera</label>
                <p className="text-gray-700 font-medium italic">{user.carrera}</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estado de Progresión</label>
                <p className={`font-bold italic ${user.nivelActual ? 'text-blue-600' : 'text-gray-400'}`}>
                  Nivel {user.nivelActual || "Sin Nivel Registrado"}
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Correo Electrónico</label>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-3 w-3 text-gray-400" />
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Teléfono de Contacto</label>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <p>{user.telefono || "No registrado"}</p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 space-y-1 border-t pt-4">
                <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Dirección de Domicilio</label>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <p>{user.direccion || "No registrada en el sistema"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de inscripciones */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="bg-gray-50 border-b px-6 py-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800 uppercase italic">Historial Académico</h2>
        </div>

        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="font-bold text-gray-600">CURSO</TableHead>
              <TableHead className="font-bold text-gray-600">CATEGORÍA</TableHead>
              <TableHead className="font-bold text-gray-600">NIVEL</TableHead>
              <TableHead className="font-bold text-gray-600 text-center">ESTADO</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {cursosState.length > 0 ? (
              cursosState.map((curso) => (
                <TableRow key={curso.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-medium">
                    <div>
                      <p className="text-gray-900">{curso.nombre}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">{curso.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                      {curso.categoria}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-gray-500 uppercase tracking-tighter">
                    {curso.nivel}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getEstadoColor(curso.estado)}`}>
                      {curso.estado}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12 text-gray-400 italic">
                  No se registran inscripciones vigentes para este docente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}