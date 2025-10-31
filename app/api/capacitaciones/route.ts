import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener solo capacitaciones (modalidad="capacitacion")
export async function GET() {
  try {
    const capacitaciones = await prisma.capacitacion.findMany({
      where: { modalidad: "capacitacion" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(capacitaciones);
  } catch (error) {
    console.error("Error al obtener capacitaciones:", error);
    return NextResponse.json({ error: "Error al cargar capacitaciones" }, { status: 500 });
  }
}

// POST - Crear capacitación (modalidad="capacitacion")
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titulo, descripcion, ubicacion } = body;

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const nueva = await prisma.capacitacion.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        ubicacion: ubicacion || "",
        modalidad: "capacitacion", // ✅ Forzar modalidad
        fechaInicio: new Date(),
        fechaFin: new Date(),
        estado: "ACTIVO",
        cupos: 0,
      },
    });

    console.log(`✅ Capacitación creada: ${nueva.titulo}`);
    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    console.error("Error al crear capacitación:", error);
    return NextResponse.json({ error: "Error al crear capacitación" }, { status: 500 });
  }
}

// PUT - Actualizar capacitación
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, titulo, descripcion, ubicacion } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // Verificar que sea una capacitación (no un sistema)
    const existe = await prisma.capacitacion.findUnique({
      where: { id },
    });

    if (!existe || existe.modalidad !== "capacitacion") {
      return NextResponse.json({ error: "Capacitación no encontrada" }, { status: 404 });
    }

    const actualizada = await prisma.capacitacion.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        ubicacion,
      },
    });

    console.log(`✅ Capacitación actualizada: ${actualizada.titulo}`);
    return NextResponse.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar capacitación:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE - Eliminar capacitación
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // Verificar que sea una capacitación
    const existe = await prisma.capacitacion.findUnique({
      where: { id },
    });

    if (!existe || existe.modalidad !== "capacitacion") {
      return NextResponse.json({ error: "Capacitación no encontrada" }, { status: 404 });
    }

    await prisma.capacitacion.delete({ where: { id } });
    console.log(`✅ Capacitación eliminada: ${existe.titulo}`);
    return NextResponse.json({ message: "Capacitación eliminada" });
  } catch (error) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}