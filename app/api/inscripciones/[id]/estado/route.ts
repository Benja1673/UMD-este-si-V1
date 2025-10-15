import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { estado } = await req.json();

    if (!["INSCRITO", "APROBADO", "REPROBADO"].includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const updated = await prisma.inscripcionCurso.update({
      where: { id: params.id },
      data: { estado },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar estado de inscripción:", error);
    return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 });
  }
}
