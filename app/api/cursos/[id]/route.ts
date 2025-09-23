// app/api/cursos/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const curso = await prisma.curso.findUnique({
      where: { id: String(params.id) },
      include: {
        departamento: true,
        inscripciones: {
          include: {
            usuario: {
              include: { departamento: true }, // si user también tiene depto
            },
          },
        },
      },
    })

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 })
    }

    return NextResponse.json(curso)
  } catch (error) {
    console.error("Error obteniendo curso:", error)
    return NextResponse.json({ error: "Error al obtener curso" }, { status: 500 })
  }
}
