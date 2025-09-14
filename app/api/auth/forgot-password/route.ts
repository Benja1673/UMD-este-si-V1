import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" : "NO DEFINIDA");

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: "Correo requerido" }, { status: 400 })
    }

    // 1️⃣ Buscar usuario o docente
    const user = await prisma.user.findUnique({ where: { email } })
    //const docente = await prisma.docente.findUnique({ where: { email } })

    if (!user  ) {
      return NextResponse.json({ message: "El correo no está registrado" }, { status: 404 })
    }

    // 2️⃣ Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 3️⃣ Guardar en PasswordReset
    await prisma.passwordReset.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      },
    })

    // 4️⃣ Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // 5️⃣ Construir link hacia reset-password
    // Cambia 'https://miweb.com/reset-password' por la URL real de tu frontend
    const resetLink = `http://localhost:3000/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`

    // 6️⃣ Opciones de correo
    const mailOptions = {
      from: `"Soporte Plataforma" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperación de contraseña",
      text: `Tu código de recuperación es: ${code}\n\nHaz clic en este enlace para restablecer tu contraseña:\n${resetLink}`,
      html: `
        <p>Tu código de recuperación es: <b>${code}</b></p>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href="${resetLink}" target="_blank">Restablecer contraseña</a>
        <p>El código expira en 15 minutos.</p>
      `,
    }

    // 7️⃣ Enviar correo
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo enviado correctamente:", info.response)

    return NextResponse.json({ message: "Se envió el código al correo" })
  } catch (error: any) {
    console.error("Error en forgot-password:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}
