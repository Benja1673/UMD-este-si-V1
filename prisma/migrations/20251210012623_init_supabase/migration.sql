-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "apellido" TEXT,
    "rut" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "fechaNacimiento" TIMESTAMP(3),
    "especialidad" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "nivelActual" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'docente',
    "departamentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "nivel" TEXT NOT NULL DEFAULT 'General',
    "orden" INTEGER NOT NULL,
    "esObligatoria" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cursos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "codigo" TEXT,
    "nivel" TEXT NOT NULL DEFAULT 'General',
    "duracion" INTEGER,
    "modalidad" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "cupos" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "instructor" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Curso',
    "ano" INTEGER NOT NULL DEFAULT 2025,
    "semestre" INTEGER,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."curso_prerrequisitos" (
    "id" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,
    "prerrequisitoCursoId" TEXT NOT NULL,

    CONSTRAINT "curso_prerrequisitos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inscripciones_cursos" (
    "id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'NO_INSCRITO',
    "fechaInscripcion" TIMESTAMP(3),
    "fechaAprobacion" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaFinalizacion" TIMESTAMP(3),
    "nota" DOUBLE PRECISION,
    "observaciones" TEXT,
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "cursoId" TEXT NOT NULL,

    CONSTRAINT "inscripciones_cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."evaluaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'ENCUESTA',
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "obligatoria" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificados" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'CURSO',
    "fechaEmision" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "codigoVerificacion" TEXT NOT NULL,
    "urlArchivo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."capacitaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "modalidad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PROGRAMADA',
    "cupos" INTEGER,
    "ubicacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capacitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordReset" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordReset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."condiciones_servicios" (
    "id" TEXT NOT NULL,
    "servicioTipo" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "cursoId" TEXT,
    "estadoRequerido" TEXT,
    "esGeneral" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "condiciones_servicios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_rut_key" ON "public"."users"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "public"."departamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_codigo_key" ON "public"."departamentos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "public"."categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_codigo_key" ON "public"."cursos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "curso_prerrequisitos_cursoId_prerrequisitoCursoId_key" ON "public"."curso_prerrequisitos"("cursoId", "prerrequisitoCursoId");

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_cursos_userId_cursoId_key" ON "public"."inscripciones_cursos"("userId", "cursoId");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_codigoVerificacion_key" ON "public"."certificados"("codigoVerificacion");

-- CreateIndex
CREATE INDEX "condiciones_servicios_servicioId_servicioTipo_idx" ON "public"."condiciones_servicios"("servicioId", "servicioTipo");

-- CreateIndex
CREATE INDEX "condiciones_servicios_cursoId_idx" ON "public"."condiciones_servicios"("cursoId");

-- CreateIndex
CREATE INDEX "condiciones_servicios_esGeneral_idx" ON "public"."condiciones_servicios"("esGeneral");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "public"."departamentos"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."cursos" ADD CONSTRAINT "cursos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."categorias"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."cursos" ADD CONSTRAINT "cursos_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "public"."departamentos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."curso_prerrequisitos" ADD CONSTRAINT "curso_prerrequisitos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "public"."cursos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."curso_prerrequisitos" ADD CONSTRAINT "curso_prerrequisitos_prerrequisitoCursoId_fkey" FOREIGN KEY ("prerrequisitoCursoId") REFERENCES "public"."cursos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inscripciones_cursos" ADD CONSTRAINT "inscripciones_cursos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "public"."cursos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inscripciones_cursos" ADD CONSTRAINT "inscripciones_cursos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."certificados" ADD CONSTRAINT "certificados_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."condiciones_servicios" ADD CONSTRAINT "condiciones_servicios_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "public"."cursos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
