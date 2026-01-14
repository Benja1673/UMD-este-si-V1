"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
import { ChevronDown, Filter, Edit, Trash2, Search, Plus, X, Pin as PinIcon, Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch" 

// ✅ FUNCIÓN AUXILIAR PARA FORMATEAR RUT CHILENO
const formatRut = (rut: string) => {
  // Eliminar cualquier caracter que no sea número o k/K
  let value = rut.replace(/[^0-9kK]/g, "");
  
  // Limitar a 9 caracteres (8 dígitos + DV)
  if (value.length > 9) value = value.slice(0, 9);

  if (value.length < 2) return value.toUpperCase();

  // Extraer DV y cuerpo
  const cuerpo = value.slice(0, -1);
  const dv = value.slice(-1).toUpperCase();

  // Formatear cuerpo con puntos y añadir guión con DV
  return cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv;
};

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
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [usersFiltrados, setUsersFiltrados] = useState<User[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepto, setFiltroDepto] = useState("todos")
  const [filtroEstado, setFiltroEstado] = useState("activos") 
  const [cabecerasFijadas, setCabecerasFijadas] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState("")

  const [userActual, setUserActual] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [showCrearDepartamento, setShowCrearDepartamento] = useState(false)
  const [nuevoDepartamentoNombre, setNuevoDepartamentoNombre] = useState("")

  const [formData, setFormData] = useState({
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
    estado: "ACTIVO",
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
    estado: "ACTIVO",
  }

  const mapearEstadoCurso = (estadoBD: string): string => {
    switch (estadoBD) {
      case "APROBADO": return "Aprobado"
      case "REPROBADO": return "No Aprobado"
      case "INSCRITO": return "En Curso"
      default: return "No Inscrito"
    }
  }

  const mapearNombreCurso = (nombreCurso: string): keyof Cursos | null => {
    const nombre = nombreCurso.toLowerCase().trim()
    if (nombre.includes("modelo educativo")) return "modeloEducativo"
    if (nombre.includes("perspectiva") && (nombre.includes("género") || nombre.includes("genero"))) return "perspectivaGenero"
    if (nombre.includes("neurodiversidad") || nombre.includes("inclusión") || nombre.includes("inclusion")) return "neurodiversidadInclusion"
    if (nombre.includes("metodologías activas") || nombre.includes("metodologias activas")) return "metodologiasActivas"
    if (nombre.includes("evaluación") || nombre.includes("evaluacion")) return "evaluacion"
    if (nombre.includes("planificación") || nombre.includes("planificacion")) return "planificacionEnsenanza"
    if (nombre === "dedu" || nombre.includes("dedu")) return "dedu"
    if (nombre === "didu" || nombre.includes("didu")) return "didu"
    if (nombre.includes("concurso") || nombre.includes("investigación") || nombre.includes("investigacion")) return "concursosInvestigacion"
    if (nombre.includes("a+s") || nombre === "a+s" || (nombre.includes("aprendizaje") && nombre.includes("servicio"))) return "aS"
    if (nombre === "stem" || nombre.includes("stem")) return "stem"
    if (nombre === "coil" || nombre.includes("coil")) return "coil"
    if (nombre.includes("didáctica") || nombre.includes("didactica")) return "didactica"
    return null
  }

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/users?estado=todos") 
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const dataRaw = await res.json()

      const data: User[] = dataRaw.map((docente: any) => {
        const cursos: Cursos = {
          modeloEducativo: "No Inscrito", perspectivaGenero: "No Inscrito", neurodiversidadInclusion: "No Inscrito",
          metodologiasActivas: "No Inscrito", evaluacion: "No Inscrito", planificacionEnsenanza: "No Inscrito",
          dedu: "No Inscrito", didu: "No Inscrito", concursosInvestigacion: "No Inscrito",
          aS: "No Inscrito", stem: "No Inscrito", coil: "No Inscrito", didactica: "No Inscrito",
        }

        if (docente.inscripciones && Array.isArray(docente.inscripciones)) {
          docente.inscripciones.forEach((insc: any) => {
            if (insc.curso?.nombre) {
              const claveCurso = mapearNombreCurso(insc.curso.nombre)
              if (claveCurso) cursos[claveCurso] = mapearEstadoCurso(insc.estado || "NO_INSCRITO")
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
          fechaNacimiento: docente.fechaNacimiento ? new Date(docente.fechaNacimiento).toISOString().slice(0, 10) : undefined,
          role: docente.role ?? "docente",
          telefono: docente.telefono ?? "",
        }
      })
      setUsers(data)
      setUsersFiltrados(data)
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  useEffect(() => {
    async function fetchDepartamentos() {
      const res = await fetch("/api/departamentos")
      if (res.ok) setDepartamentos(await res.json())
    }
    fetchDepartamentos()
  }, [])

  useEffect(() => {
    let resultado = users
    if (busqueda) {
      resultado = resultado.filter((u) =>
        `${u.nombre} ${u.apellido} ${u.rut} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase())
      )
    }
    if (filtroDepto !== "todos") {
      resultado = resultado.filter((u) => u.departamento === filtroDepto)
    }
    if (filtroEstado === "activos") {
      resultado = resultado.filter((u) => u.estado === "Activo")
    } else if (filtroEstado === "inactivos") {
      resultado = resultado.filter((u) => u.estado === "Inactivo")
    }
    setUsersFiltrados(resultado)
    setPaginaActual(1)
  }, [busqueda, filtroDepto, filtroEstado, users])

  const indiceInicial = (paginaActual - 1) * ITEMS_POR_PAGINA
  const indiceFinal = indiceInicial + ITEMS_POR_PAGINA
  const usuariosPaginados = usersFiltrados.slice(indiceInicial, indiceFinal)
  const totalPaginas = Math.ceil(usersFiltrados.length / ITEMS_POR_PAGINA)

  const handleNuevoDocente = () => {
    setUserActual(null)
    setFormData(initialForm)
    setShowCrearDepartamento(false)
    setIsDialogOpen(true)
  }

  const handleEditarDocente = (user: User) => {
    setUserActual(user)
    setFormData({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      rut: formatRut(user.rut), // ✅ Formatear al cargar para edición
      email: user.email,
      telefono: user.telefono || "",
      departamentoId: user.departamentoId || "",
      especialidad: user.especialidad || "",
      direccion: user.direccion || "",
      fechaNacimiento: user.fechaNacimiento || "",
      role: user.role || "docente",
      estado: user.estado === "Activo" ? "ACTIVO" : "INACTIVO", 
    })
    setIsDialogOpen(true)
  }

  const handleEliminarDialogo = (user: User) => {
    setUserActual(user)
    setIsDeleteDialogOpen(true)
  }

  // ✅ MODIFICADO: Manejador de cambios con formateo de RUT
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    if (name === "rut") {
      setFormData({ ...formData, [name]: formatRut(value) })
    } else {
      setFormData({ ...formData, [name]: value })
    }
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
    if (!formData.nombre || !formData.apellido || !formData.rut || !formData.email) {
      toast({ title: "Error", description: "Complete los campos obligatorios", variant: "destructive" })
      return
    }
    setIsLoading(true)
    try {
      const payload = {
        ...formData,
        departamentoId: (formData.departamentoId === "" || formData.departamentoId === "none") ? null : formData.departamentoId,
        fechaNacimiento: formData.fechaNacimiento ? new Date(formData.fechaNacimiento).toISOString() : null,
        direccion: formData.direccion || null,
        especialidad: formData.especialidad || null,
        telefono: formData.telefono || null,
      }

      const method = userActual ? "PUT" : "POST"
      const url = userActual ? `/api/users?id=${formData.id}` : "/api/users"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const payloadRes = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 409) {
          setErrorDialogMessage(payloadRes.error || "Ya existe un docente registrado con este RUT o Email.")
          setIsErrorDialogOpen(true)
          return; 
        }
        throw new Error(payloadRes.error || "Error al procesar la solicitud")
      }

      await fetchUsers()
      setIsDialogOpen(false)
      toast({ title: "Éxito", description: userActual ? "Docente actualizado" : "Docente creado" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEliminarDocente = async () => {
    if (!userActual) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/users?id=${userActual.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("No se pudo eliminar")
      toast({ title: "Éxito", description: "Docente dado de baja (Inactivo)" })
      setIsDeleteDialogOpen(false)
      await fetchUsers()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
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
            <Plus className="mr-2 h-4 w-4" /> Nuevo Docente
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Buscar docente..." className="pl-10" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCabecerasFijadas(!cabecerasFijadas)}>
              <PinIcon className="mr-2 h-4 w-4" /> {cabecerasFijadas ? "Desfijar Cabecera" : "Fijar Cabecera"}
            </Button>
            
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-[140px] bg-white">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="bg-white opacity-100 z-50">
                <SelectItem value="activos">Solo Activos</SelectItem>
                <SelectItem value="inactivos">Solo Inactivos</SelectItem>
                <SelectItem value="todos">Ver Todos</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white"><Filter className="mr-2 h-4 w-4" /> Depto.</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white opacity-100 z-50">
                <DropdownMenuItem onClick={() => setFiltroDepto("todos")}>Todos</DropdownMenuItem>
                {departamentos.map(d => <DropdownMenuItem key={d.id} onClick={() => setFiltroDepto(d.nombre)}>{d.nombre}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" className="bg-white" onClick={() => { setBusqueda(""); setFiltroDepto("todos"); setFiltroEstado("activos"); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className={`border rounded-md ${cabecerasFijadas ? "max-h-[70vh] overflow-y-auto" : "overflow-x-auto"}`}>
          <Table>
            <TableHeader className={cabecerasFijadas ? "sticky top-0 bg-white z-10" : ""}>
              <TableRow>
                <TableHead rowSpan={3} className="border border-gray-300 bg-white">Nombre</TableHead>
                <TableHead rowSpan={3} className="border border-gray-300 text-center bg-white">RUT</TableHead>
                <TableHead rowSpan={3} className="border border-gray-300 bg-white">Email</TableHead>
                <TableHead rowSpan={3} className="border border-gray-300 bg-white">Departamento</TableHead>
                <TableHead rowSpan={3} className="border border-gray-300 text-center bg-white">Estado</TableHead>
                <TableHead rowSpan={3} className="border border-gray-300 text-center bg-white">Perfil</TableHead>
                <TableHead colSpan={1} className="text-center border border-gray-300 bg-gray-50 text-[11px] font-bold">INICIAL</TableHead>
                <TableHead colSpan={9} className="text-center border border-gray-300 bg-gray-50 text-[11px] font-bold">INTERMEDIO</TableHead>
                <TableHead colSpan={3} className="text-center border border-gray-300 bg-gray-50 text-[11px] font-bold">AVANZADO</TableHead>
                <TableHead rowSpan={3} className="text-center border border-gray-300 bg-white">Nivel</TableHead>
                <TableHead rowSpan={3} className="text-right border border-gray-300 bg-white">Acciones</TableHead>
              </TableRow>
              <TableRow>
                <TableHead className="text-center border border-gray-300 text-[10px] bg-white">MODELO EDUCATIVO</TableHead>
                <TableHead colSpan={2} className="text-center border border-gray-300 text-[10px] bg-white">AMBIENTES PROPICIOS</TableHead>
                <TableHead colSpan={2} className="text-center border border-gray-300 text-[10px] bg-white">ENSEÑANZA EN AULA</TableHead>
                <TableHead className="text-center border border-gray-300 text-[10px] bg-white">PLANIFICACIÓN</TableHead>
                <TableHead colSpan={4} className="text-center border border-gray-300 text-[10px] bg-white">REFLEXIÓN DOCENTE</TableHead>
                <TableHead colSpan={2} className="text-center border border-gray-300 text-[10px] bg-white">METODOLOGÍAS VINCULADAS</TableHead>
                <TableHead className="text-center border border-gray-300 text-[10px] bg-white">DIDÁCTICA</TableHead>
              </TableRow>
              <TableRow>
                {["Mod.", "Gén.", "Incl.", "Act.", "Eval.", "Plan.", "DEDU", "DIDU", "Conc.", "A+S", "STEM", "COIL", "Didác."].map(h => (
                  <TableHead key={h} className="text-center border border-gray-300 text-[9px] p-1 bg-white">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuariosPaginados.length > 0 ? (
                usuariosPaginados.map((docente) => (
                  <TableRow key={docente.id} className={docente.estado === "Inactivo" ? "bg-gray-50 opacity-60" : ""}>
                    <TableCell className="border border-gray-200 text-xs">{`${docente.nombre} ${docente.apellido}`}</TableCell>
                    <TableCell className="border border-gray-200 text-center text-xs font-mono">{docente.rut}</TableCell>
                    <TableCell className="border border-gray-200 text-xs">{docente.email}</TableCell>
                    <TableCell className="border border-gray-200 text-xs">{docente.departamento || "-"}</TableCell>
                    
                    <TableCell className="border border-gray-200 text-center">
                      {docente.estado === "Activo" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase">
                          <XCircle className="mr-1 h-3 w-3" /> Inactivo
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="border border-gray-200 text-center">
                      <Link href={`/dashboard/perfil-docente/${docente.id}`} className="text-blue-600 hover:text-blue-800 underline text-[10px] font-bold uppercase">
                        Ver perfil
                      </Link>
                    </TableCell>

                    {Object.values(docente.cursos).map((c, i) => (
                      <TableCell key={i} className="border border-gray-200 text-center text-[9px] p-1">
                        {c === "No Inscrito" ? (
                          <span className="bg-gray-50 text-gray-400 px-2 py-0.5 rounded-sm font-bold border border-gray-100">-</span>
                        ) : (
                          <span className={`px-1 rounded ${
                            c === "Aprobado" ? "bg-green-100 text-green-800" : 
                            c === "En Curso" ? "bg-yellow-100 text-yellow-800" : 
                            "bg-red-100 text-red-800"
                          }`}>
                            {c}
                          </span>
                        )}
                      </TableCell>
                    ))}

                    <TableCell className="border border-gray-200 text-center">
                      {(() => {
                        const cur = docente.cursos;
                        const inicial = cur.modeloEducativo === "Aprobado";
                        const intermedio = inicial && cur.planificacionEnsenanza === "Aprobado" && (cur.dedu === "Aprobado" || cur.didu === "Aprobado");
                        const avanzado = intermedio && (cur.stem === "Aprobado" || cur.coil === "Aprobado");
                        const n = avanzado ? "Avanzado" : intermedio ? "Intermedio" : inicial ? "Inicial" : "Sin nivel";
                        const col = avanzado ? "text-green-600" : intermedio ? "text-blue-600" : inicial ? "text-orange-600" : "text-gray-400";
                        return <span className={`text-[10px] font-bold ${col}`}>{n}</span>
                      })()}
                    </TableCell>

                    <TableCell className="border border-gray-200 text-right">
                      <div className="flex justify-end gap-1 px-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEditarDocente(docente)}><Edit className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleEliminarDialogo(docente)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={25} className="text-center py-10 text-gray-400 border border-gray-200">No se encontraron docentes.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-6 text-xs text-gray-500 font-medium">
          <div>Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, usersFiltrados.length)} de {usersFiltrados.length} docentes</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-white opacity-100">
          <DialogHeader>
            <div className="flex justify-between items-center mr-8">
              <DialogTitle>{userActual ? "Editar Perfil Docente" : "Registrar Nuevo Docente"}</DialogTitle>
              <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border">
                <Switch checked={formData.estado === "ACTIVO"} onCheckedChange={(checked) => setFormData({...formData, estado: checked ? "ACTIVO" : "INACTIVO"})} />
                <span className={`text-[10px] font-bold ${formData.estado === "ACTIVO" ? "text-green-600" : "text-gray-400"}`}>{formData.estado}</span>
              </div>
            </div>
          </DialogHeader>
          <div className="grid gap-3 py-2 text-xs">
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Nombre *</Label><Input name="nombre" value={formData.nombre} onChange={handleFormChange} /></div>
                <div className="space-y-1"><Label>Apellido *</Label><Input name="apellido" value={formData.apellido} onChange={handleFormChange} /></div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>RUT *</Label><Input name="rut" placeholder="12.345.678-9" value={formData.rut} onChange={handleFormChange} /></div>
                <div className="space-y-1"><Label>Email *</Label><Input name="email" type="email" value={formData.email} onChange={handleFormChange} /></div>
             </div>
             <div className="space-y-1">
                <Label>Departamento</Label>
                <Select value={formData.departamentoId || "none"} onValueChange={(v) => v === "__crear__" ? setShowCrearDepartamento(true) : setFormData({...formData, departamentoId: v === "none" ? "" : v})}>
                  <SelectTrigger className="h-8 bg-white"><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent className="bg-white opacity-100 z-50">
                    <SelectItem value="none">-- ninguno --</SelectItem>
                    {departamentos.map(d => <SelectItem key={d.id} value={d.id}>{d.nombre}</SelectItem>)}
                    <SelectItem value="__crear__" className="text-blue-600 font-bold">+ Nuevo Depto.</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             {showCrearDepartamento && (
                <div className="flex gap-2 mt-1">
                   <Input placeholder="Nombre depto..." value={nuevoDepartamentoNombre} onChange={e => setNuevoDepartamentoNombre(e.target.value)} />
                   <Button size="sm" onClick={handleCrearDepartamento}>Crear</Button>
                </div>
             )}
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Dirección</Label><Input name="direccion" value={formData.direccion} onChange={handleFormChange} /></div>
                <div className="space-y-1"><Label>Nacimiento</Label><Input name="fechaNacimiento" type="date" value={formData.fechaNacimiento} onChange={handleFormChange} /></div>
             </div>
             <div className="space-y-1"><Label>Especialidad</Label><Input name="especialidad" value={formData.especialidad} onChange={handleFormChange} /></div>
             <div className="space-y-1"><Label>Teléfono</Label><Input name="telefono" value={formData.telefono} onChange={handleFormChange} /></div>
             <div className="space-y-1">
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                   <SelectTrigger className="h-8 bg-white"><SelectValue /></SelectTrigger>
                   <SelectContent className="bg-white opacity-100 z-50">
                      <SelectItem value="docente">Docente</SelectItem>
                      {session?.user?.role?.toLowerCase() === "admin" && <SelectItem value="supervisor">Supervisor</SelectItem>}
                   </SelectContent>
                </Select>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={handleGuardarDocente} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white opacity-100">
          <DialogHeader>
            <DialogTitle className="text-red-600 font-bold uppercase">Baja Administrativa</DialogTitle>
            <DialogDescription className="pt-2">
              ¿Confirmar la baja de <strong>{userActual?.nombre} {userActual?.apellido}</strong>?
              <br /><br />
              <span className="text-[10px] bg-amber-50 text-amber-800 p-2 rounded block border border-amber-200">
                <strong>Auditoría:</strong> El registro pasará a estado <strong>inactivo</strong> para conservar el historial histórico.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarDocente} disabled={isLoading}>Confirmar Baja</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="max-w-[400px] bg-white opacity-100">
          <DialogHeader>
            <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600 h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-red-600 font-bold">Datos Duplicados</DialogTitle>
            <DialogDescription className="text-center pt-2">
              {errorDialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white font-bold w-full" 
              onClick={() => setIsErrorDialogOpen(false)}
            >
              ACEPTAR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}