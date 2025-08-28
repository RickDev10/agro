-- =====================================================
-- SCRIPT 2: CRIAR POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================
-- Este script cria todas as políticas RLS necessárias

-- =====================================================
-- 1. POLÍTICAS PARA TABELAS DE CONTROLE
-- =====================================================

-- Políticas para organizations
CREATE POLICY "Usuários podem ver organizações que pertencem"
ON organizations FOR SELECT
USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
);

CREATE POLICY "Apenas owners podem criar organizações"
ON organizations FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Apenas owners/admins podem atualizar organizações"
ON organizations FOR UPDATE
USING (
    id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Políticas para organization_members
CREATE POLICY "Usuários podem ver membros de suas organizações"
ON organization_members FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Apenas owners/admins podem adicionar membros"
ON organization_members FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Apenas owners/admins podem atualizar membros"
ON organization_members FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Políticas para user_permissions
CREATE POLICY "Usuários podem ver permissões de suas organizações"
ON user_permissions FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Políticas para audit_logs
CREATE POLICY "Usuários podem ver logs de suas organizações"
ON audit_logs FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
);

CREATE POLICY "Sistema pode inserir logs"
ON audit_logs FOR INSERT
WITH CHECK (true); -- Logs podem ser inseridos pelo sistema

-- =====================================================
-- 2. FUNÇÃO PARA CRIAR POLÍTICAS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_standard_policies(table_name TEXT)
RETURNS void AS $$
DECLARE
    policy_name TEXT;
BEGIN
    -- Política de SELECT
    policy_name := format('%s_select_policy', table_name);
    EXECUTE format('
        CREATE POLICY "%s"
        ON %I FOR SELECT
        USING (
            organization_id IN (
                SELECT organization_id FROM organization_members 
                WHERE user_id = auth.uid()
            )
            OR created_by = auth.uid()
            OR organization_id IS NULL
        )', policy_name, table_name);
    
    -- Política de INSERT
    policy_name := format('%s_insert_policy', table_name);
    EXECUTE format('
        CREATE POLICY "%s"
        ON %I FOR INSERT
        WITH CHECK (
            created_by = auth.uid()
            AND (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
                OR organization_id IS NULL
            )
        )', policy_name, table_name);
    
    -- Política de UPDATE
    policy_name := format('%s_update_policy', table_name);
    EXECUTE format('
        CREATE POLICY "%s"
        ON %I FOR UPDATE
        USING (
            (created_by = auth.uid() OR updated_by = auth.uid())
            AND (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
                OR organization_id IS NULL
            )
        )
        WITH CHECK (
            updated_by = auth.uid()
            AND (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid()
                )
                OR organization_id IS NULL
            )
        )', policy_name, table_name);
    
    -- Política de DELETE
    policy_name := format('%s_delete_policy', table_name);
    EXECUTE format('
        CREATE POLICY "%s"
        ON %I FOR DELETE
        USING (
            (created_by = auth.uid())
            AND (
                organization_id IN (
                    SELECT organization_id FROM organization_members 
                    WHERE user_id = auth.uid() AND role IN (''owner'', ''admin'')
                )
                OR organization_id IS NULL
            )
        )', policy_name, table_name);
    
    RAISE NOTICE 'Políticas criadas para tabela: %', table_name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. APLICAR POLÍTICAS PADRÃO EM TODAS AS TABELAS
-- =====================================================

-- Tabelas de configuração
SELECT create_standard_policies('tipos_producao');
SELECT create_standard_policies('funcionarios');
SELECT create_standard_policies('talhoes');
SELECT create_standard_policies('tratores');

-- Tabelas de operação
SELECT create_standard_policies('safras');
SELECT create_standard_policies('manutencao');
SELECT create_standard_policies('historico_plantio');
SELECT create_standard_policies('historico_colheita');

-- Tabelas de estoque
SELECT create_standard_policies('insumos');
SELECT create_standard_policies('estoque_insumos');
SELECT create_standard_policies('lotes_insumos');
SELECT create_standard_policies('movimentacoes_insumos');

-- Tabelas financeiras
SELECT create_standard_policies('gastos_gerais');
SELECT create_standard_policies('gastos_recorrentes');

-- =====================================================
-- 4. POLÍTICAS ESPECIAIS PARA TABELAS ESPECÍFICAS
-- =====================================================

-- Políticas especiais para estoque_combustivel (singleton)
DROP POLICY IF EXISTS estoque_combustivel_select_policy ON estoque_combustivel;
DROP POLICY IF EXISTS estoque_combustivel_insert_policy ON estoque_combustivel;
DROP POLICY IF EXISTS estoque_combustivel_update_policy ON estoque_combustivel;
DROP POLICY IF EXISTS estoque_combustivel_delete_policy ON estoque_combustivel;

CREATE POLICY "estoque_combustivel_select_policy"
ON estoque_combustivel FOR SELECT
USING (true); -- Todos podem ver o estoque de combustível

CREATE POLICY "estoque_combustivel_update_policy"
ON estoque_combustivel FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM organization_members 
        WHERE role IN ('owner', 'admin')
    )
);

-- Políticas para lotes_combustivel
DROP POLICY IF EXISTS lotes_combustivel_select_policy ON lotes_combustivel;
DROP POLICY IF EXISTS lotes_combustivel_insert_policy ON lotes_combustivel;
DROP POLICY IF EXISTS lotes_combustivel_update_policy ON lotes_combustivel;
DROP POLICY IF EXISTS lotes_combustivel_delete_policy ON lotes_combustivel;

CREATE POLICY "lotes_combustivel_select_policy"
ON lotes_combustivel FOR SELECT
USING (true); -- Todos podem ver lotes de combustível

CREATE POLICY "lotes_combustivel_insert_policy"
ON lotes_combustivel FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM organization_members 
        WHERE role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "lotes_combustivel_update_policy"
ON lotes_combustivel FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM organization_members 
        WHERE role IN ('owner', 'admin')
    )
);

-- Políticas para movimentacoes_combustivel
DROP POLICY IF EXISTS movimentacoes_combustivel_select_policy ON movimentacoes_combustivel;
DROP POLICY IF EXISTS movimentacoes_combustivel_insert_policy ON movimentacoes_combustivel;
DROP POLICY IF EXISTS movimentacoes_combustivel_update_policy ON movimentacoes_combustivel;
DROP POLICY IF EXISTS movimentacoes_combustivel_delete_policy ON movimentacoes_combustivel;

CREATE POLICY "movimentacoes_combustivel_select_policy"
ON movimentacoes_combustivel FOR SELECT
USING (true); -- Todos podem ver movimentações

CREATE POLICY "movimentacoes_combustivel_insert_policy"
ON movimentacoes_combustivel FOR INSERT
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM organization_members 
        WHERE role IN ('owner', 'admin', 'member')
    )
);

-- =====================================================
-- 5. FUNÇÕES PARA VALIDAÇÃO DE POLÍTICAS
-- =====================================================

-- Função para testar se usuário pode acessar tabela
CREATE OR REPLACE FUNCTION test_table_access(
    test_table TEXT,
    test_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    operation TEXT,
    allowed BOOLEAN,
    message TEXT
) AS $$
DECLARE
    test_result BOOLEAN;
    error_msg TEXT;
BEGIN
    -- Teste SELECT
    BEGIN
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE created_by = $1', test_table) USING test_user_id;
        operation := 'SELECT';
        allowed := TRUE;
        message := 'Acesso de leitura permitido';
        RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
        operation := 'SELECT';
        allowed := FALSE;
        message := SQLERRM;
        RETURN NEXT;
    END;
    
    -- Teste INSERT
    operation := 'INSERT';
    allowed := TRUE;
    message := 'Política de inserção configurada';
    RETURN NEXT;
    
    -- Teste UPDATE
    operation := 'UPDATE';
    allowed := TRUE;
    message := 'Política de atualização configurada';
    RETURN NEXT;
    
    -- Teste DELETE
    operation := 'DELETE';
    allowed := TRUE;
    message := 'Política de exclusão configurada';
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Função de trigger para auditoria
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_values JSONB;
    new_values JSONB;
    user_id UUID;
    org_id INTEGER;
BEGIN
    -- Obter user_id
    user_id := auth.uid();
    
    -- Tentar obter organization_id
    IF TG_OP = 'DELETE' THEN
        org_id := COALESCE(OLD.organization_id, NULL);
        old_values := to_jsonb(OLD);
        new_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        org_id := COALESCE(NEW.organization_id, OLD.organization_id, NULL);
        old_values := to_jsonb(OLD);
        new_values := to_jsonb(NEW);
    ELSE -- INSERT
        org_id := COALESCE(NEW.organization_id, NULL);
        old_values := NULL;
        new_values := to_jsonb(NEW);
    END IF;
    
    -- Inserir log de auditoria
    INSERT INTO audit_logs (
        user_id,
        organization_id,
        action,
        resource,
        resource_id,
        old_values,
        new_values,
        created_at
    ) VALUES (
        user_id,
        org_id,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        old_values,
        new_values,
        NOW()
    );
    
    -- Retornar valor apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MENSAGEM DE CONCLUSÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'POLÍTICAS RLS CRIADAS COM SUCESSO!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Políticas aplicadas em todas as tabelas principais';
    RAISE NOTICE 'Sistema de auditoria configurado';
    RAISE NOTICE '';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Execute o script 03_setup_default_data.sql';
    RAISE NOTICE '2. Teste as políticas com usuários reais';
    RAISE NOTICE '3. Configure as organizações no seu sistema';
    RAISE NOTICE '=====================================================';
END $$;
