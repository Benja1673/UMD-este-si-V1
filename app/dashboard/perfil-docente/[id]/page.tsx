import ProfileCard, { Curso, UserProfile } from "@/components/profile-card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

interface ProfilePageProps {
  params: {
    id: string // coincidir con [id] de la carpeta
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="p-6 text-red-600">
        No hay sesión activa. Por favor, inicia sesión.
      </div>
    )
  }

  // Validar rol: solo supervisor o admin pueden ver otros perfiles
  const rol = session.user.role
  if (rol !== "supervisor" && rol !== "admin") {
    return (
      <div className="p-6 text-red-600">
        No autorizado para ver este perfil
      </div>
    )
  }

  // Buscar docente por id (params.id)
  const userDb = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      inscripciones: { include: { curso: { include: { categoria: true } } } },
      departamento: true,
    },
  })

  if (!userDb) {
    return (
      <div className="p-6 text-red-600">
        Docente no encontrado
      </div>
    )
  }

// Mapear datos
  const userSafe: UserProfile = {
    id: userDb.id,
    name: userDb.name ?? "",
    apellido: userDb.apellido ?? "",
    rut: userDb.rut ?? "",
    email: userDb.email,
    telefono: userDb.telefono ?? undefined,
    direccion: userDb.direccion ?? undefined,
    carrera: userDb.departamento?.nombre ?? undefined,
  }

  const cursos: Curso[] = userDb.inscripciones.map((i) => ({
    id: i.curso.id,
    nombre: i.curso.nombre ?? "",
    descripcion: i.curso.descripcion ?? "",
    categoria: i.curso.categoria?.nombre ?? "Sin categoría",
    nivel: i.curso.nivel as "Inicial" | "Intermedio" | "Avanzado",
    estado:
      i.estado === "NO_INSCRITO"
        ? "Inscrito"
        : i.estado === "APROBADO"
        ? "Aprobado"
        : "Reprobado",
  }))

  return (
    <div className="p-6">
      <ProfileCard user={userSafe} cursos={cursos} />
    </div>
  )
}
