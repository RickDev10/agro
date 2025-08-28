# Agro Dashboard

Sistema de gestão para agronegócio desenvolvido com Next.js, TypeScript e Supabase.

## 🚀 Stack Tecnológica

- **Frontend**: React/Next.js + TypeScript
- **Autenticação**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **HTTP Client**: Axios + React Query
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Query

## 📋 Funcionalidades

### ✅ Implementadas (FASE 1-2)
- [x] Setup inicial do projeto
- [x] Configuração do Supabase
- [x] Sistema de autenticação (login/registro)
- [x] Layout responsivo com sidebar
- [x] Proteção de rotas
- [x] Dashboard principal com métricas
- [x] Estrutura de tipos TypeScript

### 🔄 Em Desenvolvimento
- [ ] Módulo Funcionários (CRUD completo)
- [ ] Módulo Safras (CRUD completo)
- [ ] Módulo Insumos (CRUD completo)
- [ ] Módulo Tratores (CRUD completo)
- [ ] Relatórios e gráficos
- [ ] Webhooks para integração

## 🛠️ Configuração

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd agro
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Vá em Settings > API para obter suas credenciais
4. Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
API_BASE_URL=http://localhost:3000/api
```

### 4. Execute o projeto
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js 13+ (App Router)
│   ├── auth/              # Páginas de autenticação
│   ├── dashboard/         # Dashboard principal
│   ├── funcionarios/      # Módulo funcionários
│   ├── safras/           # Módulo safras
│   ├── insumos/          # Módulo insumos
│   ├── tratores/         # Módulo tratores
│   └── relatorios/       # Módulo relatórios
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI básicos
│   ├── layout/           # Componentes de layout
│   ├── charts/           # Componentes de gráficos
│   └── forms/            # Componentes de formulários
├── hooks/                # Hooks personalizados
├── lib/                  # Configurações e utilitários
├── types/                # Definições TypeScript
└── utils/                # Funções utilitárias
```

## 🔐 Autenticação

O sistema usa Supabase Auth para autenticação. Funcionalidades:

- Login com email/senha
- Registro de novos usuários
- Proteção de rotas
- Persistência de sessão
- Logout automático

## 🎨 Tema

O sistema usa um tema agronegócio com:
- Cores principais: Verde (#16a34a, #15803d)
- Design responsivo
- Componentes modernos
- Ícones Lucide React

## 📊 Próximos Passos

### FASE 3: Módulo Funcionários
- [ ] CRUD de funcionários
- [ ] Gestão de gastos
- [ ] Relatórios de folha

### FASE 4: Módulo Safras
- [ ] CRUD de safras
- [ ] Controle de produção
- [ ] Análise de rentabilidade

### FASE 5: Módulo Insumos
- [ ] CRUD de insumos
- [ ] Controle de estoque
- [ ] Gestão de custos

### FASE 6: Módulo Tratores
- [ ] CRUD de tratores
- [ ] Monitoramento de uso
- [ ] Agenda de manutenção

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, envie um email para [seu-email@exemplo.com] ou abra uma issue no GitHub.
