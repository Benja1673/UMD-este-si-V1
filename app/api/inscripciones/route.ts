import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const usuarioId = searchParams.get("usuarioId") ?? searchParams.get("userId");
    const cursoId = searchParams.get("cursoId");

    const where: any = {};
    if (estado) where.estado = estado;
    if (usuarioId) where.userId = usuarioId;
    if (cursoId) where.cursoId = cursoId;

    const inscripciones = await prisma.inscripcionCurso.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            apellido: true,
            email: true,
            departamento: { select: { nombre: true } },
          },
        },
        curso: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(inscripciones);
  } catch (error: any) {
    console.error("Error obteniendo inscripciones:", error);
    return NextResponse.json({ error: "Error al obtener inscripciones", details: error?.message }, { status: 500 });
  }
}