import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ✅ Aumento de timeout de ejecución para entornos Serverless (Vercel)
export const maxDuration = 60; 

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

    // Cambiar la validación para incluir NO_INSCRITO
    if (!["INSCRITO", "APROBADO", "REPROBADO", "NO_INSCRITO"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // ✅ Uso de transacción con timeout aumentado (20 segundos) para evitar cierres prematuros
    const inscripcionActualizada = await prisma.$transaction(async (tx) => {
      return await tx.inscripcionCurso.update({
        where: { id: id },
        data: { estado: estado },
      })
    }, {
      timeout: 20000 // Solución al error de Interactive Transaction timeout
    })

    return NextResponse.json(inscripcionActualizada)
  } catch (error) {
    console.error("Error actualizando inscripción:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}