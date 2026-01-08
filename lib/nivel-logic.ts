// lib/nivel-logic.ts
import { prisma } from "./prisma"

export const NivelCurso = {
  INICIAL: "INICIAL",
  INTERMEDIO: "INTERMEDIO",
  AVANZADO: "AVANZADO",
  SIN_NIVEL: "SIN_NIVEL"
} as const

/**
 * Calcula el nivel actual de un docente basado en los nombres de sus cursos aprobados
 * (Lógica idéntica a la tabla de Gestión Docente)
 */
export async function calcularNivelDocente(docenteId: string): Promise<string> {
  // 1. Obtener todas las inscripciones aprobadas
  const inscripciones = await prisma.inscripcionCurso.findMany({
    where: {
      userId: docenteId,
      estado: "APROBADO",
      deletedAt: null
    },
    include: { curso: true }
  })

  // 2. Crear un set de nombres en minúsculas para comparar
  const nombresAprobados = inscripciones.map(i => i.curso.nombre.toLowerCase().trim())
  
  const tiene = (palabra: string) => 
    nombresAprobados.some(n => n.includes(palabra.toLowerCase()))

  // 3. LA LÓGICA DE TU TABLA:
  // Inicial: Modelo Educativo
  const inicial = tiene("modelo educativo")

  // Intermedio: Inicial + Planificación + (DEDU o DIDU)
  const intermedio = inicial && 
    tiene("planificación") && 
    (tiene("dedu") || tiene("didu"))

  // Avanzado: Intermedio + (STEM o COIL)
  const avanzado = intermedio && 
    (tiene("stem") || tiene("coil"))

  // Retornar el nivel correspondiente
  if (avanzado) return "AVANZADO"
  if (intermedio) return "INTERMEDIO"
  if (inicial) return "INICIAL"
  return "SIN_NIVEL"
}

/**
 * Actualiza el campo nivelActual en la tabla User
 */
export async function actualizarNivelDocente(docenteId: string) {
  const nuevoNivel = await calcularNivelDocente(docenteId)

  return await prisma.user.update({
    where: { id: docenteId },
    data: { nivelActual: nuevoNivel }, 
  })
}