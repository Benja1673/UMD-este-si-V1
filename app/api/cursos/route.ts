import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// ✅ Obtener todos los cursos
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      // 🔹 Obtener un curso específico con docentes inscritos
      const curso = await prisma.curso.findUnique({
        where: { id },
        include: {
          departamento: true,
          categoria: true,
          inscripciones: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                  apellido: true,
                  rut: true,
                  email: true,
                  role: true,
                  departamento: { select: { nombre: true } },
                },
              },
            },
          },
        },
      });

      if (!curso) {
        return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
      }

      return NextResponse.json(curso);
    } else {
      // 🔹 Obtener todos los cursos
      const cursos = await prisma.curso.findMany({
        include: {
          departamento: true,
          _count: { select: { inscripciones: true } },
        },
      });

      const adaptados = cursos.map((c) => ({
        ...c,
        cupos: c._count.inscripciones,
      }));

      return NextResponse.json(adaptados);
    }
  } catch (error) {
    console.error("Error obteniendo cursos:", error);
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 });
  }
}

// ✅ Crear un curso
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // BLINDAJE: solo Admin o Supervisor pueden crear cursos
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos para crear cursos" }, { status: 403 });
    }
    const body = await req.json();
    const {
      nombre,
      descripcion,
      codigo,
      nivel,
      instructor,
      tipo,
      ano,
      categoriaId,
      departamentoId,
      docentesInscritos = [],
    } = body;

    if (!categoriaId) {
      return NextResponse.json({ error: "categoriaId es obligatorio" }, { status: 400 });
    }

    const nuevoCurso = await prisma.curso.create({
      data: {
        nombre,
        descripcion: descripcion || "",
        codigo,
        nivel: nivel || "",
        tipo: tipo || "",
        ano: Number(ano),
        departamentoId: String(departamentoId),
        instructor: instructor ? String(instructor) : undefined,
        categoriaId: String(categoriaId),
        inscripciones: {
          create: docentesInscritos.map((userId: number) => ({ userId })),
        },
      },
      include: {
        departamento: true,
        inscripciones: { include: { usuario: true } },
      },
    });

    return NextResponse.json(nuevoCurso, { status: 201 });
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 });
  }
}

// ✅ Actualizar curso
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // BLINDAJE: solo Admin o Supervisor pueden actualizar cursos
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos para editar cursos" }, { status: 403 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID del curso es requerido" }, { status: 400 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      codigo,
      nivel,
      tipo,
      ano,
      categoriaId,
      departamentoId,
      docentesInscritos = [],
      inscripciones = [],
    } = body;

    // Traer las inscripciones actuales desde la BD
    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({
      where: { cursoId: id },
      select: { id: true, userId: true, estado: true },
    });

    // Determinar diferencias
    const nuevos = docentesInscritos.filter(
      (docId: string) => !inscripcionesActuales.some((i) => i.userId === docId)
    );
    const eliminados = inscripcionesActuales.filter(
      (i) => !docentesInscritos.includes(i.userId)
    );

    // Actualizar curso (sin tocar las inscripciones)
    const cursoActualizado = await prisma.curso.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        codigo,
        nivel,
        tipo,
        ano: Number(ano),
        categoriaId,
        departamentoId,
      },
    });

    // Eliminar los que ya no están
    if (eliminados.length > 0) {
      await prisma.inscripcionCurso.deleteMany({
        where: { id: { in: eliminados.map((e) => e.id) } },
      });
    }

    // Crear los nuevos
    if (nuevos.length > 0) {
      await prisma.inscripcionCurso.createMany({
        data: nuevos.map((userId: string) => ({
          userId,
          cursoId: id,
          estado: "INSCRITO",
        })),
      });
    }

    // Actualizar estados de los que se enviaron en el body
    for (const insc of inscripciones) {
      await prisma.inscripcionCurso.updateMany({
        where: { id: insc.id },
        data: { estado: insc.estado },
      });
    }

    // Retornar el curso con inscripciones actualizadas
    const cursoFinal = await prisma.curso.findUnique({
      where: { id },
      include: {
        departamento: true,
        inscripciones: {
          include: { usuario: true },
        },
      },
    });

    return NextResponse.json(cursoFinal);
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 });
  }
}

// ✅ Eliminar curso
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // BLINDAJE: solo Admin o Supervisor pueden eliminar cursos
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos para eliminar cursos" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID del curso es requerido" }, { status: 400 });
    }

    await prisma.inscripcionCurso.deleteMany({ where: { cursoId: id } });
    await prisma.curso.delete({ where: { id } });

    return NextResponse.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
}