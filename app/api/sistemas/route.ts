// app/api/sistemas/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next"; // Importación para la sesión
import { authOptions } from "@/lib/auth";           // Importación de tus opciones

// GET - Obtener solo sistemas (modalidad="sistema")
export async function GET() {
  try {
    const sistemas = await prisma.capacitacion.findMany({
      where: { modalidad: "sistema" },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(sistemas);
  } catch (error) {
    console.error("Error al obtener sistemas:", error);
    return NextResponse.json({ error: "Error al cargar sistemas" }, { status: 500 });
  }
}

// POST - Crear sistema (modalidad="sistema")
export async function POST(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      console.warn(`🚫 Intento de creación de sistema no autorizado por: ${session?.user?.email || "Anónimo"}`);
      return NextResponse.json({ error: "No tienes permisos para crear sistemas" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const body = await req.json();
    const { titulo, descripcion, ubicacion } = body;

    if (!titulo) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const nuevo = await prisma.capacitacion.create({
      data: {
        titulo,
        descripcion: descripcion || "",
        ubicacion: ubicacion || "",
        modalidad: "sistema", // ✅ Forzar modalidad
        fechaInicio: new Date(),
        fechaFin: new Date(),
        estado: "ACTIVO",
        cupos: 0,
      },
    });

    console.log(`✅ Sistema creado: ${nuevo.titulo}`);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    console.error("Error al crear sistema:", error);
    return NextResponse.json({ error: "Error al crear sistema" }, { status: 500 });
  }
}

// PUT - Actualizar sistema
export async function PUT(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No tienes permisos para actualizar sistemas" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const body = await req.json();
    const { id, titulo, descripcion, ubicacion } = body;

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // Verificar que sea un sistema (no una capacitación)
    const existe = await prisma.capacitacion.findUnique({
      where: { id },
    });

    if (!existe || existe.modalidad !== "sistema") {
      return NextResponse.json({ error: "Sistema no encontrado" }, { status: 404 });
    }

    const actualizado = await prisma.capacitacion.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        ubicacion,
      },
    });

    console.log(`✅ Sistema actualizado: ${actualizado.titulo}`);
    return NextResponse.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar sistema:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// DELETE - Eliminar sistema
export async function DELETE(req: Request) {
  try {
    // 🛡️ INICIO BLINDAJE DE SEGURIDAD
    const session = await getServerSession(authOptions);
    const role = session?.user?.role?.toUpperCase();

    if (role !== "ADMIN" && role !== "SUPERVISOR") {
      return NextResponse.json({ error: "No tienes permisos para eliminar sistemas" }, { status: 403 });
    }
    // 🛡️ FIN BLINDAJE

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    }

    // Verificar que sea un sistema
    const existe = await prisma.capacitacion.findUnique({
      where: { id },
    });

    if (!existe || existe.modalidad !== "sistema") {
      return NextResponse.json({ error: "Sistema no encontrado" }, { status: 404 });
    }

    await prisma.capacitacion.delete({ where: { id } });
    console.log(`✅ Sistema eliminado: ${existe.titulo}`);
    return NextResponse.json({ message: "Sistema eliminado" });
  } catch (error) {
    console.error("Error al eliminar:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}