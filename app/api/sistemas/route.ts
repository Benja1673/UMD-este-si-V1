// app/api/sistemas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Obtener solo sistemas vivos (modalidad="sistema" y no eliminados)
export async function GET() {
  try {
    const sistemas = await prisma.capacitacion.findMany({
      where: { 
        modalidad: "sistema",
        deletedAt: null // 🛡️ Filtro Soft Delete
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sistemas);
  } catch (error) {
    console.error("Error al obtener sistemas:", error);
    return NextResponse.json({ error: "Error al cargar sistemas" }, { status: 500 });
  }
}

// POST - Crear sistema con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { titulo, descripcion, ubicacion } = body;

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const nuevo = await prisma.capacitacion.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion || "",
        ubicacion: ubicacion || "",
        modalidad: "sistema",
        fechaInicio: new Date(),
        fechaFin: new Date(),
        estado: "ACTIVO",
        cupos: 0,
        // 📝 Registro de auditoría
        createdById: requesterId,
        updatedById: requesterId,
      },
    });

    console.log(`✅ Sistema creado por ${requesterId}: ${nuevo.titulo}`);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error("Error al crear sistema:", error);
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

// PUT - Actualizar sistema con auditoría
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { id, titulo, descripcion, ubicacion } = body;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // Verificar que sea un sistema y esté vivo
    const existe = await prisma.capacitacion.findFirst({
      where: { id, modalidad: "sistema", deletedAt: null },
    });

    if (!existe) {
      return NextResponse.json({ error: "Sistema no encontrado" }, { status: 404 });
    }

    const actualizado = await prisma.capacitacion.update({
      where: { id },
      data: {
        titulo: titulo?.trim(),
        descripcion,
        ubicacion,
        updatedById: requesterId, // 📝 Trazabilidad
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const existe = await prisma.capacitacion.findFirst({
      where: { id, modalidad: "sistema", deletedAt: null },
    });

    if (!existe) {
      return NextResponse.json({ error: "Sistema no encontrado" }, { status: 404 });
    }

    // 🗑️ Soft Delete
    await prisma.capacitacion.update({ 
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
        estado: "INACTIVO"
      } 
    });

    console.log(`🗑️ Sistema marcado como eliminado por ${requesterId}: ${existe.titulo}`);
    return NextResponse.json({ message: "Sistema eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}