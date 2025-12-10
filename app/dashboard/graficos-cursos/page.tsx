"use client"

import { useState, useEffect } from "react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

type EstadisticasCurso = {
  aprobados: number
  noAprobados: number
  noInscritos: number
}

type Curso = {
  id: string
  nombre: string
  departamentoId: string
  departamentoNombre?: string
  estadisticas: EstadisticasCurso
}

type Departamento = {
  id: string
  nombre: string
}

export default function GraficosCursos() {
  const [activeTab, setActiveTab] = useState("cursos")
  const [cursos, setCursos] = useState<Curso[]>([])
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para filtros
  const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([])
  const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState<string[]>([])
  
  // Estadísticas calculadas
  const [estadisticasCurso, setEstadisticasCurso] = useState<EstadisticasCurso>({
    aprobados: 0,
    noAprobados: 0,
    noInscritos: 0,
  })

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Cargar cursos
      const resCursos = await fetch('/api/cursos')
      if (!resCursos.ok) throw new Error('Error al cargar cursos')
      const dataCursos = await resCursos.json()

      // Cargar departamentos
      const resDepartamentos = await fetch('/api/departamentos')
      if (!resDepartamentos.ok) throw new Error('Error al cargar departamentos')
      const dataDepartamentos = await resDepartamentos.json()

      setDepartamentos(dataDepartamentos)

      // Cargar inscripciones para cada curso
      const cursosConEstadisticas = await Promise.all(
        dataCursos.map(async (curso: any) => {
          try {
            const resInscripciones = await fetch(`/api/inscripciones?cursoId=${curso.id}`)
            
            if (resInscripciones.ok) {
              const inscripciones = await resInscripciones.json()
              
              // Contar estados
              const aprobados = inscripciones.filter((i: any) => i.estado === 'APROBADO').length
              const reprobados = inscripciones.filter((i: any) => i.estado === 'REPROBADO').length
              const inscritos = inscripciones.filter((i: any) => 
                i.estado === 'INSCRITO' || i.estado === 'EN_PROGRESO'
              ).length

              // Obtener nombre del departamento
              const depto = dataDepartamentos.find((d: any) => d.id === curso.departamentoId)

              return {
                id: curso.id,
                nombre: curso.nombre,
                departamentoId: curso.departamentoId,
                departamentoNombre: depto?.nombre || 'Sin departamento',
                estadisticas: {
                  aprobados,
                  noAprobados: reprobados,
                  noInscritos: inscritos,
                }
              }
            }

            return {
              id: curso.id,
              nombre: curso.nombre,
              departamentoId: curso.departamentoId,
              departamentoNombre: dataDepartamentos.find((d: any) => d.id === curso.departamentoId)?.nombre || 'Sin departamento',
              estadisticas: {
                aprobados: 0,
                noAprobados: 0,
                noInscritos: 0,
              }
            }
          } catch (err) {
            console.error(`Error cargando inscripciones para ${curso.nombre}:`, err)
            return {
              id: curso.id,
              nombre: curso.nombre,
              departamentoId: curso.departamentoId,
              departamentoNombre: 'Sin departamento',
              estadisticas: {
                aprobados: 0,
                noAprobados: 0,
                noInscritos: 0,
              }
            }
          }
        })
      )

      setCursos(cursosConEstadisticas)
    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estadísticas según filtros
  useEffect(() => {
    let cursosFiltrados = [...cursos]

    // Filtrar por departamento
    if (departamentosSeleccionados.length > 0) {
      cursosFiltrados = cursosFiltrados.filter((curso) => 
        departamentosSeleccionados.includes(curso.departamentoId)
      )
    }

    // Filtrar por cursos específicos
    if (cursosSeleccionados.length > 0) {
      cursosFiltrados = cursosFiltrados.filter((curso) => 
        cursosSeleccionados.includes(curso.id)
      )
    }

    // Calcular totales
    const totales = cursosFiltrados.reduce(
      (acc, curso) => {
        acc.aprobados += curso.estadisticas.aprobados
        acc.noAprobados += curso.estadisticas.noAprobados
        acc.noInscritos += curso.estadisticas.noInscritos
        return acc
      },
      { aprobados: 0, noAprobados: 0, noInscritos: 0 }
    )

    setEstadisticasCurso(totales)
  }, [cursosSeleccionados, departamentosSeleccionados, cursos])

  // Calcular porcentajes
  const totalCursos = estadisticasCurso.aprobados + estadisticasCurso.noAprobados + estadisticasCurso.noInscritos
  const porcentajeAprobados = totalCursos > 0 ? Math.round((estadisticasCurso.aprobados / totalCursos) * 100) : 0
  const porcentajeNoAprobados = totalCursos > 0 ? Math.round((estadisticasCurso.noAprobados / totalCursos) * 100) : 0
  const porcentajeNoInscritos = totalCursos > 0 ? Math.round((estadisticasCurso.noInscritos / totalCursos) * 100) : 0

  // Configuración del gráfico
  const chartOptions = {
    labels: ["Aprobado", "Reprobado", "Inscrito/En Progreso"],
    colors: ["#10b981", "#ef4444", "#3b82f6"],
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

  const chartSeries = [
    estadisticasCurso.aprobados,
    estadisticasCurso.noAprobados,
    estadisticasCurso.noInscritos
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav current="GRÁFICOS CURSOS" />
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Gráficos de Estadísticas</h1>
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <BreadcrumbNav current="GRÁFICOS CURSOS" />
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Gráficos de Estadísticas</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-semibold mb-2">Error al cargar estadísticas</p>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <Button onClick={cargarDatos} className="bg-red-600 hover:bg-red-700">
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GRÁFICOS CURSOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gráficos de Estadísticas</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cursos">Progreso de Cursos</TabsTrigger>
          </TabsList>

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
                        checked={cursosSeleccionados.includes(curso.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCursosSeleccionados([...cursosSeleccionados, curso.id])
                          } else {
                            setCursosSeleccionados(cursosSeleccionados.filter((id) => id !== curso.id))
                          }
                        }}
                      />
                      <label htmlFor={`curso-${curso.id}`} className="text-sm">
                        {curso.nombre} ({curso.departamentoNombre})
                      </label>
                    </div>
                  ))}
                </div>
                {cursosSeleccionados.length > 0 && (
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setCursosSeleccionados([])}>
                    Limpiar selección
                  </Button>
                )}
              </div>

              <div className="border rounded-md p-4">
                <Label htmlFor="departamento-filter" className="mb-2 block font-medium">
                  Seleccionar Departamentos
                </Label>
                <div className="max-h-60 overflow-y-auto">
                  {departamentos.map((depto) => (
                    <div key={depto.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`depto-${depto.id}`}
                        className="mr-2"
                        checked={departamentosSeleccionados.includes(depto.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setDepartamentosSeleccionados([...departamentosSeleccionados, depto.id])
                          } else {
                            setDepartamentosSeleccionados(departamentosSeleccionados.filter((d) => d !== depto.id))
                          }
                        }}
                      />
                      <label htmlFor={`depto-${depto.id}`} className="text-sm">
                        {depto.nombre}
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
                <h3 className="text-red-800 font-medium">Reprobado</h3>
                <p className="text-3xl font-bold text-red-600">{porcentajeNoAprobados}%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-800 font-medium">Inscrito/En Progreso</h3>
                <p className="text-3xl font-bold text-blue-600">{porcentajeNoInscritos}%</p>
              </div>
            </div>

            {/* Gráfico de torta */}
            <div className="mb-6">
              <div className="flex justify-center">
                {typeof window !== "undefined" && totalCursos > 0 && (
                  <Chart options={chartOptions} series={chartSeries} type="pie" width="380" />
                )}
                {totalCursos === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Selecciona cursos o departamentos para ver las estadísticas
                    </p>
                  </div>
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
                    <strong>{estadisticasCurso.aprobados}</strong> docentes han aprobado
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasCurso.noAprobados}</strong> docentes han reprobado
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span>
                    <strong>{estadisticasCurso.noInscritos}</strong> docentes están inscritos o en progreso
                  </span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Total de docentes: <strong>{totalCursos}</strong>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}