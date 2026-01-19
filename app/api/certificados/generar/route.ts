// app/api/certificados/generar/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";
import fs from "fs"; 
import path from "path"; 

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { certificadoId } = await req.json();

    if (!certificadoId) {
      return NextResponse.json({ error: "certificadoId es requerido" }, { status: 400 });
    }

    // 1. Obtener datos del usuario
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, apellido: true, rut: true, email: true }
    });

    if (!usuario) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    // 2. Obtener el certificado (servicio)
    const certificado = await prisma.certificado.findUnique({
      where: { id: certificadoId }
    });

    if (!certificado) return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });

    // 3. Obtener el curso vinculado mediante la tabla CondicionServicio
    const condicion = await prisma.condicionServicio.findFirst({
      where: {
        servicioId: certificadoId,
        servicioTipo: "CERTIFICADO",
        deletedAt: null
      },
      include: {
        curso: true 
      }
    });

    const curso = condicion?.curso;

    // 4. Variables para el documento
    const nombreCompleto = `${usuario.name || ''} ${usuario.apellido || ''}`.trim();
    const rut = usuario.rut || 'Sin RUT';
    const emailSolicitante = usuario.email || 'Sin correo';
    
    const nombreCurso = curso?.nombre || certificado.titulo;
    const semestre = curso?.semestre || 1;
    const anio = curso?.ano || new Date().getFullYear();
    const duracion = curso?.duracion || 0;
    const modalidad = curso?.modalidad || 'Virtual';

    // Cargar la imagen local en Base64 para que Puppeteer la procese correctamente
    let logoBase64 = "";
    try {
      const imagePath = path.join(process.cwd(), "public", "Logoutem-1.png");
      const imageBuffer = fs.readFileSync(imagePath);
      logoBase64 = `data:image/png;base64,${imageBuffer.toString("base64")}`;
    } catch (err) {
      console.error("No se pudo cargar el logo local:", err);
      logoBase64 = ""; // Fallback vacío
    }

    // 5. HTML Y CSS DEL NUEVO FORMATO (Con ajuste de firma más abajo)
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Constancia UTEM</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
        }

        .certificado {
            width: 216mm;
            height: 279mm;
            background-color: #fff;
            /* Ajustado: Menos padding inferior (1.5cm) para permitir que la firma baje más */
            padding: 2.5cm 2cm 1.5cm 2cm;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            color: #000;
            margin: 0 auto;
        }

        /* Marca de Agua */
        .watermark-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 70%;
            height: auto;
            z-index: 0;
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .watermark-image {
            width: 100%;
            opacity: 0.15; 
        }

        .contenido-visible {
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        /* Encabezado */
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        .logo {
            width: 80px;
            height: auto;
        }

        .header-separator {
            width: 1px;
            height: 45px;
            background-color: #005596;
            margin: 0 15px;
        }

        .header-text {
            font-family: Arial, sans-serif;
            color: #005596;
            display: flex;
            flex-direction: column;
        }

        .header-text .unidad {
            font-weight: bold;
            font-size: 0.9em;
        }

        .header-text .direccion {
            font-size: 0.65em;
            text-transform: uppercase;
            color: #668bad;
            margin-top: 2px;
        }

        .titulo-constancia {
            text-align: center;
            font-size: 1.8em;
            font-weight: 900;
            margin-bottom: 20px;
            text-transform: uppercase;
        }

        .cuerpo {
            text-align: center;
            font-size: 1.1em;
            line-height: 1.6;
        }

        .cuerpo p {
            margin: 10px 0;
        }

        .nombre-persona {
            font-size: 1.1em;
            margin: 20px 0 !important;
        }

        .nombre-persona strong {
            font-weight: bold;
            text-transform: uppercase;
        }

        .run-label {
            margin-left: 10px;
            font-weight: normal;
        }

        .curso-nombre {
            color: #005596; 
            font-size: 1.4em;
            font-weight: bold;
            text-transform: uppercase;
            margin: 25px auto;
            max-width: 90%;
            line-height: 1.3;
        }

        .detalles {
            font-size: 1em;
        }

        .modalidad {
            text-transform: uppercase;
        }

        .texto-cierre {
            margin-top: 40px !important;
            font-size: 0.95em;
        }

        .atentamente {
            margin-top: 30px !important;
        }

        /* Pie de página y Firma - Ajustado para estar más abajo */
        .footer {
            display: flex;             
            justify-content: center;
            width: 100%;
            /* Empuja todo el bloque hacia abajo */
            margin-top: auto; 
            /* Eliminado padding-bottom para ganar espacio hacia abajo */
            padding-bottom: 0;
        }

        .firma-bloque {
            text-align: center;
            width: 300px;
            /* La línea de firma */
            border-top: 2px solid #000; 
            padding-top: 10px;
        }

        .nombre-director {
            font-weight: bold;
            font-size: 1.1em;
            margin: 0;
            color: #000;
        }

        .cargo-director {
            margin: 5px 0 0 0;
            font-size: 0.9em;
            color: #000;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>

    <div class="certificado">
        
        <div class="watermark-container">
            <img src="${logoBase64}" alt="" class="watermark-image">
        </div>

        <div class="contenido-visible">
            
            <header class="header">
                <img src="${logoBase64}" alt="Logo UTEM" class="logo"> 
                <div class="header-separator"></div>
                <div class="header-text">
                    <span class="unidad">Unidad de<br>Mejoramiento Docente</span>
                    <span class="direccion">DIRECCIÓN GENERAL DE DOCENCIA</span>
                </div>
            </header>

            <h1 class="titulo-constancia">C O N S T A N C I A</h1>

            <main class="cuerpo">
                <p>Se otorga la presente constancia al Sr (a).</p>

                <p class="nombre-persona">
                    <strong>${nombreCompleto}</strong> <span class="run-label">RUN:</span> <strong>${rut}</strong>,
                </p>

                <p>por su aprobación de la instancia</p>

                <div class="curso-nombre">
                    ${nombreCurso}
                </div>

                <div class="detalles">
                    <p>realizada en el ${semestre}° semestre del año académico ${anio},</p>
                    <p>Dicha instancia tuvo un total de <strong>${duracion}</strong> horas cronológicas, y fue realizada en</p>
                    <p>modalidad <strong class="modalidad">${modalidad}</strong></p>
                </div>

                <p class="texto-cierre">
                    Se extiende la presente constancia para conocimiento y fines pertinentes.
                </p>

                <p class="atentamente">Atentamente,</p>
            </main>

            <footer class="footer">
                <div class="firma-bloque">
                    <p class="nombre-director">Director de Docencia</p>
                    <p class="cargo-director">Universidad Tecnológica Metropolitana</p>
                </div>
            </footer>
        </div>
    </div>

</body>
</html>
    `;

    // 6. LÓGICA DEL NAVEGADOR PARA GENERAR EL BUFFER DEL PDF
    let browser;
    const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

    if (isVercel) {
      const chromium = require('@sparticuz/chromium');
      const puppeteerCore = require('puppeteer-core');
      chromium.setGraphicsMode = false;
      
      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });

    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
    });

    await browser.close();

    // 7. ENVÍO DE CORREO A UMD
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "proyectoumd@gmail.com", 
      subject: `Solicitud de Firma de Certificado: ${nombreCompleto}`,
      text: `${nombreCompleto}, rut ${rut}, con correo ${emailSolicitante}, ha solicitado este certificado de ${nombreCurso}. Está pendiente a firma.`,
      attachments: [
        {
          filename: `Certificado_${nombreCompleto.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: "Certificado solicitado correctamente." 
    });

  } catch (error: any) {
    console.error("Error FATAL generando/enviando certificado:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud de certificado", details: error.message },
      { status: 500 }
    );
  }
}