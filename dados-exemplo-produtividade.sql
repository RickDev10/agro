-- =====================================================
-- DADOS DE EXEMPLO PARA ANÁLISE DE PRODUTIVIDADE POR HECTARE
-- =====================================================

-- 1. Atualizar talhões com áreas em hectares
UPDATE talhoes SET area_hectares = 15.5 WHERE id = 1;
UPDATE talhoes SET area_hectares = 22.0 WHERE id = 2;
UPDATE talhoes SET area_hectares = 18.3 WHERE id = 3;
UPDATE talhoes SET area_hectares = 25.7 WHERE id = 4;
UPDATE talhoes SET area_hectares = 12.8 WHERE id = 5;

-- 2. Inserir dados de exemplo para safras com produção
UPDATE safras SET 
  total_colhido = 2800,
  faturamento_total = 420000
WHERE id = 1;

UPDATE safras SET 
  total_colhido = 1800,
  faturamento_total = 250000
WHERE id = 2;

-- 3. Inserir dados de exemplo para histórico de plantio
INSERT INTO historico_plantio (
  tipo_de_producao, data_execucao, safra_id, talhao_id, trator_id, funcionario_id, 
  duracao_horas, combustivel, status_execucao
) VALUES 
(1, '2024-09-15', 1, 1, 1, 1, 8.5, 45.2, 'Concluído'),
(1, '2024-09-20', 1, 2, 1, 1, 12.0, 63.8, 'Concluído'),
(1, '2024-09-25', 1, 3, 2, 2, 10.2, 54.1, 'Concluído'),
(2, '2024-10-05', 2, 1, 1, 1, 7.8, 41.5, 'Concluído'),
(2, '2024-10-10', 2, 4, 2, 2, 14.5, 77.2, 'Concluído'),
(2, '2024-10-15', 2, 5, 1, 1, 6.2, 33.0, 'Concluído');

-- 4. Inserir dados de exemplo para histórico de colheita
INSERT INTO historico_colheita (
  tipo_de_producao, data_execucao, safra_id, talhao_id, trator_id, funcionario_id, 
  duracao_horas, combustivel, status_execucao
) VALUES 
(1, '2025-02-10', 1, 1, 1, 1, 10.5, 55.8, 'Concluído'),
(1, '2025-02-15', 1, 2, 1, 1, 15.2, 80.9, 'Concluído'),
(1, '2025-02-20', 1, 3, 2, 2, 12.8, 68.2, 'Concluído'),
(2, '2025-03-05', 2, 1, 1, 1, 9.5, 50.5, 'Concluído'),
(2, '2025-03-10', 2, 4, 2, 2, 18.0, 95.8, 'Concluído'),
(2, '2025-03-15', 2, 5, 1, 1, 7.8, 41.5, 'Concluído');

-- 5. Inserir dados de exemplo para gastos gerais (insumos e combustível)
INSERT INTO gastos_gerais (tipo, descricao, valor, referencia_id, referencia_tabela, data) VALUES
-- Gastos de insumo para plantio
('insumo', 'Adubo NPK', 1250.00, 1, 'historico_plantio', '2024-09-15'),
('insumo', 'Semente de Soja', 1850.00, 1, 'historico_plantio', '2024-09-15'),
('insumo', 'Adubo NPK', 1800.00, 2, 'historico_plantio', '2024-09-20'),
('insumo', 'Semente de Soja', 2200.00, 2, 'historico_plantio', '2024-09-20'),
('insumo', 'Adubo NPK', 1500.00, 3, 'historico_plantio', '2024-09-25'),
('insumo', 'Semente de Soja', 1950.00, 3, 'historico_plantio', '2024-09-25'),

-- Gastos de insumo para colheita
('insumo', 'Defensivo Agrícola', 950.00, 1, 'historico_colheita', '2025-02-10'),
('insumo', 'Defensivo Agrícola', 1200.00, 2, 'historico_colheita', '2025-02-15'),
('insumo', 'Defensivo Agrícola', 1050.00, 3, 'historico_colheita', '2025-02-20'),

-- Gastos de combustível (já registrados automaticamente pelos triggers)
('combustivel', 'Uso de Combustível em historico_plantio', 226.00, 1, 'historico_plantio', '2024-09-15'),
('combustivel', 'Uso de Combustível em historico_plantio', 319.00, 2, 'historico_plantio', '2024-09-20'),
('combustivel', 'Uso de Combustível em historico_plantio', 270.50, 3, 'historico_plantio', '2024-09-25'),
('combustivel', 'Uso de Combustível em historico_colheita', 279.00, 1, 'historico_colheita', '2025-02-10'),
('combustivel', 'Uso de Combustível em historico_colheita', 404.50, 2, 'historico_colheita', '2025-02-15'),
('combustivel', 'Uso de Combustível em historico_colheita', 341.00, 3, 'historico_colheita', '2025-02-20');

-- 6. Inserir dados de exemplo para compras de combustível
INSERT INTO movimentacoes_combustivel (tipo, quantidade, custo_unitario, data, observacao) VALUES
('entrada', 1000, 5.20, '2024-09-01', 'Compra de combustível para safra'),
('entrada', 800, 5.35, '2024-10-01', 'Compra de combustível para safra'),
('entrada', 1200, 5.15, '2025-01-01', 'Compra de combustível para safra');

-- 7. Inserir dados de exemplo para compras de insumos
INSERT INTO movimentacoes_insumos (insumo_id, tipo, quantidade, custo_unitario, data, observacao) VALUES
(1, 'entrada', 500, 2.50, '2024-09-01', 'Compra de adubo NPK'),
(2, 'entrada', 200, 9.25, '2024-09-01', 'Compra de semente de soja'),
(3, 'entrada', 100, 9.50, '2024-09-01', 'Compra de defensivo agrícola');

-- =====================================================
-- RESULTADO ESPERADO:
-- 
-- Talhão 1 (15.5 ha):
-- - Horas trabalhadas: 19.0h (8.5 + 10.5)
-- - Horas/ha: 1.23h/ha
-- - Combustível: 101.0L (45.2 + 55.8)
-- - Combustível/ha: 6.52L/ha
-- - Custo operacional: ~R$ 4.500
-- - Custo/ha: ~R$ 290/ha
--
-- Talhão 2 (22.0 ha):
-- - Horas trabalhadas: 27.2h (12.0 + 15.2)
-- - Horas/ha: 1.24h/ha
-- - Combustível: 144.7L (63.8 + 80.9)
-- - Combustível/ha: 6.58L/ha
-- - Custo operacional: ~R$ 6.000
-- - Custo/ha: ~R$ 273/ha
--
-- Safra 1 (Soja 2024/25):
-- - Área total: 55.8 ha (15.5 + 22.0 + 18.3)
-- - Produção total: 2.800 ton
-- - Produção/ha: 50.18 ton/ha
-- - Receita total: R$ 420.000
-- - Receita/ha: R$ 7.527/ha
-- =====================================================
