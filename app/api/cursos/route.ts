// app/api/cursos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Obtener todos los cursos
export async function GET() {
  try {
    const cursos = await prisma.curso.findMany({
      include: {
        departamento: true,
        _count: { select: { inscripciones: true } },
      },
    });

    const adaptados = cursos.map((c) => ({
      ...c,
      cupos: c._count.inscripciones,
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
// ✅ Crear un curso nuevo
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nombre,
      descripcion,
      codigo,
      nivel,
      instructor,
      tipo,
      ano,
      categoriaId,
      departamentoId,
      docentesInscritos = [],
    } = body;

    // 🚨 Validar que categoriaId existe
    if (!categoriaId) {
      return NextResponse.json(
        { error: "categoriaId es obligatorio" },
        { status: 400 }
      );
    }

    const nuevoCurso = await prisma.curso.create({
      data: {
        nombre,
        descripcion: descripcion || "",
        codigo,
        nivel: nivel || "",
        tipo: tipo || "",
        ano: Number(ano),
        departamentoId: String(departamentoId),
        instructor: instructor ? String(instructor) : undefined,
        categoriaId: String(categoriaId), // 👈 siempre string obligatorio

        inscripciones: {
          create: docentesInscritos.map((userId: number) => ({
            userId: (userId),
          })),
        },
      },
      include: {
        departamento: true,
        inscripciones: true,
      },
    });

    return NextResponse.json(nuevoCurso, { status: 201 });
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json(
      { error: "Error al crear curso" },
      { status: 500 }
    );
  }
}
