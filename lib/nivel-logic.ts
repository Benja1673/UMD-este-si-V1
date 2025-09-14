import { prisma } from "./prisma"

// Definición local de los valores posibles para NivelCurso y EstadoCurso
export const NivelCurso = {
  INICIAL: "INICIAL",
  INTERMEDIO: "INTERMEDIO",
  AVANZADO: "AVANZADO",
} as const

export const EstadoCurso = {
  NO_INSCRITO: "NO_INSCRITO",
  INSCRITO: "INSCRITO",
  EN_PROCESO: "EN_PROCESO",
  APROBADO: "APROBADO",
  NO_APROBADO: "NO_APROBADO",
  ABANDONADO: "ABANDONADO",
  PENDIENTE_EVALUACION: "PENDIENTE_EVALUACION",
} as const

/**
 * Calcula el nivel actual de un docente basado en sus cursos aprobados
 * Lógica: Para completar un nivel, debe aprobar al menos un curso de cada categoría obligatoria del nivel
 */
export async function calcularNivelDocente(docenteId: string): Promise<keyof typeof NivelCurso | null> {
  // Obtener todas las inscripciones aprobadas del docente
  const cursosAprobados = await prisma.inscripcionCurso.findMany({
    where: {
      docenteId,
      estado: EstadoCurso.APROBADO,
    },
    include: {
      curso: {
        include: {
          categoria: true,
        },
      },
    },
  })

  if (cursosAprobados.length === 0) {
    return null
  }

  // Verificar si tiene el curso de Modelo Educativo aprobado (requisito básico)
  const tieneModeloEducativo = cursosAprobados.some(
    (inscripcion) => inscripcion.curso.categoria.nombre === "Modelo Educativo",
  )

  if (!tieneModeloEducativo) {
    return null
  }

  // Obtener todas las categorías obligatorias por nivel
  const categoriasObligatorias = await prisma.categoria.findMany({
    where: {
      esObligatoria: true,
    },
    orderBy: [{ nivel: "asc" }, { orden: "asc" }],
  })

  // Agrupar categorías por nivel
  const categoriasPorNivel = {
    [NivelCurso.INICIAL]: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.INICIAL),
    [NivelCurso.INTERMEDIO]: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.INTERMEDIO),
    [NivelCurso.AVANZADO]: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.AVANZADO),
  }

  // Obtener categorías aprobadas por el docente
  const categoriasAprobadas = new Set(cursosAprobados.map((inscripcion) => inscripcion.curso.categoria.id))

  // Verificar nivel AVANZADO
  const categoriasAvanzadasRequeridas = categoriasPorNivel[NivelCurso.AVANZADO]
  const categoriasAvanzadasAprobadas = categoriasAvanzadasRequeridas.filter((categoria) =>
    categoriasAprobadas.has(categoria.id),
  )

  // Para nivel avanzado, debe tener todas las categorías de avanzado Y haber completado intermedio
  if (categoriasAvanzadasAprobadas.length === categoriasAvanzadasRequeridas.length) {
    // Verificar que también tenga completo el nivel intermedio
    const categoriasIntermediasRequeridas = categoriasPorNivel[NivelCurso.INTERMEDIO]
    const categoriasIntermediasAprobadas = categoriasIntermediasRequeridas.filter((categoria) =>
      categoriasAprobadas.has(categoria.id),
    )

    if (categoriasIntermediasAprobadas.length === categoriasIntermediasRequeridas.length) {
      return NivelCurso.AVANZADO
    }
  }

  // Verificar nivel INTERMEDIO
  const categoriasIntermediasRequeridas = categoriasPorNivel[NivelCurso.INTERMEDIO]
  const categoriasIntermediasAprobadas = categoriasIntermediasRequeridas.filter((categoria) =>
    categoriasAprobadas.has(categoria.id),
  )

  if (categoriasIntermediasAprobadas.length === categoriasIntermediasRequeridas.length) {
    return NivelCurso.INTERMEDIO
  }

  // Si tiene Modelo Educativo pero no completa intermedio, es nivel INICIAL
  return NivelCurso.INICIAL
}

/**
 * Actualiza el nivel de un docente en la base de datos
 */
export async function actualizarNivelDocente(docenteId: string): Promise<keyof typeof NivelCurso | null> {
  const nuevoNivel = await calcularNivelDocente(docenteId)

  await prisma.docente.update({
    where: { id: docenteId },
    data: { nivelActual: nuevoNivel },
  })

  return nuevoNivel
}

/**
 * Verifica si un docente puede inscribirse a un curso específico
 */
export async function puedeInscribirseACurso(
  docenteId: string,
  cursoId: string,
): Promise<{
  puede: boolean
  razon?: string
}> {
  const curso = await prisma.curso.findUnique({
    where: { id: cursoId },
    include: {
      categoria: true,
      prerrequisitos: {
        include: {
          prerrequisitoCurso: {
            include: {
              categoria: true,
            },
          },
        },
      },
    },
  })

  if (!curso) {
    return { puede: false, razon: "Curso no encontrado" }
  }

  // Verificar si ya está inscrito
  const inscripcionExistente = await prisma.inscripcionCurso.findUnique({
    where: {
      docenteId_cursoId: {
        docenteId,
        cursoId,
      },
    },
  })

  if (inscripcionExistente && inscripcionExistente.estado !== EstadoCurso.NO_INSCRITO) {
    return { puede: false, razon: "Ya está inscrito en este curso" }
  }

  // Verificar prerrequisitos
  if (curso.prerrequisitos.length > 0) {
    const cursosAprobados = await prisma.inscripcionCurso.findMany({
      where: {
        docenteId,
        estado: EstadoCurso.APROBADO,
      },
      include: {
        curso: true,
      },
    })

    const cursosAprobadosIds = new Set(cursosAprobados.map((i) => i.cursoId))

    for (const prereq of curso.prerrequisitos) {
      if (!cursosAprobadosIds.has(prereq.prerrequisitoCursoId)) {
        return {
          puede: false,
          razon: `Debe aprobar primero: ${prereq.prerrequisitoCurso.categoria.nombre}`,
        }
      }
    }
  }

  // Verificar nivel del docente para cursos avanzados
  if (curso.nivel === NivelCurso.AVANZADO) {
    const nivelActual = await calcularNivelDocente(docenteId)
    if (nivelActual !== NivelCurso.INTERMEDIO && nivelActual !== NivelCurso.AVANZADO) {
      return {
        puede: false,
        razon: "Debe completar el nivel intermedio antes de acceder a cursos avanzados",
      }
    }
  }

  return { puede: true }
}

/**
 * Obtiene el progreso de un docente por nivel
 */
export async function obtenerProgresoDocente(docenteId: string) {
  const cursosAprobados = await prisma.inscripcionCurso.findMany({
    where: {
      docenteId,
      estado: EstadoCurso.APROBADO,
    },
    include: {
      curso: {
        include: {
          categoria: true,
        },
      },
    },
  })

  const categoriasObligatorias = await prisma.categoria.findMany({
    where: {
      esObligatoria: true,
    },
    orderBy: [{ nivel: "asc" }, { orden: "asc" }],
  })

  const categoriasAprobadas = new Set(cursosAprobados.map((inscripcion) => inscripcion.curso.categoria.id))

  const progresoPorNivel = {
    [NivelCurso.INICIAL]: {
      total: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.INICIAL).length,
      completadas: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.INICIAL && categoriasAprobadas.has(c.id))
        .length,
    },
    [NivelCurso.INTERMEDIO]: {
      total: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.INTERMEDIO).length,
      completadas: categoriasObligatorias.filter(
        (c) => c.nivel === NivelCurso.INTERMEDIO && categoriasAprobadas.has(c.id),
      ).length,
    },
    [NivelCurso.AVANZADO]: {
      total: categoriasObligatorias.filter((c) => c.nivel === NivelCurso.AVANZADO).length,
      completadas: categoriasObligatorias.filter(
        (c) => c.nivel === NivelCurso.AVANZADO && categoriasAprobadas.has(c.id),
      ).length,
    },
  }

  return progresoPorNivel
}
