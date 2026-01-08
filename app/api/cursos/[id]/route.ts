// app/api/cursos/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";
// ✅ IMPORTACIÓN DE TU LÓGICA CORREGIDA
import { actualizarNivelDocente } from "@/lib/nivel-logic";

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
        where: { id, deletedAt: null }, // 🛡️ Filtro Soft Delete del curso
        include: {
          departamento: true,
          categoria: true,
          inscripciones: {
            where: { 
              deletedAt: null, // 🛡️ Filtro Soft Delete de la inscripción
              estado: { not: "NO_INSCRITO" } // ✅ Estándar: Los desinscritos no aparecen en la lista activa
            },
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
      // 🔹 Obtener todos los cursos activos para la lista general
      const cursos = await prisma.curso.findMany({
        where: { deletedAt: null }, // 🛡️ Filtro Soft Delete del curso
        include: {
          departamento: true,
          categoria: true,
          _count: { 
            select: { 
              inscripciones: { 
                // ✅ Solo contamos cupos para estados reales (INSCRITO, APROBADO, REPROBADO)
                where: { 
                  estado: { in: ["INSCRITO", "APROBADO", "REPROBADO"] },
                  deletedAt: null
                } 
              } 
            } 
          },
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

    // ✅ SINCRONIZACIÓN DE NIVELES (Para nuevos inscritos)
    for (const d of docentesInscritos) {
      await actualizarNivelDocente(d.userId).catch(e => console.error("Error nivel:", e));
    }

    return NextResponse.json(nuevoCurso, { status: 201 });
  } catch (error) {
    console.error("Error creando curso:", error);
    return NextResponse.json({ error: "Error al crear curso" }, { status: 500 });
  }
}

// ✅ PUT - Actualizar curso con Auditoría, Sincronización de Estados y Timeout ampliado
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
      activo, 
      categoriaId,
      departamentoId,
      docentesInscritos = [],
    } = body;

    // 🚀 Optimización: Verificaciones iniciales fuera de la transacción para ahorrar tiempo
    const cursoBase = await prisma.curso.findFirst({ where: { id: cursoId, deletedAt: null } });
    if (!cursoBase) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const inscripcionesActuales = await prisma.inscripcionCurso.findMany({ where: { cursoId } });

    const nuevosUserIds = docentesInscritos.map((d: any) => d.userId);
    
    const inscripcionesADesactivar = inscripcionesActuales.filter(
      (i) => !nuevosUserIds.includes(i.userId) && i.estado !== "NO_INSCRITO"
    );
    
    const inscripcionesAActualizar = docentesInscritos.filter((d: any) => 
      inscripcionesActuales.some((i) => i.userId === d.userId)
    );

    const inscripcionesNuevas = docentesInscritos.filter((d: any) => 
      !inscripcionesActuales.some((i) => i.userId === d.userId)
    );

    // 🛡️ Aumentamos el timeout a 20 segundos (20000ms) para evitar cierres prematuros por carga masiva
    const cursoActualizado = await prisma.$transaction(async (tx) => {
      // 1️⃣ ✅ ESTÁNDAR: Los docentes removidos pasan a NO_INSCRITO
      for (const ins of inscripcionesADesactivar) {
        await tx.inscripcionCurso.update({
          where: { id: ins.id },
          data: { 
            estado: "NO_INSCRITO", 
            updatedById: requesterId 
          },
        });
      }

      // 2️⃣ Actualizar existentes o reactivar previos NO_INSCRITO
      for (const insData of inscripcionesAActualizar) {
        const existente = inscripcionesActuales.find((i) => i.userId === insData.userId);
        if (existente) {
          await tx.inscripcionCurso.update({
            where: { id: existente.id },
            data: {
              estado: insData.estado || "INSCRITO",
              // Sanitizamos la nota para evitar errores de tipo
              nota: insData.nota !== undefined ? (insData.nota === "" ? null : Number(insData.nota)) : null,
              fechaAprobacion: insData.estado === "APROBADO" ? new Date() : null,
              updatedById: requesterId,
            },
          });
        }
      }

      // 3️⃣ Crear registros para docentes nuevos en este curso
      for (const insData of inscripcionesNuevas) {
        await tx.inscripcionCurso.create({
          data: {
            cursoId,
            userId: insData.userId,
            estado: insData.estado || "INSCRITO",
            fechaInscripcion: new Date(),
            createdById: requesterId,
            updatedById: requesterId,
          },
        });
      }

      // 4️⃣ Actualizar los datos generales del curso
      return tx.curso.update({
        where: { id: cursoId },
        data: {
          nombre,
          descripcion,
          codigo,
          nivel,
          tipo,
          activo: activo !== undefined ? activo : undefined,
          ano: Number(ano),
          categoriaId,
          departamentoId,
          updatedById: requesterId,
        },
        include: {
          departamento: true,
          categoria: true,
          inscripciones: { 
            where: { estado: { not: "NO_INSCRITO" } }, // Ocultamos historial simbólico en el retorno
            include: { usuario: true } 
          },
        },
      });
    }, {
      timeout: 20000 // ✅ Solución definitiva al error de Interactive Transaction timeout
    });

    // ✅ MEJORA: RECALCULAR NIVELES EN LA BD PARA TODOS LOS USUARIOS AFECTADOS
    // Juntamos IDs de desactivados y actuales para asegurar que todos queden al día
    const idsParaSincronizar = Array.from(new Set([
      ...inscripcionesADesactivar.map(i => i.userId),
      ...nuevosUserIds
    ]));

    for (const uId of idsParaSincronizar) {
      await actualizarNivelDocente(uId).catch(err => console.error("Error sync nivel:", err));
    }

    return NextResponse.json(cursoActualizado);
  } catch (error) {
    console.error("❌ Error al actualizar curso:", error);
    return NextResponse.json({ 
      error: "Error al actualizar", 
      details: error instanceof Error ? error.message : "Error desconocido" 
    }, { status: 500 });
  }
}

// ✅ DELETE - Soft Delete (Borrado Lógico) del curso
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

    // 🗑️ Soft Delete: Registramos fecha y autor del borrado
    await prisma.curso.update({
      where: { id: cursoId },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId,
        activo: false, 
      },
    });

    return NextResponse.json({ message: "Curso eliminado correctamente (Soft Delete)" });
  } catch (error) {
    console.error("❌ Error al eliminar curso:", error);
    return NextResponse.json({ error: "No se pudo eliminar el curso" }, { status: 500 });
  }
}