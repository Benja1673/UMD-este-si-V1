// Tipos para reemplazar los enums de Prisma

export const Role = {
  ADMIN: "ADMIN",
  COORDINADOR: "COORDINADOR",
  DOCENTE: "DOCENTE",
  INSTRUCTOR: "INSTRUCTOR",
} as const

export type Role = (typeof Role)[keyof typeof Role]

export const EstadoDocente = {
  ACTIVO: "ACTIVO",
  INACTIVO: "INACTIVO",
  SUSPENDIDO: "SUSPENDIDO",
  LICENCIA: "LICENCIA",
} as const

export type EstadoDocente = (typeof EstadoDocente)[keyof typeof EstadoDocente]

export const NivelCurso = {
  INICIAL: "INICIAL",
  INTERMEDIO: "INTERMEDIO",
  AVANZADO: "AVANZADO",
} as const

export type NivelCurso = (typeof NivelCurso)[keyof typeof NivelCurso]

export const EstadoCurso = {
  NO_INSCRITO: "NO_INSCRITO",
  INSCRITO: "INSCRITO",
  EN_PROCESO: "EN_PROCESO",
  APROBADO: "APROBADO",
  NO_APROBADO: "NO_APROBADO",
  ABANDONADO: "ABANDONADO",
  PENDIENTE_EVALUACION: "PENDIENTE_EVALUACION",
} as const

export type EstadoCurso = (typeof EstadoCurso)[keyof typeof EstadoCurso]

export const TipoEvaluacion = {
  ENCUESTA: "ENCUESTA",
  EXAMEN: "EXAMEN",
  PROYECTO: "PROYECTO",
  PRESENTACION: "PRESENTACION",
} as const

export type TipoEvaluacion = (typeof TipoEvaluacion)[keyof typeof TipoEvaluacion]

export const TipoCertificado = {
  CURSO: "CURSO",
  NIVEL: "NIVEL",
  ESPECIALIZACION: "ESPECIALIZACION",
  PARTICIPACION: "PARTICIPACION",
} as const

export type TipoCertificado = (typeof TipoCertificado)[keyof typeof TipoCertificado]

export const EstadoCapacitacion = {
  PROGRAMADA: "PROGRAMADA",
  EN_CURSO: "EN_CURSO",
  FINALIZADA: "FINALIZADA",
  CANCELADA: "CANCELADA",
  SUSPENDIDA: "SUSPENDIDA",
} as const

export type EstadoCapacitacion = (typeof EstadoCapacitacion)[keyof typeof EstadoCapacitacion]

// Funciones de validación
export const isValidRole = (role: string): role is Role => {
  return Object.values(Role).includes(role as Role)
}

export const isValidEstadoDocente = (estado: string): estado is EstadoDocente => {
  return Object.values(EstadoDocente).includes(estado as EstadoDocente)
}

export const isValidNivelCurso = (nivel: string): nivel is NivelCurso => {
  return Object.values(NivelCurso).includes(nivel as NivelCurso)
}

export const isValidEstadoCurso = (estado: string): estado is EstadoCurso => {
  return Object.values(EstadoCurso).includes(estado as EstadoCurso)
}

export const isValidTipoEvaluacion = (tipo: string): tipo is TipoEvaluacion => {
  return Object.values(TipoEvaluacion).includes(tipo as TipoEvaluacion)
}

export const isValidTipoCertificado = (tipo: string): tipo is TipoCertificado => {
  return Object.values(TipoCertificado).includes(tipo as TipoCertificado)
}

export const isValidEstadoCapacitacion = (estado: string): estado is EstadoCapacitacion => {
  return Object.values(EstadoCapacitacion).includes(estado as EstadoCapacitacion)
}
