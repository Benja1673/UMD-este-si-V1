import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json()

    // 1. Verificar que el código de reseteo sea válido
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        email,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { message: "Código inválido o expirado" },
        { status: 400 }
      )
    }

    // 2. Buscar al usuario por email
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // 3. Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // 4. Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    })

    // 5. Marcar el código como usado
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    })

    return NextResponse.json({
      message: "Contraseña actualizada con éxito",
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { message: "Error interno" },
      { status: 500 }
    )
  }
}
