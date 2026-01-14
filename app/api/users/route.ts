// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// ✅ Aumento de timeout de ejecución para entornos Serverless (Vercel)
// Permite que el proceso (incluyendo el envío de correos) tenga hasta 60 segundos para completarse.
export const maxDuration = 60; 

// --- HELPERS ---
function generateRandomPassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function sendTemporaryPasswordEmail(toEmail: string, temporaryPassword: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Credenciales de Acceso a la Plataforma UMD",
    html: `<p>Hola,</p><p>Se ha creado o restablecido tu cuenta. Tu clave temporal es: <strong>${temporaryPassword}</strong></p><p>Te recomendamos cambiarla en el  inicio de sesión, en la seccion de "¿Olvidó su contraseña?".</p>`,
  };
  try { await transporter.sendMail(mailOptions); } catch (error) { console.error("❌ Error envío correo:", error); }
}

// ✅ GET - Obtener usuarios con Auditoría, Jerarquía, Filtros y NIVEL ACTUAL
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();

    if (!requesterRole || requesterRole === "DOCENTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const estadoParam = searchParams.get("estado"); // 'activos', 'inactivos', 'todos'

    const rolesVisibles = requesterRole === "ADMIN" ? ["supervisor", "docente"] : ["docente"];
    
    const baseWhere: any = { 
      role: { in: rolesVisibles },
      deletedAt: null 
    };

    if (estadoParam === "activos") baseWhere.estado = "ACTIVO";
    else if (estadoParam === "inactivos") baseWhere.estado = "INACTIVO";

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { rut: { contains: search, mode: "insensitive" } },
      ];
    }

    // ✅ Uso de transacción con timeout aumentado para evitar errores en cargas pesadas
    const usuarios = await prisma.$transaction(async (tx) => {
      return await tx.user.findMany({
        where: baseWhere,
        select: {
          id: true,
          name: true,
          apellido: true,
          rut: true,
          email: true,
          telefono: true,
          especialidad: true,
          estado: true,
          role: true,
          direccion: true,
          fechaNacimiento: true,
          departamentoId: true,
          nivelActual: true, 
          departamento: { select: { id: true, nombre: true, codigo: true } },
          inscripciones: {
            where: { deletedAt: null },
            include: { curso: { select: { id: true, nombre: true, codigo: true, activo: true } } }
          }
        },
        orderBy: { apellido: "asc" },
      });
    }, { timeout: 20000 });

    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
  }
}

// ✅ POST - Crear usuario
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterId = session?.user?.id;

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, apellido, rut, email, telefono, departamentoId, role, direccion, fechaNacimiento, especialidad } = body;

    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // ✅ Transacción con timeout de 20s para la creación del usuario
    const nuevo = await prisma.$transaction(async (tx) => {
      const existente = await tx.user.findFirst({
        where: { OR: [{ rut }, { email }] }
      });
      if (existente) throw new Error("USER_EXISTS");

      return await tx.user.create({
        data: {
          name: nombre,
          apellido,
          rut,
          email,
          hashedPassword,
          role: role || "docente",
          estado: body.estado || "ACTIVO",
          telefono: telefono || null,
          especialidad: especialidad || null,
          direccion: direccion || null,
          fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
          departamentoId: (departamentoId === "none" || departamentoId === "") ? null : departamentoId,
          nivelActual: "SIN_NIVEL",
          createdById: requesterId,
          updatedById: requesterId,
        },
        include: { departamento: true }
      });
    }, { timeout: 20000 });

    await sendTemporaryPasswordEmail(email, temporaryPassword);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error: any) {
    if (error.message === "USER_EXISTS") return NextResponse.json({ error: "El RUT o Email ya existe" }, { status: 409 });
    console.error("❌ Error POST:", error);
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

// ✅ PUT - Actualizar usuario
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const idFromUrl = searchParams.get("id");
    
    const body = await request.json();
    const userId = idFromUrl || body.id;

    if (!userId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // ✅ Transacción con timeout de 20s para la actualización y verificaciones
    const actualizado = await prisma.$transaction(async (tx) => {
      const existente = await tx.user.findUnique({ where: { id: userId } });
      if (!existente) throw new Error("NOT_FOUND");

      if (requesterRole === "SUPERVISOR" && existente.role.toUpperCase() !== "DOCENTE") {
        throw new Error("FORBIDDEN");
      }

      const { rut, email, resetPassword } = body;
      const duplicado = await tx.user.findFirst({
        where: {
          id: { not: userId },
          OR: [{ rut }, { email }]
        }
      });
      if (duplicado) throw new Error("DUPLICATED");

      let passwordData: any = {};
      if (resetPassword || (email && email !== existente.email)) {
        const tempPass = generateRandomPassword();
        passwordData.hashedPassword = await bcrypt.hash(tempPass, 10);
        // Nota: El correo se envía fuera del proceso crítico de la transacción para no bloquear la BD
        await sendTemporaryPasswordEmail(email || existente.email, tempPass);
      }

      return await tx.user.update({
        where: { id: userId },
        data: {
          name: body.nombre,
          apellido: body.apellido,
          rut: body.rut,
          email: body.email,
          role: body.role,
          estado: body.estado,
          telefono: body.telefono || null,
          especialidad: body.especialidad || null,
          direccion: body.direccion || null,
          fechaNacimiento: body.fechaNacimiento ? new Date(body.fechaNacimiento) : null,
          departamentoId: (body.departamentoId === "none" || body.departamentoId === "") ? null : body.departamentoId,
          ...passwordData,
          updatedById: requesterId
        },
        include: { departamento: true }
      });
    }, { timeout: 20000 });

    return NextResponse.json(actualizado);
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (error.message === "FORBIDDEN") return NextResponse.json({ error: "No puedes editar este nivel" }, { status: 403 });
    if (error.message === "DUPLICATED") return NextResponse.json({ error: "RUT o Email ya en uso" }, { status: 409 });
    console.error("❌ Error PUT:", error);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ✅ DELETE - Soft Delete
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // ✅ Transacción con timeout de 10s para el borrado lógico
    await prisma.$transaction(async (tx) => {
      const usuarioAEliminar = await tx.user.findUnique({ 
        where: { id },
        select: { id: true, rut: true, email: true, role: true } 
      });

      if (!usuarioAEliminar) throw new Error("NOT_FOUND");

      if (requesterRole === "SUPERVISOR" && usuarioAEliminar.role.toUpperCase() !== "DOCENTE") {
        throw new Error("FORBIDDEN");
      }

      const timestamp = Date.now();
      await tx.user.update({
        where: { id },
        data: {
          estado: "INACTIVO",
          deletedAt: new Date(),
          deletedById: requesterId,
          rut: `${usuarioAEliminar.rut}-E-${timestamp}`,
          email: `${usuarioAEliminar.email}-E-${timestamp}`
        }
      });
    }, { timeout: 10000 });

    return NextResponse.json({ message: "Usuario dado de baja" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    if (error.message === "FORBIDDEN") return NextResponse.json({ error: "No puedes eliminar este nivel" }, { status: 403 });
    console.error("❌ Error DELETE:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
} 