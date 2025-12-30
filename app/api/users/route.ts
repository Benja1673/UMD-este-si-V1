// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions, isAdminOrSupervisor } from "@/lib/auth";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

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
    html: `<p>Hola,</p><p>Se ha creado o restablecido tu cuenta. Tu clave es: <strong>${temporaryPassword}</strong></p>`,
  };
  try { await transporter.sendMail(mailOptions); } catch (error) { console.error("❌ Error envío correo:", error); }
}

// ✅ GET - Obtener usuarios con Auditoría, Jerarquía y Datos de Cursos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();

    if (!requesterRole || requesterRole === "DOCENTE") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const rolesVisibles = requesterRole === "ADMIN" ? ["supervisor", "docente"] : ["docente"];
    const baseWhere: any = { 
      role: { in: rolesVisibles },
      deletedAt: null 
    };

    if (search) {
      baseWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { apellido: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { rut: { contains: search, mode: "insensitive" } },
      ];
    }

    const usuarios = await prisma.user.findMany({
      where: baseWhere,
      select: {
        id: true, name: true, apellido: true, rut: true, email: true,
        telefono: true, especialidad: true, estado: true, role: true,
        direccion: true, fechaNacimiento: true,
        departamento: { select: { id: true, nombre: true, codigo: true } },
        // 🔄 Reintegración de inscripciones para el Frontend
        inscripciones: {
          where: { deletedAt: null }, // Solo inscripciones activas
          include: {
            curso: {
              select: { id: true, nombre: true, codigo: true, activo: true }
            }
          }
        }
      },
      orderBy: { apellido: "asc" },
    });

    return NextResponse.json(usuarios);
  } catch (error) {
    return NextResponse.json({ error: "Error al cargar usuarios" }, { status: 500 });
  }
}

// ✅ POST - Crear usuario con Auditoría
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    if (!session || !(await isAdminOrSupervisor(session))) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    const body = await request.json();
    const { nombre, apellido, rut, email, telefono, departamentoId, role: tRole } = body;
    const targetRole = tRole?.toLowerCase() || "docente";

    if (targetRole === "supervisor" && requesterRole !== "ADMIN") {
      return NextResponse.json({ error: "Solo admins crean supervisores" }, { status: 403 });
    }

    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const nuevo = await prisma.user.create({
      data: {
        name: nombre, apellido, rut, email, telefono,
        hashedPassword, role: targetRole, estado: "ACTIVO",
        departamentoId,
        createdById: requesterId,
        updatedById: requesterId,
      },
      include: { departamento: true }
    });

    await sendTemporaryPasswordEmail(email, temporaryPassword);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear" }, { status: 500 });
  }
}

// ✅ PUT - Actualizar con Jerarquía, Auditoría y Devolución de Datos
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role?.toUpperCase();
    const requesterId = session?.user?.id;

    const body = await request.json();
    const { id, estado, role: targetRole, resetPassword, email, ...data } = body;

    const usuarioAEditar = await prisma.user.findUnique({ where: { id } });
    if (!usuarioAEditar) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // 🛡️ REGLA DE JERARQUÍA
    const targetUserRole = usuarioAEditar.role.toUpperCase();
    if (requesterRole === "SUPERVISOR" && targetUserRole !== "DOCENTE") {
      return NextResponse.json({ error: "No tienes permiso para editar este nivel" }, { status: 403 });
    }
    if (requesterRole === "ADMIN" && targetUserRole === "ADMIN" && requesterId !== id) {
      return NextResponse.json({ error: "No puedes editar a otro Admin" }, { status: 403 });
    }

    let passwordData: any = {};
    if (resetPassword || (email && email !== usuarioAEditar.email)) {
      const tempPass = generateRandomPassword();
      passwordData.hashedPassword = await bcrypt.hash(tempPass, 10);
      await sendTemporaryPasswordEmail(email || usuarioAEditar.email, tempPass);
    }

    const actualizado = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        email,
        estado,
        role: targetRole,
        ...passwordData,
        updatedById: requesterId
      },
      include: { 
        departamento: true,
        inscripciones: { include: { curso: true } }
      }
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

// ✅ DELETE - Borrado Lógico (Soft Delete)
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

    const usuarioAEliminar = await prisma.user.findUnique({ where: { id } });
    if (!usuarioAEliminar) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (requesterRole === "SUPERVISOR" && usuarioAEliminar.role.toUpperCase() !== "DOCENTE") {
      return NextResponse.json({ error: "No puedes eliminar este nivel" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id },
      data: {
        estado: "INACTIVO",
        deletedAt: new Date(),
        deletedById: requesterId
      }
    });

    return NextResponse.json({ message: "Usuario eliminado lógicamente" });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}