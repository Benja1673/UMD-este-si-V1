import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ Obtener curso específico o todos los cursos
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

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
          categoria: true,
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
          create: docentesInscritos.map((d: any) => ({
            userId: d.userId,
            estado: d.estado || "INSCRITO",
            nota: d.nota || null,
            fechaInscripcion: new Date(),
          })),
        },
      },
      include: {
        departamento: true,
        categoria: true,
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
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cursoId = resolvedParams.id;

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

    console.log(`📝 Actualizando curso ${cursoId}...`);
    console.log(`👥 Docentes inscritos recibidos:`, docentesInscritos);

    // 🔹 Obtenemos las inscripciones actuales del curso
    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({
      where: { cursoId },
    });

    console.log(`📋 Inscripciones actuales:`, inscripcionesActuales.length);

    // 🔹 Determinar qué inscripciones se mantienen, agregan o eliminan
    const nuevosUserIds = docentesInscritos.map((d: any) => d.userId);
    const inscripcionesAEliminar = inscripcionesActuales.filter(
      (i) => !nuevosUserIds.includes(i.userId)
    );
    const inscripcionesAActualizar = docentesInscritos.filter((d: any) =>
      inscripcionesActuales.some((i) => i.userId === d.userId)
    );
    const inscripcionesNuevas = docentesInscritos.filter(
      (d: any) => !inscripcionesActuales.some((i) => i.userId === d.userId)
    );

    console.log(`➖ A eliminar: ${inscripcionesAEliminar.length}`);
    console.log(`✏️  A actualizar: ${inscripcionesAActualizar.length}`);
    console.log(`➕ A crear: ${inscripcionesNuevas.length}`);

    // 🔹 Transacción para asegurar consistencia
    const cursoActualizado = await prisma.$transaction(async (tx) => {
      // 1️⃣ Eliminar inscripciones quitadas
      for (const ins of inscripcionesAEliminar) {
        await tx.inscripcionCurso.delete({ where: { id: ins.id } });
        console.log(`❌ Eliminada inscripción: ${ins.id}`);
      }

      // 2️⃣ Actualizar inscripciones existentes
      for (const insData of inscripcionesAActualizar) {
        const inscripcionExistente = inscripcionesActuales.find(
          (i) => i.userId === insData.userId
        );

        if (inscripcionExistente) {
          await tx.inscripcionCurso.update({
            where: { id: inscripcionExistente.id },
            data: {
              estado: insData.estado || "INSCRITO",
              nota: insData.nota !== undefined ? Number(insData.nota) : null,
              fechaAprobacion:
                insData.estado === "APROBADO" ? new Date() : null,
            },
          });
          console.log(`✏️  Actualizada inscripción: ${inscripcionExistente.id} → ${insData.estado}`);
        }
      }

      // 3️⃣ Crear nuevas inscripciones
      for (const insData of inscripcionesNuevas) {
        await tx.inscripcionCurso.create({
          data: {
            cursoId,
            userId: insData.userId,
            estado: insData.estado || "INSCRITO",
            nota: insData.nota !== undefined ? Number(insData.nota) : null,
            fechaInscripcion: new Date(),
            fechaAprobacion: insData.estado === "APROBADO" ? new Date() : null,
          },
        });
        console.log(`➕ Creada inscripción: ${insData.userId} → ${insData.estado}`);
      }

      // 4️⃣ Actualizar datos generales del curso
      return tx.curso.update({
        where: { id: cursoId },
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
                },
              },
            },
          },
        },
      });
    });

    console.log(`✅ Curso actualizado correctamente`);
    return NextResponse.json(cursoActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar curso:", error);
    return NextResponse.json(
      { error: "Error al actualizar curso: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// ✅ Eliminar curso
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cursoId = resolvedParams.id;

    // Eliminar inscripciones primero (si no está en cascada)
    await prisma.inscripcionCurso.deleteMany({ where: { cursoId } });
    
    // Eliminar el curso
    await prisma.curso.delete({ where: { id: cursoId } });

    console.log(`✅ Curso ${cursoId} eliminado correctamente`);
    return NextResponse.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar curso:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el curso" },
      { status: 500 }
    );
  }
}