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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { ChevronDown, Filter, Edit, Trash2 } from "lucide-react"

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
  const [filtrosColumna, setFiltrosColumna] = useState<Record<string, string[]>>({})
  const [columnaFiltroActiva, setColumnaFiltroActiva] = useState<string | null>(null)
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

  // 🔹 Fetch de usuarios desde la base de datos y mapear inscripciones a cursos
  useEffect(() => {
    async function fetchUsers() {
      const res = await fetch("/api/users")
      const dataRaw = await res.json()

      // Mapear inscripciones a cursos como lo espera la tabla
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
          // Si hay nota o estado indica aprobado, marcamos como "Aprobado"
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

  const tieneFiltroPorColumna = (col: string) => filtrosColumna[col]?.length > 0

  const handleClickColumna = (col: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setPosicionFiltro({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
    setColumnaFiltroActiva(col)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleEditarUser = (user: User) => {
    setUserActual(user)
    setFormData(user)
    setIsDialogOpen(true)
  }

  const handleEliminarDialogo = (user: User) => {
    setUserActual(user)
    setIsDeleteDialogOpen(true)
  }

  const handleGuardarCurso = () => {
    setIsDialogOpen(false)
  }

  const handleEliminarUser = () => {
    setIsDeleteDialogOpen(false)
  }

  return (
    <div className="p-4 relative">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Nombre",
                "RUT",
                "Email",
                "Departamento",
                "Perfil",
                "Modelo Educativo",
                "Perspectiva de género",
                "Neurodiversidad e Inclusión",
                "Metodologías Activas",
                "Evaluación",
                "Planificación",
                "DEDU",
                "DIDU",
                "Concursos Investigación",
                "A+S",
                "STEM",
                "COIL",
                "Didáctica",
                "Nivel",
                "Acciones",
              ].map((col, i) => (
                <TableHead
                  key={i}
                  className={`text-center cursor-pointer border border-gray-300 ${
                    tieneFiltroPorColumna(col.toLowerCase()) ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                  onClick={(e) => handleClickColumna(col.toLowerCase(), e)}
                >
                  {col}
                  <ChevronDown className="h-4 w-4 inline ml-1" />
                  {tieneFiltroPorColumna(col.toLowerCase()) && <Filter className="h-3 w-3 inline ml-1" />}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersFiltrados.length > 0 ? (
              usersFiltrados.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="border border-gray-200">{`${user.nombre} ${user.apellido}`}</TableCell>
                  <TableCell className="border border-gray-200">{user.rut}</TableCell>
                  <TableCell className="border border-gray-200">{user.email}</TableCell>
                  <TableCell className="border border-gray-200">{user.departamento}</TableCell>
                  <TableCell className="border border-gray-200 text-center">
                    <Link   href={`/perfil-docente/${user.id}`} className="text-blue-600 hover:underline">
                      Ver Perfil
                    </Link>   
                  </TableCell>

                  {Object.keys(user.cursos).map((curso) => (
                    <TableCell key={curso} className="border border-gray-200 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.cursos[curso as keyof Cursos] === "Aprobado"
                            ? "bg-green-100 text-green-800"
                            : user.cursos[curso as keyof Cursos] === "No Aprobado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.cursos[curso as keyof Cursos]}
                      </span>
                    </TableCell>
                  ))}

                  <TableCell className="border border-gray-200 text-center">
                    {(() => {
                      const c = user.cursos
                      const tieneNivelInicial = c.modeloEducativo === "Aprobado"
                      const tieneAmbientesPropicios =
                        c.perspectivaGenero === "Aprobado" || c.neurodiversidadInclusion === "Aprobado"
                      const tieneEnsenanzaAula = c.metodologiasActivas === "Aprobado" || c.evaluacion === "Aprobado"
                      const tienePlanificacion = c.planificacionEnsenanza === "Aprobado"
                      const tieneReflexion = c.dedu === "Aprobado" || c.didu === "Aprobado" || c.concursosInvestigacion === "Aprobado"
                      const tieneNivelIntermedio =
                        tieneNivelInicial && tieneAmbientesPropicios && tieneEnsenanzaAula && tienePlanificacion && tieneReflexion
                      const tieneMetodologiasVinculadas = c.aS === "Aprobado" || c.stem === "Aprobado" || c.coil === "Aprobado"
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

                  <TableCell className="border border-gray-200 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditarUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEliminarDialogo(user)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={21} className="text-center py-4 border border-gray-200">
                  No se encontraron docentes con los filtros aplicados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Aquí podrías incluir los diálogos y filtros */}
    </div>
  )
}
