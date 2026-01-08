// app/dashboard/perfil-docente/[id]/page.tsx
import ProfileCard, { Curso, UserProfile } from "@/components/profile-card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

/**
 * Función auxiliar para convertir "INICIAL" -> "Inicial"
 * Esto asegura que los badges de la tabla de cursos se vean correctamente.
 */
function capitalizar(texto: string | null | undefined) {
  if (!texto) return "Inicial"; 
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Mapea el estado almacenado en la base de datos al formato esperado por el ProfileCard.
 * Maneja inconsistencias de mayúsculas/minúsculas y filtra estados antiguos.
 */
function mapEstado(estadoDb: string): "Inscrito" | "Aprobado" | "Reprobado" {
  switch (estadoDb?.toUpperCase()) {
    case "APROBADO":
      return "Aprobado";
    case "NO_APROBADO":
    case "REPROBADO":
      return "Reprobado";
    case "INSCRITO":
    case "EN_PROCESO":
    case "PENDIENTE_EVALUACION":
      return "Inscrito";
    default:
      return "Inscrito";
  }
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params
  const { id } = params

  const session = await getServerSession(authOptions)

  // 1️⃣ Validación de sesión
  if (!session?.user?.email) {
    return <div className="p-6 text-red-600">No hay sesión activa.</div>
  }

  // 2️⃣ Validación de permisos (Admin, Supervisor o Dueño del perfil)
  const rol = session.user.role?.toLowerCase()
  const esSuPropioPerfil = session.user.id === id
  
  if (rol !== "supervisor" && rol !== "admin" && !esSuPropioPerfil) {
    return (
      <div className="p-6 text-red-600 font-bold">
        Acceso Denegado: No tienes permisos para ver este perfil docente.
      </div>
    )
  }

  // 3️⃣ Buscar el docente por ID incluyendo sus inscripciones activas
  const userDb = await prisma.user.findUnique({
    where: { id: id },
    include: {
      inscripciones: { 
        // Filtramos para no mostrar cursos borrados lógicamente o desinscritos
        where: {
          deletedAt: null,
          estado: { not: "NO_INSCRITO" }
        },
        include: { 
          curso: { 
            include: { categoria: true } 
          } 
        } 
      },
      departamento: true,
    },
  })

  if (!userDb) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold text-red-600 uppercase italic">Usuario no encontrado</h2>
        <p className="text-gray-600 mt-2">
           No se encontró un registro para el ID: <span className="font-mono bg-gray-100 p-1">{id}</span>.
        </p>
      </div>
    )
  }

  // 4️⃣ Preparar el objeto de perfil seguro (Añadimos nivelActual)
  const userSafe: UserProfile = {
    id: userDb.id,
    name: userDb.name ?? "Sin Nombre",
    apellido: userDb.apellido ?? "",
    rut: userDb.rut ?? "Sin RUT",
    email: userDb.email || "",
    telefono: userDb.telefono ?? undefined,
    direccion: userDb.direccion ?? undefined,
    carrera: userDb.departamento?.nombre ?? "Sin Departamento",
    // ✅ MEJORA: Pasamos el nivel almacenado en la DB para el badge visual
    nivelActual: userDb.nivelActual ?? "SIN_NIVEL",
  }

  // 5️⃣ Mapear cursos para la tabla de historial académico
  const cursos: Curso[] = userDb.inscripciones.map((i) => ({
    id: i.curso.id,
    nombre: i.curso.nombre ?? "Curso sin nombre",
    descripcion: i.curso.descripcion ?? "",
    categoria: i.curso.categoria?.nombre ?? "Sin categoría",
    // Formateamos el nivel del curso para que sea amigable ("Inicial", "Avanzado")
    nivel: capitalizar(i.curso.nivel) as "Inicial" | "Intermedio" | "Avanzado",
    estado: mapEstado(i.estado),
  }))

  // 6️⃣ Renderizado final
  return (
    <div className="p-6">
      <ProfileCard user={userSafe} cursos={cursos} />
    </div>
  )
}