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
  departamentoId: string // Depto del curso (original)
  departamentoNombre?: string
  // ✅ Almacenamos estadísticas desglosadas por departamento del docente participante
  statsPorDeptoDocente: Record<string, EstadisticasCurso>
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
  
  // Estadísticas calculadas finales
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
      const resCursos = await fetch('/api/cursos')
      if (!resCursos.ok) throw new Error('Error al cargar cursos')
      const dataCursos = await resCursos.json()

      const resDepartamentos = await fetch('/api/departamentos')
      if (!resDepartamentos.ok) throw new Error('Error al cargar departamentos')
      const dataDepartamentos = await resDepartamentos.json()

      // ✅ Agregamos manualmente "Sin departamento" a la lista de opciones
      setDepartamentos([...dataDepartamentos, { id: 'sin-departamento', nombre: 'Sin Departamento' }])

      // Cargar inscripciones para cada curso y procesar depto de docentes
      const cursosProcesados = await Promise.all(
        dataCursos.map(async (curso: any) => {
          try {
            const resInscripciones = await fetch(`/api/inscripciones?cursoId=${curso.id}`)
            
            const statsPorDeptoDocente: Record<string, EstadisticasCurso> = {}

            if (resInscripciones.ok) {
              const inscripciones = await resInscripciones.json()
              
              inscripciones.forEach((i: any) => {
                // ✅ Tomamos el depto del DOCENTE (usuario)
                const deptoIdDocente = i.usuario?.departamentoId || 'sin-departamento'
                
                if (!statsPorDeptoDocente[deptoIdDocente]) {
                  statsPorDeptoDocente[deptoIdDocente] = { aprobados: 0, noAprobados: 0, noInscritos: 0 }
                }

                if (i.estado === 'APROBADO') {
                  statsPorDeptoDocente[deptoIdDocente].aprobados++
                } else if (i.estado === 'REPROBADO') {
                  statsPorDeptoDocente[deptoIdDocente].noAprobados++
                } else {
                  statsPorDeptoDocente[deptoIdDocente].noInscritos++
                }
              })
            }

            // Info del depto del curso solo para etiquetas
            const deptoDelCurso = dataDepartamentos.find((d: any) => d.id === curso.departamentoId)

            return {
              id: curso.id,
              nombre: curso.nombre,
              departamentoId: curso.departamentoId,
              departamentoNombre: deptoDelCurso?.nombre || 'Sin departamento',
              statsPorDeptoDocente
            }
          } catch (err) {
            return {
              id: curso.id, nombre: curso.nombre, departamentoId: curso.departamentoId,
              statsPorDeptoDocente: {}
            }
          }
        })
      )

      setCursos(cursosProcesados)
    } catch (err: any) {
      console.error('Error cargando datos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Calcular estadísticas consolidadas basadas en el Depto del Docente
  useEffect(() => {
    let cursosFiltrados = [...cursos]

    // 1. Si hay cursos específicos seleccionados, filtramos la lista
    if (cursosSeleccionados.length > 0) {
      cursosFiltrados = cursosFiltrados.filter((curso) => 
        cursosSeleccionados.includes(curso.id)
      )
    }

    // 2. Sumamos las estadísticas de los departamentos de interés
    const totales = cursosFiltrados.reduce(
      (acc, curso) => {
        // Si hay departamentos seleccionados, solo sumamos esos. Si no, sumamos todos (los de los docentes)
        const deptoIdsAIncluir = departamentosSeleccionados.length > 0 
          ? departamentosSeleccionados 
          : Object.keys(curso.statsPorDeptoDocente)

        deptoIdsAIncluir.forEach(deptoId => {
          const stats = curso.statsPorDeptoDocente[deptoId]
          if (stats) {
            acc.aprobados += stats.aprobados
            acc.noAprobados += stats.noAprobados
            acc.noInscritos += stats.noInscritos
          }
        })
        return acc
      },
      { aprobados: 0, noAprobados: 0, noInscritos: 0 }
    )

    setEstadisticasCurso(totales)
  }, [cursosSeleccionados, departamentosSeleccionados, cursos])

  const totalDocentes = estadisticasCurso.aprobados + estadisticasCurso.noAprobados + estadisticasCurso.noInscritos
  const porcentajeAprobados = totalDocentes > 0 ? Math.round((estadisticasCurso.aprobados / totalDocentes) * 100) : 0
  const porcentajeNoAprobados = totalDocentes > 0 ? Math.round((estadisticasCurso.noAprobados / totalDocentes) * 100) : 0
  const porcentajeNoInscritos = totalDocentes > 0 ? Math.round((estadisticasCurso.noInscritos / totalDocentes) * 100) : 0

  const chartOptions = {
    labels: ["Aprobado", "Reprobado", "Inscrito/En Progreso"],
    colors: ["#10b981", "#ef4444", "#3b82f6"],
    legend: { position: "bottom" as const },
    responsive: [{
      breakpoint: 480,
      options: { chart: { width: 300 }, legend: { position: "bottom" as const } },
    }],
  }

  const chartSeries = [estadisticasCurso.aprobados, estadisticasCurso.noAprobados, estadisticasCurso.noInscritos]

  if (loading) return (
    <div className="space-y-6">
      <BreadcrumbNav current="GRÁFICOS" />
      <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Cargando estadísticas por departamento docente...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GRÁFICOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gráficos de Estadísticas (Docentes)</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="cursos">Progreso por Departamento Docente</TabsTrigger>
          </TabsList>

          <TabsContent value="cursos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Filtro de Cursos */}
              <div className="border rounded-md p-4">
                <Label className="mb-2 block font-medium">1. Filtrar por Cursos</Label>
                <div className="max-h-60 overflow-y-auto">
                  {cursos.map((curso) => (
                    <div key={curso.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`curso-${curso.id}`}
                        className="mr-2"
                        checked={cursosSeleccionados.includes(curso.id)}
                        onChange={(e) => {
                          if (e.target.checked) setCursosSeleccionados([...cursosSeleccionados, curso.id])
                          else setCursosSeleccionados(cursosSeleccionados.filter((id) => id !== curso.id))
                        }}
                      />
                      <label htmlFor={`curso-${curso.id}`} className="text-sm cursor-pointer">
                        {curso.nombre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Filtro de Departamentos de los Docentes */}
              <div className="border rounded-md p-4">
                <Label className="mb-2 block font-medium">2. Seleccionar Departamentos (Docentes)</Label>
                <div className="max-h-60 overflow-y-auto">
                  {departamentos.map((depto) => (
                    <div key={depto.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`depto-${depto.id}`}
                        className="mr-2"
                        checked={departamentosSeleccionados.includes(depto.id)}
                        onChange={(e) => {
                          if (e.target.checked) setDepartamentosSeleccionados([...departamentosSeleccionados, depto.id])
                          else setDepartamentosSeleccionados(departamentosSeleccionados.filter((d) => d !== depto.id))
                        }}
                      />
                      <label htmlFor={`depto-${depto.id}`} className="text-sm cursor-pointer">
                        {depto.nombre}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cuadros de Porcentajes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-green-800 font-medium text-xs uppercase">Aprobados</h3>
                <p className="text-3xl font-bold text-green-600">{porcentajeAprobados}%</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="text-red-800 font-medium text-xs uppercase">Reprobados</h3>
                <p className="text-3xl font-bold text-red-600">{porcentajeNoAprobados}%</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-blue-800 font-medium text-xs uppercase">En Progreso</h3>
                <p className="text-3xl font-bold text-blue-600">{porcentajeNoInscritos}%</p>
              </div>
            </div>

            {/* Gráfico ApexCharts */}
            <div className="mb-8 flex justify-center bg-gray-50 py-6 rounded-xl border border-dashed">
                {typeof window !== "undefined" && totalDocentes > 0 ? (
                  <Chart options={chartOptions} series={chartSeries} type="pie" width="400" />
                ) : (
                  <p className="text-gray-500 italic py-12">No hay datos para los filtros seleccionados</p>
                )}
            </div>

            {/* Cantidades detalladas */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Resumen de Participación</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  <span><strong>{estadisticasCurso.aprobados}</strong> docentes aprobados</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                  <span><strong>{estadisticasCurso.noAprobados}</strong> docentes reprobados</span>
                </li>
                <li className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  <span><strong>{estadisticasCurso.noInscritos}</strong> docentes activos/inscritos</span>
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Total de registros analizados: <strong>{totalDocentes}</strong>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}