import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departamentos = await prisma.departamento.findMany({
      select: { id: true, nombre: true, codigo: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(departamentos, { status: 200 });
  } catch (error) {
    console.error("Error al traer departamentos:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los departamentos" },
      { status: 500 }
    );
  }
}