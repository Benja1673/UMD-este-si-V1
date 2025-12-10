import ProfileCard, { Curso, UserProfile } from "@/components/profile-card"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
  // 1️⃣ Obtener sesión en el servidor
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return (
      <div className="p-6 text-red-600">
        No hay sesión activa. Por favor, inicia sesión.
      </div>
    )
  }

  // 2️⃣ Buscar usuario en la BD
  const userDb = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      inscripciones: { include: { curso: true } },
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

  // 3️⃣ Mapear datos a UserProfile
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

  // 4️⃣ Mapear cursos a tipo Curso con estado seguro
  const cursos: Curso[] = userDb.inscripciones.map((i) => {
    let estado: Curso["estado"]

    switch (i.estado) {
      case "Aprobado":
      case "No Aprobado":
      case "No Inscrito":
        estado = i.estado
        break
      default:
        estado = "No Inscrito"
    }

    return {
      id: i.curso.id,
      nombre: i.curso.nombre ?? "",
      descripcion: i.curso.descripcion ?? "",
      categoria: (i.curso as any).categoria ?? "Sin categoría",
      nivel: (i.curso as any).nivel ?? "Inicial",
      estado,
    }
  })

  // 5️⃣ Renderizar ProfileCard (client component)
  return (
    <div className="p-6">
      <ProfileCard user={userSafe} cursos={cursos} />
    </div>
  )
}
