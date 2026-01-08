// app/api/user/profile.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Verificación de sesión
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Buscamos al usuario y sus inscripciones en una sola consulta eficiente
    const userDb = await prisma.user.findUnique({
      where: { 
        email: session.user.email 
      },
      select: {
        id: true,
        nivelActual: true,
        inscripciones: {
          where: { deletedAt: null },
          select: { cursoId: true } // Solo traemos el ID para optimizar memoria
        }
      },
    });

    if (!userDb) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 3. Extraemos los IDs de los cursos donde ya está inscrito
    const inscritosIds = userDb.inscripciones.map((ins) => ins.cursoId);

    // 4. Buscamos cursos disponibles (No eliminados y No inscritos)
    const cursosDisponibles = await prisma.curso.findMany({
      where: {
        deletedAt: null,
        // Si no tiene inscripciones, el 'notIn' se ignora y trae todos los activos
        id: {
          notIn: inscritosIds
        }
      },
      orderBy: { 
        nombre: "asc" 
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        categoriaId: true,
        nivel: true,
      },
    });

    // 5. Respuesta estructurada para el frontend
    return NextResponse.json({
      nivelActual: userDb.nivelActual || "SIN_NIVEL",
      cursosDisponibles: cursosDisponibles
    });
    
  } catch (error) {
    console.error(" Error detallado en /api/user/profile:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" }, 
      { status: 500 }
    );
  }
}