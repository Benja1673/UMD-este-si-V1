// app/api/servicios-disponibles/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener servicios disponibles para el usuario actual
export async function GET(req: Request) {
  try {
    // Obtener sesión del usuario
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get("tipo"); // SISTEMA, CAPACITACION, EVALUACION, CERTIFICADO

    if (!tipo) {
      return NextResponse.json({ error: "Tipo de servicio es requerido" }, { status: 400 });
    }

    console.log(`🔍 Buscando servicios tipo: ${tipo} para usuario: ${session.user.email}`);

    // 1️⃣ Obtener servicios del tipo solicitado (FILTRANDO ELIMINADOS)
    let servicios: any[] = [];

    if (tipo === "SISTEMA" || tipo === "CAPACITACION") {
      const modalidad = tipo === "SISTEMA" ? "sistema" : "capacitacion";
      servicios = await prisma.capacitacion.findMany({
        where: { 
          modalidad,
          deletedAt: null // 🛡️ Solo servicios no eliminados
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          ubicacion: true,
        },
      });
    } else if (tipo === "EVALUACION") {
      servicios = await prisma.evaluacion.findMany({
        where: { 
          activa: true,
          deletedAt: null // 🛡️ Solo evaluaciones no eliminadas
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    } else if (tipo === "CERTIFICADO") {
      servicios = await prisma.certificado.findMany({
        where: { 
          activo: true,
          deletedAt: null // 🛡️ Solo certificados no eliminados
        },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    }

    console.log(`📊 Total de servicios ${tipo} (activos): ${servicios.length}`);

    // 2️⃣ Obtener inscripciones del usuario (FILTRANDO ELIMINADAS)
    const inscripciones = await prisma.inscripcionCurso.findMany({
      where: { 
        userId: session.user.id,
        deletedAt: null // 🛡️ Solo inscripciones vigentes
      },
      select: { 
        cursoId: true, 
        estado: true,
        curso: {
          select: {
            nombre: true
          }
        }
      },
    });

    // 3️⃣ Filtrar servicios según condiciones
    const serviciosDisponibles = [];

    for (const servicio of servicios) {
      // Obtener condiciones del servicio (FILTRANDO ELIMINADAS)
      const condiciones = await prisma.condicionServicio.findMany({
        where: {
          servicioId: servicio.id,
          servicioTipo: tipo,
          deletedAt: null // 🛡️ Solo condiciones vigentes
        },
        include: {
          curso: {
            select: {
              nombre: true
            }
          }
        }
      });

      // ✅ CASO 1: Si no tiene condiciones, está disponible para todos
      if (condiciones.length === 0) {
        serviciosDisponibles.push(servicio);
        continue;
      }

      // ✅ CASO 2: Si tiene una condición GENERAL, está disponible para todos
      const tieneCondicionGeneral = condiciones.some(c => c.esGeneral === true);
      if (tieneCondicionGeneral) {
        serviciosDisponibles.push(servicio);
        continue;
      }

      // ✅ CASO 3: Verificar si el usuario cumple AL MENOS UNA condición específica (OR lógico)
      const cumpleCondicion = condiciones.some(condicion => {
        return inscripciones.some(
          insc =>
            insc.cursoId === condicion.cursoId &&
            insc.estado === condicion.estadoRequerido
        );
      });

      if (cumpleCondicion) {
        serviciosDisponibles.push(servicio);
      }
    }

    console.log(`\n📊 Servicios ${tipo} finales para el usuario: ${serviciosDisponibles.length}`);

    return NextResponse.json(serviciosDisponibles);
  } catch (error: any) {
    console.error("❌ Error obteniendo servicios disponibles:", error);
    return NextResponse.json(
      { error: "Error al obtener servicios", details: error.message },
      { status: 500 }
    );
  }
}