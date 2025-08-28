-- =====================================================
-- SCRIPT 1: ATIVAR ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Este script ativa RLS em todas as tabelas principais
-- e cria as estruturas necessárias para controle de acesso

-- =====================================================
-- 1. ATIVAR RLS EM TODAS AS TABELAS PRINCIPAIS
-- =====================================================

-- Tabelas de configuração
ALTER TABLE tipos_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE talhoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratores ENABLE ROW LEVEL SECURITY;

-- Tabelas de operação
ALTER TABLE safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_plantio ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_colheita ENABLE ROW LEVEL SECURITY;

-- Tabelas de estoque
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_combustivel ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_combustivel ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_combustivel ENABLE ROW LEVEL SECURITY;

-- Tabelas financeiras
ALTER TABLE gastos_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_recorrentes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. ADICIONAR CAMPOS DE CONTROLE DE ACESSO
-- =====================================================

-- Função para adicionar campos de controle se não existirem
CREATE OR REPLACE FUNCTION add_user_control_fields(table_name TEXT)
RETURNS void AS $$
BEGIN
    -- Adicionar created_by se não existir
    BEGIN
        EXECUTE format('ALTER TABLE %I ADD COLUMN created_by UUID REFERENCES auth.users(id)', table_name);
        RAISE NOTICE 'Adicionado created_by em %', table_name;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Campo created_by já existe em %', table_name;
    END;
    
    -- Adicionar updated_by se não existir
    BEGIN
        EXECUTE format('ALTER TABLE %I ADD COLUMN updated_by UUID REFERENCES auth.users(id)', table_name);
        RAISE NOTICE 'Adicionado updated_by em %', table_name;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Campo updated_by já existe em %', table_name;
    END;
    
    -- Adicionar organization_id se não existir (para multitenancy)
    BEGIN
        EXECUTE format('ALTER TABLE %I ADD COLUMN organization_id INTEGER', table_name);
        RAISE NOTICE 'Adicionado organization_id em %', table_name;
    EXCEPTION
        WHEN duplicate_column THEN
            RAISE NOTICE 'Campo organization_id já existe em %', table_name;
    END;
END;
$$ LANGUAGE plpgsql;

-- Aplicar campos de controle em todas as tabelas
SELECT add_user_control_fields('tipos_producao');
SELECT add_user_control_fields('funcionarios');
SELECT add_user_control_fields('talhoes');
SELECT add_user_control_fields('tratores');
SELECT add_user_control_fields('safras');
SELECT add_user_control_fields('manutencao');
SELECT add_user_control_fields('historico_plantio');
SELECT add_user_control_fields('historico_colheita');
SELECT add_user_control_fields('insumos');
SELECT add_user_control_fields('estoque_insumos');
SELECT add_user_control_fields('lotes_insumos');
SELECT add_user_control_fields('movimentacoes_insumos');
SELECT add_user_control_fields('estoque_combustivel');
SELECT add_user_control_fields('lotes_combustivel');
SELECT add_user_control_fields('movimentacoes_combustivel');
SELECT add_user_control_fields('gastos_gerais');
SELECT add_user_control_fields('gastos_recorrentes');

-- =====================================================
-- 3. CRIAR TABELAS DE CONTROLE DE ACESSO
-- =====================================================

-- Tabela de organizações (multitenancy)
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    active BOOLEAN DEFAULT TRUE
);

-- Tabela de membros da organização
CREATE TABLE IF NOT EXISTS organization_members (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id INTEGER REFERENCES organizations(id),
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, organization_id)
);

-- Tabela de permissões específicas
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id INTEGER REFERENCES organizations(id),
    resource TEXT NOT NULL, -- nome da tabela ou recurso
    permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'delete', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, organization_id, resource, permission)
);

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    organization_id INTEGER REFERENCES organizations(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 4. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

-- Índices para organization_members
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);

-- Índices para user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_org_id ON user_permissions(organization_id);

-- =====================================================
-- 5. FUNÇÕES AUXILIARES PARA RLS
-- =====================================================

-- Função para verificar se usuário pertence à organização
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_uuid UUID, org_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = user_uuid 
        AND organization_id = org_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter organizações do usuário
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS TABLE(organization_id INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissão específica
CREATE OR REPLACE FUNCTION user_has_permission(
    user_uuid UUID, 
    org_id INTEGER, 
    resource_name TEXT, 
    permission_type TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Verificar se é owner ou admin da organização
    IF EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND role IN ('owner', 'admin')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar permissão específica
    RETURN EXISTS (
        SELECT 1 FROM user_permissions 
        WHERE user_id = user_uuid 
        AND organization_id = org_id 
        AND resource = resource_name 
        AND permission = permission_type
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CONFIGURAÇÕES DE SEGURANÇA
-- =====================================================

-- Ativar RLS nas tabelas de controle
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- MENSAGEM DE CONCLUSÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RLS ATIVADO COM SUCESSO!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Próximos passos:';
    RAISE NOTICE '1. Execute o script 02_create_policies.sql';
    RAISE NOTICE '2. Execute o script 03_setup_default_data.sql';
    RAISE NOTICE '3. Teste as políticas com usuários reais';
    RAISE NOTICE '=====================================================';
END $$;
