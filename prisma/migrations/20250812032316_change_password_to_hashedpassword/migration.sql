BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [hashedPassword] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'docente',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[docentes] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [apellido] NVARCHAR(1000) NOT NULL,
    [rut] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [telefono] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [fechaNacimiento] DATETIME2,
    [especialidad] NVARCHAR(1000),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [docentes_estado_df] DEFAULT 'ACTIVO',
    [nivelActual] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [docentes_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [userId] NVARCHAR(1000),
    [departamentoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [docentes_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [docentes_rut_key] UNIQUE NONCLUSTERED ([rut]),
    CONSTRAINT [docentes_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [docentes_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[departamentos] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [codigo] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [departamentos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [departamentos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [departamentos_nombre_key] UNIQUE NONCLUSTERED ([nombre]),
    CONSTRAINT [departamentos_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[categorias] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [nivel] NVARCHAR(1000) NOT NULL,
    [orden] INT NOT NULL,
    [esObligatoria] BIT NOT NULL CONSTRAINT [categorias_esObligatoria_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categorias_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [categorias_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categorias_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[cursos] (
    [id] NVARCHAR(1000) NOT NULL,
    [nombre] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [codigo] NVARCHAR(1000),
    [nivel] NVARCHAR(1000) NOT NULL,
    [duracion] INT,
    [modalidad] NVARCHAR(1000),
    [activo] BIT NOT NULL CONSTRAINT [cursos_activo_df] DEFAULT 1,
    [fechaInicio] DATETIME2,
    [fechaFin] DATETIME2,
    [cupos] INT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [cursos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [categoriaId] NVARCHAR(1000) NOT NULL,
    [departamentoId] NVARCHAR(1000) NOT NULL,
    [instructorId] NVARCHAR(1000),
    CONSTRAINT [cursos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [cursos_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[curso_prerrequisitos] (
    [id] NVARCHAR(1000) NOT NULL,
    [cursoId] NVARCHAR(1000) NOT NULL,
    [prerrequisitoCursoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [curso_prerrequisitos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [curso_prerrequisitos_cursoId_prerrequisitoCursoId_key] UNIQUE NONCLUSTERED ([cursoId],[prerrequisitoCursoId])
);

-- CreateTable
CREATE TABLE [dbo].[inscripciones_cursos] (
    [id] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [inscripciones_cursos_estado_df] DEFAULT 'NO_INSCRITO',
    [fechaInscripcion] DATETIME2,
    [fechaAprobacion] DATETIME2,
    [fechaInicio] DATETIME2,
    [fechaFinalizacion] DATETIME2,
    [nota] FLOAT(53),
    [observaciones] NVARCHAR(1000),
    [intentos] INT NOT NULL CONSTRAINT [inscripciones_cursos_intentos_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [inscripciones_cursos_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [docenteId] NVARCHAR(1000) NOT NULL,
    [cursoId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [inscripciones_cursos_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [inscripciones_cursos_docenteId_cursoId_key] UNIQUE NONCLUSTERED ([docenteId],[cursoId])
);

-- CreateTable
CREATE TABLE [dbo].[evaluaciones] (
    [id] NVARCHAR(1000) NOT NULL,
    [titulo] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [tipo] NVARCHAR(1000) NOT NULL CONSTRAINT [evaluaciones_tipo_df] DEFAULT 'ENCUESTA',
    [fechaInicio] DATETIME2 NOT NULL,
    [fechaFin] DATETIME2 NOT NULL,
    [activa] BIT NOT NULL CONSTRAINT [evaluaciones_activa_df] DEFAULT 1,
    [obligatoria] BIT NOT NULL CONSTRAINT [evaluaciones_obligatoria_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [evaluaciones_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [evaluaciones_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[certificados] (
    [id] NVARCHAR(1000) NOT NULL,
    [titulo] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [tipo] NVARCHAR(1000) NOT NULL CONSTRAINT [certificados_tipo_df] DEFAULT 'CURSO',
    [fechaEmision] DATETIME2 NOT NULL,
    [fechaVencimiento] DATETIME2,
    [codigoVerificacion] NVARCHAR(1000) NOT NULL,
    [urlArchivo] NVARCHAR(1000),
    [activo] BIT NOT NULL CONSTRAINT [certificados_activo_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [certificados_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [docenteId] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [certificados_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [certificados_codigoVerificacion_key] UNIQUE NONCLUSTERED ([codigoVerificacion])
);

-- CreateTable
CREATE TABLE [dbo].[capacitaciones] (
    [id] NVARCHAR(1000) NOT NULL,
    [titulo] NVARCHAR(1000) NOT NULL,
    [descripcion] NVARCHAR(1000),
    [fechaInicio] DATETIME2 NOT NULL,
    [fechaFin] DATETIME2 NOT NULL,
    [modalidad] NVARCHAR(1000) NOT NULL,
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [capacitaciones_estado_df] DEFAULT 'PROGRAMADA',
    [cupos] INT,
    [ubicacion] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [capacitaciones_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [capacitaciones_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[departamentos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_categoriaId_fkey] FOREIGN KEY ([categoriaId]) REFERENCES [dbo].[categorias]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[departamentos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_instructorId_fkey] FOREIGN KEY ([instructorId]) REFERENCES [dbo].[docentes]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[curso_prerrequisitos] ADD CONSTRAINT [curso_prerrequisitos_cursoId_fkey] FOREIGN KEY ([cursoId]) REFERENCES [dbo].[cursos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[curso_prerrequisitos] ADD CONSTRAINT [curso_prerrequisitos_prerrequisitoCursoId_fkey] FOREIGN KEY ([prerrequisitoCursoId]) REFERENCES [dbo].[cursos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[inscripciones_cursos] ADD CONSTRAINT [inscripciones_cursos_cursoId_fkey] FOREIGN KEY ([cursoId]) REFERENCES [dbo].[cursos]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[inscripciones_cursos] ADD CONSTRAINT [inscripciones_cursos_docenteId_fkey] FOREIGN KEY ([docenteId]) REFERENCES [dbo].[docentes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[certificados] ADD CONSTRAINT [certificados_docenteId_fkey] FOREIGN KEY ([docenteId]) REFERENCES [dbo].[docentes]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
