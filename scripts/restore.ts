// scripts/restore.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('♻️  Restaurando datos en PostgreSQL...');

  const backupPath = path.join(process.cwd(), 'backup_full.json');
  
  if (!fs.existsSync(backupPath)) {
    console.error("❌ No se encontró el archivo backup_full.json");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

  const insert = async (modelName: string, records: any[]) => {
    if (!records || records.length === 0) return;
    try {
      // @ts-ignore
      await prisma[modelName].createMany({ 
        data: records, 
        skipDuplicates: true 
      });
      console.log(`   ✅ ${modelName}: ${records.length} registros insertados.`);
    } catch (e) {
      console.error(`   ❌ Error en ${modelName}:`, e);
    }
  };

  // --- ORDEN DE INSERCIÓN CORRECTO ---

  // 1. Independientes
  await insert('departamento', data.departamento);
  await insert('categoria', data.categoria);
  await insert('condicionServicio', data.condicionServicio);
  await insert('capacitacion', data.capacitacion);
  await insert('passwordReset', data.passwordReset);

  // 2. Usuarios
  await insert('user', data.user);

  // 3. Cursos
  await insert('curso', data.curso);

  // 4. Relaciones
  await insert('cursoPrerequisito', data.cursoPrerequisito);
  await insert('inscripcionCurso', data.inscripcionCurso);
  
  // 5. Finales
  await insert('evaluacion', data.evaluacion);
  await insert('certificado', data.certificado);

  console.log('🏁 Restauración finalizada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });