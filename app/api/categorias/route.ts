import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    });
    return NextResponse.json(categorias, { status: 200 });
  } catch (error) {
    console.error("Error al traer categorías:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar las categorías" },
      { status: 500 }
    );
  }
}