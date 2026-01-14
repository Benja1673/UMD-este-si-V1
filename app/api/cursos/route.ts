import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// ✅ Aumento de timeout de ejecución para entornos Serverless (Vercel)
export const maxDuration = 60; 

// ✅ GET - Obtener todos los cursos (Filtrado por auditoría y estado)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const estado = searchParams.get("estado");

    if (id) {
      const curso = await prisma.curso.findFirst({
        where: { id, deletedAt: null },
        include: {
          departamento: true,
          categoria: true,
          inscripciones: {
            where: { deletedAt: null },
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
      let whereClause: any = { deletedAt: null };

      if (estado === "activos") {
        whereClause.activo = true;
      } else if (estado === "inactivos") {
        whereClause.activo = false;
      } else if (estado !== "todos") {
        whereClause.activo = true;
      }

      const cursos = await prisma.curso.findMany({
        where: whereClause,
        include: {
          departamento: true,
          categoria: true,
          _count: { 
            select: { 
              inscripciones: { where: { deletedAt: null } } 
            } 
          },
        },
        orderBy: { createdAt: "desc" }
      });

      const adaptados = cursos.map((c) => ({
        ...c,
        cupos: c._count.inscripciones,
      }));

      return NextResponse.json(adaptados);
    }
  } catch (error) {
    console.error("❌ Error obteniendo cursos:", error);
    return NextResponse.json({ error: "Error al obtener cursos" }, { status: 500 });
  }
}

// ✅ POST - Crear un curso con auditoría y Nuevos Campos
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
      activo = true,
      // 🆕 Nuevos campos recibidos del front
      duracion,
      semestre,
      modalidad,
      fechaInicio,
      fechaFin
    } = body;

    if (!categoriaId) {
      return NextResponse.json({ error: "categoriaId es obligatorio" }, { status: 400 });
    }

    const nuevoCurso = await prisma.$transaction(async (tx) => {
      return await tx.curso.create({
        data: {
          nombre,
          descripcion: descripcion || "",
          codigo,
          nivel: nivel || "General",
          tipo: tipo || "Curso",
          ano: Number(ano),
          departamentoId: String(departamentoId),
          instructor: instructor ? String(instructor) : undefined,
          categoriaId: String(categoriaId),
          activo: Boolean(activo),
          // 🆕 Guardado de nuevos campos
          duracion: duracion ? Number(duracion) : null,
          semestre: semestre ? Number(semestre) : null,
          modalidad: modalidad || null,
          fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          createdById: requesterId,
          updatedById: requesterId,
          inscripciones: {
            // ✅ CORRECCIÓN: Accedemos a .userId porque ahora viene como objeto
            create: docentesInscritos.map((d: any) => ({ 
              userId: typeof d === 'string' ? d : d.userId, 
              estado: typeof d === 'string' ? "INSCRITO" : (d.estado || "INSCRITO"),
              createdById: requesterId 
            })),
          },
        },
        include: {
          departamento: true,
          inscripciones: { include: { usuario: true } },
        },
      });
    }, {
      timeout: 20000 
    });

    return NextResponse.json(nuevoCurso, { status: 201 });
  } catch (error) {
    console.error("❌ Error creando curso:", error);
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 });
  }
}

// ✅ PUT - Actualizar curso con Nuevos Campos
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || req.url.split('/').pop();

    if (!id || id.includes('route')) {
      return NextResponse.json({ error: "ID del curso no válido" }, { status: 400 });
    }

    const body = await req.json();
    const {
      nombre,
      descripcion,
      codigo,
      nivel,
      tipo,
      ano,
      activo,
      categoriaId,
      departamentoId,
      docentesInscritos = [],
      // 🆕 Nuevos campos
      duracion,
      semestre,
      modalidad,
      fechaInicio,
      fechaFin
    } = body;

    const cursoFinal = await prisma.$transaction(async (tx) => {
      await tx.curso.update({
        where: { id },
        data: {
          nombre,
          descripcion,
          codigo,
          nivel,
          tipo,
          activo: activo !== undefined ? Boolean(activo) : undefined,
          ano: Number(ano),
          categoriaId,
          departamentoId,
          // 🆕 Actualización de nuevos campos
          duracion: duracion ? Number(duracion) : null,
          semestre: semestre ? Number(semestre) : null,
          modalidad: modalidad || null,
          fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
          fechaFin: fechaFin ? new Date(fechaFin) : null,
          updatedById: requesterId,
        },
      });

      const inscripcionesActuales = await tx.inscripcionCurso.findMany({
        where: { cursoId: id, deletedAt: null },
      });

      const nuevosIds = docentesInscritos.map((d: any) => (typeof d === 'string' ? d : d.userId));
      const eliminados = inscripcionesActuales.filter(
        (i) => !nuevosIds.includes(i.userId)
      );

      if (eliminados.length > 0) {
        await tx.inscripcionCurso.updateMany({
          where: { id: { in: eliminados.map((e) => e.id) } },
          data: { deletedAt: new Date(), deletedById: requesterId },
        });
      }

      for (const d of docentesInscritos) {
        const userId = typeof d === 'string' ? d : d.userId;
        const estadoInsc = typeof d === 'string' ? "INSCRITO" : (d.estado || "INSCRITO");

        await tx.inscripcionCurso.upsert({
          where: { userId_cursoId: { userId, cursoId: id } },
          update: { 
            estado: estadoInsc, 
            deletedAt: null,
            updatedById: requesterId 
          },
          create: { 
            userId, 
            cursoId: id, 
            estado: estadoInsc, 
            createdById: requesterId 
          }
        });
      }

      return await tx.curso.findUnique({
        where: { id },
        include: {
          departamento: true,
          categoria: true,
          inscripciones: {
            where: { deletedAt: null },
            include: { usuario: true },
          },
        },
      });
    }, {
      timeout: 20000 
    });

    return NextResponse.json(cursoFinal);
  } catch (error) {
    console.error("❌ Error al actualizar curso:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ✅ DELETE - Borrado Lógico
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      await tx.inscripcionCurso.updateMany({
        where: { cursoId: id, deletedAt: null },
        data: { deletedAt: new Date(), deletedById: requesterId }
      });

      await tx.curso.update({
        where: { id },
        data: { 
          deletedAt: new Date(), 
          deletedById: requesterId,
          activo: false 
        }
      });
    }, {
      timeout: 10000
    });

    return NextResponse.json({ message: "Curso eliminado lógicamente" });
  } catch (error) {
    console.error("❌ Error al eliminar:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
}