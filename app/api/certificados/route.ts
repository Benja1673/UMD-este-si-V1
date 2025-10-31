import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los certificados
export async function GET() {
  try {
    const certificados = await prisma.certificado.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    console.log(`📊 Certificados encontrados: ${certificados.length}`);
    return NextResponse.json(certificados);
  } catch (error: any) {
    console.error("❌ Error al obtener certificados:", error);
    return NextResponse.json(
      { error: "Error al cargar certificados", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear certificado
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { titulo, descripcion } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    const nuevo = await prisma.certificado.create({
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || "",
        tipo: "SISTEMA",
        fechaEmision: new Date(),
        codigoVerificacion: `CERT-${Date.now()}`,
        activo: true,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    console.log(`✅ Certificado creado ID: ${nuevo.id}`);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear certificado:", error);
    return NextResponse.json(
      { error: "Error al crear certificado", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Actualizar certificado
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, titulo, descripcion } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    if (!titulo || !titulo.trim())
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    const actualizado = await prisma.certificado.update({
      where: { id },
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || "",
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    console.log(`✅ Certificado actualizado ID: ${actualizado.id}`);
    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("❌ Error al actualizar certificado:", error);
    return NextResponse.json(
      { error: "Error al actualizar", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar certificado
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const existe = await prisma.certificado.findUnique({ where: { id } });
    if (!existe)
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    await prisma.certificado.delete({ where: { id } });

    console.log(`✅ Certificado eliminado: ${existe.titulo}`);
    return NextResponse.json({ message: "Certificado eliminado correctamente" });
  } catch (error: any) {
    console.error("❌ Error al eliminar certificado:", error);
    return NextResponse.json(
      { error: "Error al eliminar", details: error.message },
      { status: 500 }
    );
  }
}
