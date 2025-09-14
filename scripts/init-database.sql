-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'PlataformaAcademica')
BEGIN
    CREATE DATABASE PlataformaAcademica;
END
GO

-- Usar la base de datos
USE PlataformaAcademica;
GO

-- Verificar que la base de datos esté lista
SELECT 'Base de datos PlataformaAcademica creada y lista para usar' AS Status;
GO
