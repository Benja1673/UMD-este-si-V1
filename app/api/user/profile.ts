import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import type { InscripcionCurso, Curso } from "@prisma/client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const userDb = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { inscripciones: { include: { curso: true } } },
    })

    if (!userDb) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // IDs de cursos en que ya está inscrito el usuario
    const inscritosIds = (userDb.inscripciones || [])
      .map((i: InscripcionCurso & { curso?: Curso }) => i.curso?.id ?? (i as any).cursoId)
      .filter(Boolean) as string[]

    // Cursos NO inscritos por el usuario
    const cursosNoInscritos = await prisma.curso.findMany({
      where: inscritosIds.length ? { id: { notIn: inscritosIds } } : {},
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoriaId: true,
        nivel: true,
      },
    })

    return NextResponse.json(cursosNoInscritos)
  } catch (error) {
    console.error("Error en /api/user/profile:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
