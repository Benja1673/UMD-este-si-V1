// app/api/evaluaciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Obtener todas las evaluaciones que NO han sido eliminadas
export async function GET() {
  try {
    const evaluaciones = await prisma.evaluacion.findMany({
      where: {
        deletedAt: null // 🛡️ Filtro Soft Delete
      },
      orderBy: { createdAt: "desc" },
    });
    
    console.log(`📊 Evaluaciones encontradas: ${evaluaciones.length}`);
    return NextResponse.json(evaluaciones);
  } catch (error: any) {
    console.error("❌ Error al obtener evaluaciones:", error);
    return NextResponse.json({ 
      error: "Error al cargar evaluaciones",
      details: error.message 
    }, { status: 500 });
  }
}

// POST - Crear evaluación con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      console.warn(`🚫 Intento no autorizado por: ${session?.user?.email || "Anónimo"}`);
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { titulo, link } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const nueva = await prisma.evaluacion.create({
      data: {
        titulo: titulo.trim(),
        descripcion: link || "", 
        tipo: "EVALUACION",
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        activa: true,
        obligatoria: false,
        // 📝 Registro de auditoría
        createdById: requesterId,
        updatedById: requesterId,
      },
    });

    console.log(`✅ Evaluación creada por ${requesterId} ID: ${nueva.id}`);
    return NextResponse.json(nueva, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear evaluación:", error);
    return NextResponse.json({ 
      error: "Error al crear evaluación", 
      details: error.message 
    }, { status: 500 });
  }
}

// PUT - Actualizar evaluación con auditoría
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const body = await req.json();
    const { id, titulo, link } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    if (!titulo || !titulo.trim()) return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    // Verificar existencia y que no esté eliminado
    const existe = await prisma.evaluacion.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existe) return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });

    const actualizada = await prisma.evaluacion.update({
      where: { id: id },
      data: {
        titulo: titulo.trim(),
        descripcion: link || "", 
        updatedById: requesterId, // 📝 Registro de quién editó
      },
    });

    console.log(`✅ Evaluación actualizada por ${requesterId} ID: ${actualizada.id}`);
    return NextResponse.json(actualizada);
  } catch (error: any) {
    console.error("❌ Error al actualizar evaluación:", error);
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
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const existe = await prisma.evaluacion.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existe) return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });

    // 🗑️ Soft Delete: Solo marcamos fecha y autor
    await prisma.evaluacion.update({
      where: { id: id },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
        activa: false // Desactivamos al borrar
      }
    });

    console.log(`🗑️ Evaluación marcada como eliminada por ${requesterId}: ${existe.titulo}`);
    return NextResponse.json({ message: "Evaluación eliminada correctamente (Soft Delete)" });
  } catch (error: any) {
    console.error("❌ Error al eliminar:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}