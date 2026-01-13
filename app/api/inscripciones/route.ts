import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Aumento de timeout de ejecución para entornos Serverless (Vercel)
export const maxDuration = 60; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const usuarioId = searchParams.get("usuarioId") ?? searchParams.get("userId");
    const cursoId = searchParams.get("cursoId");

    const where: any = {};
    if (estado) {
      // ✅ Hacemos que la búsqueda sea insensible a mayúsculas
      where.estado = { equals: estado, mode: 'insensitive' };
    }
    if (usuarioId) where.userId = usuarioId;
    if (cursoId) where.cursoId = cursoId;

    // ✅ Uso de transacción con timeout aumentado (20 segundos) para evitar errores de carga lenta
    const inscripciones = await prisma.$transaction(async (tx) => {
      return await tx.inscripcionCurso.findMany({
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
    }, {
      timeout: 20000 // Solución al error de Interactive Transaction timeout
    });

    return NextResponse.json(inscripciones);
  } catch (error: any) {
    console.error("Error obteniendo inscripciones:", error);
    return NextResponse.json({ error: "Error al obtener inscripciones", details: error?.message }, { status: 500 });
  }
}