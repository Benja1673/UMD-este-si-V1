import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        departamento: true, // si existe tabla de departamentos
      },
    });

    return NextResponse.json(cursos);
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 });
  }
}
