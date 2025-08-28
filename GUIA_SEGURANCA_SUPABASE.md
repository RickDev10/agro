# 🔐 Guia de Segurança - Supabase

## ✅ **Status Atual**
- ✅ Sistema de login funcionando
- ✅ Middleware configurado para APIs
- ✅ APIs protegidas com autenticação
- ✅ ProtectedRoute funcionando

## 🔧 **Implementações de Segurança**

### **1. Middleware de Autenticação**
- ✅ Verifica tokens JWT nas APIs
- ✅ Adiciona headers de usuário
- ✅ Permite rotas públicas
- ✅ Integração com Supabase Auth

### **2. APIs Protegidas**
- ✅ Verificação de autenticação obrigatória
- ✅ Headers de usuário validados
- ✅ Logs de segurança
- ✅ Rastreamento de ações (created_by, updated_by)

### **3. Row Level Security (RLS) - Próximo Passo**

Para implementar RLS no Supabase, execute no SQL Editor:

```sql
-- Habilitar RLS na tabela funcionarios
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados verem todos os funcionários
CREATE POLICY "Usuários autenticados podem ver funcionários" ON funcionarios
FOR SELECT USING (auth.role() = 'authenticated');

-- Política para usuários autenticados criarem funcionários
CREATE POLICY "Usuários autenticados podem criar funcionários" ON funcionarios
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Política para usuários autenticados atualizarem funcionários
CREATE POLICY "Usuários autenticados podem atualizar funcionários" ON funcionarios
FOR UPDATE USING (auth.role() = 'authenticated');

-- Política para usuários autenticados excluírem funcionários
CREATE POLICY "Usuários autenticados podem excluir funcionários" ON funcionarios
FOR DELETE USING (auth.role() = 'authenticated');
```

### **4. Colunas de Auditoria**
Adicione estas colunas nas tabelas:

```sql
-- Adicionar colunas de auditoria
ALTER TABLE funcionarios 
ADD COLUMN created_by UUID REFERENCES auth.users(id),
ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Atualizar registros existentes
UPDATE funcionarios 
SET created_by = auth.uid() 
WHERE created_by IS NULL;
```

## 🚀 **Próximos Passos de Segurança**

### **1. Implementar RLS em todas as tabelas**
```sql
-- Aplicar RLS em todas as tabelas principais
ALTER TABLE safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratores ENABLE ROW LEVEL SECURITY;
ALTER TABLE talhoes ENABLE ROW LEVEL SECURITY;
-- ... outras tabelas
```

### **2. Políticas de Acesso Granular**
```sql
-- Exemplo: Usuários só veem dados da sua organização
CREATE POLICY "Usuários veem dados da sua organização" ON funcionarios
FOR ALL USING (organization_id = auth.jwt() ->> 'organization_id');
```

### **3. Validação de Dados**
```sql
-- Triggers para validação
CREATE OR REPLACE FUNCTION validate_funcionario()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome não vazio
  IF NEW.nome IS NULL OR LENGTH(TRIM(NEW.nome)) = 0 THEN
    RAISE EXCEPTION 'Nome é obrigatório';
  END IF;
  
  -- Validar email único
  IF EXISTS (SELECT 1 FROM funcionarios WHERE email = NEW.email AND id != NEW.id) THEN
    RAISE EXCEPTION 'Email já existe';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_funcionario
  BEFORE INSERT OR UPDATE ON funcionarios
  FOR EACH ROW EXECUTE FUNCTION validate_funcionario();
```

### **4. Logs de Auditoria**
```sql
-- Tabela de logs de auditoria
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para logs automáticos
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, action, record_id, new_data, user_id)
    VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, action, record_id, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, action, record_id, old_data, user_id)
    VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## 🔒 **Configurações de Segurança Adicionais**

### **1. Rate Limiting**
```typescript
// Implementar rate limiting nas APIs
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests por IP
})
```

### **2. Validação de Input**
```typescript
// Usar Zod para validação
import { z } from 'zod'

const funcionarioSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  numero: z.string().optional(),
  email: z.string().email('Email inválido')
})
```

### **3. CORS Configurado**
```typescript
// Configurar CORS adequadamente
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}
```

## 📊 **Monitoramento de Segurança**

### **1. Logs de Acesso**
- ✅ Middleware logs implementados
- ✅ API logs implementados
- 🔄 Logs de auditoria (próximo passo)

### **2. Alertas de Segurança**
```sql
-- Query para detectar atividades suspeitas
SELECT 
  user_id,
  COUNT(*) as actions_count,
  MAX(created_at) as last_action
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id 
HAVING COUNT(*) > 100;
```

## 🎯 **Checklist de Segurança**

- ✅ Autenticação com Supabase
- ✅ Middleware de proteção
- ✅ APIs protegidas
- ✅ Logs de segurança
- 🔄 Row Level Security (RLS)
- 🔄 Validação de dados
- 🔄 Rate limiting
- 🔄 Auditoria completa
- 🔄 Monitoramento

## 🚀 **Como Implementar**

1. **Execute o SQL do RLS** no Supabase
2. **Adicione colunas de auditoria** nas tabelas
3. **Implemente validação** com Zod
4. **Configure rate limiting** se necessário
5. **Monitore os logs** regularmente

---

**Status:** ✅ Sistema básico de segurança implementado
**Próximo:** Implementar RLS e auditoria completa

