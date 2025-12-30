// app/api/capacitaciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Solo capacitaciones NO eliminadas
export async function GET() {
  try {
    const capacitaciones = await prisma.capacitacion.findMany({
      where: { 
        modalidad: "capacitacion",
        deletedAt: null // 🛡️ Filtro de Soft Delete
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(capacitaciones);
  } catch (error) {
    console.error("Error al obtener capacitaciones:", error);
    return NextResponse.json({ error: "Error al cargar" }, { status: 500 });
  }
}

// POST - Crear con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = session?.user?.id;
    const role = session?.user?.role?.toUpperCase();

    if (role === "DOCENTE") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await req.json();
    const { titulo, descripcion, ubicacion } = body;

    const nueva = await prisma.capacitacion.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        ubicacion: ubicacion || "",
        modalidad: "capacitacion",
        fechaInicio: new Date(),
        fechaFin: new Date(),
        estado: "ACTIVO",
        cupos: 0,
        createdById: requesterId, // 📝 Auditoría
        updatedById: requesterId,
      },
    });

    return NextResponse.json(nueva, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

// PUT - Editar con auditoría
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = session?.user?.id;
    const role = session?.user?.role?.toUpperCase();

    if (role === "DOCENTE") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await req.json();
    const { id, titulo, descripcion, ubicacion, estado } = body;

    const actualizada = await prisma.capacitacion.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        ubicacion,
        estado,
        updatedById: requesterId, // 📝 Registro de quién editó
      },
    });

    return NextResponse.json(actualizada);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = session?.user?.id;

    if (session?.user?.role?.toUpperCase() === "DOCENTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID faltante" }, { status: 400 });

    // 🗑️ Soft Delete: Solo marcamos fecha y autor del borrado
    await prisma.capacitacion.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
      },
    });

    return NextResponse.json({ message: "Eliminado correctamente (Soft Delete)" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}