"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
}

interface ProfileCardProps {
  user: UserProfile
  cursos: Curso[]
}

export default function ProfileCard({ user, cursos }: ProfileCardProps) {
  const [cursosState, setCursosState] = useState<Curso[]>(cursos)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cursoActual, setCursoActual] = useState<Curso | null>(null)
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<Curso["estado"]>("Inscrito")

  // 🎨 Colores según estado
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

  // Renderizar chip de estado
  const renderEstadoCurso = (curso?: Curso) => {
    if (!curso)
      return <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">No disponible</span>

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${getColor(curso.estado)}`}>
        {curso.estado}
      </span>
    )
  }

  // Abrir modal
  const handleEditarEstado = (curso: Curso) => {
    setCursoActual(curso)
    setEstadoSeleccionado(curso.estado)
    setIsDialogOpen(true)
  }

  // Guardar nuevo estado
  const handleGuardarEstado = () => {
    if (cursoActual) {
      setCursosState(
        cursosState.map((c) => (c.id === cursoActual.id ? { ...c, estado: estadoSeleccionado } : c))
      )
      setIsDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Perfil */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Izquierda */}
        <div className="w-full md:w-1/3">
          <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center">
            <div className="h-32 w-32 rounded-full bg-gray-300 mb-4 overflow-hidden">
              <img
                src="/placeholder.svg?height=128&width=128"
                alt="Foto de perfil"
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="text-lg font-medium text-center">
              {user.name} {user.apellido}
            </h2>
            <p className="text-gray-500 text-sm">{user.rut}</p>
            <p className="text-blue-600 font-medium mt-2">{user.carrera}</p>
          </div>
        </div>

        {/* Derecha */}
        <div className="w-full md:w-2/3">
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nombre completo</label>
                  <p>{user.name} {user.apellido}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">RUT</label>
                  <p>{user.rut}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Carrera</label>
                <p>{user.carrera}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p>{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                  <p>{user.telefono || "No registrado"}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Dirección</label>
                <p>{user.direccion || "No registrada"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de inscripciones */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Inscripciones del Docente</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Curso</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Nivel</TableHead>
              <TableHead>Estado</TableHead>
              {/* Elimina esta línea */}
              {/* <TableHead>Acciones</TableHead> */}
            </TableRow>
          </TableHeader>

          <TableBody>
            {cursosState.map((curso) => (
              <TableRow key={curso.id}>
                <TableCell>{curso.nombre}</TableCell>
                <TableCell>{curso.descripcion}</TableCell>
                <TableCell>{curso.categoria}</TableCell>
                <TableCell>{curso.nivel}</TableCell>

                <TableCell>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getColor(
                      curso.estado
                    )}`}
                  >
                    {curso.estado}
                  </span>
                </TableCell>

                {/* Elimina este TableCell completo */}
                {/* <TableCell>
                  <Button size="sm" variant="outline" onClick={() => handleEditarEstado(curso)}>
                    <Edit className="w-4 h-4 mr-1" /> Editar
                  </Button>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal para editar estado */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Estado de Inscripción</DialogTitle>
            <DialogDescription>
              Actualiza el estado del curso <b>{cursoActual?.nombre}</b>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={estadoSeleccionado}
                onValueChange={(value) =>
                  setEstadoSeleccionado(value as Curso["estado"])
                }
              >
                <SelectTrigger className={`w-40 ${getColor(estadoSeleccionado)} text-center`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="Reprobado">Reprobado</SelectItem>
                  <SelectItem value="Inscrito">Inscrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEstado}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
