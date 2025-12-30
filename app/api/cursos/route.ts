import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";

// ✅ GET - Obtener todos los cursos (Filtrado por auditoría y estado)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const estado = searchParams.get("estado"); // 'activos', 'inactivos', 'todos'

    if (id) {
      // 🔹 Caso 1: Obtener un curso específico (que no esté eliminado)
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
      // 🔹 Caso 2: Obtener lista de cursos
      // 🛡️ Siempre filtramos para no traer lo que fue borrado lógicamente (deletedAt)
      let whereClause: any = { deletedAt: null };

      // 💡 Lógica de filtrado por estado activo/inactivo corregida
      if (estado === "activos") {
        whereClause.activo = true;
      } else if (estado === "inactivos") {
        whereClause.activo = false;
      } else if (estado === "todos") {
        // 🚀 Si es "todos", NO añadimos el filtro 'activo' al objeto whereClause.
        // Esto le dice a Prisma: "trae todos los que tengan deletedAt: null, sin importar si activo es true o false".
      } else {
        // Por seguridad, si el frontend no envía ningún parámetro (?estado=...), 
        // mandamos solo los activos por defecto.
        whereClause.activo = true;
      }

      console.log("🔍 Aplicando filtro de búsqueda:", whereClause); // Para debug en consola

      const cursos = await prisma.curso.findMany({
        where: whereClause,
        include: {
          departamento: true,
          categoria: true, // Incluimos la categoría para que la tabla tenga info completa
          _count: { 
            select: { 
              inscripciones: { where: { deletedAt: null } } 
            } 
          },
        },
        orderBy: { createdAt: "desc" } // Opcional: mostrar los más nuevos primero
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

// ✅ POST - Crear un curso con auditoría
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
      activo = true // Valor por defecto si no viene en el body
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
        activo: Boolean(activo),
        // 📝 Auditoría
        createdById: requesterId,
        updatedById: requesterId,
        inscripciones: {
          create: docentesInscritos.map((userId: string) => ({ 
            userId, 
            createdById: requesterId 
          })),
        },
      },
      include: {
        departamento: true,
        inscripciones: { include: { usuario: true } },
      },
    });

    return NextResponse.json(nuevoCurso, { status: 201 });
  } catch (error) {
    console.error("❌ Error creando curso:", error);
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 });
  }
}

// ✅ PUT - Actualizar curso con auditoría y campo activo
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 });
    }

    const requesterId = session.user.id;
    const url = new URL(req.url);
    const id = url.searchParams.get("id") || req.url.split('/').pop(); // Intenta sacar el ID de query o de la ruta

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
      activo, // Se permite actualizar el estado activo/inactivo
      categoriaId,
      departamentoId,
      docentesInscritos = [],
      inscripciones = [],
    } = body;

    // 1. Actualizar datos base del curso con auditoría
    const cursoActualizado = await prisma.curso.update({
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
        updatedById: requesterId,
      },
    });

    // 2. Gestionar inscripciones (Soft Delete para las quitadas)
    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({
      where: { cursoId: id, deletedAt: null },
    });

    const nuevosIds = docentesInscritos.map((d: any) => (typeof d === 'string' ? d : d.userId));
    const eliminados = inscripcionesActuales.filter(
      (i) => !nuevosIds.includes(i.userId)
    );

    if (eliminados.length > 0) {
      await prisma.inscripcionCurso.updateMany({
        where: { id: { in: eliminados.map((e) => e.id) } },
        data: { deletedAt: new Date(), deletedById: requesterId },
      });
    }

    // 3. Crear nuevas o actualizar existentes
    for (const d of docentesInscritos) {
      const userId = typeof d === 'string' ? d : d.userId;
      const estadoInsc = typeof d === 'string' ? "INSCRITO" : (d.estado || "INSCRITO");

      await prisma.inscripcionCurso.upsert({
        where: { userId_cursoId: { userId, cursoId: id } },
        update: { 
          estado: estadoInsc, 
          deletedAt: null, // Si estaba borrado, lo recuperamos
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

    const cursoFinal = await prisma.curso.findUnique({
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

    return NextResponse.json(cursoFinal);
  } catch (error) {
    console.error("❌ Error al actualizar curso:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ✅ DELETE - Borrado Lógico (Soft Delete)
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

    // Soft delete: curso e inscripciones asociadas
    await prisma.inscripcionCurso.updateMany({
      where: { cursoId: id, deletedAt: null },
      data: { deletedAt: new Date(), deletedById: requesterId }
    });

    await prisma.curso.update({
      where: { id },
      data: { 
        deletedAt: new Date(), 
        deletedById: requesterId,
        activo: false 
      }
    });

    return NextResponse.json({ message: "Curso eliminado lógicamente" });
  } catch (error) {
    console.error("❌ Error al eliminar:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
}