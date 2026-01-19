// app/api/inscripciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; 

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get("estado");
    const usuarioId = searchParams.get("usuarioId") ?? searchParams.get("userId");
    const cursoId = searchParams.get("cursoId");

    const where: any = { deletedAt: null }; // Siempre filtrar eliminados
    if (estado) {
      where.estado = { equals: estado, mode: 'insensitive' };
    }
    if (usuarioId) where.userId = usuarioId;
    if (cursoId) where.cursoId = cursoId;

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
              departamentoId: true, // ✅ CLAVE: Necesitamos este ID para agrupar en el gráfico
              departamento: { 
                select: { 
                  id: true, 
                  nombre: true 
                } 
              },
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
      timeout: 20000 
    });

    return NextResponse.json(inscripciones);
  } catch (error: any) {
    console.error("Error obteniendo inscripciones:", error);
    return NextResponse.json({ error: "Error al obtener inscripciones", details: error?.message }, { status: 500 });
  }
}