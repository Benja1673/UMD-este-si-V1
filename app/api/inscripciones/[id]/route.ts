import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;

    const { estado } = await req.json();

// Cambiar la validación para incluir NO_INSCRITO
if (!["INSCRITO", "APROBADO", "REPROBADO", "NO_INSCRITO"].includes(estado)) {
  return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
}

    const updated = await prisma.inscripcionCurso.update({
      where: { id: id },
      data: { estado },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error al actualizar estado de inscripción:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado", details: error?.message },
      { status: 500 }
    );
  }
}