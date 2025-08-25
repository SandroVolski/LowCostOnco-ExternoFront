# Endpoint de Email - Backend

## 📧 Endpoint para Envio de Emails

### POST `/api/email/enviar`

Este endpoint é responsável por enviar emails automáticos quando uma nova solicitação é criada.

### Request Body

```json
{
  "from": "sandroeduvolski@gmail.com",
  "to": "sandroeduardopradovolski@gmail.com",
  "subject": "Nova Solicitação - [Título da Solicitação]",
  "html": "<!DOCTYPE html>...",
  "text": "NOVA SOLICITAÇÃO RECEBIDA..."
}
```

### Campos

- **`from`** (string, obrigatório): Email da clínica (remetente)
- **`to`** (string, obrigatório): Email da operadora (destinatário)
- **`subject`** (string, obrigatório): Assunto do email
- **`html`** (string, obrigatório): Conteúdo HTML do email
- **`text`** (string, opcional): Versão em texto simples do email

### Response

#### Sucesso (200)
```json
{
  "success": true,
  "message": "Email enviado com sucesso",
  "data": {
    "messageId": "abc123...",
    "sentAt": "2024-01-20T10:30:00Z"
  }
}
```

#### Erro (400/500)
```json
{
  "success": false,
  "message": "Erro ao enviar email",
  "error": "Detalhes do erro"
}
```

## 🔧 Implementação Sugerida

### 1. Dependências Recomendadas
```bash
npm install nodemailer
# ou
npm install @sendgrid/mail
# ou
npm install aws-sdk  # Para Amazon SES
```

### 2. Exemplo com Nodemailer

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

// Endpoint
app.post('/api/email/enviar', async (req, res) => {
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
      text: text
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Email enviado com sucesso',
      data: {
        messageId: info.messageId,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar email',
      error: error.message
    });
  }
});
```

### 3. Variáveis de Ambiente

```env
EMAIL_USER=sandroeduvolski@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_SERVICE=gmail
```

## 📋 Fluxo de Funcionamento

1. **Usuário cria solicitação** no frontend
2. **Frontend chama** `/api/ajustes/solicitacoes` (POST)
3. **Solicitação é criada** no banco de dados
4. **Frontend chama** `/api/email/enviar` (POST)
5. **Email é enviado** para a operadora
6. **Frontend recebe confirmação** de sucesso

## 🎯 Características do Email

- **Formato HTML** com CSS inline para compatibilidade
- **Versão texto** para clientes que não suportam HTML
- **Informações completas** da solicitação
- **Lista de anexos** incluída
- **Design responsivo** e profissional
- **Marca da clínica** e sistema

## 🚀 Próximos Passos

1. **Implementar endpoint** no backend
2. **Configurar serviço de email** (Gmail, SendGrid, etc.)
3. **Testar envio** com email de teste
4. **Configurar variáveis** de ambiente
5. **Monitorar logs** de envio

## 📞 Suporte

Para dúvidas sobre a implementação, consulte a documentação do serviço de email escolhido ou entre em contato com a equipe de desenvolvimento. 