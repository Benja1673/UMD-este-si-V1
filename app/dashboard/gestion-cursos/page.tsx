"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Plus, Search, X, PinIcon, Filter, ChevronDown, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Curso = {
  id: string
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
  activo: boolean
}

const ITEMS_POR_PAGINA = 50

export default function GestionCursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cursosFiltrados, setCursosFiltrados] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState<string>("todos")
  const [filtroNivel, setFiltroNivel] = useState<string>("todos")
  const [filtroEstado, setFiltroEstado] = useState<string>("activos")
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)

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
  })

  const [filtrosColumna, setFiltrosColumna] = useState<{ [key: string]: string[] }>({})
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState<string | null>(null)
  const [posicionFiltro, setPosicionFiltro] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const filtroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch("/api/cursos?estado=todos")
        if (!res.ok) throw new Error("Error al obtener los cursos")
        const data = await res.json()

        const adaptados: Curso[] = data.map((c: any) => ({
          id: c.id,
          codigo: c.codigo ?? "",
          nivel: c.nivel ?? "Inicial",
          categoria: c.categoria?.nombre ?? "",
          curso: c.nombre ?? "",
          descripcion: c.descripcion ?? "",
          cupos: c.cupos ?? 0,
          tipo: c.tipo ?? "",
          ano: c.ano ?? new Date().getFullYear(),
          rut: c.rut ?? "",
          correo: c.correo ?? "",
          departamento: c.departamento?.nombre ?? "",
          activo: c.activo === true,
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
          c.codigo.toLowerCase().includes(busquedaLower) ||
          c.rut.toLowerCase().includes(busquedaLower) ||
          c.correo.toLowerCase().includes(busquedaLower) ||
          c.nivel.toLowerCase().includes(busquedaLower)
      )
    }

    if (filtroDepto !== "todos") {
      resultado = resultado.filter((c) => c.departamento === filtroDepto)
    }

    if (filtroNivel !== "todos") {
      resultado = resultado.filter((c) => c.nivel === filtroNivel)
    }

    if (filtroEstado === "activos") {
      resultado = resultado.filter((c) => c.activo === true)
    } else if (filtroEstado === "inactivos") {
      resultado = resultado.filter((c) => c.activo === false)
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
    setPaginaActual(1)
  }, [busqueda, filtroDepto, filtroNivel, filtroEstado, cursos, filtrosColumna])

  const indiceInicial = (paginaActual - 1) * ITEMS_POR_PAGINA
  const indiceFinal = indiceInicial + ITEMS_POR_PAGINA
  const cursosPaginados = cursosFiltrados.slice(indiceInicial, indiceFinal)
  const totalPaginas = Math.ceil(cursosFiltrados.length / ITEMS_POR_PAGINA)

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

  const handleEliminarCurso = async () => {
    if (!cursoActual) return
    try {
      const res = await fetch(`/api/cursos?id=${cursoActual.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("No se pudo eliminar")
      setCursos(cursos.filter((c) => c.id !== cursoActual.id))
      setIsDeleteDialogOpen(false)
    } catch (err) {
      alert("Error al eliminar el curso")
    }
  }

  const handleGuardarCurso = () => {
    setIsDialogOpen(false)
  }

  const departamentos = Array.from(new Set(cursos.map((c) => c.departamento)))
  const niveles = Array.from(new Set(cursos.map((c) => c.nivel)))

  if (loading) return <div className="p-6">Cargando cursos...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="space-y-6 p-6">
      <BreadcrumbNav current="GESTIÓN CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Cursos</h1>
          <Link href="/dashboard/gestion-cursos/crear">
            <Button className="bg-blue-600 hover:bg-blue-700">Nuevo Curso</Button>
          </Link>
        </div>

        {/* Barra de Filtros: se vuelve sticky si cabecerasFijadas es true */}
        <div className={`flex flex-col md:flex-row gap-4 mb-6 bg-white z-20 ${cabecerasFijadas ? "sticky top-0 py-4 border-b" : ""}`}>
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
            
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[150px] bg-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white opacity-100 z-[50]">
                <SelectItem value="activos">Solo Activos</SelectItem>
                <SelectItem value="inactivos">Solo Inactivos</SelectItem>
                <SelectItem value="todos">Ver Todos</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center bg-white">
                  <Filter className="mr-2 h-4 w-4" /> Departamento
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white opacity-100 z-[50]">
                <DropdownMenuItem onClick={() => setFiltroDepto("todos")}>Todos</DropdownMenuItem>
                {departamentos.map((d) => (
                  <DropdownMenuItem key={d} onClick={() => setFiltroDepto(d)}>{d}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" onClick={() => { setBusqueda(""); setFiltroEstado("activos"); setFiltroDepto("todos"); setFiltroNivel("todos"); setFiltrosColumna({}); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabla: el contenedor gestiona el scroll. Los TableHead usan sticky top-0 */}
        <div className={`border rounded-md relative ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto scrollbar-thin" : "overflow-hidden"}`}>
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {/* Se aplica sticky top-0, z-10 y fondo blanco a cada encabezado individualmente para que la fila de títulos se fije correctamente */}
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Perfil curso</TableHead>
                <TableHead className={`border border-gray-300 w-15 min-w-[16rem] max-w-[20rem] text-center text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Código</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Curso</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Descripción</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Nivel</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Estado</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Inscritos</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Tipo</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Año</TableHead>
                <TableHead className={`border border-gray-300 text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Departamento</TableHead>
                <TableHead className={`border border-gray-300 text-right text-gray-900 font-bold bg-white ${cabecerasFijadas ? "sticky top-0 z-10 shadow-sm" : ""}`}>Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {cursosPaginados.length ? (
                cursosPaginados.map((c) => (
                  <TableRow key={c.id} className={!c.activo ? "bg-gray-50 opacity-60" : ""}>
                    <TableCell className="border border-gray-200">
                      <Link href={`/dashboard/gestion-cursos/${c.id}`} className="text-blue-600 hover:underline">Ver curso</Link>
                    </TableCell>
                    <TableCell className="border border-gray-200 truncate text-center" style={{ width: "2rem", minWidth: "2rem", maxWidth: "2rem" }}>
                      {c.codigo}
                    </TableCell>
                    <TableCell className="border border-gray-200">{c.curso}</TableCell>
                    <TableCell className="border border-gray-200">{c.descripcion}</TableCell>
                    <TableCell className="border border-gray-200">{c.nivel}</TableCell>
                    <TableCell className="border border-gray-200">
                      {c.activo ? (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center w-fit">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 flex items-center w-fit">
                          <XCircle className="mr-1 h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="border border-gray-200">{c.cupos}</TableCell>
                    <TableCell className="border border-gray-200">{c.tipo}</TableCell>
                    <TableCell className="border border-gray-200">{c.ano}</TableCell>
                    <TableCell className="border border-gray-200">{c.departamento}</TableCell>
                    <TableCell className="text-right border border-gray-200">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/gestion-cursos/editar/${c.id}`}>
                          <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleEliminarDialogo(c)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-4 border border-gray-200">No se encontraron cursos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, cursosFiltrados.length)} de {cursosFiltrados.length} cursos
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Diálogo de crear/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>{cursoActual ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
            <DialogDescription>{cursoActual ? "Modifica los datos del curso." : "Completa el formulario para agregar un curso."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="nivel">Nivel</Label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value as any })}>
                <SelectTrigger id="nivel" className="bg-white">
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
        <DialogContent className="sm:max-w-[400px] bg-white">
          <DialogHeader>
            <DialogTitle>Eliminar Curso</DialogTitle>
            <DialogDescription>
              ¿Estás seguro que deseas eliminar <strong>{cursoActual?.curso}</strong>?
              <br /><br />
              <span className="text-xs bg-amber-50 text-amber-800 p-2 rounded block border border-amber-200">
                Esta acción marcará el curso como <strong>inactivo</strong> para auditoría histórica.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarCurso}>Eliminar Curso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}