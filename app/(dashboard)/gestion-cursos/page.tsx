"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, Plus, Edit, Trash2, Filter, ChevronDown, X, Check, PinIcon } from "lucide-react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"

// Primero, actualiza el tipo Curso para incluir nivel y categoría
type Curso = {
  id: number
  nivel: "Inicial" | "Intermedio" | "Avanzado"
  categoria: string
  curso: string
  user: string
  rut: string
  correo: string
  departamento: string
  estado: "Aprobado" | "No aprobado" | "No inscrito"
}

// Actualiza los datos de ejemplo para incluir nivel y categoría
const cursosIniciales: Curso[] = [

  {
    id: 2,
    nivel: "Intermedio",
    categoria: "Ambientes Propicios para el Aprendizaje",
    curso: "Perspectiva de Género",
    user: "María González",
    rut: "11.222.333-4",
    correo: "maria.gonzalez@utem.cl",
    departamento: "Matemáticas",
    estado: "Aprobado",
  },
  {
    id: 3,
    nivel: "Intermedio",
    categoria: "Ambientes Propicios para el Aprendizaje",
    curso: "Neurodiversidad e Inclusión",
    user: "Carlos Rodríguez",
    rut: "10.111.222-3",
    correo: "carlos.rodriguez@utem.cl",
    departamento: "Física",
    estado: "No aprobado",
  },
  {
    id: 4,
    nivel: "Intermedio",
    categoria: "Enseñanza en Aula Centrada en el Estudiantado",
    curso: "Metodologías Activas",
    user: "Ana Martínez",
    rut: "9.888.777-6",
    correo: "ana.martinez@utem.cl",
    departamento: "Informática",
    estado: "Aprobado",
  },
  {
    id: 5,
    nivel: "Intermedio",
    categoria: "Enseñanza en Aula Centrada en el Estudiantado",
    curso: "Evaluación",
    user: "Pedro Sánchez",
    rut: "8.777.666-5",
    correo: "pedro.sanchez@utem.cl",
    departamento: "Matemáticas",
    estado: "No inscrito",
  },
  {
    id: 6,
    nivel: "Intermedio",
    categoria: "Planificación de la Enseñanza",
    curso: "Planificación de la Enseñanza",
    user: "Laura Torres",
    rut: "7.666.555-4",
    correo: "laura.torres@utem.cl",
    departamento: "Educación",
    estado: "Aprobado",
  },
  {
    id: 7,
    nivel: "Intermedio",
    categoria: "Reflexión sobre la Práctica user",
    curso: "DEDU",
    user: "Roberto Gómez",
    rut: "6.555.444-3",
    correo: "roberto.gomez@utem.cl",
    departamento: "Educación",
    estado: "No aprobado",
  },
  {
    id: 8,
    nivel: "Intermedio",
    categoria: "Reflexión sobre la Práctica user",
    curso: "DIDU",
    user: "Carmen Vega",
    rut: "5.444.333-2",
    correo: "carmen.vega@utem.cl",
    departamento: "Humanidades",
    estado: "No inscrito",
  },
  {
    id: 9,
    nivel: "Intermedio",
    categoria: "Reflexión sobre la Práctica user",
    curso: "Concursos Investigación y/o Innovación",
    user: "Javier Morales",
    rut: "4.333.222-1",
    correo: "javier.morales@utem.cl",
    departamento: "Investigación",
    estado: "Aprobado",
  },
  {
    id: 10,
    nivel: "Avanzado",
    categoria: "Metodologías Vinculadas con el Entorno",
    curso: "A+S",
    user: "Sofía Ramírez",
    rut: "3.222.111-0",
    correo: "sofia.ramirez@utem.cl",
    departamento: "Ciencias Sociales",
    estado: "No aprobado",
  },
  {
    id: 11,
    nivel: "Avanzado",
    categoria: "Metodologías Vinculadas con el Entorno",
    curso: "STEM",
    user: "Diego Vargas",
    rut: "2.111.000-K",
    correo: "diego.vargas@utem.cl",
    departamento: "Ingeniería",
    estado: "No inscrito",
  },
  {
    id: 12,
    nivel: "Avanzado",
    categoria: "Metodologías Vinculadas con el Entorno",
    curso: "COIL",
    user: "Valentina Muñoz",
    rut: "1.000.999-9",
    correo: "valentina.munoz@utem.cl",
    departamento: "Relaciones Internacionales",
    estado: "Aprobado",
  },
  {
    id: 13,
    nivel: "Avanzado",
    categoria: "Didáctica",
    curso: "Didáctica",
    user: "Andrés Pizarro",
    rut: "15.888.777-8",
    correo: "andres.pizarro@utem.cl",
    departamento: "Educación",
    estado: "No aprobado",
  },
]

export default function GestionCursos() {
  const [cursos, setCursos] = useState<Curso[]>(cursosIniciales)
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>(cursosIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)

  // Estado para el formulario
  const [cursoActual, setCursoActual] = useState<Curso | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Actualiza el estado inicial del formulario
  const [formData, setFormData] = useState({
    nivel: "Inicial" as "Inicial" | "Intermedio" | "Avanzado",
    categoria: "",
    curso: "",
    user: "",
    rut: "",
    correo: "",
    departamento: "",
    estado: "En proceso" as "Aprobado" | "No aprobado" | "No inscrito",
  })

  // Añade estados para los filtros de columna
  const [filtrosColumna, setFiltrosColumna] = useState<{ [key: string]: string[] }>({})
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState<string | null>(null)
  const [posicionFiltro, setPosicionFiltro] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const filtroRef = useRef<HTMLDivElement>(null)

  // Añade la función para manejar el clic en la cabecera de columna
  const handleClickColumna = (columna: string, e: React.MouseEvent) => {
    e.preventDefault()

    // Si ya está abierto el mismo filtro, cerrarlo
    if (columnaFiltroActiva === columna) {
      setColumnaFiltroActiva(null)
      return
    }

    // Establecer la posición del filtro
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPosicionFiltro({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    })

    setColumnaFiltroActiva(columna)
  }

  // Añade la función para verificar si una columna tiene filtros aplicados
  const tieneFiltroPorColumna = (columna: string) => {
    return filtrosColumna[columna] && filtrosColumna[columna].length > 0
  }

  // Actualiza el efecto para filtrar cursos
  useEffect(() => {
    let resultado = cursos

    // Filtrar por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(
        (curso) =>
          curso.curso.toLowerCase().includes(busquedaLower) ||
          curso.user.toLowerCase().includes(busquedaLower) ||
          curso.rut.toLowerCase().includes(busquedaLower) ||
          curso.correo.toLowerCase().includes(busquedaLower) ||
          curso.nivel.toLowerCase().includes(busquedaLower) ||
          curso.categoria.toLowerCase().includes(busquedaLower),
      )
    }

    // Filtrar por departamento
    if (filtroDepto !== "todos") {
      resultado = resultado.filter((curso) => curso.curso.includes(filtroDepto))
    }

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((curso) => curso.estado === filtroEstado)
    }

    // Aplicar filtros de columna
    if (Object.keys(filtrosColumna).length > 0) {
      resultado = resultado.filter((curso) => {
        // Verificar cada filtro activo
        for (const [columna, valores] of Object.entries(filtrosColumna)) {
          if (valores.length === 0) continue

          // Filtrar según la columna
          switch (columna) {
            case "nivel":
              if (!valores.includes(curso.nivel)) return false
              break
            case "categoria":
              if (!valores.includes(curso.categoria)) return false
              break
            case "curso":
              if (!valores.includes(curso.curso)) return false
              break
            case "user":
              if (!valores.includes(curso.user)) return false
              break
            case "rut":
              if (!valores.includes(curso.rut)) return false
              break
            case "correo":
              if (!valores.includes(curso.correo)) return false
              break
            case "departamento":
              if (!valores.includes(curso.departamento)) return false
              break
            case "estado":
              if (!valores.includes(curso.estado)) return false
              break
          }
        }

        return true
      })
    }

    setCursosFiltrados(resultado)
  }, [busqueda, filtroDepto, filtroEstado, cursos, filtrosColumna])

  // Añade un efecto para manejar clics fuera del menú de filtro
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroRef.current && !filtroRef.current.contains(event.target as Node)) {
        setColumnaFiltroActiva(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Actualiza el formulario para incluir nivel y categoría
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  // Actualiza la función para crear un nuevo curso
  const handleNuevoCurso = () => {
    setCursoActual(null)
    setFormData({
      nivel: "Inicial",
      categoria: "",
      curso: "",
      user: "",
      rut: "",
      correo: "",
      departamento: "",
       estado: "Aprobado",
    })
    setIsDialogOpen(true)
  }

  // Actualiza la función para editar un curso
  const handleEditarCurso = (curso: Curso) => {
    setCursoActual(curso)
    setFormData({
      nivel: curso.nivel,
      categoria: curso.categoria,
      curso: curso.curso,
      user: curso.user,
      rut: curso.rut,
      correo: curso.correo,
      departamento: curso.departamento,
      estado: curso.estado,
    })
    setIsDialogOpen(true)
  }

  // Abrir diálogo para eliminar curso
  const handleEliminarDialogo = (curso: Curso) => {
    setCursoActual(curso)
    setIsDeleteDialogOpen(true)
  }

  // Eliminar curso
  const handleEliminarCurso = () => {
    if (cursoActual) {
      setCursos(cursos.filter((d) => d.id !== cursoActual.id))
      setIsDeleteDialogOpen(false)
    }
  }

  // Actualiza la función para guardar curso
  const handleGuardarCurso = () => {
    if (cursoActual) {
      // Editar curso existente
      setCursos(cursos.map((d) => (d.id === cursoActual.id ? { ...formData, id: cursoActual.id } : d)))
    } else {
      // Crear nuevo curso
      const nuevoId = Math.max(...cursos.map((d) => d.id)) + 1
      setCursos([...cursos, { ...formData, id: nuevoId }])
    }
    setIsDialogOpen(false)
  }

  // Obtener departamentos únicos para el filtro
  const departamentos = Array.from(new Set(cursos.map((d) => d.curso)))

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GESTIÓN CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión Cursos</h1>
          <Button onClick={handleNuevoCurso} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
          </Button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por curso, user, RUT o correo..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => setCabecerasFijadas(!cabecerasFijadas)}
            >
              <PinIcon className="mr-2 h-4 w-4" /> {cabecerasFijadas ? "Desfijar Cabecera" : "Fijar Cabecera"}
            </Button>
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {
                setBusqueda("")
                setFiltroDepto("todos")
                setFiltroEstado("todos")
                setFiltrosColumna({})
              }}
            >
              <X className="mr-2 h-4 w-4" /> Limpiar filtros
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" /> Curso
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFiltroDepto("todos")}>Todos</DropdownMenuItem>
                {departamentos.map((depto) => (
                  <DropdownMenuItem key={depto} onClick={() => setFiltroDepto(depto)}>
                    {depto}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" /> Estado
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFiltroEstado("todos")}>Todos</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroEstado("Aprobado")}>Aprobado</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroEstado("No aprobado")}>No aprobado</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFiltroEstado("No inscrito")}>No inscrito</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabla de cursos */}
        <div className={`border rounded-md ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto" : "overflow-hidden"}`}>
          <Table>
            <TableHeader className={cabecerasFijadas ? "sticky top-0 bg-white z-10" : ""}>
              <TableRow>
                <TableHead
                  className={`cursor-pointer border border-gray-300 ${tieneFiltroPorColumna("nivel") ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={(e) => handleClickColumna("nivel", e)}
                >
                  Nivel
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("nivel") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("categoria") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("categoria", e)}
                >
                  Categoría
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("categoria") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`cursor-pointer border border-gray-300 ${tieneFiltroPorColumna("curso") ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={(e) => handleClickColumna("curso", e)}
                >
                  Curso
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("curso") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead className="border border-gray-300">User</TableHead>
                <TableHead className="border border-gray-300">RUT</TableHead>
                <TableHead className="border border-gray-300">Correo</TableHead>
                <TableHead
                  className={`cursor-pointer border border-gray-300 ${tieneFiltroPorColumna("departamento") ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={(e) => handleClickColumna("departamento", e)}
                >
                  Departamento
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("departamento") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead className="border border-gray-300">Perfil docente</TableHead>
                <TableHead
                  className={`cursor-pointer border border-gray-300 ${tieneFiltroPorColumna("estado") ? "bg-gray-200" : "hover:bg-gray-100"}`}
                  onClick={(e) => handleClickColumna("estado", e)}
                >
                  Estado
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("estado") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead className="text-right border border-gray-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cursosFiltrados.length > 0 ? (
                cursosFiltrados.map((curso) => (
                  <TableRow key={curso.id}>
                    <TableCell className="border border-gray-200">{curso.nivel}</TableCell>
                    <TableCell className="border border-gray-200">{curso.categoria}</TableCell>
                    <TableCell className="border border-gray-200">{curso.curso}</TableCell>
                    <TableCell className="border border-gray-200">{curso.user}</TableCell>
                    <TableCell className="border border-gray-200">{curso.rut}</TableCell>
                    <TableCell className="border border-gray-200">{curso.correo}</TableCell>
                    <TableCell className="border border-gray-200">{curso.departamento}</TableCell>
                    <TableCell className="border border-gray-200">
                      <Link
                        href={`/perfil-docente/${curso.id}`}
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                      >
                        Ver perfil
                      </Link>
                    </TableCell>
                    <TableCell className="border border-gray-200">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          curso.estado === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : curso.estado === "No aprobado"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {curso.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right border border-gray-200">
                      <Button variant="ghost" size="sm" onClick={() => handleEditarCurso(curso)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEliminarDialogo(curso)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-4 border border-gray-200">
                    No se encontraron cursos con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {columnaFiltroActiva && (
            <div
              ref={filtroRef}
              className="absolute bg-white border border-gray-300 rounded-md shadow-lg z-50 w-64"
              style={{ top: posicionFiltro.top, left: posicionFiltro.left }}
            >
              <div className="p-3 border-b">
                <h3 className="font-medium">Filtrar {columnaFiltroActiva}</h3>
              </div>
              <div className="p-3 border-b">
                <div className="flex items-center mb-2">
                  <Search className="h-4 w-4 mr-2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    className="w-full text-sm border-none focus:outline-none"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {(() => {
                    // Generar opciones según la columna
                    let opciones: string[] = []

                    switch (columnaFiltroActiva) {
                      case "nivel":
                        opciones = ["Inicial", "Intermedio", "Avanzado"]
                        break
                      case "categoria":
                        opciones = Array.from(new Set(cursos.map((c) => c.categoria)))
                        break
                      case "curso":
                        opciones = Array.from(new Set(cursos.map((c) => c.curso)))
                        break
                      case "departamento":
                        opciones = Array.from(new Set(cursos.map((c) => c.departamento)))
                        break
                      case "estado":
                        opciones = ["Aprobado", "No aprobado", "No inscrito"]
                        break
                    }

                    return opciones.map((opcion, index) => {
                      const isSelected = filtrosColumna[columnaFiltroActiva]?.includes(opcion)

                      return (
                        <div key={index} className="flex items-center mb-1">
                          <label className="flex items-center text-sm cursor-pointer hover:bg-gray-100 p-1 rounded w-full">
                            <input
                              type="checkbox"
                              className="mr-2"
                              checked={isSelected}
                              onChange={() => {
                                setFiltrosColumna((prev) => {
                                  const prevValues = prev[columnaFiltroActiva] || []
                                  const newValues = isSelected
                                    ? prevValues.filter((v) => v !== opcion)
                                    : [...prevValues, opcion]

                                  return {
                                    ...prev,
                                    [columnaFiltroActiva]: newValues,
                                  }
                                })
                              }}
                            />
                            {isSelected && <Check className="h-4 w-4 mr-1 text-blue-600" />}
                            {opcion}
                          </label>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
              <div className="p-3 flex justify-end space-x-2">
                <Button variant="outline" size="sm" onClick={() => setColumnaFiltroActiva(null)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    // Aplicar filtro
                    setColumnaFiltroActiva(null)
                  }}
                >
                  Aceptar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diálogo para crear/editar curso */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cursoActual ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>
              {cursoActual
                ? "Modifica los datos del curso seleccionado."
                : "Completa el formulario para agregar un nuevo curso."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Select
                value={formData.nivel}
                onValueChange={(value) =>
                  setFormData({ ...formData, nivel: value as "Inicial" | "Intermedio" | "Avanzado" })
                }
              >
                <SelectTrigger id="nivel">
                  <SelectValue placeholder="Selecciona un nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Input id="categoria" name="categoria" value={formData.categoria} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="curso">Curso</Label>
              <Input id="curso" name="curso" value={formData.curso} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="user">User</Label>
              <Input id="user" name="user" value={formData.user} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="rut">RUT</Label>
              <Input id="rut" name="rut" value={formData.rut} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="correo">Correo</Label>
              <Input id="correo" name="correo" type="email" value={formData.correo} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="departamento">Departamento</Label>
              <Input id="departamento" name="departamento" value={formData.departamento} onChange={handleFormChange} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={formData.estado}
                onValueChange={(value) =>
                  setFormData({ ...formData, estado: value as "Aprobado" | "No aprobado" | "No inscrito" })
                }
              >
                <SelectTrigger id="estado">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprobado">Aprobado</SelectItem>
                  <SelectItem value="No aprobado">No aprobado</SelectItem>
                  <SelectItem value="No inscrito">No inscrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarCurso}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            {/* Actualizar el mensaje de confirmación de eliminación */}
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el curso {cursoActual ? `${cursoActual.curso}` : ""}? Esta acción no
              se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminarCurso}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
