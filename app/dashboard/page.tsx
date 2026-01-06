"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import BreadcrumbNav from "@/components/breadcrumb-nav"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Estado para los cursos con inscripción activa (pendientes de calificación)
  const [pendingCursos, setPendingCursos] = useState<
    { id: string; cursoId?: string | null; nombre?: string; estado?: string; fechaInscripcion?: string }[]
  >([])
  const [pendingLoading, setPendingLoading] = useState(true)

  // Redirige si el usuario no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // Cargar cursos pendientes para el docente
  useEffect(() => {
    const fetchPendientes = async () => {
      // Solo procedemos si tenemos el ID del usuario
      const userId = session?.user?.id
      if (!userId) return

      setPendingLoading(true)
      try {
        // ✅ Consultamos explícitamente por el estado "INSCRITO"
        // Nota: Asegúrate de haber aplicado el cambio 'insensitive' en la API de inscripciones
        const res = await fetch(`/api/inscripciones?estado=INSCRITO&usuarioId=${encodeURIComponent(userId)}`)
        
        if (!res.ok) {
          console.error("Error cargando inscripciones pendientes:", res.status)
          setPendingCursos([])
          return
        }

        const list = await res.json()

        // ✅ Mapeo de datos con estandarización de mayúsculas
        const mapped = (list || []).map((it: any) => ({
          id: it.id ?? it.inscripcionId ?? "",
          cursoId: it.curso?.id ?? it.cursoId ?? null,
          nombre: it.curso?.nombre ?? it.curso?.titulo ?? it.cursoNombre ?? "Sin título",
          // Forzamos mayúsculas para evitar discordancias visuales o de lógica
          estado: it.estado?.toUpperCase() ?? "INSCRITO",
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

    if (status === "authenticated") {
      fetchPendientes()
    }
  }, [session, status])

  // No renderizar el contenido mientras la sesión carga
  if (status === "loading" || !session) {
    return null
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav current={`Bienvenido(a), ${session.user.name || session.user.email} (${session.user.role})`} />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-800">Cursos pendientes</h3>
            <p className="text-sm text-gray-500 mt-1">
              Cursos en los que estás participando actualmente.
            </p>
          </div>
          <div className="text-sm text-blue-600 font-medium">
            {pendingLoading ? "Cargando..." : `${pendingCursos.length} pendiente(s)`}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingLoading ? (
            // Skeleton Loader
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-4 animate-pulse h-28" />
            ))
          ) : pendingCursos.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8 border-2 border-dashed border-gray-100 rounded-lg">
              No tienes cursos pendientes por aprobar en este momento.
            </div>
          ) : (
            pendingCursos.map((pc) => (
              <div key={pc.id} className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-lg p-4 transition-hover hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="text-sm font-semibold text-blue-900 line-clamp-2">{pc.nombre}</h4>
                    <p className="text-xs text-gray-500 mt-2">
                      Inscrito el: {pc.fechaInscripcion ? new Date(pc.fechaInscripcion).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider rounded-full bg-blue-100 text-blue-700 font-bold">
                      {/* ✅ Visualización amigable del estado */}
                      {pc.estado === "INSCRITO" ? "En Proceso" : pc.estado}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-blue-50 text-[11px] text-gray-400 font-mono">
                  ID: {pc.cursoId?.substring(0, 13) || "N/A"}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}