// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los docentes
export async function GET() {
  try {
    const docentes = await prisma.user.findMany({
      where: { role: "docente" },
      select: {
        id: true,
        name: true,
        apellido: true,
        rut: true,
        email: true,
        telefono: true,
        especialidad: true,
        estado: true,
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        inscripciones: {
          select: {
            id: true,
            estado: true,
            fechaInscripcion: true,
            fechaAprobacion: true,
            fechaInicio: true,
            fechaFinalizacion: true,
            nota: true,
            observaciones: true,
            curso: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                codigo: true,
                nivel: true,
                modalidad: true,
                activo: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: "asc" },
    });

    // Debug: Log para verificar datos
    console.log(`📊 Total docentes encontrados: ${docentes.length}`);
    docentes.forEach(d => {
      console.log(`  - ${d.name} ${d.apellido}: ${d.inscripciones.length} inscripciones`);
    });

    return NextResponse.json(docentes, { status: 200 });
  } catch (error) {
    console.error("❌ Error al traer docentes:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los docentes" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo docente
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, apellido, rut, email, telefono, departamentoId, departamento, direccion, fechaNacimiento, especialidad, password, role } = body;

    // Validaciones básicas
    if (!nombre || !apellido || !rut || !email) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre, apellido, rut, email" },
        { status: 400 }
      );
    }

    // Verificar si el RUT o email ya existen
    const existente = await prisma.user.findFirst({
      where: {
        OR: [
          { rut: rut },
          { email: email }
        ]
      }
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un docente con ese RUT o email" },
        { status: 409 }
      );
    }

    // Buscar el departamento si se proporciona su id o su nombre
    let departamentoIdFinal: string | null = null;
    if (departamentoId) {
      departamentoIdFinal = departamentoId
    } else if (departamento) {
      const dept = await prisma.departamento.findFirst({ where: { nombre: departamento }})
      departamentoIdFinal = dept?.id || null
    }

    // Crear el docente
    const nuevoDocente = await prisma.user.create({
      data: {
        name: nombre,
        apellido: apellido,
        rut: rut,
        email: email,
        telefono: telefono || null,
        hashedPassword: password || "temporal123", // ⚠️ TODO: Hashear con bcrypt
        role: role || "docente",
        especialidad: especialidad || null,
        estado: "ACTIVO",
        departamentoId: departamentoIdFinal,
        direccion: direccion || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      },
      include: {
        departamento: true,
        inscripciones: {
          include: {
            curso: true
          }
        }
      }
    });

    console.log(`✅ Docente creado: ${nuevoDocente.name} ${nuevoDocente.apellido}`);
    return NextResponse.json(nuevoDocente, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear docente:", error);
    return NextResponse.json(
      { error: "No se pudo crear el docente" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un docente existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, apellido, rut, email, telefono, departamentoId, departamento, direccion, fechaNacimiento, especialidad, estado, role } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID del docente" },
        { status: 400 }
      );
    }

    // Verificar que el docente existe
    const docenteExistente = await prisma.user.findUnique({
      where: { id: id }
    });

    if (!docenteExistente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el RUT o email ya existen en otro docente
    if (rut || email) {
      const duplicado = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                rut ? { rut: rut } : {},
                email ? { email: email } : {}
              ]
            }
          ]
        }
      });

      if (duplicado) {
        return NextResponse.json(
          { error: "Ya existe otro docente con ese RUT o email" },
          { status: 409 }
        );
      }
    }

    // Buscar el departamento si se proporciona
    let departamentoIdFinal = undefined as string | null | undefined;
    if (departamentoId in body || departamentoId !== undefined) {
      // preferir departamentoId si se envía
      if (departamentoId !== undefined) {
        departamentoIdFinal = departamentoId || null
      } else if (departamento !== undefined) {
        if (departamento) {
          const dept = await prisma.departamento.findFirst({ where: { nombre: departamento }})
          departamentoIdFinal = dept?.id || null
        } else {
          departamentoIdFinal = null
        }
      }
    }

    // Actualizar el docente
    const docenteActualizado = await prisma.user.update({
      where: { id: id },
      data: {
        ...(nombre && { name: nombre }),
        ...(apellido && { apellido: apellido }),
        ...(rut && { rut: rut }),
        ...(email && { email: email }),
        ...(telefono !== undefined && { telefono }),
        ...(especialidad !== undefined && { especialidad: especialidad }),
        ...(estado && { estado: estado }),
        ...(role && { role }),
        ...(departamentoIdFinal !== undefined && { departamentoId: departamentoIdFinal }),
        ...(direccion !== undefined && { direccion }),
        ...(fechaNacimiento !== undefined && { fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null }),
      },
      include: {
        departamento: true,
        inscripciones: {
          include: {
            curso: true
          }
        }
      }
    });

    console.log(`✅ Docente actualizado: ${docenteActualizado.name} ${docenteActualizado.apellido}`);
    return NextResponse.json(docenteActualizado, { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar docente:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el docente" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un docente
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID del docente" },
        { status: 400 }
      );
    }

    // Verificar que el docente existe
    const docenteExistente = await prisma.user.findUnique({
      where: { id: id },
      select: { name: true, apellido: true }
    });

    if (!docenteExistente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el docente
    await prisma.user.delete({
      where: { id: id }
    });

    console.log(`✅ Docente eliminado: ${docenteExistente.name} ${docenteExistente.apellido}`);
    return NextResponse.json(
      { message: "Docente eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al eliminar docente:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el docente. Puede que tenga registros asociados." },
      { status: 500 }
    );
  }
}