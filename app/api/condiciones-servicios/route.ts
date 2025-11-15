import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET - Listar condiciones
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const servicioId = searchParams.get("servicioId");
    const servicioTipo = searchParams.get("servicioTipo");

    let condiciones;

    if (servicioId && servicioTipo) {
      condiciones = await prisma.condicionServicio.findMany({
        where: { servicioId, servicioTipo },
        include: { curso: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      condiciones = await prisma.condicionServicio.findMany({
        include: { curso: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(condiciones);
  } catch (error: any) {
    console.error("❌ Error al obtener condiciones:", error);
    return NextResponse.json(
      { error: "Error al obtener condiciones", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ POST - Crear una nueva condición
export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { servicioId, servicioTipo, estadoRequerido, esGeneral } = body;
    let cursoId = body.cursoId;

    console.log("📥 POST condiciones - Body original:", JSON.stringify(body, null, 2));

    // 🔧 CRÍTICO: Limpiar cursoId si viene vacío
    if (cursoId === "" || cursoId === undefined) {
      console.log("⚠️  cursoId vacío detectado, convirtiéndolo a null");
      cursoId = null;
    }

    console.log("🔍 Valores después de limpieza:");
    console.log("   servicioId:", servicioId, typeof servicioId);
    console.log("   servicioTipo:", servicioTipo);
    console.log("   cursoId:", cursoId, typeof cursoId);
    console.log("   estadoRequerido:", estadoRequerido);
    console.log("   esGeneral:", esGeneral);

    if (!servicioTipo) {
      return NextResponse.json({ error: "servicioTipo es obligatorio" }, { status: 400 });
    }

    // Si no es general, cursoId y estado son obligatorios
    if (!esGeneral && (!cursoId || !estadoRequerido)) {
      console.error("❌ Validación falló: cursoId o estadoRequerido faltante");
      return NextResponse.json(
        { error: "Debe indicar cursoId y estadoRequerido si no es general" },
        { status: 400 }
      );
    }

    const dataToCreate = {
      servicioId,
      servicioTipo,
      cursoId: esGeneral ? null : cursoId,
      estadoRequerido: esGeneral ? null : estadoRequerido,
      esGeneral: Boolean(esGeneral),
    };

    console.log("💾 Datos que se enviarán a Prisma:", JSON.stringify(dataToCreate, null, 2));

    const nueva = await prisma.condicionServicio.create({
      data: dataToCreate,
      include: { curso: true },
    });

    console.log("✅ Condición creada exitosamente:", nueva.id);
    return NextResponse.json(nueva, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear condición:");
    console.error("   Mensaje:", error.message);
    console.error("   Code:", error.code);
    console.error("   Stack:", error.stack);
    return NextResponse.json(
      { error: "Error al crear condición", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ PUT - Actualizar una condición
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    let { id, estadoRequerido, esGeneral } = body;
    let cursoId = body.cursoId;

    if (!id) {
      return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
    }

    // Limpiar cursoId
    if (cursoId === "" || cursoId === undefined) {
      cursoId = null;
    }

    const actualizada = await prisma.condicionServicio.update({
      where: { id },
      data: {
        cursoId: esGeneral ? null : cursoId,
        estadoRequerido: esGeneral ? null : estadoRequerido,
        esGeneral: Boolean(esGeneral),
      },
      include: { curso: true },
    });

    return NextResponse.json(actualizada);
  } catch (error: any) {
    console.error("❌ Error al actualizar condición:", error);
    return NextResponse.json(
      { error: "Error al actualizar condición", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Eliminar una condición
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
    }

    await prisma.condicionServicio.delete({ where: { id } });
    console.log(`✅ Condición eliminada: ${id}`);
    return NextResponse.json({ message: "Condición eliminada correctamente" });
  } catch (error: any) {
    console.error("❌ Error al eliminar condición:", error);
    return NextResponse.json(
      { error: "Error al eliminar condición", details: error.message },
      { status: 500 }
    );
  }
}
