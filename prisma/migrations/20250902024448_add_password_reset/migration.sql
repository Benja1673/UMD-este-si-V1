BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[categorias] ADD CONSTRAINT [categorias_nivel_df] DEFAULT 'General' FOR [nivel];

-- AlterTable
ALTER TABLE [dbo].[cursos] ADD CONSTRAINT [cursos_nivel_df] DEFAULT 'General' FOR [nivel];

-- CreateTable
CREATE TABLE [dbo].[PasswordReset] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [used] BIT NOT NULL CONSTRAINT [PasswordReset_used_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PasswordReset_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [PasswordReset_pkey] PRIMARY KEY CLUSTERED ([id])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
