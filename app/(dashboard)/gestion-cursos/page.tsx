"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Plus, Search, X, PinIcon, Filter, ChevronDown, Edit, Trash2 } from "lucide-react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Curso = {
  id: number
  codigo: string
  nivel: "Inicial" | "Intermedio" | "Avanzado"
  categoria: string
  curso: string
  descripcion: string
  cupos: number
  tipo: string
  ano: number
  rut: string
  correo: string
  departamento: string
  estado: "Aprobado" | "No aprobado" | "No inscrito"
}

export default function GestionCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)

  const [cursoActual, setCursoActual] = useState<Curso | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    codigo: "",
    nivel: "Inicial" as "Inicial" | "Intermedio" | "Avanzado",
    categoria: "",
    curso: "",
    descripcion: "",
    cupos: 0,
    tipo: "",
    ano: new Date().getFullYear(),
    rut: "",
    correo: "",
    departamento: "",
    estado: "Aprobado" as "Aprobado" | "No aprobado" | "No inscrito",
  })

  const [filtrosColumna, setFiltrosColumna] = useState<{ [key: string]: string[] }>({})
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState<string | null>(null)
  const [posicionFiltro, setPosicionFiltro] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const filtroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch("/api/cursos")
        if (!res.ok) throw new Error("Error al obtener los cursos")
        const data = await res.json()

        const adaptados: Curso[] = data.map((c: any) => ({
          id: c.id,
          codigo: c.codigo ?? "",
          nivel: c.nivel ?? "Inicial",
          categoria: c.categoria ?? "",
          curso: c.nombre ?? "",
          descripcion: c.descripcion ?? "",
          cupos: c.cupos ?? 0,
          tipo: c.tipo ?? "",
          ano: c.ano ?? new Date().getFullYear(),
          rut: c.rut ?? "",
          correo: c.correo ?? "",
          departamento: c.departamento?.nombre ?? "",
          estado: c.estado ?? "Aprobado",
        }))

        setCursos(adaptados)
        setCursosFiltrados(adaptados)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCursos()
  }, [])

  useEffect(() => {
    let resultado = cursos

    if (busqueda) {
      const busquedaLower = busqueda.toLowerCase()
      resultado = resultado.filter(
        (c) =>
          c.curso.toLowerCase().includes(busquedaLower) ||
          c.rut.toLowerCase().includes(busquedaLower) ||
          c.correo.toLowerCase().includes(busquedaLower) ||
          c.nivel.toLowerCase().includes(busquedaLower) ||
          c.categoria.toLowerCase().includes(busquedaLower)
      )
    }

    if (filtroDepto !== "todos") {
      resultado = resultado.filter((c) => c.departamento === filtroDepto)
    }

    if (filtroEstado !== "todos") {
      resultado = resultado.filter((c) => c.estado === filtroEstado)
    }

    if (Object.keys(filtrosColumna).length > 0) {
      resultado = resultado.filter((curso) => {
        for (const [columna, valores] of Object.entries(filtrosColumna)) {
          if (valores.length === 0) continue
          if (!(valores as string[]).includes((curso as any)[columna])) return false
        }
        return true
      })
    }

    setCursosFiltrados(resultado)
  }, [busqueda, filtroDepto, filtroEstado, cursos, filtrosColumna])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filtroRef.current && !filtroRef.current.contains(event.target as Node)) {
        setColumnaFiltroActiva(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleNuevoCurso = () => {
    setCursoActual(null)
    setFormData({
      codigo: "",
      nivel: "Inicial",
      categoria: "",
      curso: "",
      descripcion: "",
      cupos: 0,
      tipo: "",
      ano: new Date().getFullYear(),
      rut: "",
      correo: "",
      departamento: "",
      estado: "Aprobado",
    })
    setIsDialogOpen(true)
  }

  const handleEditarCurso = (curso: Curso) => {
    setCursoActual(curso)
    setFormData({ ...curso })
    setIsDialogOpen(true)
  }

  const handleEliminarDialogo = (curso: Curso) => {
    setCursoActual(curso)
    setIsDeleteDialogOpen(true)
  }

  const handleEliminarCurso = () => {
    if (cursoActual) setCursos(cursos.filter((c) => c.id !== cursoActual.id))
    setIsDeleteDialogOpen(false)
  }

  const handleGuardarCurso = () => {
    if (cursoActual) {
      setCursos(cursos.map((c) => (c.id === cursoActual.id ? { ...formData, id: cursoActual.id } : c)))
    } else {
      const nuevoId = cursos.length ? Math.max(...cursos.map((c) => c.id)) + 1 : 1
      setCursos([...cursos, { ...formData, id: nuevoId }])
    }
    setIsDialogOpen(false)
  }

  const departamentos = Array.from(new Set(cursos.map((c) => c.departamento)))

  if (loading) return <div className="p-6">Cargando cursos...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <BreadcrumbNav current="GESTIÓN CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Cursos</h1>
          <Button onClick={handleNuevoCurso} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por curso, RUT o correo..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center" onClick={() => setCabecerasFijadas(!cabecerasFijadas)}>
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
                  <Filter className="mr-2 h-4 w-4" /> Departamento
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFiltroDepto("todos")}>Todos</DropdownMenuItem>
                {departamentos.map((d) => (
                  <DropdownMenuItem key={d} onClick={() => setFiltroDepto(d)}>
                    {d}
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

        <div className={`border rounded-md ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto" : "overflow-hidden"}`}>
          <Table>
            <TableHeader className={cabecerasFijadas ? "sticky top-0 bg-white z-10" : ""}>
              <TableRow>
                <TableHead className="border border-gray-300">Perfil curso</TableHead>
                <TableHead className="border border-gray-300">Código</TableHead>
                <TableHead className="border border-gray-300">Curso</TableHead>
                <TableHead className="border border-gray-300">Descripción</TableHead>
                <TableHead className="border border-gray-300">Nivel</TableHead>
                <TableHead className="border border-gray-300">Categoría</TableHead>
                <TableHead className="border border-gray-300">Inscritos</TableHead>
                <TableHead className="border border-gray-300">Tipo</TableHead>
                <TableHead className="border border-gray-300">Año</TableHead>
                <TableHead className="border border-gray-300">Departamento</TableHead>
                <TableHead className="border border-gray-300">Estado</TableHead>
                <TableHead className="border border-gray-300 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cursosFiltrados.length ? (
                cursosFiltrados.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="border border-gray-200">
                      <Link href={`/gestion-cursos/${c.id}`} className="text-blue-600 hover:underline">
                        Ver curso
                      </Link>
                    </TableCell>
                    <TableCell className="border border-gray-200">{c.codigo}</TableCell>
                    <TableCell className="border border-gray-200">{c.curso}</TableCell>
                    <TableCell className="border border-gray-200">{c.descripcion}</TableCell>
                    <TableCell className="border border-gray-200">{c.nivel}</TableCell>
                    <TableCell className="border border-gray-200">{c.categoria}</TableCell>
                    <TableCell className="border border-gray-200">{c.cupos}</TableCell>
                    <TableCell className="border border-gray-200">{c.tipo}</TableCell>
                    <TableCell className="border border-gray-200">{c.ano}</TableCell>
                    <TableCell className="border border-gray-200">{c.departamento}</TableCell>
                    <TableCell className="border border-gray-200">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          c.estado === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : c.estado === "No aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {c.estado}
                      </span>
                    </TableCell>
                    <TableCell className="text-right border border-gray-200">
                      <Button variant="ghost" size="sm" onClick={() => handleEditarCurso(c)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEliminarDialogo(c)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-4 border border-gray-200">
                    No se encontraron cursos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Diálogo de crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{cursoActual ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>{cursoActual ? "Modifica los datos del curso." : "Completa el formulario para agregar un curso."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value as any })}>
                <SelectTrigger id="nivel">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inicial">Inicial</SelectItem>
                  <SelectItem value="Intermedio">Intermedio</SelectItem>
                  <SelectItem value="Avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input id="categoria" name="categoria" value={formData.categoria} onChange={handleFormChange} placeholder="Categoría" />
            <Input id="curso" name="curso" value={formData.curso} onChange={handleFormChange} placeholder="Curso" />
            <Input id="codigo" name="codigo" value={formData.codigo} onChange={handleFormChange} placeholder="Código" />
            <Input id="rut" name="rut" value={formData.rut} onChange={handleFormChange} placeholder="RUT" />
            <Input id="correo" name="correo" value={formData.correo} onChange={handleFormChange} placeholder="Correo" />
          </div>
          <DialogFooter>
            <Button onClick={handleGuardarCurso}>{cursoActual ? "Guardar cambios" : "Agregar Curso"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Curso</DialogTitle>
            <DialogDescription>¿Estás seguro que deseas eliminar este curso?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
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
