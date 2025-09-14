import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { parse } from "csv-parse";

const prisma = new PrismaClient();

async function getGeneralIds() {
  const [categoria, departamento] = await Promise.all([
    prisma.categoria.findUnique({ where: { nombre: "General" } }),
    prisma.departamento.findUnique({ where: { nombre: "General" } }),
  ]);

  if (!categoria || !departamento) {
    throw new Error(
      'Faltan registros "General": asegura que existan en tablas categorias y departamentos.'
    );
  }

  return { categoriaId: categoria.id, departamentoId: departamento.id };
}

async function importCsv(filePath: string) {
  const { categoriaId, departamentoId } = await getGeneralIds();

  const parser = fs.createReadStream(filePath).pipe(
    parse({
      delimiter: ",",
      trim: true,
      skip_empty_lines: true,
      bom: true, // maneja BOM si el CSV viene de Excel
    })
  );

  let rowNum = 0;
  let inserted = 0;
  let skipped = 0;

  for await (const record of parser) {
    rowNum++;

    if (!Array.isArray(record) || record.length < 3) {
      console.warn(`Línea ${rowNum}: formato inválido (se esperaban 3 columnas). Omitida.`);
      skipped++;
      continue;
    }

    const [nombreRaw, tipoRaw, anoRaw] = record as [string, string, string];

    const nombre = (nombreRaw ?? "").trim();
    const tipo = (tipoRaw ?? "").trim() || "Curso";
    const anoNum = parseInt(String(anoRaw ?? "").trim(), 10);
    const ano = Number.isFinite(anoNum) ? anoNum : 2025;
    const codigo = `${nombre}_${ano}`.replace(/\s+/g, "_");

    if (!nombre) {
      console.warn(`Línea ${rowNum}: nombre vacío. Omitida.`);
      skipped++;
      continue;
    }

    // Evitar duplicados simples por (nombre, tipo, ano)
    const exists = await prisma.curso.findFirst({ where: { nombre, tipo, ano } });
    if (exists) {
      console.log(`↩️ Ya existe "${nombre}" (${tipo} ${ano}). Omitido.`);
      skipped++;
      continue;
    }

    try {
      await prisma.curso.create({
        data: {
          nombre,
          tipo,
          ano,  
          nivel: "General", // 👈 valor por defecto
          categoriaId,
          departamentoId,
          codigo, // 👈 aquí usamos el código generado
        },
      });
      inserted++;
      if (inserted % 100 === 0) {
        console.log(`Progreso: ${inserted} cursos insertados...`);
      }
    } catch (err) {
      console.error(`❌ Error al crear curso "${nombre}" (línea ${rowNum}):`, err);
      skipped++;
    }
  }

  console.log(`\n✅ Importación completada. Insertados: ${inserted}. Omitidos: ${skipped}. Leídas: ${rowNum}.`);
}

const fileArg = process.argv[2] || "data/cursos.csv";

importCsv(fileArg)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
