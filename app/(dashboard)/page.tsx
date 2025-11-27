"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import BreadcrumbNav from "@/components/breadcrumb-nav"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Pendientes
  const [pendingCursos, setPendingCursos] = useState<
    { id: string; cursoId?: string | null; nombre?: string; estado?: string; fechaInscripcion?: string }[]
  >([])
  const [pendingLoading, setPendingLoading] = useState(true)

  // IDs de inscripciones que están siendo actualizadas
  const [updatingIds, setUpdatingIds] = useState<string[]>([])

  // Redirige si no autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cargar cursos pendientes para el docente (inscripciones con estado INSCRITO)
  useEffect(() => {
    const fetchPendientes = async () => {
      setPendingLoading(true)
      try {
        const userId = session?.user?.id
        if (!userId) {
          setPendingCursos([])
          return
        }

        const res = await fetch(`/api/inscripciones?estado=INSCRITO&usuarioId=${encodeURIComponent(userId)}`)
        if (!res.ok) {
          console.error("Error cargando inscripciones pendientes:", res.status)
          setPendingCursos([])
          return
        }
        const list = await res.json()
        const mapped = (list || []).map((it: any) => ({
          id: it.id ?? it.inscripcionId ?? "",
          cursoId: it.curso?.id ?? it.cursoId ?? null,
          nombre: it.curso?.nombre ?? it.curso?.titulo ?? it.cursoNombre ?? "Sin título",
          estado: it.estado ?? "INSCRITO",
          fechaInscripcion: it.createdAt ?? it.fecha ?? undefined,
        }))
        setPendingCursos(mapped)
      } catch (err) {
        console.error("Error fetching pendientes:", err)
        setPendingCursos([])
      } finally {
        setPendingLoading(false)
      }
    }

    fetchPendientes()
  }, [session])

  // PATCH -> actualizar estado de una inscripcion (APROBADO / REPROBADO)
  const handleActualizarEstado = async (inscripcionId: string, nuevoEstado: "APROBADO" | "REPROBADO") => {
    if (!inscripcionId) return
    try {
      setUpdatingIds(prev => [...prev, inscripcionId])
      const res = await fetch(`/api/inscripciones/${encodeURIComponent(inscripcionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }))
        console.error("Error actualizando estado:", err)
        return
      }

      // eliminar la inscripción de la lista de pendientes al aprobar/reprobar
      setPendingCursos(prev => prev.filter(p => p.id !== inscripcionId))
    } catch (error) {
      console.error("Error al actualizar estado:", error)
    } finally {
      setUpdatingIds(prev => prev.filter(id => id !== inscripcionId))
    }
  }

  // Si está cargando la sesión, no renderizar nada
  if (status === "loading" || !session) {
    return null
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current={`Bienvenido(a), ${session.user.email} (${session.user.role})`} />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Cursos pendientes</h3>
            <p className="text-sm text-gray-500 mt-1">Cursos en estado "Inscrito" sin calificación final.</p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {pendingLoading ? "Cargando..." : `${pendingCursos.length} pendiente(s)`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-4 animate-pulse h-28" />
            ))
          ) : pendingCursos.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No tienes cursos pendientes por aprobar.
            </div>
          ) : (
            pendingCursos.map((pc) => (
              <div key={pc.id} className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">{pc.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-1">Inscripción: {pc.fechaInscripcion ? new Date(pc.fechaInscripcion).toLocaleDateString() : "—"}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      {pc.estado ?? "INSCRITO"}
                    </span>
                  </div>
                </div>

                {/* acciones: aprobar / reprobar (solo si está INSCRITO) */}
                {pc.estado === "INSCRITO" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleActualizarEstado(pc.id, "APROBADO")}
                      disabled={updatingIds.includes(pc.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleActualizarEstado(pc.id, "REPROBADO")}
                      disabled={updatingIds.includes(pc.id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Reprobar
                    </button>
                  </div>
                )}

                <div className="mt-3 text-sm text-gray-600">
                  {pc.cursoId ? `Curso ID: ${pc.cursoId}` : "Curso sin id asignado"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
