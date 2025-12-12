import ProfileCard, { Curso, UserProfile } from "@/components/profile-card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

// Función auxiliar para convertir "INICIAL" -> "Inicial"
function capitalizar(texto: string | null | undefined) {
  if (!texto) return "Inicial"; // Valor por defecto
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Función auxiliar para mapear el estado de la BD a lo que pide el ProfileCard
function mapEstado(estadoDb: string): "Inscrito" | "Aprobado" | "Reprobado" {
  switch (estadoDb) {
    case "APROBADO":
      return "Aprobado";
    case "NO_APROBADO":
    case "REPROBADO": // Por si acaso
      return "Reprobado";
    case "INSCRITO":
    case "EN_PROCESO":
    case "PENDIENTE_EVALUACION":
      return "Inscrito";
    default:
      // "NO_INSCRITO" o cualquier cosa rara
      return "Inscrito";
  }
}

export default async function ProfilePage(props: ProfilePageProps) {
  const params = await props.params
  const { id } = params

  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return <div className="p-6 text-red-600">No hay sesión activa.</div>
  }

  // Validar rol: Supervisor, Admin, O si el usuario está viendo su propio perfil
  const rol = session.user.role
  const esSuPropioPerfil = session.user.id === id
  
  if (rol !== "supervisor" && rol !== "admin" && !esSuPropioPerfil) {
    return <div className="p-6 text-red-600">No autorizado para ver este perfil.</div>
  }

  // Buscar docente por id en la tabla USER (Correcto)
  const userDb = await prisma.user.findUnique({
    where: { id: id },
    include: {
      inscripciones: { 
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
        <h2 className="text-xl font-bold text-red-600">Usuario no encontrado</h2>
        <p className="text-gray-600 mt-2">
           No se encontró un usuario con el ID: <span className="font-mono bg-gray-100 p-1">{id}</span>.
        </p>
        <p className="text-sm text-gray-500 mt-4">
           Posible causa: El enlace proviene de una tabla antigua o el usuario fue eliminado.
        </p>
      </div>
    )
  }

  // Mapear datos con seguridad
  const userSafe: UserProfile = {
    id: userDb.id,
    name: userDb.name ?? "Sin Nombre",
    apellido: userDb.apellido ?? "",
    rut: userDb.rut ?? "Sin RUT",
    email: userDb.email || "",
    telefono: userDb.telefono ?? undefined,
    direccion: userDb.direccion ?? undefined,
    carrera: userDb.departamento?.nombre ?? "Sin Departamento",
  }

  const cursos: Curso[] = userDb.inscripciones.map((i) => ({
    id: i.curso.id,
    nombre: i.curso.nombre ?? "Curso sin nombre",
    descripcion: i.curso.descripcion ?? "",
    categoria: i.curso.categoria?.nombre ?? "Sin categoría",
    // Convertimos "INICIAL" a "Inicial" para que el componente visual no falle
    nivel: capitalizar(i.curso.nivel) as "Inicial" | "Intermedio" | "Avanzado",
    // Usamos la función auxiliar para no marcar todo como reprobado
    estado: mapEstado(i.estado),
  }))

  return (
    <div className="p-6">
      <ProfileCard user={userSafe} cursos={cursos} />
    </div>
  )
}