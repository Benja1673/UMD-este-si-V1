// app/api/evaluaciones/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next"; // Importación necesaria para la sesión
import { authOptions } from "@/lib/auth";           // Importación de tus opciones de auth

// GET - Obtener todas las evaluaciones
export async function GET() {
  try {
    const evaluaciones = await prisma.evaluacion.findMany({
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

// POST - Crear evaluación
export async function POST(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      console.warn(`🚫 Intento de creación no autorizado por: ${session?.user?.email || "Anónimo"}`);
      return NextResponse.json({ error: "No tienes permisos para crear evaluaciones" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const body = await req.json();
    const { titulo, link } = body;

    console.log("📝 Creando evaluación:", { titulo, link });

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
      },
    });

    console.log(`✅ Evaluación creada ID: ${nueva.id}`);
    return NextResponse.json(nueva, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear evaluación:", error);
    return NextResponse.json({ 
      error: "Error al crear evaluación", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// PUT - Actualizar evaluación
export async function PUT(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No tienes permisos para editar evaluaciones" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const body = await req.json();
    const { id, titulo, link } = body;

    console.log("📝 Actualizando evaluación:", { id, titulo, link });

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const actualizada = await prisma.evaluacion.update({
      where: { id: id },
      data: {
        titulo: titulo.trim(),
        descripcion: link || "", 
      },
    });

    console.log(`✅ Evaluación actualizada ID: ${actualizada.id}`);
    return NextResponse.json(actualizada);
  } catch (error: any) {
    console.error("❌ Error al actualizar evaluación:", error);
    return NextResponse.json({ 
      error: "Error al actualizar", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

// DELETE - Eliminar evaluación
export async function DELETE(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No tienes permisos para eliminar evaluaciones" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    console.log("🗑️ Eliminando evaluación ID:", id);

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    const evaluacion = await prisma.evaluacion.findUnique({
      where: { id: id },
    });

    if (!evaluacion) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    await prisma.evaluacion.delete({ where: { id: id } });
    console.log(`✅ Evaluación eliminada: ${evaluacion.titulo}`);
    return NextResponse.json({ message: "Evaluación eliminada correctamente" });
  } catch (error: any) {
    console.error("❌ Error al eliminar:", error);
    return NextResponse.json({ 
      error: "Error al eliminar", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}