// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// ✅ Aumento de timeout de ejecución para entornos Serverless (Vercel)
// Esto es crucial para dar tiempo suficiente al envío del correo vía SMTP.
export const maxDuration = 60; 

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "****" : "NO DEFINIDA");

export async function POST(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: "Correo requerido" }, { status: 400 })
    }

    // ✅ Uso de transacción con timeout aumentado (20 segundos) para las operaciones de BD
    const resetData = await prisma.$transaction(async (tx) => {
      // 1️⃣ Buscar usuario o docente
      const user = await tx.user.findUnique({ where: { email } })

      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      // 2️⃣ Generar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // 3️⃣ Guardar en PasswordReset
      await tx.passwordReset.create({
        data: {
          email,
          code,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
        },
      })

      return { code };
    }, {
      timeout: 20000 // Solución al error de Interactive Transaction timeout
    });

    const { code } = resetData;

    // 4️⃣ Configurar Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    // 5️⃣ Construir link hacia reset-password de forma dinámica
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`

    // 6️⃣ Opciones de correo
    const mailOptions = {
      from: `"Soporte Plataforma" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Recuperación de contraseña",
      text: `Tu código de recuperación es: ${code}\n\nHaz clic en este enlace para restablecer tu contraseña:\n${resetLink}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Recuperación de Contraseña</h2>
          <p>Has solicitado restablecer tu contraseña para la plataforma UMD.</p>
          <p>Tu código de recuperación es: <b style="font-size: 1.2em; color: #2563eb;">${code}</b></p>
          <p>Haz clic en el siguiente botón para continuar con el proceso:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" 
               target="_blank" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
               Restablecer mi contraseña
            </a>
          </div>
          <p style="font-size: 0.9em; color: #666;">Este enlace y código expirarán en 15 minutos.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 0.8em; color: #999;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        </div>
      `,
    }

    // 7️⃣ Enviar correo
    const info = await transporter.sendMail(mailOptions)
    console.log("Correo enviado correctamente:", info.response)

    return NextResponse.json({ message: "Se envió el código al correo" })
  } catch (error: any) {
    if (error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ message: "El correo no está registrado" }, { status: 404 })
    }
    console.error("Error en forgot-password:", error)
    return NextResponse.json({ message: error.message || "Error interno" }, { status: 500 })
  }
}