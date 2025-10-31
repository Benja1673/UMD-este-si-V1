"use client"

import { useState, useEffect } from "react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Servicio = {
  id: string
  titulo: string
  descripcion: string
  ubicacion?: string // Para sistemas y capacitaciones
  tipo?: string // Para evaluaciones (usado como link)
}

export default function GestionServicios() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("sistemas")
  const [data, setData] = useState<Servicio[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemActual, setItemActual] = useState<Servicio | null>(null)
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    ubicacion: "",
    link: "", // Para evaluaciones
  })

  // Mapeo de endpoints según pestaña activa
  const getEndpoint = () => {
    switch (activeTab) {
      case "sistemas":
        return "/api/sistemas" // ✅ Usa modalidad="sistema"
      case "capacitaciones":
        return "/api/capacitaciones" // ✅ Usa modalidad="capacitacion"
      case "evaluaciones":
        return "/api/evaluaciones"
      case "certificados":
        return "/api/certificados"
      default:
        return "/api/sistemas"
    }
  }

  // Cargar datos según pestaña activa
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(getEndpoint())
      if (!res.ok) throw new Error("Error al cargar datos")
      const json = await res.json()
      setData(json)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const handleNuevo = () => {
    setItemActual(null)
    setFormData({
      titulo: "",
      descripcion: "",
      ubicacion: "",
      link: "",
    })
    setIsDialogOpen(true)
  }

  const handleEditar = (item: Servicio) => {
    setItemActual(item)
    setFormData({
      titulo: item.titulo || "",
      descripcion: item.descripcion || "",
      ubicacion: item.ubicacion || "",
      link: item.descripcion || "", // Para evaluaciones, el link está en descripcion
    })
    setIsDialogOpen(true)
  }

  const handleEliminarDialog = (item: Servicio) => {
    setItemActual(item)
    setIsDeleteDialogOpen(true)
  }

  const handleGuardar = async () => {
    if (!formData.titulo.trim()) {
      toast({
        title: "Error",
        description: "El título es obligatorio",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const method = itemActual ? "PUT" : "POST"
      const body: any = {
        titulo: formData.titulo.trim(),
      }

      if (itemActual) body.id = itemActual.id

      // Agregar campos específicos según pestaña
      if (activeTab === "sistemas" || activeTab === "capacitaciones") {
        body.descripcion = formData.descripcion
        body.ubicacion = formData.ubicacion
      } else if (activeTab === "evaluaciones") {
        body.link = formData.link // Link para evaluaciones (se guarda en descripcion)
      } else if (activeTab === "certificados") {
        body.descripcion = formData.descripcion // Certificados usan descripción normal
      }

      console.log("📤 Enviando a API:", { endpoint: getEndpoint(), method, body });

      const res = await fetch(getEndpoint(), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        console.error("❌ Error de API:", error);
        throw new Error(error.details || error.error || "Error al guardar")
      }

      const resultado = await res.json();
      console.log("✅ Respuesta de API:", resultado);

      toast({
        title: "Éxito",
        description: itemActual ? "Item actualizado correctamente" : "Item creado correctamente",
      })

      setIsDialogOpen(false)
      fetchData()
    } catch (error: any) {
      console.error("❌ Error en handleGuardar:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async () => {
    if (!itemActual) return

    setLoading(true)
    try {
      const res = await fetch(`${getEndpoint()}?id=${itemActual.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Error al eliminar")
      }

      toast({
        title: "Éxito",
        description: "Item eliminado correctamente",
      })

      setIsDeleteDialogOpen(false)
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTituloTab = () => {
    switch (activeTab) {
      case "sistemas":
        return "Sistemas"
      case "capacitaciones":
        return "Capacitaciones"
      case "evaluaciones":
        return "Evaluaciones"
      case "certificados":
        return "Certificados"
      default:
        return "Servicios"
    }
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current="GESTIÓN SERVICIOS" />

      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Servicios</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sistemas">Sistemas</TabsTrigger>
            <TabsTrigger value="capacitaciones">Capacitaciones</TabsTrigger>
            <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
            <TabsTrigger value="certificados">Certificados</TabsTrigger>
          </TabsList>

          {["sistemas", "capacitaciones", "evaluaciones", "certificados"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">{getTituloTab()}</h2>
                <Button onClick={handleNuevo} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear {getTituloTab().slice(0, -1)}
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        {activeTab === "evaluaciones" ? (
                          <TableHead>Link</TableHead>
                        ) : (
                          <>
                            <TableHead>Descripción</TableHead>
                            {(activeTab === "sistemas" || activeTab === "capacitaciones") && (
                              <TableHead>Link</TableHead>
                            )}
                          </>
                        )}
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length > 0 ? (
                        data.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.titulo}</TableCell>
                            <TableCell className="max-w-md truncate">{item.descripcion || "-"}</TableCell>
                            {(activeTab === "sistemas" || activeTab === "capacitaciones") && (
                              <TableCell>
                                {item.ubicacion ? (
                                  <a
                                    href={item.ubicacion}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Ver link
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            )}
                            {activeTab === "evaluaciones" && (
                              <TableCell>
                                {item.descripcion ? (
                                  <a
                                    href={item.descripcion}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Ver link
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditar(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEliminarDialog(item)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={activeTab === "certificados" ? 3 : 4}
                            className="text-center py-8 text-gray-500"
                          >
                            No hay {getTituloTab().toLowerCase()} registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {itemActual ? `Editar ${getTituloTab().slice(0, -1)}` : `Crear ${getTituloTab().slice(0, -1)}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Nombre del servicio"
                className="mt-1"
              />
            </div>
            
            {/* Descripción solo para sistemas, capacitaciones y certificados */}
            {activeTab !== "evaluaciones" && (
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del servicio"
                  rows={4}
                  className="mt-1"
                />
              </div>
            )}
            
            {/* Link para sistemas y capacitaciones */}
            {(activeTab === "sistemas" || activeTab === "capacitaciones") && (
              <div>
                <Label htmlFor="ubicacion">Link del servicio</Label>
                <Input
                  id="ubicacion"
                  type="url"
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  placeholder="https://ejemplo.com"
                  className="mt-1"
                />
              </div>
            )}
            
            {/* Link para evaluaciones */}
            {activeTab === "evaluaciones" && (
              <div>
                <Label htmlFor="link">Link de la evaluación *</Label>
                <Input
                  id="link"
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://formulario-evaluacion.com"
                  className="mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {itemActual ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            ¿Está seguro que desea eliminar <strong>{itemActual?.titulo}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}