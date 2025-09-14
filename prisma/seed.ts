import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding base de datos...");

  // Limpiar tablas (orden correcto por relaciones)
  await prisma.passwordReset.deleteMany();
  await prisma.certificado.deleteMany();
  await prisma.inscripcionCurso.deleteMany();
  await prisma.cursoPrerequisito.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.user.deleteMany();

  // Hashear contraseña por defecto
  const hashedPassword = await bcrypt.hash("123456", 10);

  // Crear Departamentos
  const departamentos = [
    await prisma.departamento.upsert({
      where: { nombre: "Departamento de Informática" },
      update: {},
      create: { nombre: "Departamento de Informática", codigo: "INF" },
    }),
    await prisma.departamento.upsert({
      where: { nombre: "Departamento de Matemáticas" },
      update: {},
      create: { nombre: "Departamento de Matemáticas", codigo: "MAT" },
    }),
  ];

  // Crear Categorías
  const categorias = [
    await prisma.categoria.upsert({
      where: { nombre: "Tecnología" },
      update: {},
      create: { nombre: "Tecnología", descripcion: "Cursos tecnológicos", orden: 1 },
    }),
    await prisma.categoria.upsert({
      where: { nombre: "Ciencias" },
      update: {},
      create: { nombre: "Ciencias", descripcion: "Cursos científicos", orden: 2 },
    }),
  ];

  // Crear Usuarios (Docentes y Admin)
  const usuarios = [
    await prisma.user.upsert({
      where: { email: "juan.perez@utem.cl" },
      update: {},
      create: {
        email: "juan.perez@utem.cl",
        hashedPassword,
        role: "docente",
        name: "Juan",
        apellido: "Pérez",
        rut: "12345678-9",
        telefono: "+56912345678",
        direccion: "Av. Libertador 1234, Santiago",
        fechaNacimiento: new Date("1980-05-15"),
        especialidad: "Ingeniería en Informática",
        estado: "ACTIVO",
        nivelActual: "INICIAL",
        departamentoId: departamentos[0].id,
      },
    }),
    await prisma.user.upsert({
      where: { email: "maria.gomez@utem.cl" },
      update: {},
      create: {
        email: "maria.gomez@utem.cl",
        hashedPassword,
        role: "docente",
        name: "María",
        apellido: "Gómez",
        rut: "98765432-1",
        telefono: "+56987654321",
        direccion: "Calle Los Olivos 567, Santiago",
        fechaNacimiento: new Date("1985-08-20"),
        especialidad: "Matemáticas",
        estado: "ACTIVO",
        nivelActual: "AVANZADO",
        departamentoId: departamentos[1].id,
      },
    }),
    await prisma.user.upsert({
      where: { email: "admin@utem.cl" },
      update: {},
      create: {
        email: "admin@utem.cl",
        hashedPassword,
        role: "admin",
        name: "Administrador",
      },
    }),
  ];

  // Crear Cursos
  const cursoModeloEducativo = await prisma.curso.upsert({
    where: { codigo: "CURSO-001" },
    update: {},
    create: {
      nombre: "Modelo Educativo UTEM",
      descripcion: "Curso introductorio al modelo educativo",
      categoriaId: categorias[0].id,
      departamentoId: departamentos[0].id,
      instructorId: usuarios[0].id, // Juan Pérez
      codigo: "CURSO-001",
    },
  });

  const cursoMatematicas = await prisma.curso.upsert({
    where: { codigo: "CURSO-002" },
    update: {},
    create: {
      nombre: "Álgebra Avanzada",
      descripcion: "Curso de álgebra avanzada",
      categoriaId: categorias[1].id,
      departamentoId: departamentos[1].id,
      instructorId: usuarios[1].id, // María Gómez
      codigo: "CURSO-002",
    },
  });

  // Crear Inscripciones
  await prisma.inscripcionCurso.createMany({
    data: [
      {
        userId: usuarios[0].id,
        cursoId: cursoModeloEducativo.id,
        estado: "APROBADO",
        fechaInscripcion: new Date(),
      },
      {
        userId: usuarios[1].id,
        cursoId: cursoMatematicas.id,
        estado: "EN_CURSO",
        fechaInscripcion: new Date(),
      },
    ],
  });

  // Crear Certificados
  await prisma.certificado.createMany({
    data: [
      {
        titulo: "Certificado Nivel Inicial",
        descripcion: "Certificado por aprobar el curso inicial",
        tipo: "CURSO",
        fechaEmision: new Date(),
        codigoVerificacion: "CERT-001",
        userId: usuarios[0].id,
      },
      {
        titulo: "Certificado Matemáticas Avanzadas",
        descripcion: "Certificado por completar álgebra avanzada",
        tipo: "CURSO",
        fechaEmision: new Date(),
        codigoVerificacion: "CERT-002",
        userId: usuarios[1].id,
      },
    ],
  });

  console.log("✅ Seed completado exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
