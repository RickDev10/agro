# 🔐 PLANO COMPLETO DE SEGURANÇA - PROJETO AGRO

## 📊 ANÁLISE DA SITUAÇÃO ATUAL

### ✅ PONTOS POSITIVOS IDENTIFICADOS
- **Frontend**: Sistema de autenticação bem estruturado
- **Hooks**: useAuth implementado corretamente
- **Proteção de Rotas**: ProtectedRoute funcional
- **Supabase Client**: Configuração adequada para o frontend

### ❌ PROBLEMAS CRÍTICOS IDENTIFICADOS

#### 1. APIs Desprotegidas
```typescript
// PROBLEMA: Todas as APIs usam service role key
const supabase = createServiceClient() // ❌ INSEGURO
```

#### 2. Sem Verificação de Autenticação
```typescript
// PROBLEMA: Nenhuma verificação de token
export async function GET(request: NextRequest) {
  // ❌ Direto para o banco sem verificar usuário
  const { data } = await supabase.from('funcionarios').select('*')
}
```

#### 3. Sem RLS (Row Level Security)
- Tabelas sem políticas de segurança
- Qualquer usuário autenticado acessa todos os dados
- Sem isolamento entre diferentes usuários/empresas

---

## 🏗️ ARQUITETURA SEGURA PROPOSTA

### FASE 1: CONFIGURAÇÃO BÁSICA DE SEGURANÇA

#### 1.1 Middleware de Autenticação
```typescript
// middleware/auth.ts
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function authenticateRequest(request: NextRequest) {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Token não fornecido')
    }

    const token = authHeader.substring(7)
    const supabase = createClient()
    
    // Verificar e decodificar o token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('Token inválido')
    }

    return {
      user,
      userId: user.id,
      userEmail: user.email
    }
  } catch (error) {
    return null
  }
}
```

#### 1.2 Wrapper para APIs Protegidas
```typescript
// lib/protected-api.ts
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/middleware/auth'

export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const authResult = await authenticateRequest(request)
      
      if (!authResult) {
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        )
      }

      // Adicionar dados do usuário ao request
      (request as any).user = authResult.user
      (request as any).userId = authResult.userId
      
      return handler(request, ...args)
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro de autenticação' },
        { status: 500 }
      )
    }
  }
}
```

#### 1.3 Cliente Supabase com Token do Usuário
```typescript
// lib/supabase/authenticated.ts
import { createClient as supabaseCreateClient } from '@supabase/supabase-js'

export function createAuthenticatedClient(userToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  const supabase = supabaseCreateClient(supabaseUrl, supabaseAnonKey)
  
  // Definir o token do usuário autenticado
  supabase.auth.setSession({
    access_token: userToken,
    refresh_token: '', // Não precisamos do refresh no backend
  })
  
  return supabase
}
```

### FASE 2: IMPLEMENTAÇÃO DE RLS (ROW LEVEL SECURITY)

#### 2.1 Políticas para Tabelas Principais
```sql
-- Ativar RLS em todas as tabelas
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tratores ENABLE ROW LEVEL SECURITY;
ALTER TABLE talhoes ENABLE ROW LEVEL SECURITY;
-- ... todas as outras tabelas

-- Política para funcionários (exemplo)
CREATE POLICY "Usuários podem ver apenas seus funcionários" 
ON funcionarios FOR SELECT 
USING (auth.uid() = created_by OR auth.uid() IN (
  SELECT user_id FROM user_permissions 
  WHERE table_name = 'funcionarios' AND permission = 'read'
));

CREATE POLICY "Usuários podem inserir funcionários" 
ON funcionarios FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Usuários podem atualizar seus funcionários" 
ON funcionarios FOR UPDATE 
USING (auth.uid() = created_by OR auth.uid() IN (
  SELECT user_id FROM user_permissions 
  WHERE table_name = 'funcionarios' AND permission = 'write'
));
```

#### 2.2 Sistema de Permissões por Usuário
```sql
-- Tabela de permissões
CREATE TABLE user_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'delete', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Tabela de organizações/empresas
CREATE TABLE organizations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Relacionamento usuário-organização
CREATE TABLE user_organizations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  organization_id INTEGER REFERENCES organizations(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### FASE 3: REFATORAÇÃO DAS APIs

#### 3.1 Nova Estrutura da API de Funcionários
```typescript
// app/api/funcionarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/protected-api'
import { createAuthenticatedClient } from '@/lib/supabase/authenticated'

async function handleGet(request: NextRequest) {
  try {
    const userId = (request as any).userId
    const userToken = request.headers.get('Authorization')?.substring(7)
    
    const supabase = createAuthenticatedClient(userToken!)
    
    // RLS automaticamente filtra por usuário
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .order('nome', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar funcionários' },
      { status: 500 }
    )
  }
}

async function handlePost(request: NextRequest) {
  try {
    const userId = (request as any).userId
    const userToken = request.headers.get('Authorization')?.substring(7)
    const body = await request.json()
    
    const supabase = createAuthenticatedClient(userToken!)
    
    const { data, error } = await supabase
      .from('funcionarios')
      .insert({
        ...body,
        created_by: userId // RLS usa este campo
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Erro ao criar funcionário' },
      { status: 500 }
    )
  }
}

// Aplicar proteção de autenticação
export const GET = withAuth(handleGet)
export const POST = withAuth(handlePost)
export const PUT = withAuth(handlePut)
export const DELETE = withAuth(handleDelete)
```

#### 3.2 Atualização do Cliente Frontend
```typescript
// lib/api.ts (atualizado)
import { createClient } from '@/lib/supabase'

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Usuário não autenticado')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`, // ✅ Token incluso
      ...(options.headers as Record<string, string>),
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      // Token expirado, redirecionar para login
      window.location.href = '/auth/login'
      return
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `API Error: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error('❌ Erro no apiRequest:', error)
    throw error
  }
}
```

### FASE 4: FUNCIONALIDADES AVANÇADAS

#### 4.1 Rate Limiting
```typescript
// middleware/rate-limit.ts
import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export async function rateLimit(request: NextRequest, limit: number = 100) {
  const ip = request.ip || 'unknown'
  const key = `rate_limit:${ip}`
  
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, 3600) // 1 hora
  }
  
  if (current > limit) {
    throw new Error('Rate limit excedido')
  }
  
  return current
}
```

#### 4.2 Auditoria e Logs
```typescript
// lib/audit.ts
export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  details?: any
) {
  const supabase = createServiceClient()
  
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource,
    details,
    ip_address: '', // Pegar do request
    user_agent: '', // Pegar do request
    created_at: new Date().toISOString()
  })
}
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### Semana 1: Configuração Base
- [x] Análise da situação atual
- [ ] Implementar middleware de autenticação
- [ ] Criar wrapper para APIs protegidas
- [ ] Atualizar uma API como exemplo (funcionários)

### Semana 2: RLS e Políticas
- [ ] Ativar RLS em todas as tabelas
- [ ] Criar políticas básicas de segurança
- [ ] Implementar sistema de organizações
- [ ] Testar isolamento de dados

### Semana 3: Refatoração das APIs
- [ ] Atualizar todas as APIs para usar autenticação
- [ ] Implementar cliente autenticado do Supabase
- [ ] Atualizar frontend para enviar tokens
- [ ] Testes de segurança

### Semana 4: Funcionalidades Avançadas
- [ ] Implementar rate limiting
- [ ] Sistema de auditoria
- [ ] Monitoramento e alertas
- [ ] Documentação final

---

## 🔧 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Para funcionalidades avançadas
REDIS_URL=redis://localhost:6379
JWT_SECRET=seu_jwt_secret_para_verificacoes_adicionais
```

---

## 🚨 MEDIDAS IMEDIATAS DE SEGURANÇA

### Para implementar AGORA:
1. **Adicionar verificação básica de token nas APIs**
2. **Ativar RLS nas tabelas principais**
3. **Criar políticas básicas de acesso**
4. **Atualizar o frontend para enviar tokens**

### Benefícios Imediatos:
- ✅ APIs protegidas por autenticação
- ✅ Isolamento de dados por usuário
- ✅ Prevenção de ataques de acesso não autorizado
- ✅ Conformidade com práticas de segurança

---

Este plano garante que seu sistema ficará seguro e preparado para produção, seguindo as melhores práticas de segurança em aplicações web modernas.
