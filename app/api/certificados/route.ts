// app/api/certificados/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// ✅ Aumento de timeout de ejecución para entornos Serverless
export const maxDuration = 60; 

// GET - Obtener todos los certificados que no han sido eliminados
export async function GET() {
  try {
    const certificados = await prisma.certificado.findMany({
      where: {
        deletedAt: null 
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    return NextResponse.json(certificados);
  } catch (error: any) {
    console.error("❌ Error al obtener certificados:", error);
    return NextResponse.json(
      { error: "Error al cargar certificados", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear certificado con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const body = await req.json();
    const { titulo, descripcion } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    // ✅ Uso de transacción para asegurar la integridad
    const nuevo = await prisma.$transaction(async (tx) => {
      return await tx.certificado.create({
        data: {
          titulo: titulo.trim(),
          descripcion: descripcion?.trim() || "",
          tipo: "SISTEMA",
          fechaEmision: new Date(),
          codigoVerificacion: `CERT-${Date.now()}`,
          activo: true,
          createdById: requesterId,
          updatedById: requesterId,
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    }, { timeout: 10000 });

    return NextResponse.json(nuevo, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear certificado:", error);
    return NextResponse.json(
      { error: "Error al crear certificado", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar certificado con auditoría
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const body = await req.json();
    const { id, titulo, descripcion } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    if (!titulo || !titulo.trim())
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    const actualizado = await prisma.$transaction(async (tx) => {
      const existe = await tx.certificado.findFirst({
        where: { id, deletedAt: null }
      });

      if (!existe) throw new Error("NOT_FOUND");

      return await tx.certificado.update({
        where: { id },
        data: {
          titulo: titulo.trim(),
          descripcion: descripcion?.trim() || "",
          updatedById: requesterId,
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    }, { timeout: 10000 });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    console.error("❌ Error al actualizar certificado:", error);
    return NextResponse.json({ error: "Error al actualizar", details: error.message }, { status: 500 });
  }
}

// DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      const existe = await tx.certificado.findFirst({ 
        where: { id, deletedAt: null } 
      });

      if (!existe) throw new Error("NOT_FOUND");

      await tx.certificado.update({ 
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: requesterId,
        }
      });
    }, { timeout: 10000 });

    return NextResponse.json({ message: "Certificado eliminado correctamente" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    console.error("❌ Error al eliminar certificado:", error);
    return NextResponse.json({ error: "Error al eliminar", details: error.message }, { status: 500 });
  }
}