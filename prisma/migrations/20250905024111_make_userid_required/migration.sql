/*
  Warnings:

  - You are about to drop the column `docenteId` on the `certificados` table. All the data in the column will be lost.
  - You are about to drop the column `docenteId` on the `inscripciones_cursos` table. All the data in the column will be lost.
  - You are about to drop the `docentes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,cursoId]` on the table `inscripciones_cursos` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `certificados` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `inscripciones_cursos` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[certificados] DROP CONSTRAINT [certificados_docenteId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[cursos] DROP CONSTRAINT [cursos_instructorId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_departamentoId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[inscripciones_cursos] DROP CONSTRAINT [inscripciones_cursos_docenteId_fkey];

-- DropIndex
ALTER TABLE [dbo].[inscripciones_cursos] DROP CONSTRAINT [inscripciones_cursos_docenteId_cursoId_key];

-- AlterTable
ALTER TABLE [dbo].[certificados] DROP COLUMN [docenteId];
ALTER TABLE [dbo].[certificados] ADD [userId] NVARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[inscripciones_cursos] DROP COLUMN [docenteId];
ALTER TABLE [dbo].[inscripciones_cursos] ADD [userId] NVARCHAR(1000) NOT NULL;

-- DropTable
DROP TABLE [dbo].[docentes];

-- DropTable
DROP TABLE [dbo].[User];

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [apellido] NVARCHAR(1000),
    [rut] NVARCHAR(1000),
    [telefono] NVARCHAR(1000),
    [direccion] NVARCHAR(1000),
    [fechaNacimiento] DATETIME2,
    [especialidad] NVARCHAR(1000),
    [estado] NVARCHAR(1000) NOT NULL CONSTRAINT [users_estado_df] DEFAULT 'ACTIVO',
    [nivelActual] NVARCHAR(1000),
    [hashedPassword] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'docente',
    [departamentoId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [users_rut_key] UNIQUE NONCLUSTERED ([rut])
);

-- CreateIndex
ALTER TABLE [dbo].[inscripciones_cursos] ADD CONSTRAINT [inscripciones_cursos_userId_cursoId_key] UNIQUE NONCLUSTERED ([userId], [cursoId]);

-- AddForeignKey
ALTER TABLE [dbo].[users] ADD CONSTRAINT [users_departamentoId_fkey] FOREIGN KEY ([departamentoId]) REFERENCES [dbo].[departamentos]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_instructorId_fkey] FOREIGN KEY ([instructorId]) REFERENCES [dbo].[users]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[inscripciones_cursos] ADD CONSTRAINT [inscripciones_cursos_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[certificados] ADD CONSTRAINT [certificados_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
