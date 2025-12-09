// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs"; //
import nodemailer from "nodemailer"; //

// Helper function to generate a random temporary password
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to send email
async function sendTemporaryPasswordEmail(toEmail: string, temporaryPassword: string) {
  // Configuración del transporte de correo (asume variables de entorno EMAIL_USER/EMAIL_PASS)
  const transporter = nodemailer.createTransport({
    service: "gmail", // Asumido
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Credenciales de Acceso a la Plataforma UMD",
    html: `
      <p>Hola,</p>
      <p>Se ha creado o restablecido tu cuenta en la Plataforma UMD.</p>
      <p>Tu clave de acceso es: <strong>${temporaryPassword}</strong></p>
      <p>Por motivos de seguridad, te recomendamos encarecidamente cambiar esta contraseña.</p>
      <p>Para cambiar tu contraseña, por favor, haz lo siguiente:</p>
      <ol>
        <li>Ve a la página de inicio de sesión.</li>
        <li>Haz clic en <strong>"¿Olvidaste tu contraseña?"</strong> (o "Olvidar Contraseña").</li>
        <li>Sigue las instrucciones para establecer una nueva clave personal.</li>
      </ol>
      <p>¡Gracias!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✉️ Correo enviado a ${toEmail} con clave temporal.`);
  } catch (error) {
    console.error("❌ Error al enviar el correo con la clave temporal:", error);
    // Nota: En producción, se debería manejar el error de forma más robusta.
  }
}

// GET - Obtener docentes (con paginación opcional)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit");
    const search = searchParams.get("search");

    // Si NO hay parámetros de paginación, devuelve TODO (compatibilidad)
    if (!page && !limit) {
      const docentes = await prisma.user.findMany({
        where: { role: "docente" },
        select: {
          id: true,
          name: true,
          apellido: true,
          rut: true,
          email: true,
          telefono: true,
          especialidad: true,
          estado: true,
          departamento: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
          inscripciones: {
            select: {
              id: true,
              estado: true,
              fechaInscripcion: true,
              fechaAprobacion: true,
              fechaInicio: true,
              fechaFinalizacion: true,
              nota: true,
              observaciones: true,
              curso: {
                select: {
                  id: true,
                  nombre: true,
                  descripcion: true,
                  codigo: true,
                  nivel: true,
                  modalidad: true,
                  activo: true,
                },
              },
            },
          },
        },
        orderBy: { apellido: "asc" },
      });

      console.log(`📊 Total docentes encontrados: ${docentes.length}`);
      return NextResponse.json(docentes, { status: 200 });
    }

    // 🆕 CON PAGINACIÓN
    const pageNum = parseInt(page || "1");
    const limitNum = parseInt(limit || "50");
    const skip = (pageNum - 1) * limitNum;

    // Construir filtro de búsqueda
    const whereClause: any = { role: "docente" };
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { rut: { contains: search, mode: "insensitive" } },
      ];
    }

    // Contar total de docentes (para calcular páginas)
    const total = await prisma.user.count({ where: whereClause });

    // Obtener docentes paginados
    const docentes = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        apellido: true,
        rut: true,
        email: true,
        telefono: true,
        especialidad: true,
        estado: true,
        departamento: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        inscripciones: {
          select: {
            id: true,
            estado: true,
            fechaInscripcion: true,
            fechaAprobacion: true,
            fechaInicio: true,
            fechaFinalizacion: true,
            nota: true,
            observaciones: true,
            curso: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                codigo: true,
                nivel: true,
                modalidad: true,
                activo: true,
              },
            },
          },
        },
      },
      orderBy: { apellido: "asc" },
      skip: skip,
      take: limitNum,
    });

    console.log(`📊 Página ${pageNum}: ${docentes.length} de ${total} docentes`);

    return NextResponse.json({
      data: docentes,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Error al traer docentes:", error);
    return NextResponse.json(
      { error: "No se pudieron cargar los docentes" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo docente
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, apellido, rut, email, telefono, departamentoId, departamento, direccion, fechaNacimiento, especialidad, role } = body;
    // Se ignora la 'password' del body para forzar la clave temporal.

    // Validaciones básicas
    if (!nombre || !apellido || !rut || !email) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre, apellido, rut, email" },
        { status: 400 }
      );
    }

    // Verificar si el RUT o email ya existen
    const existente = await prisma.user.findFirst({
      where: {
        OR: [
          { rut: rut },
          { email: email }
         , telefono ? { telefono } : {}
        ].filter(Boolean)
      }
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un docente con ese RUT, email o teléfono" },
        { status: 409 }
      );
    }
    
    // 🔑 Generar y hashear la clave temporal (implementación según el requisito)
    const temporaryPassword = generateRandomPassword();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
    // ------------------------------------

    // Buscar el departamento si se proporciona su id o su nombre
    let departamentoIdFinal: string | null = null;
    if (departamentoId) {
      departamentoIdFinal = departamentoId
    } else if (departamento) {
      const dept = await prisma.departamento.findFirst({ where: { nombre: departamento }})
      departamentoIdFinal = dept?.id || null
    }

    // Crear el docente
    const nuevoDocente = await prisma.user.create({
      data: {
        name: nombre,
        apellido: apellido,
        rut: rut,
        email: email,
        telefono: telefono || null,
        hashedPassword: hashedPassword, // Usar la clave hasheada
        role: role || "docente",
        especialidad: especialidad || null,
        estado: "ACTIVO",
        departamentoId: departamentoIdFinal,
        direccion: direccion || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
      },
      include: {
        departamento: true,
        inscripciones: {
          include: {
            curso: true
          }
        }
      }
    });

    // ✉️ Enviar correo con la clave temporal
    await sendTemporaryPasswordEmail(email, temporaryPassword);
    // ------------------------------------

    console.log(`✅ Docente creado: ${nuevoDocente.name} ${nuevoDocente.apellido}`);
    return NextResponse.json(nuevoDocente, { status: 201 });
  } catch (error) {
    console.error("❌ Error al crear docente:", error);
    return NextResponse.json(
      { error: "No se pudo crear el docente" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un docente existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nombre, apellido, rut, email, telefono, departamentoId, departamento, direccion, fechaNacimiento, especialidad, estado, role, resetPassword } = body; // Añadir 'resetPassword'

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID del docente" },
        { status: 400 }
      );
    }

    // Verificar que el docente existe
    const docenteExistente = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true, hashedPassword: true, name: true, apellido: true }
    });

    if (!docenteExistente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      );
    }
    
    // --- Lógica de restablecimiento de contraseña en PUT ---
    let hashedPassword = docenteExistente.hashedPassword;
    let temporaryPassword = null;
    let emailChanged = email && email !== docenteExistente.email;
    
    // Se activa la generación de clave si se pide resetear O si se cambia el correo
    if (resetPassword || emailChanged) {
        temporaryPassword = generateRandomPassword();
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(temporaryPassword, salt);
    }
    // --------------------------------------------------------

    // Verificar si el RUT, email o telefono ya existen en otro docente
    if (rut || email || telefono) {
      const duplicado = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                rut ? { rut: rut } : {},
                email ? { email: email } : {},
               telefono ? { telefono: telefono } : {}
              ].filter(Boolean)
            }
          ]
        }
      });

      if (duplicado) {
        return NextResponse.json(
          { error: "Ya existe otro docente con ese RUT, email o teléfono" },
          { status: 409 }
        );
      }
    }

    // Buscar el departamento si se proporciona
    let departamentoIdFinal = undefined as string | null | undefined;
    if (departamentoId in body || departamentoId !== undefined) {
      // preferir departamentoId si se envía
      if (departamentoId !== undefined) {
        departamentoIdFinal = departamentoId || null
      } else if (departamento !== undefined) {
        if (departamento) {
          const dept = await prisma.departamento.findFirst({ where: { nombre: departamento }})
          departamentoIdFinal = dept?.id || null
        } else {
          departamentoIdFinal = null
        }
      }
    }
    
    // Contruir el objeto de datos para actualizar
    const dataToUpdate: any = {
        ...(nombre && { name: nombre }),
        ...(apellido && { apellido: apellido }),
        ...(rut && { rut: rut }),
        ...(email && { email: email }),
        ...(telefono !== undefined && { telefono: telefono || null }),
        ...(especialidad !== undefined && { especialidad: especialidad }),
        ...(estado && { estado: estado }),
        ...(role && { role }),
        ...(departamentoIdFinal !== undefined && { departamentoId: departamentoIdFinal }),
        ...(direccion !== undefined && { direccion }),
        ...(fechaNacimiento !== undefined && { fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null }),
    };

    // Si se generó una nueva contraseña, incluirla en la actualización
    if (temporaryPassword && hashedPassword) {
        dataToUpdate.hashedPassword = hashedPassword;
    }


    // Actualizar el docente
    const docenteActualizado = await prisma.user.update({
      where: { id: id },
      data: dataToUpdate,
      include: {
        departamento: true,
        inscripciones: {
          include: {
            curso: true
          }
        }
      }
    });

    // ✉️ Enviar correo si se generó clave temporal
    if (temporaryPassword && email) {
        // Enviar al nuevo email si fue cambiado, sino al email existente del docente
        await sendTemporaryPasswordEmail(email, temporaryPassword); 
    }
    // ------------------------------------


    console.log(`✅ Docente actualizado: ${docenteActualizado.name} ${docenteActualizado.apellido}`);
    return NextResponse.json(docenteActualizado, { status: 200 });
  } catch (error) {
    console.error("❌ Error al actualizar docente:", error);
    return NextResponse.json(
      { error: "No se pudo actualizar el docente" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un docente
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Se requiere el ID del docente" },
        { status: 400 }
      );
    }

    // Verificar que el docente existe
    const docenteExistente = await prisma.user.findUnique({
      where: { id: id },
      select: { name: true, apellido: true }
    });

    if (!docenteExistente) {
      return NextResponse.json(
        { error: "Docente no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el docente
    await prisma.user.delete({
      where: { id: id }
    });

    console.log(`✅ Docente eliminado: ${docenteExistente.name} ${docenteExistente.apellido}`);
    return NextResponse.json(
      { message: "Docente eliminado exitosamente" },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error al eliminar docente:", error);
    return NextResponse.json(
      { error: "No se pudo eliminar el docente. Puede que tenga registros asociados." },
      { status: 500 }
    );
  }
}