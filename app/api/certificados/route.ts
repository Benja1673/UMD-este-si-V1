import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// GET - Obtener todos los certificados que no han sido eliminados
export async function GET() {
  try {
    const certificados = await prisma.certificado.findMany({
      where: {
        deletedAt: null // 🛡️ Filtro para ignorar registros con borrado lógico
      },
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

// POST - Crear certificado con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // BLINDAJE: solo Admin o Supervisor pueden crear certificados
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
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
        // 📝 Registro de auditoría
        createdById: requesterId,
        updatedById: requesterId,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    console.log(`✅ Certificado creado por ${requesterId} ID: ${nuevo.id}`);
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

    // BLINDAJE: solo Admin o Supervisor pueden actualizar certificados
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const body = await req.json();
    const { id, titulo, descripcion } = body;

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });
    if (!titulo || !titulo.trim())
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });

    // Verificar que exista y no esté eliminado
    const existe = await prisma.certificado.findFirst({
      where: { id, deletedAt: null }
    });

    if (!existe) return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    const actualizado = await prisma.certificado.update({
      where: { id },
      data: {
        titulo: titulo.trim(),
        descripcion: descripcion?.trim() || "",
        updatedById: requesterId, // 📝 Registro de quién editó
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
      },
    });

    console.log(`✅ Certificado actualizado por ${requesterId} ID: ${actualizado.id}`);
    return NextResponse.json(actualizado);
  } catch (error: any) {
    console.error("❌ Error al actualizar certificado:", error);
    return NextResponse.json(
      { error: "Error al actualizar", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // BLINDAJE: solo Admin o Supervisor pueden eliminar certificados
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID es requerido" }, { status: 400 });

    const existe = await prisma.certificado.findFirst({ 
      where: { id, deletedAt: null } 
    });

    if (!existe)
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    // 🗑️ Soft Delete: No eliminamos el registro, solo marcamos fecha y autor
    await prisma.certificado.update({ 
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
      }
    });

    console.log(`🗑️ Certificado marcado como eliminado por ${requesterId}: ${existe.titulo}`);
    return NextResponse.json({ message: "Certificado eliminado correctamente" });
  } catch (error: any) {
    console.error("❌ Error al eliminar certificado:", error);
    return NextResponse.json(
      { error: "Error al eliminar", details: error.message },
      { status: 500 }
    );
  }
}