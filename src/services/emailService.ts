// src/services/emailService.ts

import config from '@/config/environment';

const API_BASE_URL = config.API_BASE_URL;

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SolicitacaoEmailData {
  titulo: string;
  descricao: string;
  medico: string;
  especialidade: string;
  clinica: string;
  dataCriacao: string;
  anexos: string[];
}

export class EmailService {
  
  // Enviar email de nova solicitação
  static async enviarEmailNovaSolicitacao(dados: SolicitacaoEmailData): Promise<void> {
    try {
      const emailData: EmailData = {
        from: 'sandroeduvolski@gmail.com', // Email da clínica (remetente)
        to: 'sandroeduardopradovolski@gmail.com', // Email da operadora (destinatário)
        subject: `Nova Solicitação - ${dados.titulo}`,
        html: this.formatarEmailHTML(dados),
        text: this.formatarEmailTexto(dados)
      };

      const response = await fetch(`${API_BASE_URL}/email/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.status === 204) {
        throw new Error('Endpoint retornou 204 (No Content). Verifique se o backend está processando o email corretamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erro ao enviar email');
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      
      // Se o endpoint retornar 204 ou não existir, vamos simular o envio para teste
      if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('204'))) {
        await this.simularEnvioEmail(dados);
      }
    }
  }

  // Simular envio de email para teste (quando o backend não está pronto)
  private static async simularEnvioEmail(dados: SolicitacaoEmailData): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Testar se o endpoint existe
  static async testarEndpoint(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/email/enviar`, {
        method: 'OPTIONS', // Usar OPTIONS para ver se o endpoint responde
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  // Formatar email em HTML
  private static formatarEmailHTML(dados: SolicitacaoEmailData): string {
    const anexosLista = dados.anexos.length > 0 
      ? dados.anexos.map(anexo => `<li>${anexo}</li>`).join('')
      : '<li>Nenhum anexo</li>';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .title { color: #2563eb; font-size: 24px; margin: 0 0 10px 0; }
          .subtitle { color: #6b7280; font-size: 16px; margin: 0; }
          .section { margin: 20px 0; }
          .section-title { color: #1f2937; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { background: #f9fafb; padding: 15px; border-radius: 6px; }
          .info-label { color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
          .info-value { color: #1f2937; font-size: 14px; font-weight: 500; }
          .description { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .anexos { background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
          .anexos ul { margin: 10px 0; padding-left: 20px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Nova Solicitação Recebida</h1>
            <p class="subtitle">Uma nova solicitação foi criada no sistema</p>
          </div>

          <div class="section">
            <h2 class="section-title">Detalhes da Solicitação</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Título</div>
                <div class="info-value">${dados.titulo}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Médico</div>
                <div class="info-value">${dados.medico}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Especialidade</div>
                <div class="info-value">${dados.especialidade}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Criação</div>
                <div class="info-value">${dados.dataCriacao}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Descrição</h2>
            <div class="description">
              ${dados.descricao}
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Documentos Anexados</h2>
            <div class="anexos">
              <ul>
                ${anexosLista}
              </ul>
            </div>
          </div>

          <div class="footer">
            <p>Este email foi enviado automaticamente pelo sistema de Ajustes Corpo Clínico.</p>
            <p>Data: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Formatar email em texto simples
  private static formatarEmailTexto(dados: SolicitacaoEmailData): string {
    const anexosLista = dados.anexos.length > 0 
      ? dados.anexos.map(anexo => `- ${anexo}`).join('\n')
      : '- Nenhum anexo';

    return `
NOVA SOLICITAÇÃO RECEBIDA

Uma nova solicitação foi criada no sistema.

DETALHES DA SOLICITAÇÃO:
- Título: ${dados.titulo}
- Médico: ${dados.medico}
- Especialidade: ${dados.especialidade}
- Data de Criação: ${dados.dataCriacao}

DESCRIÇÃO:
${dados.descricao}

DOCUMENTOS ANEXADOS:
${anexosLista}

---
Este email foi enviado automaticamente pelo sistema de Ajustes Corpo Clínico.
Data: ${new Date().toLocaleString('pt-BR')}
    `.trim();
  }
} 