# Sistema Administrativo Onkhos

## Visão Geral

O Sistema Administrativo Onkhos é uma área exclusiva para administradores especiais do sistema, permitindo o controle total sobre clínicas, operadoras e monitoramento do sistema.

## Acesso Administrativo

### Credenciais Especiais
- **Usuário:** `OnkhosGlobal`
- **Senha:** `Douglas193`

### Como Acessar
1. Acesse a página de login principal (`/`)
2. Digite as credenciais administrativas especiais
3. O sistema automaticamente redirecionará para `/admin/controle-sistema`

## Funcionalidades Disponíveis

### 1. Dashboard Administrativo
- **Métricas Principais:** Total de clínicas, pacientes, protocolos e taxa de aprovação
- **Gráficos:** Evolução das solicitações por mês e distribuição de status
- **Performance das Clínicas:** Ranking por taxa de aprovação e tempo médio de resposta
- **Resumo Rápido:** Solicitações do dia, princípios ativos e tempo médio de resposta

### 2. Cadastro de Clínicas
- **Formulário Completo:** Nome, código, CNPJ, endereço, contatos
- **Gestão de Status:** Ativo, Inativo, Pendente
- **Múltiplos Contatos:** Telefones e e-mails dinâmicos
- **Busca e Filtros:** Por nome, código ou CNPJ
- **CRUD Completo:** Criar, editar, excluir clínicas

### 3. Cadastro de Operadoras
- **Tipos de Operadora:** Plano de Saúde, Medicina, Odontologia, Outros
- **Informações de Performance:** Tempo médio de resposta e taxa de aprovação
- **Status de Credenciamento:** Sim, Pendente, Não
- **Gestão Completa:** Endereço, contatos, observações

### 4. Logs do Sistema
- **Níveis de Log:** Error, Warning, Info, Debug
- **Categorias:** Sistema, Banco de Dados, API, Autenticação, Usuário, Performance
- **Filtros Avançados:** Por nível, categoria e busca textual
- **Detalhes Técnicos:** Stack traces, IPs, endpoints, tempos de resposta
- **Exportação:** Download em CSV
- **Auto-refresh:** Atualização automática a cada 10 segundos

## Estrutura de Arquivos

```
src/
├── pages/
│   ├── AdminControleSistema.tsx          # Página principal administrativa
│   └── admin/
│       ├── DashboardAdmin.tsx            # Dashboard com métricas
│       ├── CadastroClinicas.tsx          # Gestão de clínicas
│       ├── CadastroOperadoras.tsx        # Gestão de operadoras
│       └── LogsSistema.tsx               # Monitoramento de logs
├── contexts/
│   └── AdminContext.tsx                  # Contexto administrativo
└── App.tsx                               # Rotas administrativas
```

## Rotas Administrativas

- `/admin/controle-sistema` - Página principal administrativa
- `/admin/clinicas/register` - Cadastro de clínicas (rota existente)

## Segurança

### Proteção de Rotas
- Todas as rotas administrativas são protegidas pelo `AdminRoute`
- Verificação de credenciais especiais (`isSpecialAdmin`)
- Redirecionamento automático para login em caso de acesso não autorizado

### Contexto Administrativo
- Gerenciamento de estado administrativo
- Verificação de acesso especial
- Logout administrativo com limpeza de dados

## Integração com o Sistema Existente

### Compatibilidade
- Mantém o design e padrões visuais existentes
- Utiliza os mesmos componentes UI (`shadcn/ui`)
- Integra com o sistema de notificações (`sonner`)
- Compatível com o tema claro/escuro

### Dados Mock
- Por enquanto, utiliza dados simulados para demonstração
- Estrutura preparada para integração com APIs reais
- Fácil substituição dos dados mock por chamadas reais

## Como Implementar APIs Reais

### 1. Dashboard Administrativo
```typescript
// Substituir em DashboardAdmin.tsx
const loadDashboardData = async () => {
  try {
    const [metrics, performance] = await Promise.all([
      fetch('/api/admin/metrics').then(r => r.json()),
      fetch('/api/admin/clinicas/performance').then(r => r.json())
    ]);
    setMetrics(metrics);
    setClinicasPerformance(performance);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
};
```

### 2. Cadastro de Clínicas
```typescript
// Substituir em CadastroClinicas.tsx
const loadClinicas = async () => {
  const response = await fetch('/api/admin/clinicas');
  const clinicas = await response.json();
  setClinicas(clinicas);
};

const handleSubmit = async (e: React.FormEvent) => {
  const response = await fetch('/api/admin/clinicas', {
    method: editingClinica ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  // Tratar resposta
};
```

### 3. Logs do Sistema
```typescript
// Substituir em LogsSistema.tsx
const loadLogs = async () => {
  const response = await fetch('/api/admin/logs');
  const logs = await response.json();
  setLogs(logs);
};
```

## Personalizações

### Cores e Temas
- Cores personalizáveis via CSS variables
- Suporte a tema claro/escuro
- Gradientes e sombras consistentes com o design existente

### Responsividade
- Layout responsivo para mobile e desktop
- Grid adaptativo para diferentes tamanhos de tela
- Componentes otimizados para dispositivos móveis

## Manutenção

### Limpeza de Logs
- Função para limpar logs antigos
- Confirmação antes da exclusão
- Backup automático antes da limpeza

### Monitoramento
- Auto-refresh configurável
- Alertas para erros críticos
- Métricas de performance em tempo real

## Suporte e Desenvolvimento

### Debug
- Console logs detalhados
- Stack traces completos
- Informações de contexto para cada log

### Extensibilidade
- Fácil adição de novas categorias de log
- Sistema de plugins para funcionalidades adicionais
- APIs extensíveis para integrações futuras

---

**Nota:** Este sistema administrativo é exclusivo para usuários com credenciais especiais. Mantenha essas credenciais seguras e não as compartilhe com usuários não autorizados.
