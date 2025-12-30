import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions, isAdminOrSupervisor } from "@/lib/auth"

// ✅ GET - Obtener solo departamentos activos (no eliminados)
export async function GET() {
  try {
    const deps = await prisma.departamento.findMany({
      where: {
        deletedAt: null // 🛡️ Filtro de borrado lógico
      },
      select: { id: true, nombre: true, codigo: true },
      orderBy: { nombre: "asc" },
    })
    return NextResponse.json(deps)
  } catch (error) {
    console.error("Error al traer departamentos:", error)
    return NextResponse.json({ error: "No se pudieron cargar los departamentos" }, { status: 500 })
  }
}

// ✅ POST - Crear departamento con auditoría
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    // BLINDAJE: solo Admin o Supervisor pueden crear departamentos
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
    }

    const requesterId = session.user.id
    const body = await req.json()
    const nombre = (body.nombre || "").trim()
    
    if (!nombre) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })

    // Verificar si ya existe uno (incluso si está inactivo, podríamos reactivarlo, 
    // pero por ahora buscamos uno que esté vivo)
    const existe = await prisma.departamento.findFirst({ 
      where: { nombre, deletedAt: null } 
    })
    if (existe) return NextResponse.json(existe, { status: 200 })

    const nuevo = await prisma.departamento.create({
      data: { 
        nombre, 
        codigo: body.codigo ?? null,
        // 📝 Registro de auditoría
        createdById: requesterId,
        updatedById: requesterId
      },
    })
    return NextResponse.json(nuevo, { status: 201 })
  } catch (error) {
    console.error("Error creando departamento:", error)
    return NextResponse.json({ error: "No se pudo crear departamento" }, { status: 500 })
  }
}

// ✅ PUT - Actualizar departamento con auditoría
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const requesterId = session.user.id
    const body = await req.json()
    const { id, nombre, codigo } = body

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const actualizado = await prisma.departamento.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        codigo: codigo?.trim(),
        updatedById: requesterId // 📝 Trazabilidad de quién editó
      }
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

// ✅ DELETE - Borrado Lógico (Soft Delete)
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const requesterId = session.user.id
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    // 🗑️ No borramos, marcamos como eliminado
    await prisma.departamento.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: requesterId
      }
    })

    return NextResponse.json({ message: "Departamento eliminado lógicamente" })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}