"use client"

import { useEffect, useState } from "react"
import { FileText, Send, Loader2, CheckCircle2 } from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type Certificado = {
  id: string
  titulo: string
  descripcion: string
  tipo?: string
  fechaEmision?: string
  fechaVencimiento?: string
  codigoVerificacion?: string
  urlArchivo?: string
  activo?: boolean
}

export default function CertificadosList() {
  const [certificados, setCertificados] = useState<Certificado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [solicitandoId, setSolicitandoId] = useState<string | null>(null)
  
  // Estado para la ventana de éxito
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    fetchCertificados()
  }, [])

  const fetchCertificados = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/servicios-disponibles?tipo=CERTIFICADO')
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Debes iniciar sesión para ver los certificados")
        }
        throw new Error("Error al cargar certificados")
      }

      const data = await res.json()
      setCertificados(data)
    } catch (err: any) {
      console.error("Error cargando certificados:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSolicitar = async (certificado: Certificado) => {
    // Si es un archivo externo o URL directa, mantenemos la descarga/apertura
    if (certificado.urlArchivo) {
      window.open(certificado.urlArchivo, '_blank', 'noopener,noreferrer')
      return
    } 
    
    if (certificado.descripcion && certificado.descripcion.startsWith('http')) {
      window.open(certificado.descripcion, '_blank', 'noopener,noreferrer')
      return
    }
    
    // FLUJO NUEVO: Solicitar firma vía correo
    try {
      setSolicitandoId(certificado.id)
      
      const res = await fetch('/api/certificados/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificadoId: certificado.id
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar certificado')
      }

      // En lugar de descargar, mostramos el diálogo de éxito
      setShowSuccessDialog(true)
      
    } catch (error: any) {
      console.error('Error solicitando certificado:', error)
      setError(`Error al solicitar certificado: ${error.message}`)
      setTimeout(() => setError(null), 5000)
    } finally {
      setSolicitandoId(null)
    }
  }

  const formatearFecha = (fecha?: string) => {
    if (!fecha) return null
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const certificadoDisponible = (certificado: Certificado) => {
    if (certificado.activo === false) return false
    if (certificado.fechaVencimiento) {
      const ahora = new Date()
      if (new Date(certificado.fechaVencimiento) < ahora) {
        return false
      }
    }
    return true
  }

  const certificadoVigente = (certificado: Certificado) => {
    if (!certificado.fechaVencimiento) return true
    return new Date(certificado.fechaVencimiento) > new Date()
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Cargando certificados disponibles...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">Error al cargar certificados</p>
        <p className="text-red-700 text-sm mb-4">{error}</p>
        <button
          onClick={fetchCertificados}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (certificados.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="font-medium text-gray-900 mb-2">No hay certificados disponibles</h4>
        <p className="text-sm text-gray-500">
          En este momento no tienes acceso a ningún certificado. 
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {certificados.map((certificado) => {
        const disponible = certificadoDisponible(certificado)
        const vigente = certificadoVigente(certificado)
        const ultimaActualizacion = certificado.fechaEmision
        const estaSolicitando = solicitandoId === certificado.id

        return (
          <div
            key={certificado.id}
            className={`bg-white border rounded-lg p-4 flex items-center justify-between ${
              !disponible ? "opacity-60" : ""
            }`}
          >
            <div className="flex items-center flex-1">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{certificado.titulo}</h4>
                  {!vigente && <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Vencido</span>}
                  {!disponible && <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">No disponible</span>}
                </div>
                {certificado.descripcion && !certificado.descripcion.startsWith('http') && (
                  <p className="text-sm text-gray-500 mt-1">{certificado.descripcion}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {certificado.tipo && <span className="capitalize">{certificado.tipo}</span>}
                  {ultimaActualizacion && <span>Emisión: {formatearFecha(ultimaActualizacion)}</span>}
                  {certificado.fechaVencimiento && (
                    <span className={vigente ? "text-gray-600" : "text-red-600 font-medium"}>
                      {vigente ? 'Vigente hasta' : 'Venció'}: {formatearFecha(certificado.fechaVencimiento)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleSolicitar(certificado)}
              className={`flex items-center px-4 py-2 rounded-md whitespace-nowrap ml-4 transition-colors ${
                disponible && !estaSolicitando
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!disponible || estaSolicitando}
            >
              {estaSolicitando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {certificado.urlArchivo || (certificado.descripcion && certificado.descripcion.startsWith('http')) 
                    ? 'Descargar' 
                    : 'Solicitar Certificado'
                  }
                </>
              )}
            </button>
          </div>
        )
      })}

      {/* ✅ VENTANA EMERGENTE DE ÉXITO */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-white sm:max-w-[425px]">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl font-bold text-gray-900">
              Certificado solicitado
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 pt-2">
              El certificado generado se ha enviado a la <strong>UMD</strong> para gestionar la firma correspondiente. 
              <br /><br />
              Queda pendiente su entrega una vez finalizado el proceso administrativo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button 
              type="button" 
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
              onClick={() => setShowSuccessDialog(false)}
            >
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}