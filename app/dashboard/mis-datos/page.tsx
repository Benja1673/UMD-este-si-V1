// app/dashboard/mis-datos/page.tsx
import ProfileCard, { Curso, UserProfile } from "@/components/profile-card"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"

/**
 * Función auxiliar para capitalizar los niveles de los cursos (ej: "INICIAL" -> "Inicial")
 * Esto asegura que los badges en la interfaz se vean correctamente.
 */
function capitalizar(texto: string | null | undefined) {
  if (!texto) return "Inicial"; 
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Mapea el estado almacenado en la base de datos al formato esperado por el ProfileCard.
 * Maneja inconsistencias de mayúsculas/minúsculas.
 */
function mapEstado(estadoDb: string): "Inscrito" | "Aprobado" | "Reprobado" {
  const estado = estadoDb?.toUpperCase();
  switch (estado) {
    case "APROBADO":
      return "Aprobado";
    case "REPROBADO":
    case "NO_APROBADO":
      return "Reprobado";
    case "INSCRITO":
    case "EN_PROCESO":
    default:
      return "Inscrito";
  }
}

export default async function ProfilePage() {
  // 1️⃣ Obtener la sesión del usuario desde el servidor
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="p-6 text-red-600">
        No hay sesión activa. Por favor, inicia sesión.
      </div>
    )
  }

  // 2️⃣ Buscar los datos del usuario en la base de datos
  const userDb = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      inscripciones: { 
        // ✅ FILTRO CLAVE: Excluir cursos borrados o con estado "NO_INSCRITO"
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
      <div className="p-6 text-red-600">
        Usuario no encontrado
      </div>
    )
  }

  // 3️⃣ Preparar el objeto de perfil seguro para el componente
  const userSafe: UserProfile = {
    id: userDb.id,
    name: userDb.name ?? "",
    apellido: userDb.apellido ?? "",
    rut: userDb.rut ?? "",
    email: userDb.email,
    telefono: userDb.telefono ?? undefined,
    direccion: userDb.direccion ?? undefined,
    carrera: userDb.departamento?.nombre ?? "Sin Departamento",
    // ✅ SOLUCIÓN: Pasamos el nivel almacenado en la base de datos al componente visual
    nivelActual: userDb.nivelActual ?? "SIN_NIVEL",
  }

  // 4️⃣ Mapear las inscripciones activas a la estructura de la interfaz
  const cursos: Curso[] = userDb.inscripciones.map((i) => ({
    id: i.curso.id,
    nombre: i.curso.nombre ?? "Curso sin nombre",
    descripcion: i.curso.descripcion ?? "",
    categoria: (i.curso.categoria as any)?.nombre ?? "Sin categoría",
    // Estandarizamos el nivel para el componente visual (capitalización)
    nivel: capitalizar(i.curso.nivel) as "Inicial" | "Intermedio" | "Avanzado",
    // Traducimos el estado de la BD al componente
    estado: mapEstado(i.estado),
  }))

  // 5️⃣ Renderizar el componente ProfileCard (Client Component)
  return (
    <div className="p-6">
      <ProfileCard user={userSafe} cursos={cursos} />
    </div>
  )
}