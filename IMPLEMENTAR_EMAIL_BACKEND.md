# 🚨 IMPLEMENTAR ENDPOINT DE EMAIL NO BACKEND

## ❌ **PROBLEMA ATUAL:**
O frontend está tentando enviar emails para o endpoint `/api/email/enviar`, mas ele **NÃO EXISTE** no seu backend!

## 🔧 **SOLUÇÃO - IMPLEMENTAR NO BACKEND:**

### 1. **Instalar Dependências**
```bash
npm install nodemailer
npm install @types/nodemailer  # Se usar TypeScript
```

### 2. **Criar Arquivo de Configuração de Email**
Crie `config/email.js` (ou `.ts`):
```javascript
const nodemailer = require('nodemailer');

// Configuração do transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail', // ou outro serviço
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

module.exports = transporter;
```

### 3. **Criar Rota de Email**
Crie `routes/email.js` (ou `.ts`):
```javascript
const express = require('express');
const router = express.Router();
const transporter = require('../config/email');

// POST /api/email/enviar
router.post('/enviar', async (req, res) => {
  try {
    const { from, to, subject, html, text } = req.body;
    
    // Validar campos obrigatórios
    if (!from || !to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: from, to, subject, html'
      });
    }
    
    const mailOptions = {
      from: from, // Usar o email da clínica como remetente
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '') // Remove HTML se não tiver texto
    };
    
    console.log('📧 Enviando email de:', from);
    console.log('📧 Enviando email para:', to);
    console.log('📧 Assunto:', subject);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    
    res.json({
      success: true,
      message: 'Email enviado com sucesso',
      data: {
        messageId: info.messageId,
        sentAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email',
      error: error.message
    });
  }
});

module.exports = router;
```

### 4. **Registrar Rota no App Principal**
No seu `app.js` ou `server.js`:
```javascript
const emailRoutes = require('./routes/email');

// ... outras configurações ...

app.use('/api/email', emailRoutes);
```

### 5. **Configurar Variáveis de Ambiente**
Crie `.env`:
```env
EMAIL_USER=sandroeduvolski@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_SERVICE=gmail
```

### 6. **Configurar Gmail (Se usar Gmail)**
1. Ative **Autenticação de 2 fatores** na sua conta Google
2. Gere uma **Senha de App** específica para o sistema
3. Use essa senha no `EMAIL_PASS`

## 🧪 **TESTAR IMPLEMENTAÇÃO:**

### 1. **Reinicie o Backend**
```bash
npm run dev
# ou
node server.js
```

### 2. **Teste o Endpoint**
```bash
curl -X POST http://localhost:3001/api/email/enviar \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sandroeduvolski@gmail.com",
    "to": "sandroeduardopradovolski@gmail.com",
    "subject": "Teste",
    "html": "<h1>Teste</h1>"
  }'
```

### 3. **No Frontend**
Clique no botão **"🧪 Testar Email"** que adicionei na página.

## 🔍 **VERIFICAR LOGS:**

### **Backend deve mostrar:**
```
📧 Enviando email de: sandroeduvolski@gmail.com
📧 Enviando email para: sandroeduardopradovolski@gmail.com
📧 Assunto: Nova Solicitação - [Título]
✅ Email enviado com sucesso!
📧 Message ID: abc123...
```

### **Frontend deve mostrar:**
```
🚀 Iniciando envio de email...
📧 Dados recebidos: {...}
🌐 API URL: http://localhost:3001/api/email/enviar
🔍 Verificando se o endpoint existe...
📡 Response status: 200
✅ Email enviado com sucesso!
```

## ❌ **SE NÃO FUNCIONAR:**

### **Erro 1: "fetch failed"**
- Endpoint não existe
- Backend não está rodando
- CORS não configurado

### **Erro 2: "500 Internal Server Error"**
- Problema na configuração do email
- Variáveis de ambiente incorretas
- Serviço de email indisponível

### **Erro 3: "Email não chega"**
- Verificar spam/lixo eletrônico
- Configuração do Gmail incorreta
- Firewall bloqueando

## 🎯 **PRÓXIMOS PASSOS:**

1. **Implemente o endpoint** seguindo as instruções acima
2. **Configure as variáveis** de ambiente
3. **Teste o endpoint** com curl ou Postman
4. **Teste no frontend** clicando em "🧪 Testar Email"
5. **Crie uma solicitação** para testar o envio automático

## 📞 **AJUDA:**

Se ainda não funcionar, me envie:
- **Logs do backend** (console)
- **Logs do frontend** (console do navegador)
- **Erro específico** que aparece
- **Status da resposta** HTTP

**Implemente isso no backend e teste novamente!** 🚀 