"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Loader2, X, AlertCircle, Check } from "lucide-react"

type Servicio = {
  id: string
  titulo: string
  descripcion: string
  ubicacion?: string
  condiciones?: Condicion[]
}

type Condicion = {
  id?: string
  cursoId: string | null
  cursoNombre?: string
  estadoRequerido: string | null
  esGeneral: boolean
}

type Curso = {
  id: string
  nombre: string
  codigo?: string
}

const ESTADOS_CURSO = ["INSCRITO", "APROBADO", "REPROBADO"]

export default function GestionServicios() {
  const [activeTab, setActiveTab] = useState("sistemas")
  const [data, setData] = useState<Servicio[]>([])
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemActual, setItemActual] = useState<Servicio | null>(null)
  const [toast, setToast] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  })

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
    link: "",
  })

  const [condiciones, setCondiciones] = useState<Condicion[]>([])
  const [esDisponibleParaTodos, setEsDisponibleParaTodos] = useState(false)
  const [nuevaCondicion, setNuevaCondicion] = useState({
    cursoId: "",
    estadoRequerido: ""
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const getEndpoint = () => {
    switch (activeTab) {
      case "sistemas": return "/api/sistemas"
      case "capacitaciones": return "/api/capacitaciones"
      case "evaluaciones": return "/api/evaluaciones"
      case "certificados": return "/api/certificados"
      default: return "/api/sistemas"
    }
  }

  const getTipoServicio = () => {
    switch (activeTab) {
      case "sistemas": return "SISTEMA"
      case "capacitaciones": return "CAPACITACION"
      case "evaluaciones": return "EVALUACION"
      case "certificados": return "CERTIFICADO"
      default: return "SISTEMA"
    }
  }

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos")
      if (res.ok) {
        const data = await res.json()
        setCursos(data)
      }
    } catch (error) {
      console.error("Error cargando cursos:", error)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(getEndpoint())
      if (!res.ok) throw new Error("Error al cargar datos")
      const servicios = await res.json()

      const serviciosConCondiciones = await Promise.all(
        servicios.map(async (servicio: Servicio) => {
          const condRes = await fetch(
            `/api/condiciones-servicios?servicioId=${servicio.id}&servicioTipo=${getTipoServicio()}`
          )
          if (condRes.ok) {
            const conds = await condRes.json()
            return { ...servicio, condiciones: conds }
          }
          return servicio
        })
      )

      setData(serviciosConCondiciones)
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchCursos()
  }, [activeTab])

  const handleNuevo = () => {
    setItemActual(null)
    setFormData({ titulo: "", descripcion: "", ubicacion: "", link: "" })
    setCondiciones([])
    setEsDisponibleParaTodos(false)
    setNuevaCondicion({ cursoId: "", estadoRequerido: "" })
    setIsDialogOpen(true)
  }

  const handleEditar = (item: Servicio) => {
    setItemActual(item)
    setFormData({
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      ubicacion: item.ubicacion || "",
      link: item.descripcion || "",
    })
    
    const condsExistentes = item.condiciones || []
    setCondiciones(condsExistentes.map(c => ({
      ...c,
      cursoNombre: cursos.find(curso => curso.id === c.cursoId)?.nombre
    })))
    
    setEsDisponibleParaTodos(
      condsExistentes.length === 0 || condsExistentes.some(c => c.esGeneral)
    )
    
    setNuevaCondicion({ cursoId: "", estadoRequerido: "" })
    setIsDialogOpen(true)
  }

  const handleEliminarDialog = (item: Servicio) => {
    setItemActual(item)
    setIsDeleteDialogOpen(true)
  }

  const agregarCondicion = () => {
    if (!nuevaCondicion.cursoId || !nuevaCondicion.estadoRequerido) {
      showToast("Debe seleccionar curso y estado", 'error')
      return
    }

    const curso = cursos.find(c => c.id === nuevaCondicion.cursoId)
    
    setCondiciones([
      ...condiciones,
      {
        cursoId: nuevaCondicion.cursoId,
        cursoNombre: curso?.nombre,
        estadoRequerido: nuevaCondicion.estadoRequerido,
        esGeneral: false
      }
    ])
    
    setNuevaCondicion({ cursoId: "", estadoRequerido: "" })
  }

  const eliminarCondicion = (index: number) => {
    setCondiciones(condiciones.filter((_, i) => i !== index))
  }

  const handleGuardar = async () => {
    if (!formData.titulo.trim()) {
      showToast("El título es obligatorio", 'error')
      return
    }

    setLoading(true)
    try {
      // 1️⃣ Crear/Actualizar el servicio primero
      const method = itemActual ? "PUT" : "POST"
      const body: any = { titulo: formData.titulo.trim() }

      if (itemActual) body.id = itemActual.id

      if (activeTab === "sistemas" || activeTab === "capacitaciones") {
        body.descripcion = formData.descripcion
        body.ubicacion = formData.ubicacion
      } else if (activeTab === "evaluaciones") {
        body.link = formData.link
      } else if (activeTab === "certificados") {
        body.descripcion = formData.descripcion
      }

      const resServicio = await fetch(getEndpoint(), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!resServicio.ok) {
        const error = await resServicio.json()
        throw new Error(error.details || error.error || "Error al guardar servicio")
      }

      const servicioGuardado = await resServicio.json()
      const servicioId = servicioGuardado.id

      if (!servicioId) {
        throw new Error("No se recibió el ID del servicio")
      }

      // 2️⃣ Eliminar condiciones anteriores (solo si está editando)
      if (itemActual?.condiciones) {
        for (const cond of itemActual.condiciones) {
          if (cond.id) {
            await fetch(`/api/condiciones-servicios?id=${cond.id}`, {
              method: "DELETE"
            })
          }
        }
      }

      // 3️⃣ Crear nuevas condiciones
      if (esDisponibleParaTodos) {
        // Condición general
        const resCondicion = await fetch("/api/condiciones-servicios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            servicioId: servicioId,
            servicioTipo: getTipoServicio(),
            esGeneral: true
          })
        })

        if (!resCondicion.ok) {
          const error = await resCondicion.json()
          console.error("Error creando condición general:", error)
        }
      } else if (condiciones.length > 0) {
        // Condiciones específicas
        for (const cond of condiciones) {
          const resCondicion = await fetch("/api/condiciones-servicios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              servicioId: servicioId,
              servicioTipo: getTipoServicio(),
              cursoId: cond.cursoId,
              estadoRequerido: cond.estadoRequerido,
              esGeneral: false
            })
          })

          if (!resCondicion.ok) {
            const error = await resCondicion.json()
            console.error("Error creando condición:", error)
          }
        }
      }

      showToast(
        itemActual ? "Servicio actualizado correctamente" : "Servicio creado correctamente",
        'success'
      )

      setIsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      console.error("Error en handleGuardar:", error)
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async () => {
    if (!itemActual) return

    setLoading(true)
    try {
      const condicionesAEliminar = itemActual.condiciones || []
      for (const cond of condicionesAEliminar) {
        if (cond.id) {
          await fetch(`/api/condiciones-servicios?id=${cond.id}`, {
            method: "DELETE"
          })
        }
      }

      const res = await fetch(`${getEndpoint()}?id=${itemActual.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar")
      }

      showToast("Servicio eliminado correctamente", 'success')
      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (error: any) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getTituloTab = () => {
    switch (activeTab) {
      case "sistemas": return "Sistemas"
      case "capacitaciones": return "Capacitaciones"
      case "evaluaciones": return "Evaluaciones"
      case "certificados": return "Certificados"
      default: return "Servicios"
    }
  }

  const renderCondicionesBadges = (servicio: Servicio) => {
    const conds = servicio.condiciones || []
    
    if (conds.length === 0) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Sin restricciones</span>
    }

    if (conds.some(c => c.esGeneral)) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
        <Check className="w-3 h-3 mr-1" />
        Disponible para todos
      </span>
    }

    return (
      <div className="flex flex-wrap gap-1">
        {conds.slice(0, 2).map((cond, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {cond.cursoNombre || "Curso"}: {cond.estadoRequerido?.replace('_', ' ')}
          </span>
        ))}
        {conds.length > 2 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            +{conds.length - 2} más
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">Gestión de Servicios</h1>

          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-4">
              {["sistemas", "capacitaciones", "evaluaciones", "certificados"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{getTituloTab()}</h2>
              <button
                onClick={handleNuevo}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear {getTituloTab().slice(0, -1)}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condiciones</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.length > 0 ? (
                      data.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{item.titulo}</td>
                          <td className="px-6 py-4 text-gray-700 max-w-md truncate">
                            {item.descripcion || "-"}
                          </td>
                          <td className="px-6 py-4">
                            {renderCondicionesBadges(item)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleEditar(item)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarDialog(item)}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          No hay {getTituloTab().toLowerCase()} registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {itemActual ? `Editar ${getTituloTab().slice(0, -1)}` : `Crear ${getTituloTab().slice(0, -1)}`}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-gray-700">Información Básica</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Nombre del servicio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {activeTab !== "evaluaciones" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción del servicio"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {(activeTab === "sistemas" || activeTab === "capacitaciones") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link del servicio</label>
                    <input
                      type="url"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      placeholder="https://ejemplo.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
                
                {activeTab === "evaluaciones" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Link de la evaluación *</label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="https://formulario-evaluacion.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700">Condiciones de Disponibilidad</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Define quiénes pueden ver este servicio
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esDisponibleParaTodos}
                      onChange={(e) => setEsDisponibleParaTodos(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Disponible para todos</span>
                  </label>
                </div>

                {!esDisponibleParaTodos && (
                  <>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Curso</label>
                        <select
                          value={nuevaCondicion.cursoId}
                          onChange={(e) => setNuevaCondicion({ ...nuevaCondicion, cursoId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccionar curso</option>
                          {cursos.map(curso => (
                            <option key={curso.id} value={curso.id}>
                              {curso.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Estado requerido</label>
                        <select
                          value={nuevaCondicion.estadoRequerido}
                          onChange={(e) => setNuevaCondicion({ ...nuevaCondicion, estadoRequerido: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        >
                          <option value="">Seleccionar estado</option>
                          {ESTADOS_CURSO.map(estado => (
                            <option key={estado} value={estado}>
                              {estado.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={agregarCondicion}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {condiciones.length > 0 && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-600">
                          Condiciones agregadas ({condiciones.length})
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {condiciones.map((cond, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                            >
                              <div className="flex-1 text-sm">
                                <span className="font-medium text-gray-900">{cond.cursoNombre}</span>
                                <span className="text-gray-400 mx-2">→</span>
                                <span className="text-blue-600 font-medium">
                                  {cond.estadoRequerido?.replace('_', ' ')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => eliminarCondicion(idx)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 italic bg-blue-50 p-2 rounded">
                          💡 El servicio estará disponible para usuarios que cumplan AL MENOS UNA de estas condiciones
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardar}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {itemActual ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirmar eliminación</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600">
                ¿Está seguro que desea eliminar <strong className="text-gray-900">{itemActual?.titulo}</strong>? 
                Esta acción eliminará también todas sus condiciones y no se puede deshacer.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}