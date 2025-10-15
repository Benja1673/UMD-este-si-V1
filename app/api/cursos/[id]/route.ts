import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Obtener todos los cursos
export async function GET(req: Request, { params }: { params?: { id?: string } }) {
  try {
    if (params?.id) {
      // 🔹 Obtener un curso específico con docentes inscritos
      const curso = await prisma.curso.findUnique({
        where: { id: params.id },
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

// ✅ Actualizar curso (mantiene estados de inscripción)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
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
    } = body;

    // 🔹 Obtenemos las inscripciones actuales del curso
    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({
      where: { cursoId: params.id },
    });

    // 🔹 Determinar qué inscripciones se mantienen, agregan o eliminan
    const nuevosUserIds = docentesInscritos.map((d: any) => d.userId);
    const inscripcionesAEliminar = inscripcionesActuales.filter(
      (i) => !nuevosUserIds.includes(i.userId)
    );
    const inscripcionesAActualizar = docentesInscritos.filter((d: any) =>
      inscripcionesActuales.some((i) => i.userId === d.userId)
    );
    const inscripcionesANuevas = docentesInscritos.filter(
      (d: any) => !inscripcionesActuales.some((i) => i.userId === d.userId)
    );

    // 🔹 Transacción para asegurar consistencia
    const cursoActualizado = await prisma.$transaction(async (tx) => {
      // 1️⃣ Eliminar inscripciones quitadas
      for (const ins of inscripcionesAEliminar) {
        await tx.inscripcionCurso.delete({ where: { id: ins.id } });
      }

      // 2️⃣ Actualizar inscripciones existentes (mantener estado)
      for (const ins of inscripcionesAActualizar) {
        await tx.inscripcionCurso.updateMany({
          where: { cursoId: params.id, userId: ins.userId },
          data: { estado: ins.estado ?? "INSCRITO" },
        });
      }

      // 3️⃣ Crear nuevas inscripciones
      for (const ins of inscripcionesANuevas) {
        await tx.inscripcionCurso.create({
          data: {
            cursoId: params.id,
            userId: ins.userId,
            estado: ins.estado ?? "INSCRITO",
          },
        });
      }

      // 4️⃣ Actualizar datos generales del curso
      return tx.curso.update({
        where: { id: params.id },
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
        include: {
          departamento: true,
          inscripciones: { include: { usuario: true } },
        },
      });
    });

    return NextResponse.json(cursoActualizado);
  } catch (error) {
    console.error("Error al actualizar curso:", error);
    return NextResponse.json({ error: "Error al actualizar curso" }, { status: 500 });
  }
}



// ✅ Eliminar curso
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.inscripcionCurso.deleteMany({ where: { cursoId: params.id } });
    await prisma.curso.delete({ where: { id: params.id } });

    return NextResponse.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar curso:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
}
