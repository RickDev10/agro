# 🚀 GUIA DE IMPLEMENTAÇÃO PASSO A PASSO

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **FASE 1: PREPARAÇÃO (30 minutos)**

#### ✅ **Passo 1: Backup do Banco de Dados**
```bash
# Faça backup antes de implementar (OBRIGATÓRIO)
# No Supabase Dashboard:
# Settings > Database > Database backups
```

#### ✅ **Passo 2: Variáveis de Ambiente**
Certifique-se que seu `.env.local` tem:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

#### ✅ **Passo 3: Instalar Dependências**
```bash
npm install
```

---

### **FASE 2: CONFIGURAÇÃO DE SEGURANÇA NO BANCO (45 minutos)**

#### ✅ **Passo 4: Executar Scripts SQL**
Execute na seguinte ordem no SQL Editor do Supabase:

1. **Ativar RLS:**
```bash
# Copie e execute: sql/01_enable_rls.sql
```

2. **Criar Políticas:**
```bash
# Copie e execute: sql/02_create_policies.sql
```

#### ✅ **Passo 5: Verificar RLS**
No SQL Editor, execute para verificar:
```sql
-- Verificar se RLS está ativo
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- Deve mostrar todas as suas tabelas com rowsecurity = true
```

---

### **FASE 3: IMPLEMENTAÇÃO NO CÓDIGO (60 minutos)**

#### ✅ **Passo 6: Testar Middleware de Autenticação**
Crie um arquivo de teste:

```typescript
// src/app/api/test-auth/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/protected-api'

async function handleGet(request: AuthenticatedRequest) {
  return NextResponse.json({
    message: 'Autenticação funcionando!',
    user: {
      id: request.userId,
      email: request.userEmail
    }
  })
}

export const GET = withAuth(handleGet)
```

#### ✅ **Passo 7: Atualizar Frontend para Usar API Segura**
Substitua chamadas da API antiga pela nova:

```typescript
// ANTES (inseguro)
import { funcionariosApi } from '@/lib/api'

// DEPOIS (seguro)
import { funcionariosApi } from '@/lib/api/funcionarios'
```

#### ✅ **Passo 8: Testar API Protegida**
1. Faça login no sistema
2. Acesse: `http://localhost:3000/api/test-auth`
3. Deve retornar dados do usuário, não erro 401

#### ✅ **Passo 9: Migrar APIs Uma por Uma**
Comece com funcionários como exemplo:

1. **Mover API antiga:** 
   - Renomeie `src/app/api/funcionarios/route.ts` para `route.ts.backup`

2. **Ativar API segura:**
   - Mova `src/app/api/funcionarios/secure/route.ts` para `src/app/api/funcionarios/route.ts`

3. **Testar:**
   ```bash
   # Teste GET (deve funcionar com usuário logado)
   curl -H "Authorization: Bearer SEU_TOKEN" http://localhost:3000/api/funcionarios
   
   # Teste sem token (deve retornar 401)
   curl http://localhost:3000/api/funcionarios
   ```

---

### **FASE 4: CONFIGURAÇÃO DE ORGANIZAÇÕES (30 minutos)**

#### ✅ **Passo 10: Criar Primeira Organização**
Execute no SQL Editor:

```sql
-- Inserir organização padrão
INSERT INTO organizations (name, slug, created_by) 
VALUES ('Minha Fazenda', 'minha-fazenda', auth.uid());

-- Adicionar usuário atual como owner
INSERT INTO organization_members (user_id, organization_id, role)
VALUES (
  auth.uid(),
  (SELECT id FROM organizations WHERE slug = 'minha-fazenda'),
  'owner'
);
```

#### ✅ **Passo 11: Associar Dados Existentes**
Execute para associar dados existentes à organização:

```sql
-- Atualizar dados existentes com organization_id
UPDATE funcionarios 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'minha-fazenda'),
    created_by = auth.uid()
WHERE organization_id IS NULL;

UPDATE safras 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'minha-fazenda'),
    created_by = auth.uid()
WHERE organization_id IS NULL;

-- Repita para outras tabelas importantes
UPDATE insumos 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'minha-fazenda'),
    created_by = auth.uid()
WHERE organization_id IS NULL;
```

---

### **FASE 5: TESTES DE SEGURANÇA (45 minutos)**

#### ✅ **Passo 12: Criar Usuário de Teste**
1. Registre um novo usuário no sistema
2. **NÃO** adicione ele à organização ainda

#### ✅ **Passo 13: Testar Isolamento de Dados**
1. Faça login com o usuário de teste
2. Tente acessar `/api/funcionarios`
3. **Deve retornar lista vazia** (não os dados do usuário principal)

#### ✅ **Passo 14: Testar Prevenção de Acesso**
1. Com usuário de teste, tente criar um funcionário
2. Tente acessar dados via ID específico
3. **Deve ser bloqueado pelas políticas RLS**

#### ✅ **Passo 15: Validar Logs de Auditoria**
Execute no SQL Editor:
```sql
-- Ver logs de auditoria
SELECT 
  al.*,
  u.email as user_email
FROM audit_logs al
LEFT JOIN auth.users u ON al.user_id = u.id
ORDER BY al.created_at DESC
LIMIT 10;
```

---

### **FASE 6: OTIMIZAÇÃO E MONITORAMENTO (30 minutos)**

#### ✅ **Passo 16: Configurar Rate Limiting**
Para produção, configure Redis e ative rate limiting real:

```typescript
// .env.local
REDIS_URL=redis://localhost:6379

// Em src/middleware/auth.ts
// Implemente checkRateLimit() com Redis
```

#### ✅ **Passo 17: Configurar Alertas**
Configure alertas para:
- Tentativas de acesso não autorizado
- Erros 401/403 em alta frequência
- Operações administrativas (DELETE, etc.)

#### ✅ **Passo 18: Documentar Usuários**
Crie documento interno sobre:
- Como adicionar novos usuários
- Como configurar permissões
- Como gerenciar organizações

---

## 🔧 **COMANDOS ÚTEIS DE DESENVOLVIMENTO**

### **Verificar Status de Segurança:**
```sql
-- Verificar RLS ativo
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verificar políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public';

-- Verificar organizações e membros
SELECT o.name, om.role, u.email
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
JOIN auth.users u ON om.user_id = u.id;
```

### **Reset Completo (Emergência):**
```sql
-- CUIDADO! Remove todas as políticas
DROP POLICY IF EXISTS funcionarios_select_policy ON funcionarios;
DROP POLICY IF EXISTS funcionarios_insert_policy ON funcionarios;
-- etc...

-- Desativar RLS temporariamente
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
-- etc...
```

### **Debug de Requisições:**
```bash
# Obter token do usuário logado (no browser console)
const { data } = await supabase.auth.getSession()
console.log('Token:', data.session.access_token)

# Testar API com curl
curl -H "Authorization: Bearer TOKEN_AQUI" http://localhost:3000/api/funcionarios
```

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Erro: "RLS is enabled but no policy"**
**Solução:** Execute o script `02_create_policies.sql`

### **Erro: "JWT expired"**
**Solução:** Token expirou, faça login novamente

### **Erro: "Cannot read properties of null"**
**Solução:** Usuário não está associado a nenhuma organização

### **API retorna dados vazios após RLS**
**Solução:** Execute o Passo 11 para associar dados à organização

### **Usuário não consegue criar dados**
**Solução:** Verifique se `created_by` está sendo definido corretamente

---

## ✅ **VALIDAÇÃO FINAL**

Após completar todos os passos, você deve ter:

- [ ] ✅ RLS ativo em todas as tabelas
- [ ] ✅ APIs protegidas por autenticação
- [ ] ✅ Isolamento de dados por organização
- [ ] ✅ Logs de auditoria funcionando
- [ ] ✅ Rate limiting básico implementado
- [ ] ✅ Frontend usando APIs seguras
- [ ] ✅ Testes de segurança validados

**🎉 Parabéns! Seu sistema agora está seguro e pronto para produção!**

---

## 📞 **SUPORTE**

Se encontrar problemas durante a implementação:

1. **Verifique os logs** no console do navegador e servidor
2. **Consulte o SQL Editor** do Supabase para erros de banco
3. **Teste com usuários diferentes** para validar isolamento
4. **Execute os comandos de debug** mostrados acima

Lembre-se: **Sempre faça backup antes de implementar em produção!**
