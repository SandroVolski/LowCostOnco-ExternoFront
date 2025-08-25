# 🚀 IMPLEMENTAÇÃO BACKEND - AJUSTES DE NEGOCIAÇÃO

## 📋 **VISÃO GERAL**
Esta documentação descreve a implementação backend necessária para a página "Ajustes de Negociação", que gerencia solicitações de ajustes relacionados a protocolos, medicamentos, procedimentos e questões administrativas.

## 🗄️ **ESTRUTURA DO BANCO DE DADOS**

### **1. TABELA PRINCIPAL: `ajustes_solicitacoes`**
```sql
-- A tabela já existe, mas precisa ser configurada para tipo 'negociacao'
-- Campos específicos para NEGOCIAÇÃO:
-- prioridade: ENUM('baixa', 'media', 'alta', 'critica')
-- categoria: ENUM('protocolo', 'medicamento', 'procedimento', 'administrativo')

-- Verificar se os campos estão corretos:
DESCRIBE ajustes_solicitacoes;

-- Se necessário, ajustar os campos:
ALTER TABLE ajustes_solicitacoes 
MODIFY COLUMN prioridade ENUM('baixa', 'media', 'alta', 'critica') NULL,
MODIFY COLUMN categoria ENUM('protocolo', 'medicamento', 'procedimento', 'administrativo') NULL;

-- Garantir que campos específicos de corpo clínico sejam NULL para negociação:
UPDATE ajustes_solicitacoes 
SET medico = NULL, especialidade = NULL 
WHERE tipo = 'negociacao';
```

### **2. TABELAS AUXILIARES (já existem)**
- `ajustes_anexos` - Para upload de documentos
- `ajustes_historico` - Para timeline de mudanças de status

## 🔌 **ENDPOINTS NECESSÁRIOS**

### **1. LISTAR SOLICITAÇÕES DE NEGOCIAÇÃO**
```http
GET /api/ajustes/solicitacoes
```

**Query Parameters:**
- `clinica_id` (obrigatório): ID da clínica
- `tipo` (obrigatório): "negociacao"
- `status` (opcional): "pendente", "em_analise", "aprovado", "rejeitado"
- `prioridade` (opcional): "baixa", "media", "alta", "critica"
- `categoria` (opcional): "protocolo", "medicamento", "procedimento", "administrativo"
- `search` (opcional): busca por título/descrição
- `page` (opcional): número da página (padrão: 1)
- `pageSize` (opcional): itens por página (padrão: 20)
- `sort` (opcional): ordenação (ex: "created_at:desc", "prioridade:asc")

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Solicitações listadas com sucesso",
  "data": {
    "items": [
      {
        "id": 1,
        "clinica_id": 1,
        "tipo": "negociacao",
        "titulo": "Revisão de protocolo XYZ",
        "descricao": "Solicitação de ajuste no protocolo XYZ...",
        "prioridade": "alta",
        "categoria": "protocolo",
        "status": "em_analise",
        "created_at": "2024-03-15T10:30:00",
        "updated_at": "2024-03-15T14:45:00",
        "anexos": [
          {
            "id": 1,
            "arquivo_nome": "proposta.pdf",
            "arquivo_url": "http://localhost:3001/uploads/ajustes/arquivo.pdf",
            "arquivo_tamanho": 1024000
          }
        ],
        "historico": [
          {
            "id": 1,
            "status": "pendente",
            "comentario": "Solicitação criada",
            "created_at": "2024-03-15T10:30:00"
          },
          {
            "id": 2,
            "status": "em_analise",
            "comentario": "Em análise pela operadora",
            "created_at": "2024-03-15T14:45:00"
          }
        ]
      }
    ],
    "total": 8,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}
```

### **2. CRIAR NOVA SOLICITAÇÃO DE NEGOCIAÇÃO**
```http
POST /api/ajustes/solicitacoes
```

**Body (JSON):**
```json
{
  "clinica_id": 1,
  "tipo": "negociacao",
  "titulo": "Revisão de protocolo XYZ",
  "descricao": "Solicitação de ajuste no protocolo XYZ devido a novas diretrizes clínicas...",
  "prioridade": "alta",
  "categoria": "protocolo"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Solicitação criada com sucesso",
  "data": {
    "id": 1,
    "clinica_id": 1,
    "tipo": "negociacao",
    "titulo": "Revisão de protocolo XYZ",
    "descricao": "Solicitação de ajuste no protocolo XYZ...",
    "prioridade": "alta",
    "categoria": "protocolo",
    "status": "pendente",
    "created_at": "2024-03-15T10:30:00",
    "updated_at": "2024-03-15T10:30:00"
  }
}
```

### **3. UPLOAD DE ANEXOS PARA NEGOCIAÇÃO**
```http
POST /api/ajustes/solicitacoes/{id}/anexos
```

**Body (multipart/form-data):**
- `file`: arquivo (PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, XLSX)
- `solicitacao_id`: ID da solicitação (no path)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Anexo enviado com sucesso",
  "data": {
    "id": 1,
    "solicitacao_id": 1,
    "arquivo_nome": "proposta.pdf",
    "arquivo_url": "http://localhost:3001/uploads/ajustes/arquivo.pdf",
    "arquivo_tamanho": 1024000,
    "created_at": "2024-03-15T10:30:00"
  }
}
```

### **4. ALTERAR STATUS DA SOLICITAÇÃO**
```http
PUT /api/ajustes/solicitacoes/{id}/status
```

**Body (JSON):**
```json
{
  "status": "em_analise",
  "comentario": "Em análise pela operadora"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Status alterado com sucesso",
  "data": {
    "id": 1,
    "status": "em_analise",
    "updated_at": "2024-03-15T14:45:00"
  }
}
```

### **5. ATUALIZAR SOLICITAÇÃO**
```http
PUT /api/ajustes/solicitacoes/{id}
```

**Body (JSON):**
```json
{
  "titulo": "Revisão de protocolo XYZ - Atualizado",
  "descricao": "Descrição atualizada...",
  "prioridade": "critica",
  "categoria": "protocolo"
}
```

### **6. EXCLUIR SOLICITAÇÃO**
```http
DELETE /api/ajustes/solicitacoes/{id}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Solicitação excluída com sucesso"
}
```

### **7. LISTAR ANEXOS DE UMA SOLICITAÇÃO**
```http
GET /api/ajustes/solicitacoes/{id}/anexos
```

### **8. REMOVER ANEXO**
```http
DELETE /api/ajustes/anexos/{id}
```

### **9. DOWNLOAD DE ANEXO**
```http
GET /api/ajustes/anexos/{id}/download
```

## 📊 **ESTATÍSTICAS NECESSÁRIAS**

### **Endpoint para Estatísticas:**
```http
GET /api/ajustes/estatisticas/negociacao?clinica_id=1
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "solicitacoesCriticas": 3,
    "totalSolicitacoes": 8,
    "taxaAprovacao": 75,
    "protocolosAtualizados": 12,
    "tempoMedioRetorno": 2.8,
    "solicitacoesPorStatus": {
      "pendente": 2,
      "em_analise": 3,
      "aprovado": 2,
      "rejeitado": 1
    },
    "solicitacoesPorPrioridade": {
      "baixa": 1,
      "media": 2,
      "alta": 2,
      "critica": 3
    },
    "solicitacoesPorCategoria": {
      "protocolo": 4,
      "medicamento": 2,
      "procedimento": 1,
      "administrativo": 1
    }
  }
}
```

## 🔍 **VALIDAÇÕES NECESSÁRIAS**

### **1. Criação de Solicitação:**
- `clinica_id`: obrigatório, deve existir
- `tipo`: deve ser "negociacao"
- `titulo`: obrigatório, máximo 200 caracteres
- `descricao`: obrigatório, máximo 1000 caracteres
- `prioridade`: obrigatório, deve ser um dos valores do ENUM
- `categoria`: obrigatório, deve ser um dos valores do ENUM

### **2. Upload de Anexos:**
- Tamanho máximo: 10MB por arquivo
- Tipos permitidos: PDF, DOC, DOCX, JPG, JPEG, PNG, XLS, XLSX
- Máximo de 10 anexos por solicitação

### **3. Alteração de Status:**
- Status deve ser um dos valores válidos
- Comentário obrigatório para mudanças de status
- Não permitir alterar status de solicitações aprovadas/rejeitadas

## 🚨 **TRIGGERS E REGRAS DE NEGÓCIO**

### **1. Histórico Automático:**
- Criar entrada no histórico sempre que o status mudar
- Registrar data/hora e comentário da mudança

### **2. Validação de Campos:**
- Para `tipo = 'negociacao'`: `medico` e `especialidade` devem ser NULL
- Para `tipo = 'negociacao'`: `prioridade` e `categoria` são obrigatórios

### **3. Notificações:**
- Notificar operadora quando nova solicitação for criada
- Notificar clínica quando status mudar

## 📁 **ESTRUTURA DE ARQUIVOS**

### **Diretório de Upload:**
```
/uploads/ajustes/
├── solicitacao_1/
│   ├── proposta.pdf
│   ├── diretrizes_clinicas.pdf
│   └── comparativo.xlsx
└── solicitacao_2/
    └── documento.pdf
```

## 🧪 **TESTES RECOMENDADOS**

### **1. Teste de Criação:**
```bash
curl -X POST http://localhost:3001/api/ajustes/solicitacoes \
  -H "Content-Type: application/json" \
  -d '{
    "clinica_id": 1,
    "tipo": "negociacao",
    "titulo": "Teste Negociação",
    "descricao": "Descrição de teste",
    "prioridade": "alta",
    "categoria": "protocolo"
  }'
```

### **2. Teste de Upload:**
```bash
curl -X POST http://localhost:3001/api/ajustes/solicitacoes/1/anexos \
  -F "file=@teste.pdf"
```

### **3. Teste de Listagem:**
```bash
curl "http://localhost:3001/api/ajustes/solicitacoes?clinica_id=1&tipo=negociacao&page=1&pageSize=10"
```

## 🔧 **IMPLEMENTAÇÃO NO BACKEND**

### **1. Criar Controller:**
```javascript
// controllers/ajustesController.js
class AjustesController {
  // Listar solicitações de negociação
  async listarNegociacao(req, res) {
    // Implementar lógica de listagem com filtros
  }

  // Criar solicitação de negociação
  async criarNegociacao(req, res) {
    // Implementar criação com validações
  }

  // Upload de anexos
  async uploadAnexo(req, res) {
    // Implementar upload com validações
  }

  // Alterar status
  async alterarStatus(req, res) {
    // Implementar mudança de status
  }

  // Estatísticas
  async getEstatisticas(req, res) {
    // Implementar cálculo de estatísticas
  }
}
```

### **2. Criar Routes:**
```javascript
// routes/ajustes.js
router.get('/solicitacoes', ajustesController.listarNegociacao);
router.post('/solicitacoes', ajustesController.criarNegociacao);
router.post('/solicitacoes/:id/anexos', upload.single('file'), ajustesController.uploadAnexo);
router.put('/solicitacoes/:id/status', ajustesController.alterarStatus);
router.get('/estatisticas/negociacao', ajustesController.getEstatisticas);
```

### **3. Middleware de Validação:**
```javascript
// middleware/validacaoAjustes.js
const validarNegociacao = (req, res, next) => {
  const { tipo, prioridade, categoria } = req.body;
  
  if (tipo !== 'negociacao') {
    return res.status(400).json({
      success: false,
      message: 'Tipo deve ser "negociacao"'
    });
  }
  
  if (!prioridade || !categoria) {
    return res.status(400).json({
      success: false,
      message: 'Prioridade e categoria são obrigatórios para negociação'
    });
  }
  
  next();
};
```

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Configurar banco de dados com campos corretos
- [ ] Implementar endpoints de CRUD para solicitações
- [ ] Implementar upload e gerenciamento de anexos
- [ ] Implementar sistema de histórico de status
- [ ] Implementar cálculo de estatísticas
- [ ] Adicionar validações de campos
- [ ] Implementar triggers para histórico automático
- [ ] Configurar diretório de uploads
- [ ] Implementar sistema de notificações
- [ ] Testar todos os endpoints
- [ ] Documentar API

## 🎯 **PRÓXIMOS PASSOS**

1. **Implementar endpoints básicos** (CRUD de solicitações)
2. **Configurar upload de anexos** com validações
3. **Implementar sistema de histórico** automático
4. **Criar cálculo de estatísticas** dinâmicas
5. **Adicionar validações** e regras de negócio
6. **Testar integração** com o frontend

---

**📞 Suporte:** Em caso de dúvidas sobre a implementação, consulte a documentação da API de Ajustes Corpo Clínico como referência, pois ambas compartilham a mesma estrutura base. 