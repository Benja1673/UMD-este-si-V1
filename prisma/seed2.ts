import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const commonPassword = "1234";
  const hashedPassword = await bcrypt.hash(commonPassword, 10);

  const users = [
    { email: "admin@utem.cl", role: "admin", rut: "11111111-1" },
    { email: "supervisor@utem.cl", role: "supervisor", rut: "22222222-2" },
    { email: "docente@utem.cl", role: "docente", rut: "33333333-3" },
    { email: "benja1673b@gmail.com", role: "admin", rut: "21000955-8" }, // tu RUT
        { email: "mvalenzuelam@utem.cl", role: "admin", rut: "21110955-8" }, // tu RUT
  ];

  for (const user of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      // Actualizamos rol, contraseña y rut si ya existe
      await prisma.user.update({
        where: { email: user.email },
        data: { role: user.role, hashedPassword, rut: user.rut },
      });
    } else {
      // Creamos nuevo usuario
      await prisma.user.create({
        data: { email: user.email, role: user.role, hashedPassword, rut: user.rut },
      });
    }
  }

  console.log("Usuarios de prueba creados/actualizados con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
