// test-email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config(); // carga variables del .env

async function testEmail() {
  try {
    // 1. Configurar el transporter con Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // tu correo
        pass: process.env.EMAIL_PASS, // tu App Password
      },
    });

    // 2. Configurar el correo
    const mailOptions = {
      from: `"Soporte Plataforma" <${process.env.EMAIL_USER}>`, // de quién
      to: "benja1673b@gmail.com", // a dónde quieres enviar la prueba
      subject: "Test correo desde Node.js", // asunto
      text: "¡Hola! Este es un correo de prueba para Nodemailer.", // contenido
    };

    // 3. Enviar el correo
    const info = await transporter.sendMail(mailOptions);

    console.log("Correo enviado correctamente:", info.response);
  } catch (error) {
    console.error("Error al enviar correo:", error);
  }
}

testEmail();
