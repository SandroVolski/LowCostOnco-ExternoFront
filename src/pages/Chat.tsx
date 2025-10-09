import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  PaperclipIcon, 
  MoreVertical, 
  Search, 
  Users, 
  Circle, 
  Hospital,
  Wallet,
  Database,
  MessageSquare,
  RefreshCw,
  Info,
  FileText,
  Image,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { chatService, type Chat, type Message } from '@/services/chatService';

const Chat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const selectedChatIdRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para obter informações do contato
  const getContactInfo = () => {
    if (!selectedChat) return null;
    
    // Encontrar o contato (não o usuário atual)
    const contact = (selectedChat as any).participants?.find((p: any) => 
      (user?.role === 'operator' && p.type === 'clinica') ||
      (user?.role === 'clinic' && p.type === 'operadora')
    );
    
    return contact;
  };

  // Função para verificar novas mensagens
  const checkForNewMessages = async () => {
    const chatId = selectedChatIdRef.current;
    if (!chatId) return;
    
    try {
      const response = await chatService.getChatMessages(chatId, 50, 0, lastMessageIdRef.current || undefined);
      if (response && response.messages && response.messages.length > 0) {
        const latest = response.messages[response.messages.length - 1];
        setMessages(prev => {
          const lastId = lastMessageIdRef.current;
          // Evitar duplicação: filtrar por id já existente no estado
          const existingIds = new Set(prev.map(m => m.id));
          const newOnes = response.messages.filter(m => (!lastId || m.id > lastId) && !existingIds.has(m.id));
          if (newOnes.length === 0) return prev;
          return [...prev, ...newOnes];
        });
        setLastMessageId(latest.id);
        lastMessageIdRef.current = latest.id;
        setTimeout(scrollToBottom, 50);
      }
    } catch (error) {
      console.error('Erro ao verificar novas mensagens:', error);
    }
  };

  // Iniciar polling para novas mensagens
  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(checkForNewMessages, 2000); // Verifica a cada 2 segundos
  };

  // Parar polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Função para ver perfil do contato
  const handleViewProfile = () => {
    if (!selectedChat) return;
    setProfileModalOpen(true);
  };

  // Função para anexar arquivo
  const handleAttachFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt';
    input.multiple = false; // Apenas um arquivo por vez
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validar tamanho do arquivo (máximo 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({
            title: "Arquivo muito grande",
            description: "O arquivo deve ter no máximo 10MB",
            variant: "destructive",
          });
          return;
        }
        
        // Validar tipo de arquivo
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'text/plain'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Tipo de arquivo não suportado",
            description: "Apenas PDF, DOC, DOCX, JPG, PNG, GIF e TXT são permitidos",
            variant: "destructive",
          });
          return;
        }
        
        // Enviar arquivo automaticamente
        handleSendAttachment(file);
      }
    };
    
    input.click();
  };

  // Função para obter ícone do arquivo baseado no tipo
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  // Função para formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para abrir/baixar arquivo
  const handleFileAction = (fileInfo: any, action: 'open' | 'download') => {
    if (action === 'open' && fileInfo.url) {
      // Para imagens, abrir em nova aba
      if (fileInfo.type.startsWith('image/')) {
        window.open(fileInfo.url, '_blank');
      } else {
        // Para outros arquivos, tentar abrir
        window.open(fileInfo.url, '_blank');
      }
    } else if (action === 'download') {
      // Criar link de download
      const link = document.createElement('a');
      link.href = fileInfo.url;
      link.download = fileInfo.name;
      link.click();
    }
  };

  // Função para enviar arquivo como anexo
  const handleSendAttachment = async (file: File) => {
    if (!selectedChat) return;
    
    try {
      // Mostrar toast de carregamento
      toast({
        title: "Enviando arquivo",
        description: `Enviando "${file.name}"...`,
      });
      
      // Determinar tipo de mensagem baseado no tipo do arquivo
      let messageType: 'image' | 'file' = 'file';
      if (file.type.startsWith('image/')) {
        messageType = 'image';
      }
      
      // Criar mensagem otimista (aparece imediatamente)
      const tempId = Date.now();
      const now = new Date();
      const optimisticMessage = {
        id: tempId,
        chat_id: selectedChat.id,
        sender_id: user?.id || 0,
        sender_type: (user?.role === 'operator' ? 'operadora' : 'clinica') as 'operadora' | 'clinica',
        sender_name: (user as any)?.name || 'Usuário',
        content: file.name,
        message_type: messageType,
        status: 'sent' as const,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file) // URL temporária para visualização
        }
      };
      
      // Adicionar mensagem imediatamente à lista
      console.log('🔧 Adicionando arquivo otimista:', optimisticMessage);
      setMessages(prev => {
        const newMessages = [...prev, optimisticMessage];
        console.log('🔧 Mensagens com arquivo atualizadas:', newMessages);
        return newMessages;
      });
      
      // Scroll para o final
      setTimeout(scrollToBottom, 50);
      
      // Enviar arquivo para o servidor usando o chatService
      const newMessage = await chatService.uploadFile(selectedChat.id, file);
      
      // Substituir mensagem otimista pela real, mantendo o fileInfo
      const finalMessage = {
        ...newMessage,
        content: file.name, // Garantir que o nome do arquivo seja mantido
        sender_name: optimisticMessage.sender_name,
        sender_type: optimisticMessage.sender_type,
        fileInfo: optimisticMessage.fileInfo // Manter as informações do arquivo
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? finalMessage : msg
      ));
      
      // Mostrar sucesso
      toast({
        title: "Arquivo enviado",
        description: `"${file.name}" enviado com sucesso`,
      });
      
      console.log('🔧 Arquivo enviado:', {
        name: file.name,
        size: file.size,
        type: file.type,
        chatId: selectedChat.id,
        messageType: messageType
      });
      
      // Recarregar chats para atualizar última mensagem (sem recarregar mensagens)
      // await loadChats(); // Comentado para evitar sobrescrever mensagens
      
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
      
      toast({
        title: "Erro ao enviar arquivo",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para rolar automaticamente para o final
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  // Carregar chats do usuário
  const loadChats = async () => {
    try {
      setLoading(true);
      const userChats = await chatService.getUserChats();
      console.log('🔧 [CHAT COMPONENT] Chats carregados:', userChats);
      console.log('🔧 [CHAT COMPONENT] Primeiro chat detalhado:', userChats[0]);
      
      // Usar os dados já mapeados pelo chatService (preservar participants e nomes)
      const processedChats = userChats.map((chat: any) => {
        console.log('🔧 [LOAD CHATS] Processando chat:', chat);
        
        if (user?.role === 'operator') {
          // Para operadoras, preservar todos os campos mapeados pelo chatService
          // e garantir que os nomes estejam corretos
          const operadoraNome = chat.operadora_nome || 'Operadora';
          const clinicaNome = chat.nome || chat.clinica_nome || 'Clínica';
          
          // Para operadoras, se não há conversa_id, precisamos criar/encontrar a conversa
          const chatId = chat.conversa_id || chat.id;
          
          console.log('🔧 [OPERADORA] Chat processado:', {
            originalId: chat.id,
            conversaId: chat.conversa_id,
            finalId: chatId,
            clinicaNome,
            operadoraNome
          });
          
          return {
            ...chat, // Preservar todos os campos do chatService
            id: chatId,
            name: clinicaNome, // Nome da clínica para operadoras
            description: `Chat com ${clinicaNome}`,
            clinica_id: chat.id, // ID da clínica
            operadora_id: user?.id,
            // Garantir que os nomes estejam disponíveis
            operadora_nome: operadoraNome,
            clinica_nome: clinicaNome,
            participants: [
              { id: user?.id, name: operadoraNome, type: 'operadora' },
              { id: chat.id, name: clinicaNome, type: 'clinica' }
            ],
            type: 'individual' as const
          };
        } else {
          // Para clínicas, usar dados mapeados pelo chatService
          return {
            ...chat, // Preservar todos os campos do chatService
            type: 'individual' as const
          };
        }
      });
      
      setChats(processedChats);
      
      // Se não há chat selecionado e há chats disponíveis, selecionar o primeiro
      if (!selectedChat && processedChats.length > 0) {
        setSelectedChat(processedChats[0]);
        selectedChatIdRef.current = processedChats[0].id || null;
        if (processedChats[0].id) {
          await loadMessages(processedChats[0].id);
        }
      } else if (!selectedChat && processedChats.length === 0) {
        // Se não há chats, criar um automaticamente
        await createInitialChat();
      }
    } catch (error) {
      console.error('Erro ao carregar chats:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar chats. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar chat inicial baseado no tipo de usuário
  const createInitialChat = async () => {
    try {
      if (!user) return;
      
      // Para clínicas: criar chat com operadora padrão (ID 1)
      // Para operadoras: criar chat com primeira clínica disponível
      if (user.role === 'clinic') {
        const newChat = await chatService.findOrCreateChat(1, 'operadora');
        setChats([newChat]);
        setSelectedChat(newChat);
        selectedChatIdRef.current = newChat.id || null;
        if (newChat.id) {
          await loadMessages(newChat.id);
        }
      } else if (user.role === 'operator') {
        // Para operadoras, buscar clínicas disponíveis e criar chat com a primeira
        // Por enquanto, vamos usar uma clínica padrão (ID 1)
        const newChat = await chatService.findOrCreateChat(1, 'clinica');
        setChats([newChat]);
        setSelectedChat(newChat);
        selectedChatIdRef.current = newChat.id || null;
        if (newChat.id) {
          await loadMessages(newChat.id);
        }
      }
    } catch (error) {
      console.error('Erro ao criar chat inicial:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar chat inicial. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Carregar mensagens de um chat
  const loadMessages = async (chatId: number) => {
    try {
      setMessagesLoading(true);
      console.log('🔧 [LOAD MESSAGES] Carregando mensagens para chatId:', chatId);
      console.log('🔧 [LOAD MESSAGES] selectedChat:', selectedChat);
      const response = await chatService.getChatMessages(chatId, 50, 0);
      
      // Processar mensagens para criar fileInfo se necessário
      const processedMessages = response.messages.map(msg => {
        console.log('🔧 Processando mensagem:', {
          id: msg.id,
          message_type: msg.message_type,
          content: msg.content,
          hasFileInfo: !!(msg as any).fileInfo
        });
        
        // Se já tem fileInfo, não processar
        if ((msg as any).fileInfo) {
          console.log('🔧 Mensagem já tem fileInfo:', (msg as any).fileInfo);
          return msg;
        }
        
        // Se é mensagem de arquivo/imagem, criar fileInfo
        if (msg.message_type === 'image' || msg.message_type === 'file') {
          console.log('🔧 Criando fileInfo para mensagem:', msg.message_type, 'Content:', msg.content);
          
          let fileInfo;
          let displayContent = msg.content;
          
          // Verificar se o conteúdo está no formato novo (nome|url|tipo|tamanho)
          if (msg.content.includes('|')) {
            const parts = msg.content.split('|');
            console.log('🔧 Partes do conteúdo:', parts);
            
            if (parts.length >= 4) {
              fileInfo = {
                name: parts[0],
                url: parts[1],
                type: parts[2],
                size: parseInt(parts[3]) || 0
              };
              displayContent = parts[0]; // Mostrar apenas o nome do arquivo
              console.log('🔧 FileInfo criado com sucesso:', fileInfo);
            } else {
              console.log('🔧 Formato inválido, usando fallback');
              fileInfo = {
                name: msg.content,
                size: 0,
                type: msg.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream',
                url: '#'
              };
            }
          } else {
            // Formato antigo (apenas nome)
            console.log('🔧 Formato antigo detectado');
            fileInfo = {
              name: msg.content,
              size: 0,
              type: msg.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream',
              url: '#'
            };
          }
          
          const processedMsg = {
            ...msg,
            content: displayContent, // Atualizar o content para mostrar apenas o nome
            fileInfo
          };
          
          console.log('🔧 Mensagem processada:', processedMsg);
          return processedMsg;
        }
        
        return msg;
      });
      
      setMessages(processedMessages);
      
      // Definir lastMessageId inicial para polling
      if (processedMessages.length > 0) {
        const latestMessage = processedMessages[processedMessages.length - 1];
        setLastMessageId(latestMessage.id);
        lastMessageIdRef.current = latestMessage.id;
      } else {
        setLastMessageId(null);
        lastMessageIdRef.current = null;
      }
      // Scroll para o final após carregar as mensagens
      setTimeout(scrollToBottom, 50);
      
      // Iniciar polling para novas mensagens
      startPolling();
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    try {
      if (!selectedChat.id) return;
      
      const messageText = message.trim();
      setMessage(''); // Limpar input imediatamente
      
      // Criar mensagem otimista (aparece imediatamente)
      const tempId = Date.now();
      const now = new Date();
      const optimisticMessage = {
        id: tempId,
        chat_id: selectedChat.id,
        sender_id: user?.id || 0,
        sender_type: (user?.role === 'operator' ? 'operadora' : 'clinica') as 'operadora' | 'clinica',
        sender_name: (user as any)?.name || 'Usuário',
        content: messageText,
        message_type: 'text' as const,
        status: 'sent' as const,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        fileInfo: null
      };
      
      // Adicionar mensagem imediatamente à lista
      console.log('🔧 Adicionando mensagem otimista:', optimisticMessage);
      setMessages(prev => {
        const newMessages = [...prev, optimisticMessage];
        console.log('🔧 Mensagens atualizadas:', newMessages);
        return newMessages;
      });
      
      // Scroll para o final após enviar mensagem
      setTimeout(scrollToBottom, 50);
      
      // Enviar para o servidor
      const newMessage = await chatService.sendMessage(selectedChat.id, messageText);
      console.log('🔧 Mensagem do servidor recebida:', newMessage);
      
      // Substituir mensagem otimista pela real, mantendo o conteúdo
      const finalMessage = {
        ...newMessage,
        content: messageText, // Garantir que o conteúdo seja mantido
        sender_name: optimisticMessage.sender_name,
        sender_type: optimisticMessage.sender_type
      };
      
      console.log('🔧 Mensagem final:', finalMessage);
      
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? finalMessage : msg
      ));
      
      // Recarregar chats para atualizar última mensagem (sem recarregar mensagens)
      // await loadChats(); // Comentado para evitar sobrescrever mensagens
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Selecionar chat
  const handleSelectChat = async (chat: Chat) => {
    console.log('🔧 [SELECT CHAT] Chat selecionado:', chat);
    
    // Parar polling anterior
    stopPolling();
    
    setSelectedChat(chat);
    selectedChatIdRef.current = chat.id || null;
    
    if (chat.id) {
      // Se é operadora e não há conversa_id, criar/encontrar conversa primeiro
      if (user?.role === 'operator' && !(chat as any).conversa_id) {
        try {
          console.log('🔧 [SELECT CHAT] Criando/encontrando conversa para operadora...');
          const newChat = await chatService.findOrCreateOperadoraClinicaChat(
            chat.operadora_id || user.id, 
            chat.clinica_id || chat.id
          );
          console.log('🔧 [SELECT CHAT] Conversa criada/encontrada:', newChat);
          
          // Atualizar o chat selecionado com o ID correto
          const updatedChat = {
            ...chat,
            id: newChat.id,
            conversa_id: newChat.id
          };
          setSelectedChat(updatedChat);
          
          await loadMessages(newChat.id);
        } catch (error) {
          console.error('Erro ao criar/encontrar conversa:', error);
          toast({
            title: "Erro",
            description: "Erro ao carregar conversa. Tente novamente.",
            variant: "destructive",
          });
        }
      } else {
        await loadMessages(chat.id);
      }
    }
  };

  // Filtrar chats por busca
  const filteredChats = chats.filter(chat => {
    if (searchTerm && !chat.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtrar baseado no tipo de usuário
    if (user?.role === 'operator') {
      return chat.operadora_id === user.id;
    } else if (user?.role === 'clinic') {
      return chat.clinica_id === user.id;
    }
    
    return true;
  });
  
  console.log('🔧 [CHAT COMPONENT] Chats filtrados:', filteredChats);

  // Filtrar chats não lidos
  const unreadChats = filteredChats.filter(chat => {
    if (user?.role === 'operator') {
      return chat.last_message && chat.last_message.created_at && 
             chat.operadora_ultima_leitura && 
             new Date(chat.last_message.created_at) > new Date(chat.operadora_ultima_leitura);
    } else if (user?.role === 'clinic') {
      return chat.last_message && chat.last_message.created_at && 
             chat.clinica_ultima_leitura && 
             new Date(chat.last_message.created_at) > new Date(chat.clinica_ultima_leitura);
    }
    return false;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'clinic': return <Hospital className="h-4 w-4" />;
      case 'operator': return <Database className="h-4 w-4" />;
      case 'operadora': return <Database className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getUserInitials = (name: string | undefined) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (role: string) => {
    switch(role) {
      case 'clinica': return 'bg-support-green';
      case 'operadora': return 'bg-support-yellow';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    // Converter para horário local (Brasília)
    const date = new Date(dateString);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return 'Horário inválido';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    // Formatar no horário local brasileiro
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', options);
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      // Para datas mais antigas, mostrar data e hora
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      };
      return date.toLocaleDateString('pt-BR', dateOptions);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadChats();
  }, []);

  // Auto-scroll sempre que mensagens mudarem (apenas se a última mensagem for nova)
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(scrollToBottom, 30);
    }
  }, [messages]);

  // Limpar polling quando trocar de chat ou desmontar componente
  useEffect(() => {
    // ao trocar de chat, reinicia polling para o novo chat
    stopPolling();
    if (selectedChat?.id) {
      selectedChatIdRef.current = selectedChat.id;
      startPolling();
    }
    return () => {
      stopPolling();
    };
  }, [selectedChat?.id]);

  return (
    <div className="h-[calc(100vh-4rem)] border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        {/* Sidebar */}
        <div className="md:col-span-1 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                className="pl-8 lco-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="all" className="text-sm">Todas</TabsTrigger>
                <TabsTrigger value="unread" className="text-sm">Não lidas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="m-0">
              <ScrollArea className="h-[calc(100vh-13rem)]">
                <div className="p-2 space-y-1">
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">
                        {user?.role === 'operator' ? 'Nenhuma conversa com clínicas' : 'Nenhuma conversa com operadora'}
                      </p>
                    </div>
                  ) : (
                    filteredChats.map((chat) => (
                      <button
                        key={chat.id}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md transition-colors",
                          selectedChat?.id === chat.id
                            ? "bg-primary/20"
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback className={cn(
                                user?.role === 'operator' ? "bg-support-green/20 text-support-green" : "bg-support-yellow/20 text-support-yellow"
                              )}>
                                {getUserInitials(chat.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className={cn(
                              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                              user?.role === 'operator' ? "bg-support-green" : "bg-support-yellow"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate text-sm">
                                {chat.name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {chat.last_message?.created_at ? formatTime(chat.last_message.created_at) : ''}
                              </span>
                            </div>
                              {chat.last_message?.content ? (
                                <p className="text-muted-foreground text-xs truncate">
                                  {chat.last_message.content}
                                </p>
                              ) : user?.role === 'operator' ? (() => {
                                const nomeConversa = (chat as any)?.nome_conversa || '';
                                const parts = nomeConversa.split(' - ');
                                const clinicaName = parts[1] || 'Clínica';
                                return (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Chat com</p>
                                    <p className="text-sm font-medium text-primary">{clinicaName}</p>
                                  </div>
                                );
                              })() : (
                                <p className="text-muted-foreground text-xs truncate">
                                  Nenhuma mensagem ainda
                                </p>
                              )}
                          </div>
                          {chat.ultima_mensagem_data && (
                            <div className="h-2 w-2 bg-primary rounded-full"></div>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <ScrollArea className="h-[calc(100vh-13rem)]">
                <div className="p-2 space-y-1">
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : unreadChats.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Nenhuma mensagem não lida</p>
                    </div>
                  ) : (
                    unreadChats.map((chat) => (
                      <button
                        key={chat.id}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md transition-colors",
                          selectedChat?.id === chat.id
                            ? "bg-primary/20"
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className={cn(
                              user?.role === 'operator' ? "bg-support-green/20 text-support-green" : "bg-support-yellow/20 text-support-yellow"
                            )}>
                              {getUserInitials(chat.nome_conversa)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate text-sm">
                                {chat.name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {chat.last_message?.created_at ? formatTime(chat.last_message.created_at) : ''}
                              </span>
                            </div>
                              {chat.last_message?.content ? (
                                <p className="text-muted-foreground text-xs truncate">
                                  {chat.last_message.content}
                                </p>
                              ) : user?.role === 'operator' ? (() => {
                                const nomeConversa = (chat as any)?.nome_conversa || '';
                                const parts = nomeConversa.split(' - ');
                                const clinicaName = parts[1] || 'Clínica';
                                return (
                                  <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground">Chat com</p>
                                    <p className="text-sm font-medium text-primary">{clinicaName}</p>
                                  </div>
                                );
                              })() : (
                                <p className="text-muted-foreground text-xs truncate">
                                  Nenhuma mensagem ainda
                                </p>
                              )}
                          </div>
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full max-h-[calc(100vh-4rem)]">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-card">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className={cn(
                      user?.role === 'operator' ? "bg-support-green/20 text-support-green" : "bg-support-yellow/20 text-support-yellow"
                    )}>
                      {getUserInitials((() => {
                        // Tentar obter o nome do contato (não o usuário atual)
                        const contact = getContactInfo();
                        if (contact?.name) return contact.name;
                        
                        // Fallback: usar participantes ou campos diretos
                        const operadoraName = (selectedChat as any)?.participants?.find((p: any) => p.type === 'operadora')?.name || 
                                             (selectedChat as any)?.operadora_nome || '';
                        const clinicaName = (selectedChat as any)?.participants?.find((p: any) => p.type === 'clinica')?.name || 
                                           (selectedChat as any)?.clinica_nome || '';
                        
                        // Se é operadora, mostrar nome da clínica; se é clínica, mostrar nome da operadora
                        if (user?.role === 'operator' && clinicaName) return clinicaName;
                        if (user?.role === 'clinic' && operadoraName) return operadoraName;
                        
                        return selectedChat.name;
                      })())}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {(() => {
                      // Debug: log do selectedChat para ver os campos disponíveis
                      console.log('🔧 [HEADER DEBUG] selectedChat completo:', selectedChat);
                      console.log('🔧 [HEADER DEBUG] participants:', (selectedChat as any)?.participants);
                      
                      // Extrair nomes do nome_conversa que já contém "Operadora - Clínica"
                      const nomeConversa = (selectedChat as any)?.nome_conversa || '';
                      const parts = nomeConversa.split(' - ');
                      const operadoraName = parts[0] || '';
                      const clinicaName = parts[1] || '';
                      
                      console.log('🔧 [HEADER DEBUG] nome_conversa:', nomeConversa);
                      console.log('🔧 [HEADER DEBUG] operadoraName extraído:', operadoraName);
                      console.log('🔧 [HEADER DEBUG] clinicaName extraído:', clinicaName);
                      
                      // Título principal: nome do contato (não o usuário atual)
                      const contact = getContactInfo();
                      const mainTitle = contact?.name || 
                                       (user?.role === 'operator' ? clinicaName : operadoraName) || 
                                       selectedChat.name;
                      
                      console.log('🔧 [HEADER DEBUG] mainTitle:', mainTitle);
                      
                      return (
                        <>
                          <p className="font-medium">{mainTitle}</p>
                          <p className="text-xs text-muted-foreground">
                            {operadoraName && clinicaName 
                              ? `Operadora: ${operadoraName} • Clínica: ${clinicaName}`
                              : user?.role === 'operator' ? 'Clínica' : 'Operadora'
                            }
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={handleViewProfile}>
                      <Info className="mr-2 h-4 w-4" />
                      Ver Perfil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Messages */}
              <ScrollArea ref={scrollAreaRef} className="flex-1 p-3 max-h-[calc(100vh-12rem)]">
                <div className="space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center p-4 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Nenhuma mensagem ainda</p>
                      <p className="text-xs">Seja o primeiro a enviar uma mensagem!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isSender = (msg.sender_id === user?.id) && (msg.sender_type === (user?.role === 'operator' ? 'operadora' : 'clinica'));
                      
                      return (
                        <div key={msg.id} className={cn("flex", isSender ? "justify-end" : "justify-start")}>
                          <div className="flex gap-2 max-w-[80%]">
                            {!isSender && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn(getStatusColor(msg.sender_type))}>
                                  {getUserInitials(msg.sender_name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div>
                              <div className={cn(
                                "rounded-2xl p-3 text-sm",
                                isSender 
                                  ? "bg-primary text-primary-foreground" 
                                  : "bg-muted"
                              )}>
                                {/* Renderizar arquivo no estilo WhatsApp */}
                                {(() => {
                                  console.log('🔧 Renderizando mensagem:', {
                                    id: msg.id,
                                    message_type: msg.message_type,
                                    content: msg.content,
                                    hasFileInfo: !!(msg as any).fileInfo,
                                    fileInfo: (msg as any).fileInfo
                                  });
                                  return null;
                                })()}
                                {(() => {
                                  // Processar arquivo se necessário
                                  let fileInfo = (msg as any).fileInfo;
                                  
                                  if (!fileInfo && (msg.message_type === 'file' || msg.message_type === 'image' || (msg.content && msg.content.includes('|')))) {
                                    console.log('🔧 Processando arquivo na renderização:', msg.content);
                                    
                                    if (msg.content && msg.content.includes('|')) {
                                      const parts = msg.content.split('|');
                                      if (parts.length >= 4) {
                                        fileInfo = {
                                          name: parts[0],
                                          url: parts[1],
                                          type: parts[2],
                                          size: parseInt(parts[3]) || 0
                                        };
                                      }
                                    }
                                    
                                    if (!fileInfo) {
                                      fileInfo = {
                                        name: msg.content,
                                        size: 0,
                                        type: msg.message_type === 'image' ? 'image/jpeg' : 'application/octet-stream',
                                        url: '#'
                                      };
                                    }
                                  }
                                  
                                  return fileInfo ? (
                                    <div className="max-w-xs">
                                      <div className="flex items-center space-x-3 p-2 bg-background/50 rounded-md">
                                        {getFileIcon(fileInfo.type || 'application/octet-stream')}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium truncate">
                                            {fileInfo.name}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {formatFileSize(fileInfo.size || 0)}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex space-x-1 mt-2">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-2 text-xs border-border/50 hover:bg-muted dark:hover:bg-muted/80 text-foreground dark:text-foreground"
                                          onClick={() => handleFileAction(fileInfo, 'open')}
                                        >
                                          <ExternalLink className="h-3 w-3 mr-1" />
                                          Abrir
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 px-2 text-xs border-border/50 hover:bg-muted dark:hover:bg-muted/80 text-foreground dark:text-foreground"
                                          onClick={() => handleFileAction(fileInfo, 'download')}
                                        >
                                          <Download className="h-3 w-3 mr-1" />
                                          Baixar
                                        </Button>
                                      </div>
                                    </div>
                                  ) : null;
                                })() || (
                                  msg.content
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    type="button" 
                    title="Anexar arquivo"
                    onClick={handleAttachFile}
                  >
                    <PaperclipIcon className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Digite uma mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                    disabled={messagesLoading}
                  />
                  <Button 
                    className="lco-btn-primary" 
                    onClick={handleSendMessage} 
                    type="button"
                    disabled={!message.trim() || messagesLoading}
                    title="Enviar mensagem"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {user?.role === 'operator' ? 'Selecione uma clínica' : 'Selecione a conversa'}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                {user?.role === 'operator' 
                  ? 'Escolha uma clínica para iniciar ou continuar uma conversa'
                  : 'Escolha a conversa com sua operadora para trocar mensagens'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal do Perfil do Contato */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Perfil do Contato</DialogTitle>
          </DialogHeader>
          {(() => {
            const contact = getContactInfo();
            if (!contact) return null;
            
            return (
              <div className="space-y-4">
                {/* Avatar e Nome */}
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className={cn(
                      user?.role === 'operator' ? "bg-support-green/20 text-support-green" : "bg-support-yellow/20 text-support-yellow"
                    )}>
                      {getUserInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{contact.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.type === 'operadora' ? 'Operadora de Saúde' : 'Clínica Médica'}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                {/* Informações do Contato */}
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Tipo</h4>
                    <p className="text-sm text-muted-foreground">
                      {contact.type === 'operadora' ? 'Operadora de Planos de Saúde' : 'Clínica Médica'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">Status</h4>
                    <div className="flex items-center space-x-2">
                      <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      <span className="text-sm text-green-600">Online</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;