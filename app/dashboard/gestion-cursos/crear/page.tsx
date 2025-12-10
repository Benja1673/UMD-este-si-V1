"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

// Tipo para docente real
type Docente = {
  id: string
  name: string
  apellido: string
  rut: string
  email: string
  especialidad: string
  estado: string
  departamento?: {
    id: string
    nombre: string
    codigo: string | null
  } | null
}

export default function CrearCursoPage() {
  const router = useRouter()

  // Estados para datos reales
  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [docentesDisponibles, setDocentesDisponibles] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para la información del curso
  const [cursoData, setCursoData] = useState({
    nombre: "",
    descripcion: "",
    codigo: "",
    nivel: "",
    instructor: "",
    tipo: "",
    ano: "",
    categoriaId: "",
    departamentoId: "",
  })

  // Estado para las listas de docentes
  const [docentesInscritos, setDocentesInscritos] = useState<Docente[]>([])
  const [docentesNoInscritos, setDocentesNoInscritos] = useState<Docente[]>([])

  // Estado para los checkboxes seleccionados
  const [seleccionadosInscritos, setSeleccionadosInscritos] = useState<string[]>([])
  const [seleccionadosNoInscritos, setSeleccionadosNoInscritos] = useState<string[]>([])

  // Estado para búsqueda y filtros
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todos")

  // Filtrar docentes no inscritos
  const [docentesFiltrados, setDocentesFiltrados] = useState<Docente[]>([])

  // Obtener departamentos y especialidades únicos de los docentes disponibles
  const departamentosDocentes = Array.from(
    new Set(
      docentesDisponibles
        .map((d) => d.departamento?.nombre)
        .filter((nombre): nombre is string => !!nombre)
    )
  )
  const especialidades = Array.from(
    new Set(docentesDisponibles.map((d) => d.especialidad).filter(Boolean))
  )

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCursoData({ ...cursoData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setCursoData({ ...cursoData, [name]: value })
  }

  // Manejar selección de checkboxes
  const handleCheckboxInscritos = (id: string) => {
    setSeleccionadosInscritos((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleCheckboxNoInscritos = (id: string) => {
    setSeleccionadosNoInscritos((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  // Inscribir docentes seleccionados
  const inscribirSeleccionados = () => {
    const docentesAInscribir = docentesNoInscritos.filter((d) => seleccionadosNoInscritos.includes(d.id))
    setDocentesInscritos([...docentesInscritos, ...docentesAInscribir])
    setDocentesNoInscritos(docentesNoInscritos.filter((d) => !seleccionadosNoInscritos.includes(d.id)))
    setSeleccionadosNoInscritos([])
  }

  // Desinscribir docentes seleccionados
  const desinscribirSeleccionados = () => {
    const docentesADesinscribir = docentesInscritos.filter((d) => seleccionadosInscritos.includes(d.id))
    setDocentesNoInscritos([...docentesNoInscritos, ...docentesADesinscribir])
    setDocentesInscritos(docentesInscritos.filter((d) => !seleccionadosInscritos.includes(d.id)))
    setSeleccionadosInscritos([])
  }

  // Guardar curso en backend
  const handleGuardarCurso = async () => {
    try {
      const response = await fetch("/api/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cursoData,
          docentesInscritos: docentesInscritos.map((d) => d.id),
        }),
      })

      if (!response.ok) throw new Error("Error al guardar el curso")

      const data = await response.json()
      console.log("Curso guardado en BD:", data)

      router.push("/gestion-cursos")
    } catch (error) {
      console.error(error)
      alert("No se pudo guardar el curso")
    }
  }

  // Cargar datos reales al montar
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [deps, cats, users] = await Promise.all([
          fetch("/api/departamentos").then(r => r.json()),
          fetch("/api/categorias").then(r => r.json()),
          fetch("/api/users").then(r => r.json()),
        ])
        setDepartamentos(deps)
        setCategorias(cats)
        setDocentesDisponibles(users)
        setDocentesNoInscritos(users)
      } catch (e) {
        alert("Error cargando datos")
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Filtrar docentes no inscritos según búsqueda y filtros
  useEffect(() => {
    let resultado = docentesNoInscritos

    // Filtrar por búsqueda
    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(
        (docente) =>
          `${docente.name} ${docente.apellido}`.toLowerCase().includes(busquedaLower) ||
          docente.rut?.toLowerCase().includes(busquedaLower) ||
          docente.email?.toLowerCase().includes(busquedaLower)
      )
    }

    // Filtrar por departamento
    if (filtroDepartamento !== "todos") {
      resultado = resultado.filter((docente) => docente.departamento?.nombre === filtroDepartamento)
    }

    // Filtrar por especialidad
    if (filtroEspecialidad !== "todos") {
      resultado = resultado.filter((docente) => docente.especialidad === filtroEspecialidad)
    }

    setDocentesFiltrados(resultado)
  }, [busqueda, filtroDepartamento, filtroEspecialidad, docentesNoInscritos])

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="CREAR CURSO" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Curso</h1>

        {/* Panel superior: Información del curso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre del Curso</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={cursoData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Introducción a la Programación"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  name="codigo"
                  value={cursoData.codigo}
                  onChange={handleInputChange}
                  placeholder="Ej: CS101"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="nivel">Nivel</Label>
                <Select value={cursoData.nivel} onValueChange={(value) => handleSelectChange("nivel", value)}>
                  <SelectTrigger id="nivel">
                    <SelectValue placeholder="Selecciona un nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inicial">Inicial</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={cursoData.tipo} onValueChange={(value) => handleSelectChange("tipo", value)}>
                  <SelectTrigger id="tipo">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teórico">Teórico</SelectItem>
                    <SelectItem value="Práctico">Práctico</SelectItem>
                    <SelectItem value="Teórico-Práctico">Teórico-Práctico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="ano">Año</Label>
                <Input
                  id="ano"
                  name="ano"
                  type="number"
                  value={cursoData.ano}
                  onChange={handleInputChange}
                  placeholder="2024"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="instructor">Instructor Principal</Label>
                <Input
                  id="instructor"
                  name="instructor"
                  value={cursoData.instructor}
                  onChange={handleInputChange}
                  placeholder="Nombre del instructor"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="categoriaId">Categoría</Label>
                <Select
                  value={cursoData.categoriaId}
                  onValueChange={(value) => handleSelectChange("categoriaId", value)}
                >
                  <SelectTrigger id="categoriaId">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="departamentoId">Departamento</Label>
                <Select
                  value={cursoData.departamentoId}
                  onValueChange={(value) => handleSelectChange("departamentoId", value)}
                >
                  <SelectTrigger id="departamentoId">
                    <SelectValue placeholder="Selecciona un departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((depto) => (
                      <SelectItem key={depto.id} value={depto.id}>
                        {depto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  name="descripcion"
                  value={cursoData.descripcion}
                  onChange={handleInputChange}
                  placeholder="Describe el curso..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel inferior: Gestión de docentes */}
        <Card>
          <CardHeader>
            <CardTitle>Inscripción de Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Lista izquierda: Docentes inscritos */}
              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3 text-gray-700">Docentes Inscritos ({docentesInscritos.length})</h3>
                <div className="border rounded-md h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentesInscritos.length > 0 ? (
                        docentesInscritos.map((docente) => (
                          <TableRow key={docente.id}>
                            <TableCell>
                              <Checkbox
                                checked={seleccionadosInscritos.includes(docente.id)}
                                onCheckedChange={() => handleCheckboxInscritos(docente.id)}
                              />
                            </TableCell>
                            <TableCell>{`${docente.name} ${docente.apellido}`}</TableCell>
                            <TableCell>{docente.rut}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                            No hay docentes inscritos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Botones centrales */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4">
                <Button
                  onClick={inscribirSeleccionados}
                  disabled={seleccionadosNoInscritos.length === 0}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Inscribir seleccionados
                </Button>
                <Button
                  onClick={desinscribirSeleccionados}
                  disabled={seleccionadosInscritos.length === 0}
                  className="w-full bg-transparent"
                  variant="outline"
                >
                  Desinscribir seleccionados
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Lista derecha: Docentes disponibles */}
              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3 text-gray-700">Docentes Disponibles ({docentesFiltrados.length})</h3>

                {/* Filtros y búsqueda */}
                <div className="flex flex-col gap-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar docente..."
                      className="pl-10"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Filter className="mr-2 h-4 w-4" />
                          Departamento
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroDepartamento("todos")}>Todos</DropdownMenuItem>
                        {departamentosDocentes.map((depto) => (
                          <DropdownMenuItem key={depto} onClick={() => setFiltroDepartamento(depto)}>
                            {depto}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Filter className="mr-2 h-4 w-4" />
                          Especialidad
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroEspecialidad("todos")}>Todos</DropdownMenuItem>
                        {especialidades.map((esp) => (
                          <DropdownMenuItem key={esp} onClick={() => setFiltroEspecialidad(esp)}>
                            {esp}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="border rounded-md h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>RUT</TableHead>
                        <TableHead>Departamento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentesFiltrados.length > 0 ? (
                        docentesFiltrados.map((docente) => (
                          <TableRow key={docente.id}>
                            <TableCell>
                              <Checkbox
                                checked={seleccionadosNoInscritos.includes(docente.id)}
                                onCheckedChange={() => handleCheckboxNoInscritos(docente.id)}
                              />
                            </TableCell>
                            <TableCell>{`${docente.name} ${docente.apellido}`}</TableCell>
                            <TableCell>{docente.rut}</TableCell>
                            <TableCell>{docente.departamento?.nombre || "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No se encontraron docentes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botón para guardar */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleGuardarCurso} className="bg-blue-600 hover:bg-blue-700" size="lg">
            Guardar Curso
          </Button>
        </div>
      </div>
    </div>
  )
}
