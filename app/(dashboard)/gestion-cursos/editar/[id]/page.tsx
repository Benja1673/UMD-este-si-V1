"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Filter, Trash2 } from "lucide-react"
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

export default function EditarCursoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [cursoData, setCursoData] = useState<any>(null)
  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [docentesDisponibles, setDocentesDisponibles] = useState<Docente[]>([])
  const [docentesInscritos, setDocentesInscritos] = useState<Docente[]>([])
  const [docentesNoInscritos, setDocentesNoInscritos] = useState<Docente[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepartamento, setFiltroDepartamento] = useState("todos")
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("todos")
  const [seleccionadosInscritos, setSeleccionadosInscritos] = useState<string[]>([])
  const [seleccionadosNoInscritos, setSeleccionadosNoInscritos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

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

  // Cargar datos del curso, categorías, departamentos y docentes
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
        setCursoData(cursoRes)

        // Inscritos desde la API
        const inscritos = cursoRes.inscripciones.map((i: any) => i.usuario)
        setDocentesInscritos(inscritos)

        // No inscritos = todos los docentes - los inscritos
        const noInscritos = users.filter((u: Docente) => !inscritos.some((i: Docente) => i.id === u.id))
        setDocentesNoInscritos(noInscritos)
      } catch (error) {
        console.error(error)
        alert("Error cargando datos del curso")
      }
      setLoading(false)
    }
    if (id) fetchData()
  }, [id])

  // Filtrar docentes disponibles
  const docentesFiltrados = docentesNoInscritos.filter((docente) => {
    const cumpleBusqueda =
      !busqueda ||
      `${docente.name} ${docente.apellido}`.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.rut?.toLowerCase().includes(busqueda.toLowerCase()) ||
      docente.email?.toLowerCase().includes(busqueda.toLowerCase())

    const cumpleDepto =
      filtroDepartamento === "todos" || docente.departamento?.nombre === filtroDepartamento

    const cumpleEsp =
      filtroEspecialidad === "todos" || docente.especialidad === filtroEspecialidad

    return cumpleBusqueda && cumpleDepto && cumpleEsp
  })

  // Inscribir / desinscribir docentes
  const inscribirSeleccionados = () => {
    const docentesAInscribir = docentesNoInscritos.filter((d) => seleccionadosNoInscritos.includes(d.id))
    setDocentesInscritos([...docentesInscritos, ...docentesAInscribir])
    setDocentesNoInscritos(docentesNoInscritos.filter((d) => !seleccionadosNoInscritos.includes(d.id)))
    setSeleccionadosNoInscritos([])
  }

  const desinscribirSeleccionados = () => {
    const docentesADesinscribir = docentesInscritos.filter((d) => seleccionadosInscritos.includes(d.id))
    setDocentesNoInscritos([...docentesNoInscritos, ...docentesADesinscribir])
    setDocentesInscritos(docentesInscritos.filter((d) => !seleccionadosInscritos.includes(d.id)))
    setSeleccionadosInscritos([])
  }

  const handleEliminarCurso = async () => {
    if (!confirm("¿Seguro que deseas eliminar este curso?")) return
    await fetch(`/api/cursos/${id}`, { method: "DELETE" })
    router.push("/gestion-cursos")
  }

  const handleGuardarCambios = async () => {
    try {
      const response = await fetch(`/api/cursos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cursoData,
          docentesInscritos: docentesInscritos.map((d) => d.id),
        }),
      })
      if (!response.ok) throw new Error("Error al guardar cambios")
      alert("Curso actualizado correctamente")
      router.push("/gestion-cursos")
    } catch (error) {
      console.error(error)
      alert("No se pudo actualizar el curso")
    }
  }

  if (loading || !cursoData) {
    return <div className="p-6 text-gray-500">Cargando datos del curso...</div>
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="EDITAR CURSO" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Curso</h1>

        {/* Información del curso */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Información del Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nombre</Label>
                <Input
                  value={cursoData.nombre || ""}
                  onChange={(e) => setCursoData({ ...cursoData, nombre: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Código</Label>
                <Input
                  value={cursoData.codigo || ""}
                  onChange={(e) => setCursoData({ ...cursoData, codigo: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Nivel</Label>
                <Select
                  value={cursoData.nivel || ""}
                  onValueChange={(v) => setCursoData({ ...cursoData, nivel: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inicial">Inicial</SelectItem>
                    <SelectItem value="Intermedio">Intermedio</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tipo</Label>
                <Select
                  value={cursoData.tipo || ""}
                  onValueChange={(v) => setCursoData({ ...cursoData, tipo: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teórico">Teórico</SelectItem>
                    <SelectItem value="Práctico">Práctico</SelectItem>
                    <SelectItem value="Teórico-Práctico">Teórico-Práctico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Año</Label>
                <Input
                  type="number"
                  value={cursoData.ano || ""}
                  onChange={(e) => setCursoData({ ...cursoData, ano: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                <Label>Descripción</Label>
                <Textarea
                  value={cursoData.descripcion || ""}
                  onChange={(e) => setCursoData({ ...cursoData, descripcion: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de docentes */}
        <Card>
          <CardHeader>
            <CardTitle>Gestión de Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Izquierda: inscritos */}
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
                                onCheckedChange={() =>
                                  setSeleccionadosInscritos((prev) =>
                                    prev.includes(docente.id)
                                      ? prev.filter((i) => i !== docente.id)
                                      : [...prev, docente.id]
                                  )
                                }
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
                  variant="outline"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Inscribir
                </Button>
                <Button
                  onClick={desinscribirSeleccionados}
                  disabled={seleccionadosInscritos.length === 0}
                  variant="outline"
                >
                  Desinscribir
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Derecha: disponibles */}
              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3 text-gray-700">Docentes Disponibles ({docentesFiltrados.length})</h3>

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
                          <Filter className="mr-2 h-4 w-4" /> Departamento
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroDepartamento("todos")}>Todos</DropdownMenuItem>
                        {departamentosDocentes.map((d) => (
                          <DropdownMenuItem key={d} onClick={() => setFiltroDepartamento(d)}>
                            {d}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Filter className="mr-2 h-4 w-4" /> Especialidad
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroEspecialidad("todos")}>Todos</DropdownMenuItem>
                        {especialidades.map((e) => (
                          <DropdownMenuItem key={e} onClick={() => setFiltroEspecialidad(e)}>
                            {e}
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
                                onCheckedChange={() =>
                                  setSeleccionadosNoInscritos((prev) =>
                                    prev.includes(docente.id)
                                      ? prev.filter((i) => i !== docente.id)
                                      : [...prev, docente.id]
                                  )
                                }
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

        {/* Botones finales */}
        <div className="flex justify-between mt-6">
          <Button onClick={handleEliminarCurso} variant="destructive" className="bg-red-600 hover:bg-red-700" size="lg">
            <Trash2 className="mr-2 h-4 w-4" /> Eliminar Curso
          </Button>
          <Button onClick={handleGuardarCambios} className="bg-blue-600 hover:bg-blue-700" size="lg">
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
