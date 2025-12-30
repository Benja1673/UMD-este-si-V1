"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronLeft, ChevronRight, Filter, CheckCircle2, AlertCircle } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"

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

  const [departamentos, setDepartamentos] = useState<{ id: string; nombre: string }[]>([])
  const [categorias, setCategorias] = useState<{ id: string; nombre: string }[]>([])
  const [docentesDisponibles, setDocentesDisponibles] = useState<Docente[]>([])
  const [loading, setLoading] = useState(true)

  const [cursoData, setCursoData] = useState({
    nombre: "",
    descripcion: "",
    codigo: "",
    nivel: "",
    instructor: "",
    tipo: "",
    ano: new Date().getFullYear().toString(),
    categoriaId: "",
    departamentoId: "",
    activo: true, // ✅ Nuevo: Estado inicial del curso
  })

  const [docentesInscritos, setDocentesInscritos] = useState<Docente[]>([])
  const [docentesNoInscritos, setDocentesNoInscritos] = useState<Docente[]>([])
  const [seleccionadosInscritos, setSeleccionadosInscritos] = useState<string[]>([])
  const [seleccionadosNoInscritos, setSeleccionadosNoInscritos] = useState<string[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [filtroDepartamento, setFiltroDepartamento] = useState<string>("todos")
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>("todos")
  const [docentesFiltrados, setDocentesFiltrados] = useState<Docente[]>([])

  const departamentosDocentes = Array.from(
    new Set(docentesDisponibles.map((d) => d.departamento?.nombre).filter((n): n is string => !!n))
  )
  const especialidades = Array.from(
    new Set(docentesDisponibles.map((d) => d.especialidad).filter(Boolean))
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCursoData({ ...cursoData, [name]: value })
  }

  const handleSelectChange = (name: string, value: string) => {
    setCursoData({ ...cursoData, [name]: value })
  }

  const handleCheckboxInscritos = (id: string) => {
    setSeleccionadosInscritos((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleCheckboxNoInscritos = (id: string) => {
    setSeleccionadosNoInscritos((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

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

  const handleGuardarCurso = async () => {
    if (!cursoData.nombre || !cursoData.categoriaId || !cursoData.departamentoId) {
      alert("Por favor rellena los campos obligatorios (Nombre, Categoría y Departamento)")
      return
    }

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
      
      router.push("/dashboard/gestion-cursos")
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("No se pudo guardar el curso")
    }
  }

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
        console.error("Error cargando datos:", e)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let resultado = docentesNoInscritos
    if (busqueda) {
      const b = busqueda.toLowerCase()
      resultado = resultado.filter(d => 
        `${d.name} ${d.apellido}`.toLowerCase().includes(b) || d.rut?.toLowerCase().includes(b)
      )
    }
    if (filtroDepartamento !== "todos") {
      resultado = resultado.filter(d => d.departamento?.nombre === filtroDepartamento)
    }
    if (filtroEspecialidad !== "todos") {
      resultado = resultado.filter(d => d.especialidad === filtroEspecialidad)
    }
    setDocentesFiltrados(resultado)
  }, [busqueda, filtroDepartamento, filtroEspecialidad, docentesNoInscritos])

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="CREAR CURSO" />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Crear Nuevo Curso</h1>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
            <Label htmlFor="activo-switch" className="text-sm font-medium">Estado inicial:</Label>
            <Switch 
              id="activo-switch" 
              checked={cursoData.activo} 
              onCheckedChange={(val) => setCursoData({...cursoData, activo: val})} 
            />
            <span className={cursoData.activo ? "text-green-600 text-xs font-bold" : "text-gray-400 text-xs font-bold"}>
              {cursoData.activo ? "ACTIVO" : "INACTIVO"}
            </span>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle>Información del Curso</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nombre">Nombre del Curso *</Label>
                <Input id="nombre" name="nombre" value={cursoData.nombre} onChange={handleInputChange} placeholder="Ej: Introducción a la Programación" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" name="codigo" value={cursoData.codigo} onChange={handleInputChange} placeholder="Ej: CS101" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nivel">Nivel</Label>
                <Select value={cursoData.nivel} onValueChange={(v) => handleSelectChange("nivel", v)}>
                  <SelectTrigger id="nivel"><SelectValue placeholder="Selecciona un nivel" /></SelectTrigger>
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
                <Select value={cursoData.tipo} onValueChange={(v) => handleSelectChange("tipo", v)}>
                  <SelectTrigger id="tipo"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teórico">Teórico</SelectItem>
                    <SelectItem value="Práctico">Práctico</SelectItem>
                    <SelectItem value="Teórico-Práctico">Teórico-Práctico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="ano">Año</Label>
                <Input id="ano" name="ano" type="number" value={cursoData.ano} onChange={handleInputChange} placeholder="2025" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="instructor">Instructor Principal</Label>
                <Input id="instructor" name="instructor" value={cursoData.instructor} onChange={handleInputChange} placeholder="Nombre del instructor" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="categoriaId">Categoría *</Label>
                <Select value={cursoData.categoriaId} onValueChange={(v) => handleSelectChange("categoriaId", v)}>
                  <SelectTrigger id="categoriaId"><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="departamentoId">Departamento *</Label>
                <Select value={cursoData.departamentoId} onValueChange={(v) => handleSelectChange("departamentoId", v)}>
                  <SelectTrigger id="departamentoId"><SelectValue placeholder="Selecciona un departamento" /></SelectTrigger>
                  <SelectContent>
                    {departamentos.map((depto) => <SelectItem key={depto.id} value={depto.id}>{depto.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" name="descripcion" value={cursoData.descripcion} onChange={handleInputChange} placeholder="Describe el curso..." rows={3} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Inscripción de Docentes</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
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
                            <TableCell><Checkbox checked={seleccionadosInscritos.includes(docente.id)} onCheckedChange={() => handleCheckboxInscritos(docente.id)} /></TableCell>
                            <TableCell>{`${docente.name} ${docente.apellido}`}</TableCell>
                            <TableCell>{docente.rut}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-8">No hay docentes inscritos</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col items-center justify-center gap-4">
                <Button onClick={inscribirSeleccionados} disabled={seleccionadosNoInscritos.length === 0} className="w-full" variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Inscribir</Button>
                <Button onClick={desinscribirSeleccionados} disabled={seleccionadosInscritos.length === 0} className="w-full" variant="outline">Quitar <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>

              <div className="lg:col-span-5">
                <h3 className="font-semibold mb-3 text-gray-700">Docentes Disponibles ({docentesFiltrados.length})</h3>
                <div className="flex flex-col gap-2 mb-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Buscar docente..." className="pl-10" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="flex-1">Depto.</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroDepartamento("todos")}>Todos</DropdownMenuItem>
                        {departamentosDocentes.map((depto) => <DropdownMenuItem key={depto} onClick={() => setFiltroDepartamento(depto)}>{depto}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="flex-1">Especialidad</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setFiltroEspecialidad("todos")}>Todas</DropdownMenuItem>
                        {especialidades.map((esp) => <DropdownMenuItem key={esp} onClick={() => setFiltroEspecialidad(esp)}>{esp}</DropdownMenuItem>)}
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
                        <TableHead>Depto.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docentesFiltrados.length > 0 ? (
                        docentesFiltrados.map((docente) => (
                          <TableRow key={docente.id}>
                            <TableCell><Checkbox checked={seleccionadosNoInscritos.includes(docente.id)} onCheckedChange={() => handleCheckboxNoInscritos(docente.id)} /></TableCell>
                            <TableCell>{`${docente.name} ${docente.apellido}`}</TableCell>
                            <TableCell>{docente.rut}</TableCell>
                            <TableCell>{docente.departamento?.nombre || "-"}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow><TableCell colSpan={4} className="text-center text-gray-500 py-8">No se encontraron docentes</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button onClick={handleGuardarCurso} className="bg-blue-600 hover:bg-blue-700" size="lg">Guardar Curso</Button>
        </div>
      </div>
    </div>
  )
}