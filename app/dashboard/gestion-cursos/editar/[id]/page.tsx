"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Filter, Trash2, Save, AlertTriangle } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch" // ✅ Importante para el estado

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

type DocenteInscrito = Docente & {
  inscripcionId?: string
  estadoInscripcion: string
}

export default function EditarCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = params?.id as string

  const [cursoData, setCursoData] = useState<any>(null)
  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [docentesDisponibles, setDocentesDisponibles] = useState<Docente[]>([])
  const [docentesInscritos, setDocentesInscritos] = useState<DocenteInscrito[]>([])
  const [docentesNoInscritos, setDocentesNoInscritos] = useState<Docente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepartamento, setFiltroDepartamento] = useState("todos")
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todos")
  const [seleccionadosInscritos, setSeleccionadosInscritos] = useState<string[]>([])
  const [seleccionadosNoInscritos, setSeleccionadosNoInscritos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const departamentosDocentes = Array.from(
    new Set(docentesDisponibles.map((d) => d.departamento?.nombre).filter((n): n is string => !!n))
  )
  const especialidades = Array.from(
    new Set(docentesDisponibles.map((d) => d.especialidad).filter(Boolean))
  )

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const [cursoRes, deps, cats, users] = await Promise.all([
          fetch(`/api/cursos/${id}`).then((r) => r.json()),
          fetch("/api/departamentos").then((r) => r.json()),
          fetch("/api/categorias").then((r) => r.json()),
          fetch("/api/users").then((r) => r.json()),
        ])

        setDepartamentos(deps)
        setCategorias(cats)
        setDocentesDisponibles(users)
        
        // ✅ Cargamos los datos del curso incluyendo el campo 'activo'
        setCursoData({
          ...cursoRes,
          activo: cursoRes.activo ?? true
        })

        const inscritos: DocenteInscrito[] = (cursoRes.inscripciones || []).map((i: any) => ({
          ...i.usuario,
          inscripcionId: i.id,
          estadoInscripcion: i.estado || "INSCRITO",
        }))
        setDocentesInscritos(inscritos)

        const noInscritos = users.filter((u: Docente) => !inscritos.some((i) => i.id === u.id))
        setDocentesNoInscritos(noInscritos)
      } catch (error) {
        toast({ title: "Error", description: "No se pudieron cargar los datos", variant: "destructive" })
      }
      setLoading(false)
    }
    if (id) fetchData()
  }, [id, toast])

  const docentesFiltrados = docentesNoInscritos.filter((docente) => {
    const cumpleBusqueda = !busqueda || `${docente.name} ${docente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) || docente.rut?.toLowerCase().includes(busqueda.toLowerCase())
    const cumpleDepto = filtroDepartamento === "todos" || docente.departamento?.nombre === filtroDepartamento
    const cumpleEsp = filtroEspecialidad === "todos" || docente.especialidad === filtroEspecialidad
    return cumpleBusqueda && cumpleDepto && cumpleEsp
  })

  const inscribirSeleccionados = () => {
    const nuevos = docentesNoInscritos.filter((d) => seleccionadosNoInscritos.includes(d.id)).map(d => ({ ...d, estadoInscripcion: "INSCRITO" }))
    setDocentesInscritos([...docentesInscritos, ...nuevos])
    setDocentesNoInscritos(docentesNoInscritos.filter((d) => !seleccionadosNoInscritos.includes(d.id)))
    setSeleccionadosNoInscritos([])
  }

  const desinscribirSeleccionados = () => {
    const quitar = docentesInscritos.filter((d) => seleccionadosInscritos.includes(d.id))
    setDocentesNoInscritos([...docentesNoInscritos, ...quitar])
    setDocentesInscritos(docentesInscritos.filter((d) => !seleccionadosInscritos.includes(d.id)))
    setSeleccionadosInscritos([])
  }

  const handleEstadoChange = (docente: DocenteInscrito, nuevoEstado: string) => {
    setDocentesInscritos((prev) => prev.map((d) => d.id === docente.id ? { ...d, estadoInscripcion: nuevoEstado } : d ))
  }

  const handleEliminarCurso = async () => {
    if (!confirm("¿Seguro que deseas eliminar este curso? Se aplicará un borrado lógico.")) return
    try {
      const res = await fetch(`/api/cursos?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast({ title: "Eliminado", description: "Curso marcado como eliminado correctamente" })
      router.push("/dashboard/gestion-cursos")
    } catch (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" })
    }
  }

  const handleGuardarCambios = async () => {
    try {
      const payload = {
        ...cursoData,
        docentesInscritos: docentesInscritos.map((d) => ({
          userId: d.id,
          estado: d.estadoInscripcion,
        })),
      }

      const response = await fetch(`/api/cursos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error("Error al actualizar")

      toast({ title: "Éxito", description: "Curso actualizado con auditoría" })
      router.push("/dashboard/gestion-cursos")
      router.refresh()
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const getColor = (estado: string) => {
    if (estado === "APROBADO") return "bg-green-100 text-green-800 border-green-300"
    if (estado === "REPROBADO") return "bg-red-100 text-red-800 border-red-300"
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  if (loading || !cursoData) return <div className="p-6 text-gray-500 animate-pulse">Cargando datos del curso...</div>

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="EDITAR CURSO" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Editar Curso</h1>
          
          {/* ✅ Switch de Estado Activo/Inactivo */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-full border">
            <Label htmlFor="estado-curso" className="text-sm font-semibold">Estado del Curso:</Label>
            <Switch 
              id="estado-curso" 
              checked={cursoData.activo} 
              onCheckedChange={(val) => setCursoData({ ...cursoData, activo: val })} 
            />
            <span className={`text-xs font-bold ${cursoData.activo ? "text-green-600" : "text-gray-400"}`}>
              {cursoData.activo ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nombre</Label>
                <Input value={cursoData.nombre || ""} onChange={(e) => setCursoData({ ...cursoData, nombre: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Código</Label>
                <Input value={cursoData.codigo || ""} onChange={(e) => setCursoData({ ...cursoData, codigo: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nivel</Label>
                <Select value={cursoData.nivel || ""} onValueChange={(v) => setCursoData({ ...cursoData, nivel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inicial">Inicial</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                <Label>Descripción</Label>
                <Textarea value={cursoData.descripcion || ""} onChange={(e) => setCursoData({ ...cursoData, descripcion: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Gestión de Docentes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Lista Inscritos */}
              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3">Docentes Inscritos ({docentesInscritos.length})</h3>
                <div className="border rounded-md h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentesInscritos.map((docente) => (
                        <TableRow key={docente.id}>
                          <TableCell><Checkbox checked={seleccionadosInscritos.includes(docente.id)} onCheckedChange={() => setSeleccionadosInscritos(prev => prev.includes(docente.id) ? prev.filter(i => i !== docente.id) : [...prev, docente.id])} /></TableCell>
                          <TableCell className="text-sm">{`${docente.name} ${docente.apellido}`}</TableCell>
                          <TableCell>
                            <Select value={docente.estadoInscripcion} onValueChange={(val) => handleEstadoChange(docente, val)}>
                              <SelectTrigger className={`h-8 text-xs ${getColor(docente.estadoInscripcion)}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INSCRITO">Inscrito</SelectItem>
                                <SelectItem value="APROBADO">Aprobado</SelectItem>
                                <SelectItem value="REPROBADO">Reprobado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2">
                <Button onClick={inscribirSeleccionados} disabled={seleccionadosNoInscritos.length === 0} variant="outline" size="sm" className="w-full"><ChevronLeft className="h-4 w-4" /> Inscribir</Button>
                <Button onClick={desinscribirSeleccionados} disabled={seleccionadosInscritos.length === 0} variant="outline" size="sm" className="w-full">Quitar <ChevronRight className="h-4 w-4" /></Button>
              </div>

              {/* Lista Disponibles */}
              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3">Disponibles ({docentesFiltrados.length})</h3>
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar..." className="pl-8 h-9" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                </div>
                <div className="border rounded-md h-80 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white z-10">
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Depto.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentesFiltrados.map((docente) => (
                        <TableRow key={docente.id}>
                          <TableCell><Checkbox checked={seleccionadosNoInscritos.includes(docente.id)} onCheckedChange={() => setSeleccionadosNoInscritos(prev => prev.includes(docente.id) ? prev.filter(i => i !== docente.id) : [...prev, docente.id])} /></TableCell>
                          <TableCell className="text-sm">{`${docente.name} ${docente.apellido}`}</TableCell>
                          <TableCell className="text-xs text-gray-500">{docente.departamento?.nombre || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button onClick={handleEliminarCurso} variant="destructive" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> Eliminar permanentemente
          </Button>
          <Button onClick={handleGuardarCambios} className="bg-blue-600 hover:bg-blue-700 px-8 flex items-center gap-2">
            <Save className="h-4 w-4" /> Guardar Cambios
          </Button>
        </div>
      </div>  
    </div>
  )
}