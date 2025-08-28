# 🧪 **TESTE DE AUTENTICAÇÃO E RLS**

## 🎯 **Status Atual**
- ✅ **Middleware**: Configurado com autenticação JWT
- ✅ **RLS**: Habilitado em todas as tabelas
- ✅ **Políticas**: Criadas para usuários autenticados
- ✅ **API Funcionários**: Protegida com autenticação

## 🚀 **Como Testar**

### **1. Teste Básico de Autenticação**
```bash
# Acesse no navegador (deve retornar 401 se não estiver logado)
http://localhost:3000/api/funcionarios
```

### **2. Teste Completo de Autenticação + RLS**
```bash
# Acesse no navegador (deve retornar 401 se não estiver logado)
http://localhost:3000/api/test-auth-rls
```

### **3. Teste via cURL (sem autenticação)**
```bash
curl http://localhost:3000/api/funcionarios
# Deve retornar: {"error":"Token de autenticação não fornecido"}
```

### **4. Teste via cURL (com autenticação)**
```bash
# Primeiro, faça login no site e pegue o token do localStorage
# Depois execute:
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" http://localhost:3000/api/funcionarios
```

## 📋 **Checklist de Teste**

### **✅ Teste 1: Sem Autenticação**
- [ ] Acesse `http://localhost:3000/api/funcionarios` sem estar logado
- [ ] **Resultado esperado**: 401 Unauthorized
- [ ] **Mensagem**: "Token de autenticação não fornecido"

### **✅ Teste 2: Com Autenticação**
- [ ] Faça login no site
- [ ] Acesse `http://localhost:3000/api/funcionarios`
- [ ] **Resultado esperado**: 200 OK com dados
- [ ] **Dados**: Lista de funcionários do banco

### **✅ Teste 3: Teste Completo RLS**
- [ ] Faça login no site
- [ ] Acesse `http://localhost:3000/api/test-auth-rls`
- [ ] **Resultado esperado**: 200 OK
- [ ] **Mensagem**: "Autenticação e RLS funcionando perfeitamente!"

### **✅ Teste 4: Página de Funcionários**
- [ ] Faça login no site
- [ ] Acesse `/dashboard/funcionarios`
- [ ] **Resultado esperado**: Página carrega com dados
- [ ] **Funcionalidade**: CRUD completo funcionando

## 🔍 **Logs para Verificar**

### **No Console do Navegador (F12):**
```
🔍 Middleware executado para: /api/funcionarios
🔐 Verificando autenticação para API: /api/funcionarios
🔍 Verificando token JWT...
✅ Usuário autenticado: seu-email@exemplo.com
🔍 GET /api/funcionarios - Iniciando...
✅ Usuário autenticado: seu-email@exemplo.com
🔍 Fazendo query no Supabase...
✅ Dados retornados: X funcionários
```

### **No Terminal (Next.js):**
```
🔍 Middleware executado para: /api/funcionarios
🔐 Verificando autenticação para API: /api/funcionarios
✅ Usuário autenticado: seu-email@exemplo.com
🔍 GET /api/funcionarios - Iniciando...
✅ Usuário autenticado: seu-email@exemplo.com
🔍 Fazendo query no Supabase...
✅ Dados retornados: X funcionários
```

## 🚨 **Possíveis Problemas**

### **Problema 1: 401 Unauthorized mesmo logado**
**Causa**: Token JWT não está sendo enviado corretamente
**Solução**: Verificar se o `src/lib/api.ts` está enviando o token

### **Problema 2: 403 Forbidden**
**Causa**: RLS bloqueando acesso
**Solução**: Verificar se as políticas foram criadas corretamente

### **Problema 3: Erro de conexão com Supabase**
**Causa**: Variáveis de ambiente incorretas
**Solução**: Verificar `.env.local`

## 🎯 **Resultado Esperado**

Se tudo estiver funcionando corretamente:

1. **Sem login**: 401 Unauthorized
2. **Com login**: 200 OK com dados
3. **RLS**: Funcionando (apenas usuários autenticados acessam)
4. **Auditoria**: Campos `created_by` sendo preenchidos

## 📞 **Próximos Passos**

Após os testes:
1. **Se funcionar**: Implementar RLS em outras APIs
2. **Se não funcionar**: Verificar logs e ajustar configuração
3. **Se houver problemas**: Revisar políticas RLS no Supabase

---

**Execute os testes e me diga os resultados!**
