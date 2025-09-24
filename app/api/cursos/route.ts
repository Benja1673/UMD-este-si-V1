// app/api/cursos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        departamento: true,
        _count: { select: { inscripciones: true } }, // 👈 Prisma trae solo el número
      },
    });

    // Adaptamos los datos para que "cupos" sea la cantidad de inscripciones
    const adaptados = cursos.map((c) => ({
      ...c,
      cupos: c._count.inscripciones, // 👈 reemplaza cupos con el número real
    }));

    return NextResponse.json(adaptados);
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    return NextResponse.json(
      { error: "Error al obtener cursos" },
      { status: 500 }
    );
  }
}
