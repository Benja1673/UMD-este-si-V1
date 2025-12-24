import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions, isAdminOrSupervisor } from "@/lib/auth"

export async function GET() {
  try {
    const deps = await prisma.departamento.findMany({
      select: { id: true, nombre: true, codigo: true },
      orderBy: { nombre: "asc" },
    })
    return NextResponse.json(deps)
  } catch (error) {
    console.error("Error al traer departamentos:", error)
    return NextResponse.json({ error: "No se pudieron cargar los departamentos" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // BLINDAJE: solo Admin o Supervisor pueden crear departamentos
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos para crear departamentos" }, { status: 403 })
    }

    const body = await req.json()
    const nombre = (body.nombre || "").trim()
    if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

    const existe = await prisma.departamento.findFirst({ where: { nombre } })
    if (existe) return NextResponse.json(existe, { status: 200 })

    const nuevo = await prisma.departamento.create({
      data: { nombre, codigo: body.codigo ?? null },
    })
    return NextResponse.json(nuevo, { status: 201 })
  } catch (error) {
    console.error("Error creando departamento:", error)
    return NextResponse.json({ error: "No se pudo crear departamento" }, { status: 500 })
  }
}