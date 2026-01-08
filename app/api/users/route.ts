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
    html: `<p>Hola,</p><p>Se ha creado o restablecido tu cuenta. Tu clave temporal es: <strong>${temporaryPassword}</strong></p><p>Te recomendamos cambiarla al iniciar sesión.</p>`,
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

    const usuarios = await prisma.user.findMany({
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
        // ✅ MEJORA: Incluimos el nivel para que se vea en Gestión Docente y Dashboard
        nivelActual: true, 
        departamento: { select: { id: true, nombre: true, codigo: true } },
        inscripciones: {
          where: { deletedAt: null },
          include: { curso: { select: { id: true, nombre: true, codigo: true, activo: true } } }
        }
      },
      orderBy: { apellido: "asc" },
    });

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

    const existente = await prisma.user.findFirst({
      where: { OR: [{ rut }, { email }] }
    });
    if (existente) return NextResponse.json({ error: "El RUT o Email ya existe" }, { status: 409 });

    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const nuevo = await prisma.user.create({
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
        nivelActual: "SIN_NIVEL", // Nivel por defecto al crear
        createdById: requesterId,
        updatedById: requesterId,
      },
      include: { departamento: true }
    });

    await sendTemporaryPasswordEmail(email, temporaryPassword);
    return NextResponse.json(nuevo, { status: 201 });
  } catch (error) {
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

    const existente = await prisma.user.findUnique({ where: { id: userId } });
    if (!existente) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (requesterRole === "SUPERVISOR" && existente.role.toUpperCase() !== "DOCENTE") {
      return NextResponse.json({ error: "No puedes editar este nivel" }, { status: 403 });
    }

    const { rut, email, resetPassword } = body;
    const duplicado = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [{ rut }, { email }]
      }
    });
    if (duplicado) return NextResponse.json({ error: "RUT o Email ya en uso" }, { status: 409 });

    let passwordData: any = {};
    if (resetPassword || (email && email !== existente.email)) {
      const tempPass = generateRandomPassword();
      passwordData.hashedPassword = await bcrypt.hash(tempPass, 10);
      await sendTemporaryPasswordEmail(email || existente.email, tempPass);
    }

    const actualizado = await prisma.user.update({
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

    return NextResponse.json(actualizado);
  } catch (error) {
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

    const usuarioAEliminar = await prisma.user.findUnique({ 
      where: { id },
      select: { id: true, rut: true, email: true, role: true } 
    });

    if (!usuarioAEliminar) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (requesterRole === "SUPERVISOR" && usuarioAEliminar.role.toUpperCase() !== "DOCENTE") {
      return NextResponse.json({ error: "No puedes eliminar este nivel" }, { status: 403 });
    }

    const timestamp = Date.now();
    await prisma.user.update({
      where: { id },
      data: {
        estado: "INACTIVO",
        deletedAt: new Date(),
        deletedById: requesterId,
        rut: `${usuarioAEliminar.rut}-E-${timestamp}`,
        email: `${usuarioAEliminar.email}-E-${timestamp}`
      }
    });

    return NextResponse.json({ message: "Usuario dado de baja" });
  } catch (error) {
    console.error("❌ Error DELETE:", error);
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}