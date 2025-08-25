# 🚀 Configuração para Hostinger - Frontend + Backend

## 🔧 Problema Identificado
O sistema está tentando se conectar com `localhost:3001`, mas em produção na Hostinger isso não funciona.

## ✅ Solução Implementada

### 1. **Configuração Automática de Ambiente**
- ✅ Sistema detecta automaticamente se está em desenvolvimento ou produção
- ✅ Em desenvolvimento: usa `localhost:3001`
- ✅ Em produção: usa o mesmo domínio da aplicação

### 2. **Arquivos Criados/Modificados**
- ✅ `src/config/environment.ts` - Configuração principal
- ✅ `src/config/production.ts` - Configurações específicas para produção
- ✅ `src/services/api.ts` - Atualizado para usar configuração de ambiente
- ✅ `src/services/clinicService.ts` - Atualizado para usar configuração de ambiente

## 🌐 **Configuração na Hostinger**

### **Frontend (React)**
1. **Faça o build:**
   ```bash
   npm run build
   ```

2. **Upload para Hostinger:**
   - Pasta `dist/` → raiz do seu domínio
   - Arquivo `public/.htaccess` → raiz do seu domínio

### **Backend (Node.js)**

#### **Opção 1: Hostinger Node.js (Recomendado)**
1. **Acesse o painel da Hostinger**
2. **Vá para "Hospedagem" → "Node.js"**
3. **Configure:**
   - **Versão do Node.js:** 18.x ou superior
   - **Pasta:** `/backend` (ou onde você quiser)
   - **Arquivo de entrada:** `server.js` ou `index.js`

4. **Upload do backend:**
   - Faça upload da pasta `backend/` para a pasta configurada
   - Certifique-se de que o `package.json` está na pasta

5. **Instale as dependências:**
   ```bash
   npm install
   ```

6. **Configure as variáveis de ambiente:**
   ```bash
   NODE_ENV=production
   PORT=3001
   ```

#### **Opção 2: Hostinger VPS/Dedicado**
1. **Acesse via SSH**
2. **Clone/upload do backend**
3. **Configure PM2 ou similar:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "onco-backend"
   pm2 startup
   pm2 save
   ```

## 🔗 **Configuração de URLs**

### **Frontend (React)**
- ✅ **Desenvolvimento:** `http://localhost:8080`
- ✅ **Produção:** `https://seudominio.com`

### **Backend (Node.js)**
- ✅ **Desenvolvimento:** `http://localhost:3001`
- ✅ **Produção:** `https://seudominio.com/api`

## 📁 **Estrutura de Arquivos na Hostinger**

```
seudominio.com/
├── index.html (da pasta dist/)
├── assets/ (da pasta dist/)
├── .htaccess
└── backend/ (se usar Hostinger Node.js)
    ├── package.json
    ├── server.js
    └── ... (outros arquivos do backend)
```

## 🚀 **Teste da Configuração**

### **1. Verifique o console do navegador:**
- Deve aparecer: `🔧 Configuração de ambiente carregada`
- Deve mostrar URLs corretas para produção

### **2. Teste a conexão:**
- A função `testarConexaoBackend()` deve usar a URL correta
- Não deve mais tentar conectar com `localhost:3001`

### **3. Verifique as requisições:**
- No DevTools → Network
- As requisições devem ir para `seudominio.com/api` em vez de `localhost:3001`

## 🐛 **Solução de Problemas**

### **Erro: "Backend não está respondendo"**
1. ✅ Verifique se o backend está rodando na Hostinger
2. ✅ Confirme se as URLs estão corretas no console
3. ✅ Verifique se o arquivo `.htaccess` está na raiz

### **Erro: "CORS"**
1. ✅ Configure o backend para aceitar requisições do frontend
2. ✅ Use o mesmo domínio para frontend e backend

### **Erro: "404 Not Found"**
1. ✅ Verifique se o arquivo `.htaccess` está configurado
2. ✅ Confirme se as rotas do backend estão funcionando

## 📝 **Comandos Úteis**

### **Desenvolvimento Local:**
```bash
# Frontend
npm run dev

# Backend (em outra aba)
cd backend
npm start
```

### **Produção:**
```bash
# Build do frontend
npm run build

# Upload para Hostinger
# Configurar backend na Hostinger
```

## 🎯 **Resultado Esperado**

✅ **Sistema detecta automaticamente o ambiente**  
✅ **Em desenvolvimento: usa localhost:3001**  
✅ **Em produção: usa o domínio da Hostinger**  
✅ **Não há mais erros de conexão com localhost**  
✅ **Backend e frontend funcionam perfeitamente**  

## 🔍 **Verificação Final**

Após a configuração, o console deve mostrar:
```
🔧 Configuração de ambiente carregada
ℹ️ Configuração de ambiente carregada {
  hostname: "seudominio.com",
  protocol: "https:",
  port: "",
  isProduction: true,
  isDevelopment: false,
  apiUrl: "https://seudominio.com/api",
  healthUrl: "https://seudominio.com/health"
}
```

Se aparecer isso, está tudo funcionando! 🎉 