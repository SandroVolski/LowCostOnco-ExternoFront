# 🚀 Desenvolvimento Local - Frontend + Backend

## 🔧 Situação Atual
- ✅ **Frontend:** Rodando em `localhost:8080`
- ❌ **Backend:** Não está rodando (erro de conexão com `localhost:3001`)
- ✅ **Sistema:** Configurado para usar dados locais em desenvolvimento

## 🎯 **Opções para Desenvolvimento**

### **Opção 1: Usar Dados Locais (Recomendado para desenvolvimento rápido)**
- ✅ **Status:** Já configurado e funcionando
- ✅ **Vantagem:** Desenvolvimento rápido, sem dependência do backend
- ✅ **Como usar:** Apenas rode `npm run dev`

### **Opção 2: Configurar Backend Local (Para desenvolvimento completo)**
- 🔧 **Status:** Precisa ser configurado
- ✅ **Vantagem:** Testa integração completa frontend + backend
- ⚠️ **Requisito:** Backend Node.js rodando localmente

## 🚀 **Como Configurar Backend Local (Opção 2)**

### **1. Verificar se o backend existe:**
```bash
ls backend/
```

### **2. Se o backend existir, configure-o:**
```bash
cd backend
npm install
npm start
```

### **3. Se o backend não existir, crie um simples:**
```bash
mkdir backend
cd backend
npm init -y
npm install express cors
```

### **4. Crie um servidor básico (`backend/server.js`):**
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Endpoint de health
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Backend funcionando!' });
});

// Endpoint de teste de banco
app.get('/api/test-db', (req, res) => {
  res.json({ success: true, message: 'Conexão com banco OK!' });
});

// Endpoint de exemplo para pacientes
app.get('/api/pacientes', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        Paciente_Nome: 'João Silva',
        Operadora: 1,
        Prestador: 1,
        Codigo: 'P001',
        Data_Nascimento: '1980-01-01',
        Sexo: 'M',
        Cid_Diagnostico: 'C34.9',
        Data_Primeira_Solicitacao: '2024-01-01',
        status: 'ativo'
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
});
```

### **5. Configure o package.json do backend:**
```json
{
  "name": "onco-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### **6. Inicie o backend:**
```bash
npm start
```

### **7. Em outra aba, inicie o frontend:**
```bash
npm run dev
```

## 🔄 **Alternar Entre Modos**

### **Para usar dados locais (sem backend):**
```typescript
// src/config/environment.ts
USE_LOCAL_DATA_IN_DEV: true
```

### **Para conectar com backend local:**
```typescript
// src/config/environment.ts
USE_LOCAL_DATA_IN_DEV: false
```

## 📊 **Verificação de Funcionamento**

### **Com dados locais:**
```
ℹ️ Modo desenvolvimento: usando dados locais (backend não testado)
✅ Pacientes filtrados: 1
```

### **Com backend local:**
```
🔧 Testando conexão com backend...
📍 URL de teste: http://localhost:3001/health
✅ Backend respondeu: { success: true, message: 'Backend funcionando!' }
```

## 🎯 **Recomendação**

### **Para desenvolvimento rápido:**
- ✅ Use **Opção 1** (dados locais)
- ✅ Não precisa configurar backend
- ✅ Foque no frontend

### **Para desenvolvimento completo:**
- ✅ Use **Opção 2** (backend local)
- ✅ Teste integração completa
- ✅ Simule ambiente de produção

## 🚀 **Comandos Rápidos**

### **Desenvolvimento com dados locais:**
```bash
npm run dev
# Acesse: http://localhost:8080
```

### **Desenvolvimento com backend:**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend  
npm run dev
# Acesse: http://localhost:8080
```

### **Produção:**
```bash
npm run build
# Upload para Hostinger
```

## 🔍 **Solução de Problemas**

### **Erro: "Backend não está respondendo"**
1. ✅ Verifique se o backend está rodando na porta 3001
2. ✅ Confirme se não há firewall bloqueando
3. ✅ Teste: `curl http://localhost:3001/health`

### **Erro: "CORS"**
1. ✅ Verifique se o backend tem `app.use(cors())`
2. ✅ Confirme se as URLs estão corretas

### **Erro: "Porta 3001 já em uso"**
1. ✅ Mude a porta no backend: `const PORT = 3002`
2. ✅ Atualize a configuração no frontend
3. ✅ Ou mate o processo: `npx kill-port 3001` 