
import { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Mock chat data
interface Message {
  id: string;
  sender: string;
  senderRole: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Chat {
  id: string;
  type: 'individual' | 'group';
  participants: string[];
  name: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    read: boolean;
  };
  messages: Message[];
}

const mockChats: Chat[] = [
  {
    id: 'group',
    type: 'group',
    participants: ['LCOClínica', 'LCOOperadora', 'LCOPlanoSaude'],
    name: 'Grupo LCOnco',
    avatar: '',
    lastMessage: {
      content: 'Podemos ajustar aquela questão do relatório?',
      timestamp: '14:30',
      read: false,
    },
    messages: [
      {
        id: '1',
        sender: 'LCOOperadora',
        senderRole: 'operator',
        content: 'Bom dia! Temos uma nova atualização no sistema.',
        timestamp: '09:15',
        read: true,
      },
      {
        id: '2',
        sender: 'LCOClínica',
        senderRole: 'clinic',
        content: 'Ok, obrigado pelo aviso.',
        timestamp: '09:20',
        read: true,
      },
      {
        id: '3',
        sender: 'LCOPlanoSaude',
        senderRole: 'healthPlan',
        content: 'Podemos ajustar aquela questão do relatório?',
        timestamp: '14:30',
        read: false,
      },
    ]
  },
  {
    id: 'clinic',
    type: 'individual',
    participants: ['LCOOperadora', 'LCOClínica'],
    name: 'LCOClínica',
    avatar: '',
    lastMessage: {
      content: 'Vamos confirmar o tratamento da paciente Ana Silva?',
      timestamp: 'Ontem',
      read: true,
    },
    messages: [
      {
        id: '1',
        sender: 'LCOOperadora',
        senderRole: 'operator',
        content: 'Olá, tudo bem?',
        timestamp: 'Ontem, 15:30',
        read: true,
      },
      {
        id: '2',
        sender: 'LCOClínica',
        senderRole: 'clinic',
        content: 'Olá! Tudo sim, e com você?',
        timestamp: 'Ontem, 15:32',
        read: true,
      },
      {
        id: '3',
        sender: 'LCOOperadora',
        senderRole: 'operator',
        content: 'Vamos confirmar o tratamento da paciente Ana Silva?',
        timestamp: 'Ontem, 15:35',
        read: true,
      },
    ]
  },
  {
    id: 'operator',
    type: 'individual',
    participants: ['LCOPlanoSaude', 'LCOOperadora'],
    name: 'LCOOperadora',
    avatar: '',
    lastMessage: {
      content: 'Precisamos verificar o orçamento trimestral.',
      timestamp: '10:45',
      read: false,
    },
    messages: [
      {
        id: '1',
        sender: 'LCOPlanoSaude',
        senderRole: 'healthPlan',
        content: 'Olá, bom dia',
        timestamp: '10:40',
        read: true,
      },
      {
        id: '2',
        sender: 'LCOOperadora',
        senderRole: 'operator',
        content: 'Bom dia! Como posso ajudar?',
        timestamp: '10:42',
        read: true,
      },
      {
        id: '3',
        sender: 'LCOPlanoSaude',
        senderRole: 'healthPlan',
        content: 'Precisamos verificar o orçamento trimestral.',
        timestamp: '10:45',
        read: false,
      },
    ]
  },
  {
    id: 'healthPlan',
    type: 'individual',
    participants: ['LCOClínica', 'LCOPlanoSaude'],
    name: 'LCOPlanoSaude',
    avatar: '',
    lastMessage: {
      content: 'O relatório do último tratamento foi enviado?',
      timestamp: 'Segunda',
      read: true,
    },
    messages: [
      {
        id: '1',
        sender: 'LCOPlanoSaude',
        senderRole: 'healthPlan',
        content: 'Olá, sobre o tratamento recente.',
        timestamp: 'Segunda, 11:20',
        read: true,
      },
      {
        id: '2',
        sender: 'LCOClínica',
        senderRole: 'clinic',
        content: 'Sim, como posso ajudar?',
        timestamp: 'Segunda, 11:25',
        read: true,
      },
      {
        id: '3',
        sender: 'LCOPlanoSaude',
        senderRole: 'healthPlan',
        content: 'O relatório do último tratamento foi enviado?',
        timestamp: 'Segunda, 11:30',
        read: true,
      },
    ]
  },
];

const Chat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(mockChats[0]);
  const [chats, setChats] = useState<Chat[]>(mockChats);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter chats by search term and create relevant chats based on user role
  const filteredChats = chats.filter(chat => {
    // Filter by search
    if (searchTerm && !chat.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filter based on user role (individual chats are only shown if the user is a participant)
    if (chat.type === 'individual') {
      return chat.participants.includes(user?.username || '');
    }
    
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'clinic': return <Hospital className="h-4 w-4" />;
      case 'operator': return <Database className="h-4 w-4" />;
      case 'healthPlan': return <Wallet className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const getUserInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (role: string) => {
    switch(role) {
      case 'clinic': return 'bg-support-green';
      case 'operator': return 'bg-support-yellow';
      case 'healthPlan': return 'bg-highlight-peach';
      default: return 'bg-gray-400';
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChat) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: user?.username || '',
      senderRole: user?.role || '',
      content: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    
    const updatedChat = {
      ...selectedChat,
      messages: [...selectedChat.messages, newMessage],
      lastMessage: {
        content: message.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      }
    };
    
    setChats(chats.map(chat => chat.id === selectedChat.id ? updatedChat : chat));
    setSelectedChat(updatedChat);
    setMessage('');
  };

  return (
    <div className="h-[calc(100vh-7rem)] border border-border rounded-lg overflow-hidden shadow-sm animate-fade-in">
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
                  {filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md transition-colors",
                        selectedChat?.id === chat.id
                          ? "bg-primary/20"
                          : "hover:bg-muted"
                      )}
                      onClick={() => setSelectedChat(chat)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar>
                            {chat.type === 'group' ? (
                              <div className="flex h-full w-full items-center justify-center bg-primary">
                                <Users className="h-5 w-5 text-primary-foreground" />
                              </div>
                            ) : (
                              <AvatarFallback className={cn(
                                chat.name === 'LCOClínica' ? "bg-support-green/20 text-support-green" :
                                chat.name === 'LCOOperadora' ? "bg-support-yellow/20 text-support-yellow" :
                                "bg-highlight-peach/20 text-highlight-peach"
                              )}>
                                {getUserInitials(chat.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          {chat.type !== 'group' && (
                            <span className={cn(
                              "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                              chat.name === 'LCOClínica' ? "bg-support-green" :
                              chat.name === 'LCOOperadora' ? "bg-support-yellow" :
                              "bg-highlight-peach"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="font-medium truncate text-sm">
                              {chat.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {chat.lastMessage?.timestamp}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-xs truncate">
                            {chat.lastMessage?.content}
                          </p>
                        </div>
                        {!chat.lastMessage?.read && chat.lastMessage?.content && (
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="unread" className="m-0">
              <ScrollArea className="h-[calc(100vh-13rem)]">
                <div className="p-2 space-y-1">
                  {filteredChats
                    .filter(chat => chat.lastMessage && !chat.lastMessage.read)
                    .map((chat) => (
                      <button
                        key={chat.id}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md transition-colors",
                          selectedChat?.id === chat.id
                            ? "bg-primary/20"
                            : "hover:bg-muted"
                        )}
                        onClick={() => setSelectedChat(chat)}
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            {chat.type === 'group' ? (
                              <div className="flex h-full w-full items-center justify-center bg-primary">
                                <Users className="h-5 w-5 text-primary-foreground" />
                              </div>
                            ) : (
                              <AvatarFallback className={cn(
                                chat.name === 'LCOClínica' ? "bg-support-green/20 text-support-green" :
                                chat.name === 'LCOOperadora' ? "bg-support-yellow/20 text-support-yellow" :
                                "bg-highlight-peach/20 text-highlight-peach"
                              )}>
                                {getUserInitials(chat.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <p className="font-medium truncate text-sm">
                                {chat.name}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {chat.lastMessage?.timestamp}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-xs truncate">
                              {chat.lastMessage?.content}
                            </p>
                          </div>
                          <div className="h-2 w-2 bg-primary rounded-full"></div>
                        </div>
                      </button>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div className="md:col-span-2 flex flex-col h-full">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-border flex items-center justify-between px-4 bg-card">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    {selectedChat.type === 'group' ? (
                      <div className="flex h-full w-full items-center justify-center bg-primary">
                        <Users className="h-5 w-5 text-primary-foreground" />
                      </div>
                    ) : (
                      <AvatarFallback className={cn(
                        selectedChat.name === 'LCOClínica' ? "bg-support-green/20 text-support-green" :
                        selectedChat.name === 'LCOOperadora' ? "bg-support-yellow/20 text-support-yellow" :
                        "bg-highlight-peach/20 text-highlight-peach"
                      )}>
                        {getUserInitials(selectedChat.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedChat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedChat.type === 'group' 
                        ? '3 participantes' 
                        : 'Online'}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedChat.messages.map((msg) => {
                    const isSender = msg.sender === user?.username;
                    
                    return (
                      <div key={msg.id} className={cn("flex", isSender ? "justify-end" : "justify-start")}>
                        <div className="flex gap-2 max-w-[80%]">
                          {!isSender && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn(getStatusColor(msg.senderRole))}>
                                {getUserInitials(msg.sender)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div>
                            {selectedChat.type === 'group' && !isSender && (
                              <p className="text-xs font-medium mb-1 flex items-center gap-1">
                                {getRoleIcon(msg.senderRole)}
                                {msg.sender}
                              </p>
                            )}
                            
                            <div className={cn(
                              "rounded-2xl p-3 text-sm",
                              isSender 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted"
                            )}>
                              {msg.content}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1">
                              {msg.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" type="button">
                    <PaperclipIcon className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Digite uma mensagem"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button className="lco-btn-primary" onClick={handleSendMessage} type="button">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Selecione uma conversa</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Escolha uma conversa para começar a trocar mensagens
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
