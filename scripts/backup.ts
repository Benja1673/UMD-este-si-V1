// scripts/backup.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('📦 Iniciando respaldo EXACTO desde SQL Server...');

  const backupData: any = {};

  // Nombres de MODELOS en Prisma (Singular) que mapean a tus TABLAS (Plural)
  const models = [
    'departamento',       // Tabla: dbo.departamentos
    'categoria',          // Tabla: dbo.categorias
    'condicionServicio',  // Tabla: dbo.condiciones_servicios
    'capacitacion',       // Tabla: dbo.capacitaciones
    'passwordReset',      // Tabla: dbo.PasswordReset
    'user',               // Tabla: dbo.users
    'curso',              // Tabla: dbo.cursos
    'cursoPrerequisito',  // Tabla: dbo.curso_prerrequisitos
    'inscripcionCurso',   // Tabla: dbo.inscripciones_cursos
    'evaluacion',         // Tabla: dbo.evaluaciones
    'certificado'         // Tabla: dbo.certificados
  ];

  for (const model of models) {
    try {
      // @ts-ignore
      if (prisma[model]) {
        // @ts-ignore
        const data = await prisma[model].findMany();
        backupData[model] = data;
        console.log(`   ✅ Modelo ${model} -> Tabla en BD: ${data.length} registros.`);
      } else {
        console.log(`   ⚠️  El modelo ${model} no parece existir en el cliente Prisma.`);
      }
    } catch (e) {
      console.error(`   ❌ Error leyendo ${model}:`, e);
    }
  }

  const outputPath = path.join(process.cwd(), 'backup_full.json');
  fs.writeFileSync(outputPath, JSON.stringify(backupData, null, 2));
  console.log(`🎉 Respaldo guardado en: ${outputPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });