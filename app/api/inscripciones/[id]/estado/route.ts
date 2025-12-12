import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const { id } = params

    const body = await req.json()
    const { estado } = body

    // Validar que venga el estado
    if (!estado) {
      return NextResponse.json({ error: "Estado requerido" }, { status: 400 })
    }

    // Validar que sea un estado válido
    if (!["INSCRITO", "APROBADO", "REPROBADO"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    const inscripcionActualizada = await prisma.inscripcionCurso.update({
      where: { id: id },
      data: { estado: estado },
    })

    return NextResponse.json(inscripcionActualizada)
  } catch (error) {
    console.error("Error actualizando inscripción:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}
