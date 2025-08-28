# Sistema de Widgets Personalizáveis

## 🎯 Visão Geral

Implementamos um sistema completo de widgets personalizáveis que permite aos usuários criar dashboards customizados tanto para o dashboard principal quanto para relatórios específicos.

## 🏗️ Arquitetura

### 1. **Tipos e Interfaces** (`src/types/widgets.ts`)
- `WidgetConfig`: Configuração completa de um widget
- `WidgetType`: Tipos disponíveis (metric-card, chart, filters, etc.)
- `WidgetProps`: Props para componentes de widget
- `DashboardLayout`: Layout de dashboard com widgets
- `WidgetSettings`: Configurações específicas por tipo

### 2. **Componentes Base**
- `WidgetContainer`: Container base com funcionalidades de edição
- `WidgetManager`: Gerenciador principal de widgets
- `MetricCardWidget`: Widget de cartão de métrica
- `ChartWidget`: Widget de gráficos
- `FiltersWidget`: Widget de filtros

### 3. **API e Banco de Dados**
- `user_widgets` table: Armazena configurações por usuário e tipo
- `/api/widgets`: API para salvar/carregar widgets
- Suporte a múltiplos layouts (dashboard, relatórios)

## 📊 Widgets Disponíveis

### 1. **Cartão de Métrica** (`metric-card`)
- Exibe métricas específicas do dashboard
- Configurável: tipo de métrica, cor, ícone
- Métricas disponíveis:
  - Total de Safras
  - Total de Funcionários
  - Total de Tratores
  - Total de Talhões
  - Gastos do Mês
  - Atividades em Andamento

### 2. **Gráfico** (`chart`)
- Exibe dados em diferentes formatos
- Tipos: Bar, Line, Pie, Area
- Fontes de dados:
  - Rentabilidade
  - Performance Operacional
  - Estoque e Sobra
  - Produtividade por Hectare

### 3. **Filtros** (`filters`)
- Filtros personalizáveis para relatórios
- Filtros disponíveis:
  - Safra
  - Trator
  - Funcionário
  - Talhão
  - Período (Data Início/Fim)

## 🎨 Funcionalidades

### **Dashboard Principal**
- Botão para alternar entre dashboard padrão e widgets personalizados
- Sistema de edição inline
- Salvamento automático de configurações
- Grid responsivo

### **Página de Relatórios Personalizados**
- Nova página dedicada (`/dashboard/relatorios-widgets`)
- Foco em widgets de análise e filtros
- Interface otimizada para relatórios

### **Sistema de Edição**
- Modo de edição com controles visuais
- Drag & drop (preparado para implementação)
- Configuração de visibilidade
- Remoção de widgets

## 🔧 Configuração

### **Banco de Dados**
Execute o SQL em `create-user-widgets-table.sql`:
```sql
CREATE TABLE IF NOT EXISTS user_widgets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_type VARCHAR(50) NOT NULL DEFAULT 'dashboard',
  widgets JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, layout_type)
);
```

### **Estrutura de Dados**
```typescript
interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  description?: string
  position: { x: number, y: number, width: number, height: number }
  visible: boolean
  settings: Record<string, any>
  data?: any
}
```

## 🚀 Como Usar

### **1. Dashboard Principal**
1. Acesse o dashboard
2. Clique em "Widgets Personalizados"
3. Clique em "Editar"
4. Adicione widgets desejados
5. Configure cada widget
6. Clique em "Salvar"

### **2. Relatórios Personalizados**
1. Acesse "Relatórios Personalizados" no menu
2. Clique em "Editar"
3. Adicione widgets de gráficos e filtros
4. Configure as fontes de dados
5. Salve a configuração

## 🔮 Próximos Passos

### **Funcionalidades Planejadas**
1. **Drag & Drop**: Reorganização visual de widgets
2. **Templates**: Layouts pré-definidos
3. **Exportação**: Salvar/importar configurações
4. **Compartilhamento**: Compartilhar layouts entre usuários
5. **Widgets Avançados**: Tabelas, KPIs, alertas

### **Melhorias Técnicas**
1. **Performance**: Lazy loading de widgets
2. **Cache**: Cache de dados de widgets
3. **Validação**: Validação de configurações
4. **Testes**: Testes unitários e de integração

## 📱 Responsividade

- Grid adaptativo (1-4 colunas)
- Widgets responsivos
- Interface mobile-friendly
- Controles touch-friendly

## 🎨 Design System

- Consistente com o tema do sistema
- Cores padronizadas
- Ícones Lucide React
- Animações suaves
- Estados de loading/erro

## 🔒 Segurança

- Autenticação obrigatória
- RLS (Row Level Security) no banco
- Validação de dados
- Sanitização de inputs

## 📈 Benefícios

1. **Flexibilidade**: Usuários podem personalizar suas experiências
2. **Produtividade**: Acesso rápido às informações mais relevantes
3. **Escalabilidade**: Sistema preparado para novos tipos de widget
4. **Manutenibilidade**: Código modular e bem estruturado
5. **UX**: Interface intuitiva e moderna
