import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// ✅ GET - Obtener curso específico o todos los cursos (solo no eliminados)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (id) {
      // 🔹 Obtener un curso específico (que no esté eliminado)
      const curso = await prisma.curso.findFirst({
        where: { id, deletedAt: null }, // 🛡️ Filtro Soft Delete
        include: {
          departamento: true,
          categoria: true,
          inscripciones: {
            where: { deletedAt: null }, // 🛡️ Opcional: filtrar inscripciones eliminadas
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
      // 🔹 Obtener todos los cursos activos
      const cursos = await prisma.curso.findMany({
        where: { deletedAt: null }, // 🛡️ Filtro Soft Delete
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

// ✅ POST - Crear un curso con Auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
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
        // 📝 Registro de Auditoría
        createdById: requesterId,
        updatedById: requesterId,
        inscripciones: {
          create: docentesInscritos.map((d: any) => ({
            userId: d.userId,
            estado: d.estado || "INSCRITO",
            nota: d.nota || null,
            fechaInscripcion: new Date(),
            createdById: requesterId,
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

// ✅ PUT - Actualizar curso con Auditoría y Control de Activo/Inactivo
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
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
      activo, // 👈 Nuevo campo para activar/desactivar
      categoriaId,
      departamentoId,
      docentesInscritos = [],
    } = body;

    // Verificar que el curso no esté eliminado
    const cursoBase = await prisma.curso.findFirst({ where: { id: cursoId, deletedAt: null } });
    if (!cursoBase) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({ where: { cursoId } });

    const nuevosUserIds = docentesInscritos.map((d: any) => d.userId);
    const inscripcionesAEliminar = inscripcionesActuales.filter((i) => !nuevosUserIds.includes(i.userId));
    const inscripcionesAActualizar = docentesInscritos.filter((d: any) => inscripcionesActuales.some((i) => i.userId === d.userId));
    const inscripcionesNuevas = docentesInscritos.filter((d: any) => !inscripcionesActuales.some((i) => i.userId === d.userId));

    const cursoActualizado = await prisma.$transaction(async (tx) => {
      // 1️⃣ Eliminar físicamente inscripciones quitadas (o podrías hacer soft delete aquí también)
      for (const ins of inscripcionesAEliminar) {
        await tx.inscripcionCurso.delete({ where: { id: ins.id } });
      }

      // 2️⃣ Actualizar inscripciones existentes
      for (const insData of inscripcionesAActualizar) {
        const inscripcionExistente = inscripcionesActuales.find((i) => i.userId === insData.userId);
        if (inscripcionExistente) {
          await tx.inscripcionCurso.update({
            where: { id: inscripcionExistente.id },
            data: {
              estado: insData.estado || "INSCRITO",
              nota: insData.nota !== undefined ? Number(insData.nota) : null,
              fechaAprobacion: insData.estado === "APROBADO" ? new Date() : null,
              updatedById: requesterId,
            },
          });
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
            createdById: requesterId,
            updatedById: requesterId,
          },
        });
      }

      // 4️⃣ Actualizar curso con Auditoría
      return tx.curso.update({
        where: { id: cursoId },
        data: {
          nombre,
          descripcion,
          codigo,
          nivel,
          tipo,
          activo: activo !== undefined ? activo : undefined, // 📝 Actualización de estado Activo/Inactivo
          ano: Number(ano),
          categoriaId,
          departamentoId,
          updatedById: requesterId, // 📝 Auditoría
        },
        include: {
          departamento: true,
          categoria: true,
          inscripciones: { include: { usuario: true } },
        },
      });
    });

    return NextResponse.json(cursoActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar curso:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ✅ DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const resolvedParams = await params;
    const cursoId = resolvedParams.id;

    // 🗑️ Soft Delete: Solo marcamos fecha y autor del borrado
    await prisma.curso.update({
      where: { id: cursoId },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
        activo: false, // Opcional: Desactivarlo también al "eliminar"
      },
    });

    console.log(`🗑️ Curso marcado como eliminado por ${requesterId}: ${cursoId}`);
    return NextResponse.json({ message: "Curso eliminado correctamente (Soft Delete)" });
  } catch (error) {
    console.error("❌ Error al eliminar curso:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
} 