"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ChevronDown, Filter, Edit, Trash2, Search, Plus, X, Pin as PinIcon } from "lucide-react"

// Componente BreadcrumbNav (ajusta según tu implementación)
function BreadcrumbNav({ current }: { current: string }) {
  return (
    <div className="text-sm text-gray-600 mb-4">
      INICIO / <span className="font-semibold">{current}</span>
    </div>
  )
}

type Cursos = {
  modeloEducativo: string
  perspectivaGenero: string
  neurodiversidadInclusion: string
  metodologiasActivas: string
  evaluacion: string
  planificacionEnsenanza: string
  dedu: string
  didu: string
  concursosInvestigacion: string
  aS: string
  stem: string
  coil: string
  didactica: string
}

type User = {
  id: string
  nombre: string
  apellido: string
  rut: string
  email: string
  departamento: string
  especialidad?: string
  estado: "Activo" | "Inactivo"
  cursos: Cursos
}

export default function Page() {
  const [users, setUsers] = useState<User[]>([])
  const [usersFiltrados, setUsersFiltrados] = useState<User[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtrosColumna, setFiltrosColumna] = useState<Record<string, string[]>>({})
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState<string | null>(null)
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)
  const filtroRef = useRef<HTMLDivElement>(null)
  const [posicionFiltro, setPosicionFiltro] = useState({ top: 0, left: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userActual, setUserActual] = useState<User | null>(null)
  const [formData, setFormData] = useState<User>({
    id: "",
    nombre: "",
    apellido: "",
    rut: "",
    email: "",
    departamento: "",
    especialidad: "",
    estado: "Activo",
    cursos: {
      modeloEducativo: "No Inscrito",
      perspectivaGenero: "No Inscrito",
      neurodiversidadInclusion: "No Inscrito",
      metodologiasActivas: "No Inscrito",
      evaluacion: "No Inscrito",
      planificacionEnsenanza: "No Inscrito",
      dedu: "No Inscrito",
      didu: "No Inscrito",
      concursosInvestigacion: "No Inscrito",
      aS: "No Inscrito",
      stem: "No Inscrito",
      coil: "No Inscrito",
      didactica: "No Inscrito",
    },
  })

  // Fetch de usuarios desde la base de datos
  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users")
      const dataRaw = await res.json()

      const data: User[] = dataRaw.map((docente: any) => {
        const cursos: Cursos = {
          modeloEducativo: "No Inscrito",
          perspectivaGenero: "No Inscrito",
          neurodiversidadInclusion: "No Inscrito",
          metodologiasActivas: "No Inscrito",
          evaluacion: "No Inscrito",
          planificacionEnsenanza: "No Inscrito",
          dedu: "No Inscrito",
          didu: "No Inscrito",
          concursosInvestigacion: "No Inscrito",
          aS: "No Inscrito",
          stem: "No Inscrito",
          coil: "No Inscrito",
          didactica: "No Inscrito",
        }

        docente.inscripciones.forEach((insc: any) => {
          const estadoCurso = insc.nota && insc.nota >= 4 ? "Aprobado" : "No Aprobado"

          switch (insc.curso.nombre) {
            case "Modelo Educativo":
              cursos.modeloEducativo = estadoCurso
              break
            case "Perspectiva de Género":
              cursos.perspectivaGenero = estadoCurso
              break
            case "Neurodiversidad e Inclusión":
              cursos.neurodiversidadInclusion = estadoCurso
              break
            case "Metodologías Activas":
              cursos.metodologiasActivas = estadoCurso
              break
            case "Evaluación":
              cursos.evaluacion = estadoCurso
              break
            case "Planificación de Enseñanza":
              cursos.planificacionEnsenanza = estadoCurso
              break
            case "DEDU":
              cursos.dedu = estadoCurso
              break
            case "DIDU":
              cursos.didu = estadoCurso
              break
            case "Concursos Investigación":
              cursos.concursosInvestigacion = estadoCurso
              break
            case "A+S":
              cursos.aS = estadoCurso
              break
            case "STEM":
              cursos.stem = estadoCurso
              break
            case "COIL":
              cursos.coil = estadoCurso
              break
            case "Didáctica":
              cursos.didactica = estadoCurso
              break
          }
        })

        return {
          id: docente.id,
          nombre: docente.name ?? "",
          apellido: docente.apellido ?? "",
          rut: docente.rut ?? "",
          email: docente.email,
          departamento: docente.departamento?.nombre ?? "",
          especialidad: docente.especialidad ?? "",
          estado: docente.estado === "ACTIVO" ? "Activo" : "Inactivo",
          cursos,
        }
      })

      setUsers(data)
      setUsersFiltrados(data)
    }

    fetchUsers()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let resultado = users

    // Filtro de búsqueda
    if (busqueda) {
      resultado = resultado.filter((u) =>
        `${u.nombre} ${u.apellido} ${u.rut} ${u.email}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      )
    }

    // Filtro de departamento
    if (filtroDepto !== "todos") {
      resultado = resultado.filter((u) => u.departamento === filtroDepto)
    }

    // Filtro de estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((u) => u.estado === filtroEstado)
    }

    setUsersFiltrados(resultado)
  }, [busqueda, filtroDepto, filtroEstado, users])

  const departamentos = Array.from(new Set(users.map((u) => u.departamento)))

  const tieneFiltroPorColumna = (col: string) => filtrosColumna[col]?.length > 0

  const handleClickColumna = (col: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPosicionFiltro({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    setColumnaFiltroActiva(col)
  }

  const handleNuevoDocente = () => {
    setUserActual(null)
    setFormData({
      id: "",
      nombre: "",
      apellido: "",
      rut: "",
      email: "",
      departamento: "",
      especialidad: "",
      estado: "Activo",
      cursos: {
        modeloEducativo: "No Inscrito",
        perspectivaGenero: "No Inscrito",
        neurodiversidadInclusion: "No Inscrito",
        metodologiasActivas: "No Inscrito",
        evaluacion: "No Inscrito",
        planificacionEnsenanza: "No Inscrito",
        dedu: "No Inscrito",
        didu: "No Inscrito",
        concursosInvestigacion: "No Inscrito",
        aS: "No Inscrito",
        stem: "No Inscrito",
        coil: "No Inscrito",
        didactica: "No Inscrito",
      },
    })
    setIsDialogOpen(true)
  }

  const handleEditarDocente = (user: User) => {
    setUserActual(user)
    setFormData(user)
    setIsDialogOpen(true)
  }

  const handleEliminarDialogo = (user: User) => {
    setUserActual(user)
    setIsDeleteDialogOpen(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleGuardarCurso = () => {
    setIsDialogOpen(false)
  }

  const handleEliminarUser = () => {
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GESTIÓN DOCENTE" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Gestión Docente</h1>
          <Button onClick={handleNuevoDocente} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Docente
          </Button>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, apellido, RUT o email..."
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
              <PinIcon className="mr-2 h-4 w-4" />
              {cabecerasFijadas ? "Desfijar Cabecera" : "Fijar Cabecera"}
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
              <X className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  Departamento
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
          </div>
        </div>

        {/* Tabla de docentes con cursos */}
        <div className={`border rounded-md ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto" : "overflow-x-auto"}`}>
          <Table>
            <TableHeader className={cabecerasFijadas ? "sticky top-0 bg-white z-10" : ""}>
              <TableRow>
                <TableHead
                  rowSpan={3}
                  className={`cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("nombre") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("nombre", e)}
                >
                  Nombre
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("nombre") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  rowSpan={3}
                  className={`cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("rut") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("rut", e)}
                >
                  RUT
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("rut") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  rowSpan={3}
                  className={`cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("email") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("email", e)}
                >
                  Email
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("email") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  rowSpan={3}
                  className={`cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("departamento") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("departamento", e)}
                >
                  Departamento
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("departamento") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead rowSpan={3} className="text-center border border-gray-300">
                  Perfil
                </TableHead>
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  INICIAL
                </TableHead>
                <TableHead colSpan={9} className="text-center border border-gray-300">
                  INTERMEDIO
                </TableHead>
                <TableHead colSpan={3} className="text-center border border-gray-300">
                  AVANZADO
                </TableHead>
                <TableHead
                  rowSpan={3}
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("nivel") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("nivel", e)}
                >
                  Nivel
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("nivel") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead rowSpan={3} className="text-right border border-gray-300">
                  Acciones
                </TableHead>
              </TableRow>
              <TableRow>
                {/* Nivel Inicial - Categorías */}
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  MODELO EDUCATIVO
                </TableHead>
                {/* Nivel Intermedio - Categorías */}
                <TableHead colSpan={2} className="text-center border border-gray-300">
                  AMBIENTES PROPICIOS
                </TableHead>
                <TableHead colSpan={2} className="text-center border border-gray-300">
                  ENSEÑANZA EN AULA
                </TableHead>
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  PLANIFICACIÓN
                </TableHead>
                <TableHead colSpan={4} className="text-center border border-gray-300">
                  REFLEXIÓN DOCENTE
                </TableHead>
                {/* Nivel Avanzado - Categorías */}
                <TableHead colSpan={2} className="text-center border border-gray-300">
                  METODOLOGÍAS VINCULADAS
                </TableHead>
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  DIDÁCTICA
                </TableHead>
              </TableRow>
              <TableRow>
                {/* Nivel Inicial */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("modeloEducativo") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("modeloEducativo", e)}
                >
                  Modelo Educativo
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("modeloEducativo") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                {/* Nivel Intermedio - Ambientes propicios */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("perspectivaGenero") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("perspectivaGenero", e)}
                >
                  Perspectiva de género
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("perspectivaGenero") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("neurodiversidadInclusion") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("neurodiversidadInclusion", e)}
                >
                  Neurodiversidad e Inclusión
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("neurodiversidadInclusion") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                {/* Nivel Intermedio - Enseñanza en aula */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("metodologiasActivas") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("metodologiasActivas", e)}
                >
                  Metodologías Activas
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("metodologiasActivas") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("evaluacion") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("evaluacion", e)}
                >
                  Evaluación
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("evaluacion") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                {/* Nivel Intermedio - Planificación */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("planificacionEnsenanza") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("planificacionEnsenanza", e)}
                >
                  Planificación de la enseñanza
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("planificacionEnsenanza") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                {/* Nivel Intermedio - Reflexión */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("dedu") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("dedu", e)}
                >
                  DEDU
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("dedu") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("didu") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("didu", e)}
                >
                  DIDU
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("didu") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("concursosInvestigacion") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("concursosInvestigacion", e)}
                >
                  Concursos Investigación
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("concursosInvestigacion") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead className="text-center border border-gray-300">
                  Participación Docente
                </TableHead>
                {/* Nivel Avanzado - Metodologías vinculadas */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("aS") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("aS", e)}
                >
                  A+S
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("aS") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("stem") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("stem", e)}
                >
                  STEM
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("stem") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("coil") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("coil", e)}
                >
                  COIL
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("coil") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
                {/* Nivel Avanzado - Didáctica */}
                <TableHead
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna("didactica") ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna("didactica", e)}
                >
                  DIDÁCTICA
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna("didactica") && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersFiltrados.length > 0 ? (
                usersFiltrados.map((docente) => (
                  <TableRow key={docente.id}>
                    <TableCell className="border border-gray-200">{`${docente.nombre} ${docente.apellido}`}</TableCell>
                    <TableCell className="border border-gray-200">{docente.rut}</TableCell>
                    <TableCell className="border border-gray-200">{docente.email}</TableCell>
                    <TableCell className="border border-gray-200">{docente.departamento}</TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <Link
                        href={`/perfil-docente/${docente.id}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Ver perfil
                      </Link>
                    </TableCell>

                    {/* Nivel Inicial */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.modeloEducativo === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.modeloEducativo === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.modeloEducativo}
                      </span>
                    </TableCell>

                    {/* Nivel Intermedio - Ambientes propicios */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.perspectivaGenero === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.perspectivaGenero === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.perspectivaGenero}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.neurodiversidadInclusion === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.neurodiversidadInclusion === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.neurodiversidadInclusion}
                      </span>
                    </TableCell>

                    {/* Nivel Intermedio - Enseñanza en aula */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.metodologiasActivas === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.metodologiasActivas === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.metodologiasActivas}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.evaluacion === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.evaluacion === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.evaluacion}
                      </span>
                    </TableCell>

                    {/* Nivel Intermedio - Planificación */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.planificacionEnsenanza === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.planificacionEnsenanza === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.planificacionEnsenanza}
                      </span>
                    </TableCell>

                    {/* Nivel Intermedio - Reflexión */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.dedu === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.dedu === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.dedu}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.didu === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.didu === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.didu}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.concursosInvestigacion === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.concursosInvestigacion === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.concursosInvestigacion}
                      </span>
                    </TableCell>
                    
                    {/* Participación Docente - placeholder */}
                    <TableCell className="border border-gray-200 text-center">
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        No Inscrito
                      </span>
                    </TableCell>

                    {/* Nivel Avanzado - Metodologías vinculadas */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.aS === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.aS === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.aS}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.stem === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.stem === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.stem}
                      </span>
                    </TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.coil === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.coil === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.coil}
                      </span>
                    </TableCell>

                    {/* Nivel Avanzado - Didáctica */}
                    <TableCell className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          docente.cursos.didactica === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : docente.cursos.didactica === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {docente.cursos.didactica}
                      </span>
                    </TableCell>

                    {/* Cálculo del Nivel */}
                    <TableCell className="border border-gray-200 text-center">
                      {(() => {
                        const c = docente.cursos
                        const tieneNivelInicial = c.modeloEducativo === "Aprobado"
                        const tieneAmbientesPropicios =
                          c.perspectivaGenero === "Aprobado" || c.neurodiversidadInclusion === "Aprobado"
                        const tieneEnsenanzaAula = c.metodologiasActivas === "Aprobado" || c.evaluacion === "Aprobado"
                        const tienePlanificacion = c.planificacionEnsenanza === "Aprobado"
                        const tieneReflexion =
                          c.dedu === "Aprobado" || c.didu === "Aprobado" || c.concursosInvestigacion === "Aprobado"
                        const tieneNivelIntermedio =
                          tieneNivelInicial &&
                          tieneAmbientesPropicios &&
                          tieneEnsenanzaAula &&
                          tienePlanificacion &&
                          tieneReflexion
                        const tieneMetodologiasVinculadas =
                          c.aS === "Aprobado" || c.stem === "Aprobado" || c.coil === "Aprobado"
                        const tieneDidactica = c.didactica === "Aprobado"
                        const tieneNivelAvanzado = tieneNivelIntermedio && tieneMetodologiasVinculadas && tieneDidactica

                        let nivel = "Sin nivel"
                        let bgColorClass = "bg-gray-100 text-gray-800"
                        if (tieneNivelAvanzado) {
                          nivel = "Avanzado"
                          bgColorClass = "bg-green-100 text-green-800"
                        } else if (tieneNivelIntermedio) {
                          nivel = "Intermedio"
                          bgColorClass = "bg-blue-100 text-blue-800"
                        } else if (tieneNivelInicial) {
                          nivel = "Inicial"
                          bgColorClass = "bg-orange-100 text-orange-800"
                        }

                        return <span className={`px-2 py-1 rounded text-xs font-medium ${bgColorClass}`}>{nivel}</span>
                      })()}
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="border border-gray-200 text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEditarDocente(docente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEliminarDialogo(docente)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={20} className="text-center py-4 border border-gray-200">
                    No se encontraron docentes con los filtros aplicados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialogo de Edición/Creación */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{userActual ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
            <DialogDescription>Complete los datos del docente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido</Label>
              <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="rut">RUT</Label>
              <Input id="rut" name="rut" value={formData.rut} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={formData.email} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Input id="departamento" name="departamento" value={formData.departamento} onChange={handleFormChange} />
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

      {/* Dialogo de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar al docente {userActual?.nombre} {userActual?.apellido}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminarUser}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}