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

    // 1️⃣ Obtener servicios del tipo solicitado
    let servicios: any[] = [];

    if (tipo === "SISTEMA" || tipo === "CAPACITACION") {
      const modalidad = tipo === "SISTEMA" ? "sistema" : "capacitacion";
      servicios = await prisma.capacitacion.findMany({
        where: { modalidad },
        select: {
          id: true,
          titulo: true,
          descripcion: true,
          ubicacion: true,
        },
      });
    } else if (tipo === "EVALUACION") {
      servicios = await prisma.evaluacion.findMany({
        where: { activa: true }, // Solo evaluaciones activas
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    } else if (tipo === "CERTIFICADO") {
      servicios = await prisma.certificado.findMany({
        where: { activo: true }, // Solo certificados activos
        select: {
          id: true,
          titulo: true,
          descripcion: true,
        },
      });
    }

    console.log(`📊 Total de servicios ${tipo}: ${servicios.length}`);

    // 2️⃣ Obtener inscripciones del usuario con sus estados
    const inscripciones = await prisma.inscripcionCurso.findMany({
      where: { userId: session.user.id },
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

    console.log(`📚 Inscripciones del usuario:`, inscripciones.map(i => ({
      curso: i.curso.nombre,
      estado: i.estado
    })));

    // 3️⃣ Filtrar servicios según condiciones
    const serviciosDisponibles = [];

    for (const servicio of servicios) {
      // Obtener condiciones del servicio
      const condiciones = await prisma.condicionServicio.findMany({
        where: {
          servicioId: servicio.id,
          servicioTipo: tipo,
        },
        include: {
          curso: {
            select: {
              nombre: true
            }
          }
        }
      });

      console.log(`\n🔐 Verificando servicio: ${servicio.titulo}`);
      console.log(`   Condiciones encontradas: ${condiciones.length}`);

      // ✅ CASO 1: Si no tiene condiciones, está disponible para todos
      if (condiciones.length === 0) {
        console.log(`   ✅ Sin condiciones → Disponible para todos`);
        serviciosDisponibles.push(servicio);
        continue;
      }

      // ✅ CASO 2: Si tiene una condición GENERAL, está disponible para todos
      const tieneCondicionGeneral = condiciones.some(c => c.esGeneral === true);
      if (tieneCondicionGeneral) {
        console.log(`   ✅ Condición GENERAL → Disponible para todos`);
        serviciosDisponibles.push(servicio);
        continue;
      }

      // ✅ CASO 3: Verificar si el usuario cumple AL MENOS UNA condición específica (OR lógico)
      const cumpleCondicion = condiciones.some(condicion => {
        // Buscar si el usuario tiene inscripción en este curso con el estado requerido
        const tieneInscripcion = inscripciones.some(
          insc =>
            insc.cursoId === condicion.cursoId &&
            insc.estado === condicion.estadoRequerido
        );

        if (tieneInscripcion) {
          console.log(`   ✅ Cumple condición: ${condicion.curso?.nombre} (${condicion.estadoRequerido})`);
        } else {
          console.log(`   ❌ No cumple: ${condicion.curso?.nombre} (requiere: ${condicion.estadoRequerido})`);
        }

        return tieneInscripcion;
      });

      if (cumpleCondicion) {
        console.log(`   ✅ Usuario cumple al menos una condición → DISPONIBLE`);
        serviciosDisponibles.push(servicio);
      } else {
        console.log(`   ❌ Usuario NO cumple ninguna condición → NO DISPONIBLE`);
      }
    }

    console.log(`\n📊 Servicios ${tipo} disponibles: ${serviciosDisponibles.length}/${servicios.length}`);
    console.log(`📋 Servicios disponibles:`, serviciosDisponibles.map(s => s.titulo));

    return NextResponse.json(serviciosDisponibles);
  } catch (error: any) {
    console.error("❌ Error obteniendo servicios disponibles:", error);
    return NextResponse.json(
      { error: "Error al obtener servicios", details: error.message },
      { status: 500 }
    );
  }
}