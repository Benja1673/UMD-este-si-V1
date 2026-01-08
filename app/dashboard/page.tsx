"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import BreadcrumbNav from "@/components/breadcrumb-nav"
import { Award, BookOpen, CheckCircle, ArrowRight, Info, AlertCircle } from "lucide-react"

// Interfaces para mejor control de datos
interface CursoPendiente {
  id: string
  cursoId: string
  nombre: string
  estado: string
  fechaInscripcion: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Estados para datos
  const [pendingCursos, setPendingCursos] = useState<CursoPendiente[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [aprobados, setAprobados] = useState<string[]>([])
  
  // Estados de carga
  const [loading, setLoading] = useState(true)

  // 1. Redirección de seguridad
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  // 2. Carga de datos unificada sincronizada con la DB
  useEffect(() => {
    const fetchData = async () => {
      const userId = session?.user?.id
      if (!userId) return

      setLoading(true)
      try {
        // Consultamos el endpoint de perfil que ya tiene la lógica de nivelActual corregida
        // y las inscripciones por estado para la lógica del dashboard
        const [resInscritos, resAprobados, resProfile] = await Promise.all([
          fetch(`/api/inscripciones?estado=INSCRITO&usuarioId=${encodeURIComponent(userId)}`),
          fetch(`/api/inscripciones?estado=APROBADO&usuarioId=${encodeURIComponent(userId)}`),
          fetch(`/api/user/profile`) // <--- Endpoint clave para el Nivel Actual
        ])

        // Procesar Cursos en Proceso (Inscritos)
        if (resInscritos.ok) {
          const list = await resInscritos.json()
          setPendingCursos((list || []).map((it: any) => ({
            id: it.id,
            cursoId: it.curso?.id || it.cursoId,
            nombre: it.curso?.nombre || "Sin título",
            estado: it.estado?.toUpperCase() || "INSCRITO",
            fechaInscripcion: it.createdAt,
          })))
        }

        // Procesar Aprobados para la lógica de "Próximo Paso"
        if (resAprobados.ok) {
          const aprobadosList = await resAprobados.json()
          setAprobados(aprobadosList.map((i: any) => i.curso?.nombre?.toLowerCase() || ""))
        }

        // Procesar Perfil (Nivel Actual de la DB)
        if (resProfile.ok) {
          const profileData = await resProfile.json()
          setUserProfile(profileData)
        }

      } catch (err) {
        console.error("Error cargando el dashboard:", err)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchData()
    }
  }, [session, status])

  // --- LÓGICA DE CURSOS FALTANTES ---
  const getProximoPaso = () => {
    if (!userProfile) return null;

    const nivel = userProfile.nivelActual?.toUpperCase() || "SIN_NIVEL";
    const tiene = (palabra: string) => aprobados.some(n => n.includes(palabra.toLowerCase()));

    if (nivel === "SIN_NIVEL") {
      return {
        titulo: "¡Comienza tu camino!",
        mensaje: "Para obtener el nivel Inicial, debes aprobar el curso base:",
        cursos: ["Modelo Educativo"],
        color: "orange",
        classes: "border-orange-500 bg-orange-50 text-orange-700"
      }
    }

    if (nivel === "INICIAL") {
      const faltantes = [];
      if (!tiene("planificación")) faltantes.push("Planificación del Proceso de Enseñanza y Aprendizaje");
      if (!tiene("dedu") && !tiene("didu")) faltantes.push("DEDU o DIDU (Diplomado en Docencia)");

      return {
        titulo: "Hacia el Nivel Intermedio",
        mensaje: "Te falta completar estos cursos para subir de nivel:",
        cursos: faltantes,
        color: "blue",
        classes: "border-blue-500 bg-blue-50 text-blue-700"
      }
    }

    if (nivel === "INTERMEDIO") {
      const faltantes = [];
      if (!tiene("stem") && !tiene("coil")) faltantes.push("Metodologías STEM o Proyecto COIL");

      return {
        titulo: "¡Ya casi llegas al Nivel Avanzado!",
        mensaje: "Completa uno de estos cursos para alcanzar la distinción máxima:",
        cursos: faltantes,
        color: "green",
        classes: "border-green-500 bg-green-50 text-green-700"
      }
    }

    if (nivel === "AVANZADO") {
      return {
        titulo: "¡Nivel Máximo Alcanzado!",
        mensaje: "Has completado la ruta de formación docente satisfactoriamente.",
        cursos: [],
        color: "purple",
        classes: "border-purple-500 bg-purple-50 text-purple-700"
      }
    }

    return null;
  }

  const proximoPaso = getProximoPaso();

  const formatNivel = (nivel: string) => {
    if (!nivel || nivel === "SIN_NIVEL") return "Sin Nivel";
    // Si viene "INICIAL", lo convierte a "Inicial"
    return nivel.charAt(0).toUpperCase() + nivel.slice(1).toLowerCase();
  }

  const getNivelStyles = (nivel: string) => {
    switch (nivel?.toUpperCase()) {
      case "AVANZADO": return "bg-purple-600 text-white border-purple-700";
      case "INTERMEDIO": return "bg-blue-600 text-white border-blue-700";
      case "INICIAL": return "bg-orange-500 text-white border-orange-600";
      default: return "bg-gray-400 text-white border-gray-500";
    }
  }

  if (status === "loading" || !session) return null

  return (
    <div className="space-y-6">
      <BreadcrumbNav current={`Panel de Control`} />

      {/* SECCIÓN 1: BIENVENIDA Y NIVEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Bienvenido(a), {session.user.name || "Docente"}
            </h1>
            <p className="text-gray-500">Gestione su progreso académico y cursos vigentes.</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1">
             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nivel Actual</span>
             <div className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm border-b-4 transition-colors ${getNivelStyles(userProfile?.nivelActual)}`}>
               <Award className="h-5 w-5" />
               {formatNivel(userProfile?.nivelActual)}
             </div>
          </div>
        </div>

        {/* SECCIÓN 2: PRÓXIMO PASO */}
        {proximoPaso && (
          <div className={`border-l-4 rounded-xl shadow-sm p-6 relative overflow-hidden bg-white ${proximoPaso.classes.split(' ')[0]}`}>
            <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
              <Info size={80} />
            </div>
            <h3 className={`text-sm font-bold uppercase tracking-tight flex items-center gap-2 mb-2 ${proximoPaso.classes.split(' ')[2]}`}>
              <ArrowRight className="h-4 w-4" />
              {proximoPaso.titulo}
            </h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {proximoPaso.mensaje}
            </p>
            <div className="space-y-2">
              {proximoPaso.cursos.length > 0 ? (
                proximoPaso.cursos.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white/50 p-2 rounded border border-black/5">
                    <BookOpen className="h-3 w-3 text-gray-400" />
                    {c}
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 p-2 rounded border border-green-100 uppercase">
                  <CheckCircle className="h-3 w-3" />
                  Ruta formativa completa
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN 3: CURSOS PENDIENTES */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Cursos en Proceso</h3>
              <p className="text-xs text-gray-500">Calificaciones pendientes de cierre.</p>
            </div>
          </div>
          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
            {loading ? "..." : `${pendingCursos.length} Pendiente(s)`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 animate-pulse h-32" />
            ))
          ) : pendingCursos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
              <CheckCircle className="h-10 w-10 text-green-200 mb-3" />
              <p className="text-gray-500 font-medium text-sm">No tienes cursos pendientes por aprobar.</p>
              <p className="text-gray-400 text-xs mt-1">¡Buen trabajo!</p>
            </div>
          ) : (
            pendingCursos.map((pc) => (
              <div key={pc.id} className="group bg-white border border-gray-200 rounded-xl p-5 transition-all hover:border-blue-300 hover:shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 rounded border border-blue-200">
                      {pc.estado === "INSCRITO" ? "En Proceso" : pc.estado}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-blue-700 transition-colors uppercase italic">
                    {pc.nombre}
                  </h4>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>Inscrito: {pc.fechaInscripcion ? new Date(pc.fechaInscripcion).toLocaleDateString() : "—"}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}