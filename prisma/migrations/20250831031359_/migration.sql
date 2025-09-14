/*
  Warnings:

  - You are about to drop the column `año` on the `cursos` table. All the data in the column will be lost.
  - You are about to drop the column `usersId` on the `docentes` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId]` on the table `docentes` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tipo` on table `cursos` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_usersId_fkey];

-- DropIndex
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_usersId_key];

-- AlterTable
ALTER TABLE [dbo].[cursos] ALTER COLUMN [tipo] NVARCHAR(1000) NOT NULL;
ALTER TABLE [dbo].[cursos] DROP COLUMN [año];
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_tipo_df] DEFAULT 'Curso' FOR [tipo];
ALTER TABLE [dbo].[cursos] ADD [ano] INT NOT NULL CONSTRAINT [cursos_ano_df] DEFAULT 2025;

-- AlterTable
ALTER TABLE [dbo].[docentes] DROP COLUMN [usersId];
ALTER TABLE [dbo].[docentes] ADD [userId] NVARCHAR(1000);

-- DropTable
DROP TABLE [dbo].[users];

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

-- CreateIndex
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_userId_key] UNIQUE NONCLUSTERED ([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
