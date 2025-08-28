# Sistema de Dados Mock - Agro Dashboard

## 📋 Visão Geral

Este sistema permite desligar temporariamente as APIs e usar dados mock em todas as páginas do sistema. Isso facilita o desenvolvimento e teste da interface sem depender de APIs externas.

## 🚀 Como Usar

### 1. Configuração

O sistema de dados mock é controlado pelo arquivo `src/config/mockConfig.ts`:

```typescript
export const MOCK_CONFIG = {
  // Ativar modo mock para todas as páginas
  ENABLE_MOCK_MODE: true,
  
  // Configurações específicas por módulo
  MODULES: {
    DASHBOARD: true,
    FUNCIONARIOS: true,
    SAFRAS: true,
    INSUMOS: true,
    TRATORES: true,
    TALHOES: true,
    PLANTIO: true,
    COLHEITA: true,
    MANUTENCAO: true,
    COMBUSTIVEL: true,
    GASTOS: true,
    MAPA: true
  }
}
```

### 2. Para Desativar APIs e Usar Dados Mock

1. **Ativar modo mock global:**
   ```typescript
   ENABLE_MOCK_MODE: true
   ```

2. **Ativar módulos específicos:**
   ```typescript
   MODULES: {
     DASHBOARD: true,
     FUNCIONARIOS: true,
     // ... outros módulos
   }
   ```

### 3. Para Voltar às APIs Reais

1. **Desativar modo mock global:**
   ```typescript
   ENABLE_MOCK_MODE: false
   ```

2. **Ou desativar módulos específicos:**
   ```typescript
   MODULES: {
     DASHBOARD: false,
     FUNCIONARIOS: false,
     // ... outros módulos
   }
   ```

## 📁 Estrutura dos Arquivos

### Dados Mock Centralizados
- `src/lib/mockData.ts` - Todos os dados mock do sistema
- `src/hooks/useMockData.ts` - Hooks para usar dados mock
- `src/config/mockConfig.ts` - Configuração do sistema

### Hooks Disponíveis

#### 1. `useMockData` - Para listas simples
```typescript
const { data, loading, error, refetch } = useMockData<Funcionario>('funcionarios')
```

#### 2. `useMockDataSingle` - Para dados únicos
```typescript
const { data, loading, error, refetch } = useMockDataSingle('dashboard')
```

#### 3. `useMockDataCRUD` - Para operações CRUD completas
```typescript
const { 
  data, 
  loading, 
  error, 
  create, 
  update, 
  remove, 
  refetch 
} = useMockDataCRUD<Funcionario>('funcionarios')
```

## 🔧 Exemplo de Implementação

### Antes (com API real):
```typescript
const [funcionarios, setFuncionarios] = useState([])
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    const response = await fetch('/api/funcionarios')
    const result = await response.json()
    setFuncionarios(result.data)
    setLoading(false)
  }
  fetchData()
}, [])
```

### Depois (com dados mock):
```typescript
import { useMockDataCRUD } from '@/hooks/useMockData'
import { isMockModeEnabled } from '@/config/mockConfig'

const { 
  data: funcionarios, 
  loading, 
  error, 
  create, 
  update, 
  remove 
} = useMockDataCRUD<Funcionario>('funcionarios', {
  delay: 600,
  enableError: false
})
```

## 📊 Dados Mock Disponíveis

### Dashboard
- Métricas gerais (funcionários, tratores, safras, etc.)
- Gráficos de produção mensal
- Gráficos de custos por categoria

### Funcionários
- Lista de funcionários com dados completos
- Operações CRUD (criar, editar, excluir)

### Safras
- Safras ativas e históricas
- Dados de produção e faturamento

### Insumos
- Lista de insumos com quantidades e valores
- Controle de estoque

### Tratores
- Lista de tratores com status de manutenção
- Tempo para próxima manutenção

### Mapa
- Coordenadas de fazendas rurais
- Localização de funcionários e equipamentos

## ⚙️ Configurações de Simulação

```typescript
SIMULATION: {
  // Delay simulado para APIs (em ms)
  API_DELAY: 500,
  
  // Probabilidade de erro simulado (0-1)
  ERROR_PROBABILITY: 0.1,
  
  // Ativar simulação de erros
  ENABLE_ERROR_SIMULATION: false
}
```

## 🎯 Benefícios

1. **Desenvolvimento Rápido** - Não depende de APIs externas
2. **Testes Consistentes** - Dados sempre disponíveis
3. **Controle Total** - Pode simular diferentes cenários
4. **Performance** - Carregamento instantâneo
5. **Flexibilidade** - Fácil alternar entre mock e APIs reais

## 🔄 Migração de APIs para Mock

### Passo 1: Importar hooks
```typescript
import { useMockDataCRUD } from '@/hooks/useMockData'
import { isMockModeEnabled } from '@/config/mockConfig'
```

### Passo 2: Substituir estados
```typescript
// Antes
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)

// Depois
const { data, loading, error, create, update, remove } = useMockDataCRUD('modulo')
```

### Passo 3: Atualizar operações CRUD
```typescript
// Antes
const response = await fetch('/api/modulo', { method: 'POST', body: JSON.stringify(data) })

// Depois
await create(data)
```

## 🚨 Importante

- Os dados mock são **temporários** e não persistem entre sessões
- Para produção, sempre use as APIs reais
- O sistema permite alternar facilmente entre mock e APIs reais
- Todos os dados mock são realistas e representativos do agronegócio

## 📝 Notas

- O mapa usa coordenadas reais de uma região rural do interior de São Paulo
- Os dados financeiros são representativos de uma fazenda média
- As culturas são típicas do agronegócio brasileiro (soja, milho, cana-de-açúcar)
- Os nomes e dados pessoais são fictícios
