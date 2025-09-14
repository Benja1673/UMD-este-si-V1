"use client"

import { useState, useEffect } from "react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

// Importamos React-ApexCharts para los gráficos
import dynamic from "next/dynamic"
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

// Tipos para los datos de cursos
type EstadoCurso = "Aprobado" | "No aprobado" | "No inscrito"

type EstadisticasCurso = {
  aprobados: number
  noAprobados: number
  noInscritos: number
}

type Curso = {
  id: string
  nombre: string
  departamento: string
  estadisticas: EstadisticasCurso
}

// Tipos para los datos de evaluaciones
type EstadoEvaluacion = "Realizada" | "No realizada"

type EstadisticasEvaluacion = {
  realizadas: number
  noRealizadas: number
}

type Evaluacion = {
  id: string
  nombre: string
  departamento: string
  estadisticas: EstadisticasEvaluacion
}

// Datos de ejemplo para cursos basados en la información real de gestión de cursos
const cursos: Curso[] = [
  {
    id: "modelo-educativo",
    nombre: "Curso Modelo Educativo",
    departamento: "Informática",
    estadisticas: {
      aprobados: 40,
      noAprobados: 30,
      noInscritos: 4,
    },
  },
  {
    id: "perspectiva-genero",
    nombre: "Perspectiva de Género",
    departamento: "Matemáticas",
    estadisticas: {
      aprobados: 35,
      noAprobados: 25,
      noInscritos: 10,
    },
  },
  {
    id: "neurodiversidad",
    nombre: "Neurodiversidad e Inclusión",
    departamento: "Física",
    estadisticas: {
      aprobados: 20,
      noAprobados: 45,
      noInscritos: 15,
    },
  },
  {
    id: "metodologias-activas",
    nombre: "Metodologías Activas",
    departamento: "Informática",
    estadisticas: {
      aprobados: 30,
      noAprobados: 35,
      noInscritos: 8,
    },
  },
  {
    id: "evaluacion",
    nombre: "Evaluación",
    departamento: "Matemáticas",
    estadisticas: {
      aprobados: 25,
      noAprobados: 40,
      noInscritos: 12,
    },
  },
  {
    id: "planificacion",
    nombre: "Planificación de la Enseñanza",
    departamento: "Educación",
    estadisticas: {
      aprobados: 22,
      noAprobados: 38,
      noInscritos: 14,
    },
  },
  {
    id: "dedu",
    nombre: "DEDU",
    departamento: "Educación",
    estadisticas: {
      aprobados: 28,
      noAprobados: 32,
      noInscritos: 10,
    },
  },
  {
    id: "didu",
    nombre: "DIDU",
    departamento: "Humanidades",
    estadisticas: {
      aprobados: 18,
      noAprobados: 42,
      noInscritos: 16,
    },
  },
  {
    id: "concursos",
    nombre: "Concursos Investigación y/o Innovación",
    departamento: "Investigación",
    estadisticas: {
      aprobados: 15,
      noAprobados: 45,
      noInscritos: 20,
    },
  },
  {
    id: "as",
    nombre: "A+S",
    departamento: "Ciencias Sociales",
    estadisticas: {
      aprobados: 12,
      noAprobados: 48,
      noInscritos: 22,
    },
  },
  {
    id: "stem",
    nombre: "STEM",
    departamento: "Ingeniería",
    estadisticas: {
      aprobados: 10,
      noAprobados: 50,
      noInscritos: 24,
    },
  },
  {
    id: "coil",
    nombre: "COIL",
    departamento: "Relaciones Internacionales",
    estadisticas: {
      aprobados: 8,
      noAprobados: 52,
      noInscritos: 26,
    },
  },
  {
    id: "didactica",
    nombre: "Didáctica",
    departamento: "Educación",
    estadisticas: {
      aprobados: 5,
      noAprobados: 55,
      noInscritos: 28,
    },
  },
]

// Datos de ejemplo para evaluaciones
const evaluaciones: Evaluacion[] = [
  {
    id: "eval-competencias",
    nombre: "Evaluación de Competencias Docentes",
    departamento: "Informática",
    estadisticas: {
      realizadas: 65,
      noRealizadas: 15,
    },
  },
  {
    id: "eval-conocimientos",
    nombre: "Evaluación de Conocimientos Técnicos",
    departamento: "Informática",
    estadisticas: {
      realizadas: 50,
      noRealizadas: 30,
    },
  },
  {
    id: "eval-habilidades",
    nombre: "Evaluación de Habilidades Digitales",
    departamento: "Matemáticas",
    estadisticas: {
      realizadas: 40,
      noRealizadas: 40,
    },
  },
  {
    id: "eval-metodologias",
    nombre: "Evaluación de Metodologías Activas",
    departamento: "Física",
    estadisticas: {
      realizadas: 55,
      noRealizadas: 25,
    },
  },
]

export default function GraficosCursos() {
  const [activeTab, setActiveTab] = useState("cursos")

  // Estados para el gráfico de cursos
  const [cursoSeleccionados, setCursoSeleccionados] = useState<string[]>([])
  const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState<string[]>([])
  const [estadisticasCurso, setEstadisticasCurso] = useState<EstadisticasCurso>({
    aprobados: 0,
    noAprobados: 0,
    noInscritos: 0,
  })

  // Estados para el gráfico de evaluaciones
  const [evaluacionesSeleccionadas, setEvaluacionesSeleccionadas] = useState<string[]>([])
  const [departamentosEvaluacionSeleccionados, setDepartamentosEvaluacionSeleccionados] = useState<string[]>([])
  const [estadisticasEvaluacion, setEstadisticasEvaluacion] = useState<EstadisticasEvaluacion>({
    realizadas: 0,
    noRealizadas: 0,
  })

  // Obtener departamentos únicos para cursos
  const departamentosCursos = Array.from(new Set(cursos.map((curso) => curso.departamento)))

  // Obtener departamentos únicos para evaluaciones
  const departamentosEvaluaciones = Array.from(new Set(evaluaciones.map((evaluacion) => evaluacion.departamento)))

  // Calcular estadísticas para cursos
  useEffect(() => {
    let cursosFiltrados = [...cursos]

    // Filtrar por departamento si es necesario
    if (departamentosSeleccionados.length > 0) {
      cursosFiltrados = cursosFiltrados.filter((curso) => departamentosSeleccionados.includes(curso.departamento))
    }

    // Si se seleccionaron cursos específicos
    if (cursoSeleccionados.length > 0) {
      cursosFiltrados = cursosFiltrados.filter((curso) => cursoSeleccionados.includes(curso.id))
    }

    // Calcular totales
    const totales = cursosFiltrados.reduce(
      (acc, curso) => {
        acc.aprobados += curso.estadisticas.aprobados
        acc.noAprobados += curso.estadisticas.noAprobados
        acc.noInscritos += curso.estadisticas.noInscritos
        return acc
      },
      { aprobados: 0, noAprobados: 0, noInscritos: 0 },
    )

    setEstadisticasCurso(totales)
  }, [cursoSeleccionados, departamentosSeleccionados])

  // Calcular estadísticas para evaluaciones
  useEffect(() => {
    let evaluacionesFiltradas = [...evaluaciones]

    // Filtrar por departamento si es necesario
    if (departamentosEvaluacionSeleccionados.length > 0) {
      evaluacionesFiltradas = evaluacionesFiltradas.filter((evaluacion) =>
        departamentosEvaluacionSeleccionados.includes(evaluacion.departamento),
      )
    }

    // Si se seleccionaron evaluaciones específicas
    if (evaluacionesSeleccionadas.length > 0) {
      evaluacionesFiltradas = evaluacionesFiltradas.filter((evaluacion) =>
        evaluacionesSeleccionadas.includes(evaluacion.id),
      )
    }

    // Calcular totales
    const totales = evaluacionesFiltradas.reduce(
      (acc, evaluacion) => {
        acc.realizadas += evaluacion.estadisticas.realizadas
        acc.noRealizadas += evaluacion.estadisticas.noRealizadas
        return acc
      },
      { realizadas: 0, noRealizadas: 0 },
    )

    setEstadisticasEvaluacion(totales)
  }, [evaluacionesSeleccionadas, departamentosEvaluacionSeleccionados])

  // Calcular porcentajes para cursos
  const totalCursos = estadisticasCurso.aprobados + estadisticasCurso.noAprobados + estadisticasCurso.noInscritos
  const porcentajeAprobados = totalCursos > 0 ? Math.round((estadisticasCurso.aprobados / totalCursos) * 100) : 0
  const porcentajeNoAprobados = totalCursos > 0 ? Math.round((estadisticasCurso.noAprobados / totalCursos) * 100) : 0
  const porcentajeNoInscritos = totalCursos > 0 ? Math.round((estadisticasCurso.noInscritos / totalCursos) * 100) : 0

  // Calcular porcentajes para evaluaciones
  const totalEvaluaciones = estadisticasEvaluacion.realizadas + estadisticasEvaluacion.noRealizadas
  const porcentajeRealizadas =
    totalEvaluaciones > 0 ? Math.round((estadisticasEvaluacion.realizadas / totalEvaluaciones) * 100) : 0
  const porcentajeNoRealizadas =
    totalEvaluaciones > 0 ? Math.round((estadisticasEvaluacion.noRealizadas / totalEvaluaciones) * 100) : 0

  // Configuración del gráfico de torta para cursos
  const chartOptionsCursos = {
    labels: ["Aprobado", "No aprobado", "No inscrito"],
    colors: ["#10b981", "#ef4444", "#6b7280"],
    legend: {
      position: "bottom" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
  }

  const chartSeriesCursos = [estadisticasCurso.aprobados, estadisticasCurso.noAprobados, estadisticasCurso.noInscritos]

  // Configuración del gráfico de torta para evaluaciones
  const chartOptionsEvaluaciones = {
    labels: ["Evaluación realizada", "Evaluación no realizada"],
    colors: ["#10b981", "#ef4444"],
    legend: {
      position: "bottom" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
  }

  const chartSeriesEvaluaciones = [estadisticasEvaluacion.realizadas, estadisticasEvaluacion.noRealizadas]

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GRÁFICOS CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gráficos de Estadísticas</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cursos">Progreso de Cursos</TabsTrigger>
            <TabsTrigger value="evaluaciones">Progreso de Evaluaciones</TabsTrigger>
          </TabsList>

          {/* Contenido de la pestaña de Cursos */}
          <TabsContent value="cursos">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border rounded-md p-4">
                <Label htmlFor="curso-filter" className="mb-2 block font-medium">
                  Seleccionar Cursos
                </Label>
                <div className="max-h-60 overflow-y-auto">
                  {cursos.map((curso) => (
                    <div key={curso.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`curso-${curso.id}`}
                        className="mr-2"
                        checked={cursoSeleccionados.includes(curso.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCursoSeleccionados([...cursoSeleccionados, curso.id])
                          } else {
                            setCursoSeleccionados(cursoSeleccionados.filter((id) => id !== curso.id))
                          }
                        }}
                      />
                      <label htmlFor={`curso-${curso.id}`} className="text-sm">
                        {curso.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {cursoSeleccionados.length > 0 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setCursoSeleccionados([])}>
                    Limpiar selección
                  </Button>
                )}
              </div>

              <div className="border rounded-md p-4">
                <Label htmlFor="departamento-filter" className="mb-2 block font-medium">
                  Seleccionar Departamentos
                </Label>
                <div className="max-h-60 overflow-y-auto">
                  {departamentosCursos.map((depto) => (
                    <div key={depto} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`depto-${depto}`}
                        className="mr-2"
                        checked={departamentosSeleccionados.includes(depto)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartamentosSeleccionados([...departamentosSeleccionados, depto])
                          } else {
                            setDepartamentosSeleccionados(departamentosSeleccionados.filter((d) => d !== depto))
                          }
                        }}
                      />
                      <label htmlFor={`depto-${depto}`} className="text-sm">
                        {depto}
                      </label>
                    </div>
                  ))}
                </div>
                {departamentosSeleccionados.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setDepartamentosSeleccionados([])}
                  >
                    Limpiar selección
                  </Button>
                )}
              </div>
            </div>

            {/* Porcentajes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 font-medium">Aprobado</h3>
                <p className="text-3xl font-bold text-green-600">{porcentajeAprobados}%</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-red-800 font-medium">No aprobado</h3>
                <p className="text-3xl font-bold text-red-600">{porcentajeNoAprobados}%</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-gray-800 font-medium">No inscrito</h3>
                <p className="text-3xl font-bold text-gray-600">{porcentajeNoInscritos}%</p>
              </div>
            </div>

            {/* Gráfico de torta */}
            <div className="mb-6">
              <div className="flex justify-center">
                {typeof window !== "undefined" && (
                  <Chart options={chartOptionsCursos} series={chartSeriesCursos} type="pie" width="380" />
                )}
              </div>
            </div>

            {/* Cantidades */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Resumen de Docentes</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasCurso.aprobados}</strong> users han aprobado el curso
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasCurso.noAprobados}</strong> users no han aprobado
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-gray-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasCurso.noInscritos}</strong> docentes no se han inscrito
                  </span>
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* Contenido de la pestaña de Evaluaciones */}
          <TabsContent value="evaluaciones">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border rounded-md p-4">
                <Label htmlFor="evaluacion-filter" className="mb-2 block font-medium">
                  Seleccionar Evaluaciones
                </Label>
                <div className="max-h-60 overflow-y-auto">
                  {evaluaciones.map((evaluacion) => (
                    <div key={evaluacion.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`evaluacion-${evaluacion.id}`}
                        className="mr-2"
                        checked={evaluacionesSeleccionadas.includes(evaluacion.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEvaluacionesSeleccionadas([...evaluacionesSeleccionadas, evaluacion.id])
                          } else {
                            setEvaluacionesSeleccionadas(evaluacionesSeleccionadas.filter((id) => id !== evaluacion.id))
                          }
                        }}
                      />
                      <label htmlFor={`evaluacion-${evaluacion.id}`} className="text-sm">
                        {evaluacion.nombre}
                      </label>
                    </div>
                  ))}
                </div>
                {evaluacionesSeleccionadas.length > 0 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setEvaluacionesSeleccionadas([])}>
                    Limpiar selección
                  </Button>
                )}
              </div>

              <div className="border rounded-md p-4">
                <Label htmlFor="departamento-eval-filter" className="mb-2 block font-medium">
                  Seleccionar Departamentos
                </Label>
                <div className="max-h-60 overflow-y-auto">
                  {departamentosEvaluaciones.map((depto) => (
                    <div key={depto} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`depto-eval-${depto}`}
                        className="mr-2"
                        checked={departamentosEvaluacionSeleccionados.includes(depto)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartamentosEvaluacionSeleccionados([...departamentosEvaluacionSeleccionados, depto])
                          } else {
                            setDepartamentosEvaluacionSeleccionados(
                              departamentosEvaluacionSeleccionados.filter((d) => d !== depto),
                            )
                          }
                        }}
                      />
                      <label htmlFor={`depto-eval-${depto}`} className="text-sm">
                        {depto}
                      </label>
                    </div>
                  ))}
                </div>
                {departamentosEvaluacionSeleccionados.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setDepartamentosEvaluacionSeleccionados([])}
                  >
                    Limpiar selección
                  </Button>
                )}
              </div>
            </div>

            {/* Porcentajes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 font-medium">Evaluación realizada</h3>
                <p className="text-3xl font-bold text-green-600">{porcentajeRealizadas}%</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-red-800 font-medium">Evaluación no realizada</h3>
                <p className="text-3xl font-bold text-red-600">{porcentajeNoRealizadas}%</p>
              </div>
            </div>

            {/* Gráfico de torta */}
            <div className="mb-6">
              <div className="flex justify-center">
                {typeof window !== "undefined" && (
                  <Chart options={chartOptionsEvaluaciones} series={chartSeriesEvaluaciones} type="pie" width="380" />
                )}
              </div>
            </div>

            {/* Cantidades */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Resumen de Docentes</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasEvaluacion.realizadas}</strong> docentes han realizado la evaluación
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasEvaluacion.noRealizadas}</strong> docentes no han realizado la evaluación
                  </span>
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
