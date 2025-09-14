/*
  Warnings:

  - You are about to drop the column `userId` on the `docentes` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[usersId]` on the table `docentes` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_userId_fkey];

-- DropIndex
ALTER TABLE [dbo].[docentes] DROP CONSTRAINT [docentes_userId_key];

-- AlterTable
ALTER TABLE [dbo].[docentes] DROP COLUMN [userId];
ALTER TABLE [dbo].[docentes] ADD [usersId] NVARCHAR(1000);

-- DropTable
DROP TABLE [dbo].[User];

-- CreateTable
CREATE TABLE [dbo].[Users] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [hashedPassword] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [Users_role_df] DEFAULT 'docente',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateIndex
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_usersId_key] UNIQUE NONCLUSTERED ([usersId]);

-- AddForeignKey
ALTER TABLE [dbo].[docentes] ADD CONSTRAINT [docentes_usersId_fkey] FOREIGN KEY ([usersId]) REFERENCES [dbo].[Users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
