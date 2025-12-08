"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { ChevronDown, Filter, Edit, Trash2, Search, Plus, X, Pin as PinIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

// Componente BreadcrumbNav
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
  departamentoId?: string
  especialidad?: string
  estado: "Activo" | "Inactivo"
  cursos: Cursos
  direccion?: string
  fechaNacimiento?: string
  role?: string
  telefono?: string
}

const ITEMS_POR_PAGINA = 50

export default function Page() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [usersFiltrados, setUsersFiltrados] = useState<User[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("todos")
  const [filtrosColumna, setFiltrosColumna] = useState<Record<string, string[]>>({})
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1) // Nueva línea
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userActual, setUserActual] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [showCrearDepartamento, setShowCrearDepartamento] = useState(false)
  const [nuevoDepartamentoNombre, setNuevoDepartamentoNombre] = useState("")

  // ampliar formData para usar departamentoId, direccion, fechaNacimiento y role
  const [formData, setFormData] = useState({
    id: "",
    nombre: "",
    apellido: "",
    rut: "",
    email: "",
    telefono: "",
    departamentoId: "", // ahora guardamos id
    especialidad: "",
    direccion: "",
    fechaNacimiento: "",
    role: "docente",
  })

  const initialForm = {
    id: "",
    nombre: "",
    apellido: "",
    rut: "",
    email: "",
    telefono: "",
    departamentoId: "",
    especialidad: "",
    direccion: "",
    fechaNacimiento: "",
    role: "docente",
  }

  // Función para mapear estado de BD a estado UI
  const mapearEstadoCurso = (estadoBD: string): string => {
    switch (estadoBD) {
      case "APROBADO":
        return "Aprobado"
      case "REPROBADO":
        return "No Aprobado"
      case "INSCRITO":
        return "En Curso"
      case "NO_INSCRITO":
        return "No Inscrito"
      default:
        return "No Inscrito"
    }
  }

  // Función para mapear nombre de curso a clave del objeto
  const mapearNombreCurso = (nombreCurso: string): keyof Cursos | null => {
    const nombre = nombreCurso.toLowerCase().trim()
    
    if (nombre.includes("modelo educativo")) return "modeloEducativo"
    if (nombre.includes("perspectiva") && nombre.includes("género")) return "perspectivaGenero"
    if (nombre.includes("perspectiva") && nombre.includes("genero")) return "perspectivaGenero"
    if (nombre.includes("neurodiversidad") || nombre.includes("inclusión") || nombre.includes("inclusion")) return "neurodiversidadInclusion"
    if (nombre.includes("metodologías activas") || nombre.includes("metodologias activas")) return "metodologiasActivas"
    if (nombre.includes("evaluación") || nombre.includes("evaluacion")) return "evaluacion"
    if (nombre.includes("planificación") || nombre.includes("planificacion")) return "planificacionEnsenanza"
    if (nombre === "dedu" || nombre.includes("dedu")) return "dedu"
    if (nombre === "didu" || nombre.includes("didu")) return "didu"
    if (nombre.includes("concurso") || nombre.includes("investigación") || nombre.includes("investigacion")) return "concursosInvestigacion"
    if (nombre.includes("a+s") || nombre === "a+s" || nombre.includes("aprendizaje") && nombre.includes("servicio")) return "aS"
    if (nombre === "stem" || nombre.includes("stem")) return "stem"
    if (nombre === "coil" || nombre.includes("coil")) return "coil"
    if (nombre.includes("didáctica") || nombre.includes("didactica")) return "didactica"
    
    return null
  }

  // Fetch inicial de usuarios
  const fetchUsers = async () => {
    try {
      console.log("🔄 Fetching usuarios...")
      const res = await fetch("/api/users")
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const dataRaw = await res.json()
      console.log(`📥 Datos recibidos: ${dataRaw.length} docentes`)

      const data: User[] = dataRaw.map((docente: any) => {
        // Inicializar todos los cursos en "No Inscrito"
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

        // Debug: Log inscripciones del docente
        console.log(`👤 ${docente.name} ${docente.apellido}: ${docente.inscripciones?.length || 0} inscripciones`)

        // Procesar inscripciones
        if (docente.inscripciones && Array.isArray(docente.inscripciones)) {
          docente.inscripciones.forEach((insc: any) => {
            if (!insc.curso || !insc.curso.nombre) {
              console.warn("⚠️ Inscripción sin curso:", insc)
              return
            }

            const nombreCurso = insc.curso.nombre
            const estadoBD = insc.estado || "NO_INSCRITO"
            const claveCurso = mapearNombreCurso(nombreCurso)
            const estadoUI = mapearEstadoCurso(estadoBD)

            console.log(`  📚 ${nombreCurso} → ${claveCurso} → ${estadoUI}`)

            if (claveCurso) {
              cursos[claveCurso] = estadoUI
            } else {
              console.warn(`⚠️ No se pudo mapear el curso: "${nombreCurso}"`)
            }
          })
        }

        return {
          id: docente.id,
          nombre: docente.name ?? "",
          apellido: docente.apellido ?? "",
          rut: docente.rut ?? "",
          email: docente.email,
          departamento: docente.departamento?.nombre ?? "",
          departamentoId: docente.departamento?.id ?? "",
          especialidad: docente.especialidad ?? "",
          estado: docente.estado === "ACTIVO" ? "Activo" : "Inactivo",
          cursos,
          direccion: docente.direccion ?? undefined,
          fechaNacimiento: docente.fechaNacimiento ? new Date(docente.fechaNacimiento).toISOString().slice(0,10) : undefined,
          role: docente.role ?? "docente",
        }
      })

      console.log("✅ Usuarios procesados:", data.length)
      setUsers(data)
      setUsersFiltrados(data)
    } catch (error: any) {
      console.error("❌ Error al cargar docentes:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los docentes: " + error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Cargar departamentos
  useEffect(() => {
    async function fetchDepartamentos() {
      try {
        const res = await fetch("/api/departamentos")
        if (!res.ok) throw new Error("No se pudieron cargar departamentos")
        const data = await res.json()
        setDepartamentos(data)
      } catch (err) {
        console.error(err)
      }
    }
    fetchDepartamentos()
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let resultado = users

    if (busqueda) {
      resultado = resultado.filter((u) =>
        `${u.nombre} ${u.apellido} ${u.rut} ${u.email}`
          .toLowerCase()
          .includes(busqueda.toLowerCase())
      )
    }

    if (filtroDepto !== "todos") {
      resultado = resultado.filter((u) => u.departamento === filtroDepto)
    }

    if (filtroEstado !== "todos") {
      resultado = resultado.filter((u) => u.estado === filtroEstado)
    }

    setUsersFiltrados(resultado)
    setPaginaActual(1) // Vuelve a página 1 al filtrar
  }, [busqueda, filtroDepto, filtroEstado, users])

  // Calcular datos de la página actual
  const indiceInicial = (paginaActual - 1) * ITEMS_POR_PAGINA
  const indiceFinal = indiceInicial + ITEMS_POR_PAGINA
  const usuariosPaginados = usersFiltrados.slice(indiceInicial, indiceFinal)
  const totalPaginas = Math.ceil(usersFiltrados.length / ITEMS_POR_PAGINA)

  const tieneFiltroPorColumna = (col: string) => filtrosColumna[col]?.length > 0

  const handleClickColumna = (col: string, e: React.MouseEvent) => {
    // Lógica de filtros por columna (implementar después si es necesario)
  }

  const handleNuevoDocente = () => {
    setUserActual(null)
    setFormData(initialForm)
    setShowCrearDepartamento(false)
    setIsDialogOpen(true)
  }

  const handleEditarDocente = (user: User) => {
    console.log("handleEditarDocente called", user) // added log
    setUserActual(user)
    setFormData({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      rut: user.rut,
      email: user.email,
      telefono: user.telefono || "",
      departamentoId: user.departamentoId || "",
      especialidad: user.especialidad || "",
      direccion: user.direccion || "",
      fechaNacimiento: user.fechaNacimiento || "",
      role: user.role || "docente",
    })
    setIsDialogOpen(true)
  }

  const handleEliminarDialogo = (user: User) => {
    setUserActual(user)
    setIsDeleteDialogOpen(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSelectDepartamento = (id: string) => {
    setFormData({ ...formData, departamentoId: id })
  }

  const handleCrearDepartamento = async () => {
    if (!nuevoDepartamentoNombre.trim()) return
    try {
      const res = await fetch("/api/departamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoDepartamentoNombre.trim() }),
      })
      if (!res.ok) throw new Error("No se pudo crear departamento")
      const dept = await res.json()
      setDepartamentos((d) => [dept, ...d])
      setFormData({ ...formData, departamentoId: dept.id })
      setNuevoDepartamentoNombre("")
      setShowCrearDepartamento(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }

  const handleGuardarDocente = async () => {
    // Validación de campos obligatorios
    if (!formData.nombre || !formData.apellido || !formData.rut || !formData.email) {
      toast({ title: "Error", description: "Complete los campos obligatorios", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      let res: Response
      if (userActual) {
        res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: formData.id,
            nombre: formData.nombre,
            apellido: formData.apellido,
            rut: formData.rut,
            email: formData.email,
            telefono: formData.telefono || null,
            departamentoId: formData.departamentoId || null,
            direccion: formData.direccion || null,
            fechaNacimiento: formData.fechaNacimiento || null,
            especialidad: formData.especialidad || null,
            role: formData.role || "docente",
          }),
        })
      } else {
        res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre,
            apellido: formData.apellido,
            rut: formData.rut,
            email: formData.email,
            telefono: formData.telefono || null,
            departamentoId: formData.departamentoId || null,
            direccion: formData.direccion || null,
            fechaNacimiento: formData.fechaNacimiento || null,
            especialidad: formData.especialidad || null,
            role: formData.role || "docente",
            password: "temporal123",
          }),
        })
      }

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload.error || payload.message || `HTTP ${res.status}`)
      }

      // éxito: recargar lista, cerrar y resetear formulario
      await fetchUsers()
      setIsDialogOpen(false)
      setUserActual(null)
      setFormData(initialForm)
      setShowCrearDepartamento(false)
      toast({ title: "Éxito", description: userActual ? "Docente actualizado" : "Docente creado" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Error en la operación", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminarDocente = async () => {
    if (!userActual) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/users?id=${userActual.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar")
      }

      toast({
        title: "Éxito",
        description: "Docente eliminado correctamente",
      })

      setIsDeleteDialogOpen(false)
      await fetchUsers() // Recargar la tabla
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
            {departamentos.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    Departamento
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white shadow-md">
                  <DropdownMenuItem onClick={() => setFiltroDepto("todos")}>Todos</DropdownMenuItem>
                  {departamentos.map((depto) => (
                    <DropdownMenuItem key={depto.id} onClick={() => setFiltroDepto(depto.nombre)}>
                      {depto.nombre}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Tabla de docentes */}
        <div className={`border rounded-md ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto" : "overflow-x-auto"}`}>
          <Table>
            <TableHeader className={cabecerasFijadas ? "sticky top-0 bg-white z-10" : ""}>
              <TableRow>
                <TableHead rowSpan={3} className="cursor-pointer border border-gray-300">
                  Nombre
                </TableHead>
                <TableHead rowSpan={3} className="cursor-pointer border border-gray-300">
                  RUT
                </TableHead>
                <TableHead rowSpan={3} className="cursor-pointer border border-gray-300">
                  Email
                </TableHead>
                <TableHead rowSpan={3} className="cursor-pointer border border-gray-300">
                  Departamento
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
                <TableHead rowSpan={3} className="text-center border border-gray-300">
                  Nivel
                </TableHead>
                <TableHead rowSpan={3} className="text-right border border-gray-300">
                  Acciones
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  MODELO EDUCATIVO
                </TableHead>
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
                <TableHead colSpan={2} className="text-center border border-gray-300">
                  METODOLOGÍAS VINCULADAS
                </TableHead>
                <TableHead colSpan={1} className="text-center border border-gray-300">
                  DIDÁCTICA
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-center border border-gray-300">Modelo Educativo</TableHead>
                <TableHead className="text-center border border-gray-300">Perspectiva de género</TableHead>
                <TableHead className="text-center border border-gray-300">Neurodiversidad e Inclusión</TableHead>
                <TableHead className="text-center border border-gray-300">Metodologías Activas</TableHead>
                <TableHead className="text-center border border-gray-300">Evaluación</TableHead>
                <TableHead className="text-center border border-gray-300">Planificación</TableHead>
                <TableHead className="text-center border border-gray-300">DEDU</TableHead>
                <TableHead className="text-center border border-gray-300">DIDU</TableHead>
                <TableHead className="text-center border border-gray-300">Concursos</TableHead>
                <TableHead className="text-center border border-gray-300">A+S</TableHead>
                <TableHead className="text-center border border-gray-300">STEM</TableHead>
                <TableHead className="text-center border border-gray-300">COIL</TableHead>
                <TableHead className="text-center border border-gray-300">DIDÁCTICA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosPaginados.length > 0 ? (
                usuariosPaginados.map((docente) => (
                  <TableRow key={docente.id}>
                    <TableCell className="border border-gray-200">{`${docente.nombre} ${docente.apellido}`}</TableCell>
                    <TableCell className="border border-gray-200">{docente.rut}</TableCell>
                    <TableCell className="border border-gray-200">{docente.email}</TableCell>
                    <TableCell className="border border-gray-200">{docente.departamento || "-"}</TableCell>
                    <TableCell className="border border-gray-200 text-center">
                      <Link href={`/perfil-docente/${docente.id}`} className="text-blue-600 hover:text-blue-800 underline">
                        Ver perfil
                      </Link>
                    </TableCell>

                    {/* Cursos */}
                    {Object.values(docente.cursos).map((curso, idx) => (
                      <TableCell key={idx} className="border border-gray-200 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            curso === "Aprobado"
                              ? "bg-green-100 text-green-800"
                              : curso === "No Aprobado"
                              ? "bg-red-100 text-red-800"
                              : curso === "En Curso"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {curso}
                        </span>
                      </TableCell>
                    ))}

                    {/* Nivel */}
                    <TableCell className="border border-gray-200 text-center">
                      {(() => {
                        const c = docente.cursos
                        const tieneNivelInicial = c.modeloEducativo === "Aprobado"
                        const tieneAmbientesPropicios = c.perspectivaGenero === "Aprobado" || c.neurodiversidadInclusion === "Aprobado"
                        const tieneEnsenanzaAula = c.metodologiasActivas === "Aprobado" || c.evaluacion === "Aprobado"
                        const tienePlanificacion = c.planificacionEnsenanza === "Aprobado"
                        const tieneReflexion = c.dedu === "Aprobado" || c.didu === "Aprobado" || c.concursosInvestigacion === "Aprobado" || c.aS === "Aprobado"
                        const tieneNivelIntermedio = tieneNivelInicial && tieneAmbientesPropicios && tieneEnsenanzaAula && tienePlanificacion && tieneReflexion
                        const tieneMetodologiasVinculadas = c.stem === "Aprobado" || c.coil === "Aprobado"
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
                    {busqueda || filtroDepto !== "todos" ? 
                      "No se encontraron docentes con los filtros aplicados" :
                      "No hay docentes registrados"
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de paginación */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, usersFiltrados.length)} de {usersFiltrados.length} docentes
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
              disabled={paginaActual === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
                <Button
                  key={num}
                  variant={paginaActual === num ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaginaActual(num)}
                  className="w-8"
                >
                  {num}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
              disabled={paginaActual === totalPaginas}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de Crear/Editar Docente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle>{userActual ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
            <DialogDescription>
              Complete los datos del docente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                placeholder="Juan"
                required
              />
            </div>
            <div>
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleFormChange}
                placeholder="Pérez"
                required
              />
            </div>
            <div>
              <Label htmlFor="rut">RUT *</Label>
              <Input
                id="rut"
                name="rut"
                value={formData.rut}
                onChange={handleFormChange}
                placeholder="12.345.678-9"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="juan.perez@universidad.cl"
                required
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleFormChange}
                placeholder="+56 9 1234 5678"
              />
            </div>

            <div>
              <Label htmlFor="departamento">Departamento</Label>
              <Select value={formData.departamentoId || "none"} onValueChange={(v) => {
                if (v === "__crear_nuevo__") {
                  setShowCrearDepartamento(true)
                } else {
                  // "none" representa ninguno -> guardar cadena vacía
                  setFormData({ ...formData, departamentoId: v === "none" ? "" : v })
                }
              }}>
                <SelectTrigger id="departamento">
                  <SelectValue placeholder="Selecciona departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- ninguno --</SelectItem>
                   {departamentos.map((d) => (
                     <SelectItem key={d.id} value={d.id}>
                       {d.nombre}
                     </SelectItem>
                   ))}
                   <SelectItem value="__crear_nuevo__">
                     + Crear nuevo departamento
                   </SelectItem>
                </SelectContent>
              </Select>
              {showCrearDepartamento && (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Nombre nuevo departamento"
                    value={nuevoDepartamentoNombre}
                    onChange={(e) => setNuevoDepartamentoNombre(e.target.value)}
                  />
                  <Button onClick={handleCrearDepartamento}>Crear</Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
              <Input id="fechaNacimiento" name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="especialidad">Especialidad</Label>
              <Input id="especialidad" name="especialidad" value={formData.especialidad} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Selecciona role" />
                </SelectTrigger>
                <SelectContent className="bg-white shadow-md">
                  <SelectItem value="docente">Docente</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarDocente} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {userActual ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmación de Eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white shadow-lg">
           <DialogHeader>
             <DialogTitle>Confirmar eliminación</DialogTitle>
             <DialogDescription>
               ¿Está seguro que desea eliminar al docente{" "}
               <strong>
                 {userActual?.nombre} {userActual?.apellido}
               </strong>
               ? Esta acción no se puede deshacer.
             </DialogDescription>
           </DialogHeader>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
               Cancelar
             </Button>
             <Button variant="destructive" onClick={handleEliminarDocente} disabled={isLoading}>
               {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Eliminar
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}