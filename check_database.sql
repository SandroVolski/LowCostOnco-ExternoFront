-- Script para verificar se a coluna unidade_medida existe na tabela de medicamentos
-- Execute este script no seu banco de dados MySQL

-- 1. Verificar se a tabela Medicamentos existe
SHOW TABLES LIKE 'Medicamentos';

-- 2. Verificar a estrutura da tabela Medicamentos
DESCRIBE Medicamentos;

-- 3. Verificar se a coluna unidade_medida existe
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Medicamentos' 
AND COLUMN_NAME = 'unidade_medida';

-- 4. Se a coluna não existir, adicionar ela
-- ALTER TABLE Medicamentos ADD COLUMN unidade_medida VARCHAR(50) NULL;

-- 5. Verificar dados existentes
SELECT id, nome, dose, unidade_medida, via_adm, dias_adm, frequencia
FROM Medicamentos 
LIMIT 10;

-- 6. Atualizar medicamentos existentes com unidades padrão (se necessário)
-- UPDATE Medicamentos SET unidade_medida = 'mg' WHERE unidade_medida IS NULL AND dose IS NOT NULL;
-- UPDATE Medicamentos SET unidade_medida = 'mg/m²' WHERE unidade_medida IS NULL AND dose IS NOT NULL AND nome LIKE '%platina%';
-- UPDATE Medicamentos SET unidade_medida = 'UI' WHERE unidade_medida IS NULL AND dose IS NOT NULL AND nome LIKE '%rituximab%'; 