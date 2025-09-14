// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Traer todos los usuarios con rol "docente"
    const docentes = await prisma.user.findMany({
      where: { role: "docente" },
      select: {
        id: true,
        name: true,
        apellido: true,
        rut: true,
        email: true,
        especialidad: true,
        estado: true,
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        // Traemos las inscripciones y los cursos relacionados
        inscripciones: {
          select: {
            id: true,
            estado: true,
            fechaInscripcion: true,
            fechaAprobacion: true,
            fechaInicio: true,
            fechaFinalizacion: true,
            nota: true,
            observaciones: true,
            curso: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                codigo: true,
                nivel: true,
                modalidad: true,
                activo: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: "asc" }, // opcional
    });

    return NextResponse.json(docentes, { status: 200 });
  } catch (error) {
    console.error("Error al traer docentes:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los docentes" },
      { status: 500 }
    );
  }
}
