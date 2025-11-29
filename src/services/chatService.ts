// src/services/chatService.ts

import { authorizedFetch } from './authService';
import config from '@/config/environment';

export interface Message {
  id?: number;
  chat_id: number;
  sender_id: number;
  sender_type: 'operadora' | 'clinica';
  sender_name: string;
  content: string;
  message_type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  created_at?: string;
  updated_at?: string;
  
  // Campos do banco bd_onkhos
  conversa_id?: number;
  remetente_id?: number;
  remetente_tipo?: 'operadora' | 'clinica';
  remetente_nome?: string;
  conteudo?: string;
  tipo_mensagem?: 'texto' | 'imagem' | 'arquivo';
}

export interface ChatParticipantSummary {
  id?: number;
  name: string;
  type: 'operadora' | 'clinica';
}

export interface Chat {
  id?: number;
  type: 'individual' | 'group';
  operadora_id?: number;
  clinica_id?: number;
  name: string;
  description?: string;
  last_message_id?: number;
  last_message?: {
    id?: number;
    content: string;
    created_at?: string;
    sender_name?: string;
    sender_type?: 'operadora' | 'clinica';
  } | null;
  last_message_time?: string;
  created_at?: string;
  updated_at?: string;
  unread_count?: number;
  participants?: ChatParticipantSummary[];
  
  // Campos do banco bd_onkhos (compatibilidade)
  nome_conversa?: string;
  descricao?: string;
  ultima_mensagem_id?: number;
  ultima_mensagem_texto?: string;
  ultima_mensagem_data?: string;
  operadora_ultima_leitura?: string;
  clinica_ultima_leitura?: string;
  ativa?: boolean;
  operadora_nome?: string;
  clinica_nome?: string;
}

export interface ChatParticipant {
  id?: number;
  chat_id: number;
  participant_id: number;
  participant_type: 'operadora' | 'clinica';
  joined_at?: string;
  last_read_message_id?: number;
  is_active: boolean;
}

export interface ChatWithParticipants extends Chat {
  participants: ChatParticipantSummary[];
}

export interface UnreadCountResponse {
  total_unread: number;
  unread_by_chat: Record<number, number>;
}

class ChatService {
  private mapChat = (chat: any): Chat => {
    if (!chat) {
      return {
        id: undefined,
        type: 'individual',
        name: 'Conversa',
        last_message: null,
        participants: [],
      };
    }

    const operadoraNome =
      chat.operadora_nome ||
      chat.operadoraNome ||
      chat.operadora?.nome ||
      chat.operadoraNome?.trim?.() ||
      '';

    const clinicaNome =
      chat.clinica_nome ||
      chat.clinicaNome ||
      chat.clinica?.nome ||
      chat.clinicaNome?.trim?.() ||
      '';

    // Ajustar participants vindos do backend ou criar fallback
    const participants: ChatParticipantSummary[] = Array.isArray(chat.participants) && chat.participants.length > 0
      ? chat.participants.map((participant: any) => ({
          id: participant.participant_id ?? participant.id,
          name: participant.name || participant.participant_name || (participant.participant_type === 'operadora' ? operadoraNome : clinicaNome),
          type: participant.participant_type || participant.type || 'clinica'
        }))
      : [
          { id: chat.operadora_id, name: operadoraNome || 'Operadora', type: 'operadora' },
          { id: chat.clinica_id, name: clinicaNome || 'Clínica', type: 'clinica' },
        ];

    const lastMessage = chat.ultima_mensagem_texto
      ? {
          id: chat.ultima_mensagem_id,
          content: chat.ultima_mensagem_texto,
          created_at: chat.ultima_mensagem_data,
          sender_name: chat.ultima_mensagem_remetente_nome,
          sender_type: chat.ultima_mensagem_remetente_tipo,
        }
      : chat.last_message?.content
      ? chat.last_message
      : null;

    return {
      id: chat.id,
      type: chat.type === 'group' ? 'group' : 'individual',
      operadora_id: chat.operadora_id,
      clinica_id: chat.clinica_id,
      name: chat.nome_conversa || chat.name || `${operadoraNome} - ${clinicaNome}`.trim(),
      description: chat.descricao || chat.description || undefined,
      last_message_id: chat.last_message_id || chat.ultima_mensagem_id,
      last_message: lastMessage,
      last_message_time: chat.ultima_mensagem_data || lastMessage?.created_at,
      created_at: chat.created_at,
      updated_at: chat.updated_at,
      unread_count: chat.mensagens_nao_lidas ?? chat.unread_count ?? 0,
      participants,
      // Campos auxiliares para compatibilidade
      nome_conversa: chat.nome_conversa,
      descricao: chat.descricao,
      ultima_mensagem_id: chat.ultima_mensagem_id,
      ultima_mensagem_texto: chat.ultima_mensagem_texto,
      ultima_mensagem_data: chat.ultima_mensagem_data,
      operadora_ultima_leitura: chat.operadora_ultima_leitura,
      clinica_ultima_leitura: chat.clinica_ultima_leitura,
      ativa: chat.ativa,
      operadora_nome: operadoraNome,
      clinica_nome: clinicaNome,
    };
  };
  
  
  // Buscar chats do usuário
  async getUserChats(): Promise<Chat[]> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();

      const mappedChats = (result.data || []).map(this.mapChat);

      return mappedChats;
    } catch (error) {
      console.error('Erro ao buscar chats:', error);
      throw new Error('Erro ao carregar chats');
    }
  }
  
  // Buscar chat específico
  async getChat(chatId: number): Promise<ChatWithParticipants> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/${chatId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      
      const chat = result.data;
      return this.mapChat(chat) as ChatWithParticipants;
    } catch (error) {
      console.error('Erro ao buscar chat:', error);
      throw new Error('Erro ao carregar chat');
    }
  }
  
  // Buscar mensagens de um chat (suporta paginação e incremental via lastId)
  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0, lastId?: number): Promise<{
    messages: Message[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      last_id?: number | null;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('offset', offset.toString());
      if (lastId && lastId > 0) queryParams.append('last_id', String(lastId));

      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/${chatId}/messages?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();

      // Mapear mensagens do formato backend para frontend
      const mappedMessages = result.data.messages.map((msg: any) => {
        return {
          id: msg.id,
          chat_id: msg.conversa_id,
          sender_id: msg.remetente_id,
          sender_type: msg.remetente_tipo,
          sender_name: msg.remetente_nome,
          content: msg.conteudo,
          message_type: msg.tipo_mensagem === 'texto' ? 'text' : msg.tipo_mensagem,
          status: msg.status === 'enviada' ? 'sent' : msg.status === 'entregue' ? 'delivered' : 'read',
          created_at: msg.created_at,
          updated_at: msg.updated_at
        };
      });

      return {
        messages: mappedMessages,
        pagination: result.data.pagination
      };
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw new Error('Erro ao carregar mensagens');
    }
  }
  
  // Enviar mensagem
  async sendMessage(chatId: number, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<Message> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          message_type: messageType
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();

      // Mapear mensagem do formato backend para frontend
      const msg = result.data;
      const mappedMessage = {
        id: msg.id,
        chat_id: msg.conversa_id,
        sender_id: msg.remetente_id,
        sender_type: msg.remetente_tipo,
        sender_name: msg.remetente_nome,
        content: msg.conteudo,
        message_type: msg.tipo_mensagem === 'texto' ? 'text' : msg.tipo_mensagem,
        status: msg.status === 'enviada' ? 'sent' : msg.status === 'entregue' ? 'delivered' : 'read',
        created_at: msg.created_at,
        updated_at: msg.updated_at
      };

      return mappedMessage;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw new Error('Erro ao enviar mensagem');
    }
  }

  // Upload de arquivo
  async uploadFile(chatId: number, file: File): Promise<Message> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/${chatId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();

      // Mapear mensagem do formato backend para frontend
      const msg = result.data;
      const mappedMessage = {
        id: msg.id,
        chat_id: msg.conversa_id,
        sender_id: msg.remetente_id,
        sender_type: msg.remetente_tipo,
        sender_name: msg.remetente_nome,
        content: msg.conteudo.split('|')[0], // Nome do arquivo
        message_type: msg.tipo_mensagem === 'texto' ? 'text' : msg.tipo_mensagem,
        status: msg.status === 'enviada' ? 'sent' : msg.status === 'entregue' ? 'delivered' : 'read',
        created_at: msg.created_at,
        updated_at: msg.updated_at,
        fileInfo: result.data.fileInfo
      };

      return mappedMessage;
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      throw new Error('Erro ao fazer upload do arquivo');
    }
  }

  // Encontrar ou criar conversa entre operadora e clínica
  async findOrCreateChat(targetUserId: number, targetUserType: string): Promise<Chat> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/find-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          targetUserType
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return this.mapChat(result.data);
    } catch (error) {
      console.error('Erro ao encontrar/criar conversa:', error);
      throw new Error('Erro ao encontrar/criar conversa');
    }
  }
  
  // Criar novo chat
  async createChat(chatData: {
    type: 'individual' | 'group';
    operadora_id?: number;
    clinica_id?: number;
    name: string;
    description?: string;
  }): Promise<Chat> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return this.mapChat(result.data);
    } catch (error) {
      console.error('Erro ao criar chat:', error);
      throw new Error('Erro ao criar chat');
    }
  }
  
  // Buscar ou criar chat entre operadora e clínica
  async findOrCreateOperadoraClinicaChat(operadoraId: number, clinicaId: number): Promise<Chat> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/find-or-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: clinicaId,
          targetUserType: 'clinica'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return this.mapChat(result.data);
    } catch (error) {
      console.error('Erro ao buscar/criar chat:', error);
      throw new Error('Erro ao buscar/criar chat');
    }
  }
  
  // Contar mensagens não lidas
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/unread-count`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao contar mensagens não lidas:', error);
      return { total_unread: 0, unread_by_chat: {} };
    }
  }
  
  // Marcar chat como lido
  async markChatAsRead(chatId: number): Promise<boolean> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats/${chatId}/read`, {
        method: 'PUT',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erro ao marcar chat como lido:', error);
      return false;
    }
  }
  
  // Criar chat individual entre operadora e clínica (para operadoras)
  async createIndividualChatWithClinica(clinicaId: number): Promise<Chat> {
    try {
      // Para operadoras, criar chat com uma clínica específica
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'individual',
          clinica_id: clinicaId,
          name: `Chat com Clínica ${clinicaId}`, // Será atualizado pelo backend
          description: 'Chat individual entre operadora e clínica'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao criar chat individual:', error);
      throw new Error('Erro ao criar chat individual');
    }
  }
  
  // Criar chat em grupo (para operadoras)
  async createGroupChat(name: string, description?: string): Promise<Chat> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/chat/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'group',
          name,
          description: description || `Chat em grupo: ${name}`
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao criar chat em grupo:', error);
      throw new Error('Erro ao criar chat em grupo');
    }
  }

  // Buscar operadora de uma clínica
  async getClinicOperator(clinicId: number): Promise<any> {
    try {
      const response = await authorizedFetch(`${this.API_URL}/clinic/operator/${clinicId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Erro ao buscar operadora da clínica:', error);
      throw new Error('Erro ao buscar operadora da clínica');
    }
  }

  // Buscar clínicas de uma operadora
  async getOperatorClinics(operatorId: number): Promise<any[]> {
    try {
      const response = await authorizedFetch(`${this.API_URL}/operator/clinics/${operatorId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erro ao buscar clínicas da operadora:', error);
      throw new Error('Erro ao buscar clínicas da operadora');
    }
  }

  // Buscar perfil do usuário (clínica)
  async getUserProfile(): Promise<any> {
    try {
      const response = await authorizedFetch(`${config.API_BASE_URL}/clinicas/profile`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || null;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      throw error;
    }
  }

  // Buscar clínicas por operadora
  async getClinicas(operadoraId?: number): Promise<any[]> {
    try {
      const query = operadoraId ? `?operadora_id=${operadoraId}` : '';
      const response = await authorizedFetch(`${config.API_BASE_URL}/clinicas/por-operadora${query}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();