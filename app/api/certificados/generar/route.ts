import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

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

    // Obtener datos del usuario
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        apellido: true,
        rut: true,
      }
    });

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Obtener datos del certificado
    const certificado = await prisma.certificado.findUnique({
      where: { id: certificadoId }
    });

    if (!certificado) {
      return NextResponse.json({ error: "Certificado no encontrado" }, { status: 404 });
    }

    // Buscar el curso relacionado
    const curso = await prisma.curso.findFirst({
      where: {
        nombre: {
          contains: certificado.titulo
        }
      },
      include: {
        departamento: true
      }
    });

    // Datos para el certificado
    const nombreCompleto = `${usuario.name || ''} ${usuario.apellido || ''}`.trim();
    const rut = usuario.rut || 'Sin RUT';
    const nombreCurso = curso?.nombre || certificado.titulo;
    const semestre = curso?.semestre || 1;
    const anio = curso?.ano || new Date().getFullYear();
    const duracion = curso?.duracion || 0;
    const modalidad = curso?.modalidad || 'Virtual';

    // Fecha actual
    const fechaActual = new Date();
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                   'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dia = fechaActual.getDate();
    const mes = meses[fechaActual.getMonth()];
    const anioEmision = fechaActual.getFullYear();

    // HTML del certificado (el mismo que antes)
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CONSTANCIA CURSO UTEM</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif; 
            margin: 0;
            padding: 0;
            background-color: #ffffff; 
        }
        .certificado-a4 {
            width: 210mm; 
            height: 297mm; 
            margin: 0;
            padding: 0; 
            box-sizing: border-box;
            background-color: #ffffff;
            position: relative;
        }
        .header {
            text-align: center;
            color: #ffffff;
            background-color: #00688B; 
            padding: 40px 0 20px 0;
            position: relative;
        }
        .utem-nombre {
            font-size: 1.2em;
            font-weight: bold;
            margin: 5px 0 5px 0;
            letter-spacing: 5px;
        }
        .universidad-nombre {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 2.2em;
            line-height: 1.1;
            font-weight: bold;
            margin: 5px 0;
            letter-spacing: 1px;
        }
        .estado-chile {
            font-size: 1.0em;
            font-style: italic;
            margin: 10px 0 0 0;
            padding-bottom: 20px;
        }
        .contenido {
            padding: 40px 50px 20px 50px; 
            text-align: center;
            color: #333;
        }
        .titulo-constancia {
            font-size: 2.5em;
            font-weight: bold;
            color: #000;
            margin: 0 0 40px 0; 
            display: block;
        }
        .texto-general {
            font-size: 1.0em;
            line-height: 1.6;
            margin-bottom: 15px;
            text-align: center;
        }
        .datos-persona, .nombre-curso {
            font-size: 1.1em;
            color: #000;
            margin: 10px 0 20px 0; 
            padding: 5px 0;
            font-weight: bold; 
        }
        .nombre-curso {
            font-style: normal; 
            font-size: 1.2em; 
        }
        .footer {
            position: absolute;
            bottom: 50px; 
            left: 50px;
            right: 50px;
            text-align: center;
            color: #333;
        }
        .atentamente {
            font-size: 1.0em;
            margin: 50px 0 80px 0; 
            text-align: center; 
            display: block;
        }
        .firma-container {
            width: 100%; 
            text-align: center;
            margin-bottom: 0;
        }
        .nombre-director {
            font-size: 1.0em;
            font-weight: bold;
            margin: 0;
        }
        .cargo-director {
            font-size: 1.0em;
            margin: 5px 0 0 0;
        }
        .fecha-emision {
            font-size: 0.8em; 
            margin-top: 50px;
            text-align: right; 
            font-weight: normal;
        }
    </style>
</head>
<body>
    <div class="certificado-a4">
        <div class="header">
            <h1 class="utem-nombre">UTEM</h1>
            <h2 class="universidad-nombre">UNIVERSIDAD<br>TECNOLÓGICA<br>METROPOLITANA</h2>
            <p class="estado-chile">del Estado de Chile</p>
        </div>
        <div class="contenido">
            <h3 class="titulo-constancia">CONSTANCIA</h3>
            <p class="texto-general">Se otorga la presente constancia al Sr (a).</p>
            <p class="datos-persona"><strong>${nombreCompleto}, RUN: ${rut},</strong></p>
            <p class="texto-general">por su aprobación de la instancia</p>
            <p class="nombre-curso"><strong>${nombreCurso},</strong></p>
            <p class="texto-general">realizada en el ${semestre}° semestre del año académico ${anio}.</p>
            <p class="texto-general">Dicha instancia tuvo un total de ${duracion} horas cronológicas, y fue realizada en modalidad ${modalidad}.</p>
            <p class="texto-general" style="margin-top: 30px;">Se extiende la presente constancia para conocimiento y fines pertinentes.</p>
        </div>
        <div class="footer">
            <p class="atentamente">Atentamente,</p>
            <div class="firma-container">
                <p class="nombre-director"><strong>Director de Docencia</strong></p>
                <p class="cargo-director">Universidad Tecnológica Metropolitana</p>
            </div>
            <p class="fecha-emision"><strong>Santiago, ${dia} de ${mes} de ${anioEmision}</strong></p>
        </div>
    </div>
</body>
</html>
    `;

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
    });

    await browser.close();

    // Convertir a Buffer
    const buffer = Buffer.from(pdfBuffer);

    // Devolver el PDF
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificado_${nombreCompleto.replace(/\s+/g, '_')}.pdf"`
      }
    });

  } catch (error: any) {
    console.error("Error generando certificado:", error);
    return NextResponse.json(
      { error: "Error al generar certificado", details: error.message },
      { status: 500 }
    );
  }
}