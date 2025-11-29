import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';
import { TransitionLink } from '@/components/transitions/TransitionLink';
import { usePageNavigation } from '@/components/transitions/PageTransitionContext';
import { 
  BellIcon, 
  Sun, 
  Moon, 
  Users, 
  FileText, 
  PieChart, 
  MessageSquare,
  Menu, 
  X,
  Hospital,
  Database,
  Search,
  FilePlus,
  File,
  Check,
  FolderOpen,
  UserPlus,
  AlertCircle,
  Activity,
  Settings,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NotificationService, type NotificationItem } from '@/services/api';
import { useAdmin } from '@/contexts/AdminContext';

// Interface para itens de navegação
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
  submenu?: {
    label: string;
    path: string;
    icon: React.ReactElement;
  }[];
}

// Componente otimizado para GIFs com lazy loading
const OptimizedGifIcon = ({ 
  normalSrc, 
  hoverSrc, 
  hovered, 
  active, 
  alt 
}: { 
  normalSrc: string; 
  hoverSrc: string; 
  hovered: boolean; 
  active: boolean; 
  alt: string; 
}) => {
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false);
  const [shouldShowHover, setShouldShowHover] = useState(false);

  // Preload hover image when component mounts or first hover
  useEffect(() => {
    if ((hovered || active) && !hoverImageLoaded) {
      const img = new Image();
      img.onload = () => {
        setHoverImageLoaded(true);
        setShouldShowHover(hovered || active);
      };
      img.src = hoverSrc;
    } else if (hoverImageLoaded) {
      setShouldShowHover(hovered || active);
    }
  }, [hovered, active, hoverSrc, hoverImageLoaded]);

  return (
    <img
      src={shouldShowHover && hoverImageLoaded ? hoverSrc : normalSrc}
      alt={alt}
      className="h-5 w-5 object-contain transition-opacity duration-200"
      loading="lazy"
      style={{
        opacity: (shouldShowHover && !hoverImageLoaded) ? 0.8 : 1
      }}
    />
  );
};

// Ícone estático para o menu Dashboards
const DashboardGifIcon = () => (
  <PieChart className="h-5 w-5 text-primary" />
);

// Ícone estático para o menu Dashboard da Clínica
const HospitalGifIcon = () => (
  <Hospital className="w-5 h-5 text-primary" />
);

// Ícone estático para Pacientes
const PacientesGifIcon = () => (
  <Users className="w-5 h-5 text-primary" />
);

// Ícone estático para Cadastros
const CadastrosGifIcon = () => (
  <FolderOpen className="h-5 w-5 text-primary" />
);

// Ícone estático para Database
const DatabaseGifIcon = () => (
  <Database className="w-5 h-5 text-primary" />
);

// Ícone estático para Cadastro de Paciente
const CadPacienteGifIcon = () => (
  <UserPlus className="w-5 h-5 text-primary" />
);

// Ícone estático para Protocolos
const ProtocolosGifIcon = () => (
  <FileText className="w-5 h-5 text-primary" />
);

// Ícone estático para Solicitação
const SolicitacaoGifIcon = () => (
  <FilePlus className="w-5 h-5 text-primary" />
);

// Ícone estático para Glosas
const GlosasGifIcon = () => (
  <AlertCircle className="w-5 h-5 text-primary" />
);

// Ícone estático para Chat
const ChatGifIcon = () => (
  <MessageSquare className="w-5 h-5 text-primary" />
);

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const clinicaId = (useAuth().user?.clinica_id as number) || 1;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { navigateWithTransition } = usePageNavigation();
  
  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Carregar notificações com polling simples (apenas para clínicas)
  useEffect(() => {
    // Não carregar notificações para operadoras
    if (user?.role === 'operator') {
      return;
    }
    
    let timer: number | null = null;
    let failureCooldown = 0;
    const load = async () => {
      try {
        if (failureCooldown > Date.now()) return;
        setLoadingNotifs(true);
        const list = await NotificationService.listar({ clinica_id: clinicaId, limit: 20 });
        setNotifications(list);
        setUnreadCount(list.filter(n => !n.lida).length);
      } catch (e: any) {
        // Em caso de falha (ex.: 404), pausa polling por 60s
        failureCooldown = Date.now() + 60000;
      } finally {
        setLoadingNotifs(false);
      }
    };
    load();
    timer = window.setInterval(load, 30000); // 30s
    return () => { if (timer) window.clearInterval(timer); };
  }, []);

  const handleNotifClick = async (n: NotificationItem) => {
    await NotificationService.marcarComoLida(n.id);
    setNotifications(prev => prev.map(it => it.id === n.id ? { ...it, lida: true } : it));
    setUnreadCount(prev => Math.max(0, prev - 1));
    // Navegação contextual
    if (n.solicitacao_id) {
      navigateWithTransition('/historico-solicitacoes', {
        state: { authId: n.solicitacao_id, scrollToAuth: String(n.solicitacao_id) }
      } as any);
      return;
    }
    if (n.paciente_id) {
      navigateWithTransition('/patients');
      return;
    }
  };

  const markAllAsRead = async () => {
    const ok = await NotificationService.marcarTodasComoLidas({ clinica_id: clinicaId });
    if (ok) {
      setNotifications(prev => prev.map(n => ({ ...n, lida: true })));
      setUnreadCount(0);
    }
  };
  
  const roleLabel = user?.role === 'clinic' 
    ? 'Clínica' 
    : user?.role === 'operator' 
      ? 'Operadora' 
      : 'Plano de Saúde';
  
  const roleBadgeClass = user?.role === 'clinic'
    ? 'bg-[#65a3ee]'
    : user?.role === 'operator'
      ? 'bg-support-yellow'
      : 'bg-highlight-peach';

  // Função para verificar se um menu está ativo (incluindo submenus)
  const isMenuActive = (menuPath: string, submenuPaths?: string[]): boolean => {
    const currentPath = location.pathname;
    
    // Verificar se está na rota principal do menu
    if (currentPath === menuPath) return true;
    
    // Verificar se está em algum submenu
    if (submenuPaths && submenuPaths.some(subPath => currentPath === subPath)) {
      return true;
    }
    
    return false;
  };
  
  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const commonItems = [
      {
        label: 'Chat',
        path: '/chat',
        icon: <ChatGifIcon />,
      },
    ];

    if (user?.role === 'clinic') {
      return [
        {
          label: 'Dashboards',
          path: '/dashboard-clinica',
          icon: <DashboardGifIcon />,
          submenu: [
            {
              label: 'Clínica',
              path: '/dashboard-clinica',
              icon: <Hospital className="h-5 w-5" />,
            },
            {
              label: 'Pacientes',
              path: '/patient-dashboard',
              icon: <Users className="h-5 w-5" />,
            },
            {
              label: 'Análises',
              path: '/analyses',
              icon: <Activity className="h-5 w-5" />,
            },
          ],
        },
        {
          label: 'Cadastros',
          path: '/patients', // default path
          icon: <CadastrosGifIcon />,
          submenu: [
            {
              label: 'Pacientes',
              path: '/patients',
              icon: <UserPlus className="h-5 w-5" />,
            },
            {
              label: 'Protocolos',
              path: '/protocols',
              icon: <FileText className="h-5 w-5" />,
            },

          ],
        },
        {
          label: 'Autorização',
          path: '/reports',
          icon: <GlosasGifIcon />,
          submenu: [
            {
              label: 'Nova Solicitação',
              path: '/reports',
              icon: <FilePlus className="h-5 w-5" />,
            },
            {
              label: 'Histórico',
              path: '/historico-solicitacoes',
              icon: <File className="h-5 w-5" />,
            },
          ],
        },
        {
          label: 'Solicitações',
          path: '/ajustes-negociacao',
          icon: <SolicitacaoGifIcon />,
          submenu: [
            {
              label: 'Ajustes Corpo Clínico',
              path: '/ajustes-corpo-clinico',
              icon: <Users className="h-5 w-5" />,
            },
            {
              label: 'Ajustes Negociação',
              path: '/ajustes-negociacao',
              icon: <FileText className="h-5 w-5" />,
            },
          ],
        },
        {
          label: 'Financeiro',
          path: '/financeiro',
          icon: <DollarSign className={cn("h-5 w-5", isMenuActive('/financeiro', ['/financeiro', '/recursos-glosas', '/financeiro/tabelas']) && "text-primary")} />,
          submenu: [
            {
              label: 'Faturamento',
              path: '/financeiro',
              icon: <FileText className="h-5 w-5" />,
            },
            {
              label: 'Recurso de Glosa',
              path: '/recursos-glosas',
              icon: <AlertCircle className="h-5 w-5" />,
            },
            {
              label: 'Tabelas',
              path: '/financeiro/tabelas',
              icon: <Database className="h-5 w-5" />,
            },
          ],
        },
        // {
        //   label: 'Finanças',
        //   path: '/financas',
        //   icon: <TrendingUp className={cn("h-5 w-5", location.pathname === '/financas' && "text-primary")} />,
        // },
        ...commonItems,
      ];
    } else if (user?.role === 'operator') {
      return [
        { label: 'Dashboard', path: '/dashboard-operadora', icon: <Database className="w-5 h-5" /> },
        { label: 'Análises', path: '/analysis', icon: <PieChart className="w-5 h-5" /> },
        { label: 'Solicitações', path: '/operator-solicitacoes', icon: <FileText className="w-5 h-5" /> },
        { label: 'Ajustes', path: '/operator-ajustes', icon: <Database className="w-5 h-5" /> },
        { label: 'Recursos de Glosas', path: '/operadora/recursos-glosas', icon: <AlertCircle className="w-5 h-5" /> },
        ...commonItems,
      ];
    } else {
      // Health Plan
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Database className="w-5 h-5" />,
        },
        {
          label: 'Gastos',
          path: '/expenses',
          icon: <PieChart className="w-5 h-5" />,
        },
        ...commonItems,
      ];
    }
  };

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigateWithTransition(path);
  };

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-6 z-50 transition-all duration-300",
      scrolled 
        ? "modern-header" 
        : "bg-card border-b border-border animate-slide-down"
    )}>
      <div className="flex items-center gap-4">
        <Logo size="sm" className="hidden md:flex animate-fade-in" withText={false} />
        
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden icon-hover">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pt-4">
                <Logo size="sm" withText={false} />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="icon-hover">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {getNavItems().map((item, index) => (
                  <button
                    key={item.path}
                    onClick={() => handleMobileNavClick(item.path)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300 w-full",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path))
                        ? "bg-primary/20 text-primary font-medium" 
                        : "hover:bg-muted hover:translate-x-1"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="mt-auto pt-4 border-t border-border">
                <Badge className={cn("mb-2", roleBadgeClass)}>
                  {roleLabel}
                </Badge>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{user?.username || (user as any)?.nome || 'Operadora'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive/80 hover-lift"
                    onClick={logout}
                  >
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {getNavItems().map((item) => (
          'submenu' in item ? (
            <div key={item.path} className="relative group">
              {item.label === 'Cadastros' ? (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <TransitionLink
                    to={item.path}
                    className={cn(
                      "nav-link hover-lift flex items-center gap-1",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                      "animate-fade-in"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </TransitionLink>
                </span>
              ) : item.label === 'Dashboards' ? (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <TransitionLink
                    to={item.path}
                    className={cn(
                      "nav-link hover-lift flex items-center gap-1",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                      "animate-fade-in"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </TransitionLink>
                </span>
              ) : item.label === 'Autorização' ? (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <TransitionLink
                    to={item.path}
                    className={cn(
                      "nav-link hover-lift flex items-center gap-1",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                      "animate-fade-in"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </TransitionLink>
                </span>
              ) : item.label === 'Solicitações' ? (
                <span
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <TransitionLink
                    to={item.path}
                    className={cn(
                      "nav-link hover-lift flex items-center gap-1",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                      "animate-fade-in"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </TransitionLink>
                </span>
              ) : item.label === 'Financeiro' ? (
                <span
                  onMouseEnter={() => setFinanceiroMenuHover(true)}
                  onMouseLeave={() => setFinanceiroMenuHover(false)}
                  style={{ display: 'inline-flex', alignItems: 'center' }}
                >
                  <TransitionLink
                    to={item.path}
                    className={cn(
                      "nav-link hover-lift flex items-center gap-1",
                      isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                      "animate-fade-in"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </TransitionLink>
                </span>
              ) : (
                <TransitionLink
                  to={item.path}
                  className={cn(
                    "nav-link hover-lift flex items-center gap-1",
                    isMenuActive(item.path, item.submenu?.map(sub => sub.path)) && "active",
                    "animate-fade-in"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.submenu && (
                    <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  )}
                </TransitionLink>
              )}
              <div className="absolute left-0 top-full z-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                <div className="bg-card border border-border rounded-md shadow-lg mt-1 py-1 animate-fade-in w-fit">
                  {item.submenu.map((sub) => {
                    if (sub.label === 'Clínica') {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <Hospital className="h-5 w-5" />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    } else if (sub.label === 'Pacientes') {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <Users className="h-5 w-5" />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    } else if (sub.label === 'Análises') {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <Activity className="h-5 w-5" />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    } else if (sub.label === 'Pacientes') {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <UserPlus className="h-5 w-5" />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    } else if (sub.label === 'Protocolos') {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          <FileText className="h-5 w-5" />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    } else {
                      return (
                        <TransitionLink
                          key={sub.path}
                          to={sub.path}
                          className={cn(
                            "block w-full px-4 py-2 text-base transition-all duration-200 hover-lift rounded-md text-left flex flex-row items-center gap-2 whitespace-nowrap",
                            location.pathname === sub.path && "bg-primary/10 text-primary font-semibold"
                          )}
                        >
                          {sub.icon && <span className="inline-block align-middle">{sub.icon}</span>}
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </TransitionLink>
                      );
                    }
                  })}
                </div>
              </div>
            </div>
          ) : item.label === 'Autorização' ? (
            <span
              key={item.path}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <TransitionLink
                to={item.path}
                className={cn(
                  "nav-link hover-lift flex items-center gap-1",
                  (location.pathname === item.path || location.pathname === '/historico-solicitacoes') && "active",
                  "animate-fade-in"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </TransitionLink>
            </span>
          ) : item.label === 'Recursos de Glosas' ? (
            <span
              key={item.path}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <TransitionLink
                to={item.path}
                className={cn(
                  "nav-link hover-lift flex items-center gap-1",
                  location.pathname === item.path && "active",
                  "animate-fade-in"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </TransitionLink>
            </span>
          ) : item.label === 'Chat' ? (
            <span
              key={item.path}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <TransitionLink
                to={item.path}
                className={cn(
                  "nav-link hover-lift flex items-center gap-1",
                  location.pathname === item.path && "active",
                  "animate-fade-in"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </TransitionLink>
            </span>
          ) : item.label === 'Solicitações' ? (
            <span
              key={item.path}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <TransitionLink
                to={item.path}
                className={cn(
                  "nav-link hover-lift flex items-center gap-1",
                  (location.pathname === item.path || location.pathname === '/ajustes-corpo-clinico') && "active",
                  "animate-fade-in"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                
              </TransitionLink>
            </span>
          ) : item.label === 'Financeiro' ? (
            <span
              key={item.path}
              onMouseEnter={() => setFinanceiroMenuHover(true)}
              onMouseLeave={() => setFinanceiroMenuHover(false)}
              style={{ display: 'inline-flex', alignItems: 'center' }}
            >
              <TransitionLink
                to={item.path}
                className={cn(
                  "nav-link hover-lift flex items-center gap-1",
                  (location.pathname === item.path || location.pathname === '/recursos-glosas' || location.pathname === '/financeiro/tabelas') && "active",
                  "animate-fade-in"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                
              </TransitionLink>
            </span>
          ) : (
            <TransitionLink
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link hover-lift",
                location.pathname === item.path && "active",
                "animate-fade-in"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </TransitionLink>
          )
        ))}
      </nav>
      
      <div className="flex items-center space-x-3">
        <Badge className={cn(
          "hidden sm:flex animate-fade-in transition-all", 
          roleBadgeClass,
          "hover:scale-105"
        )}>
          {roleLabel}
        </Badge>
        
        <Button 
          variant="ghost" 
          size="icon"
          onClick={toggleTheme}
          className="transition-all duration-300"
        >
          <div className={cn("relative w-5 h-5 flex items-center justify-center")}>
            <div className={cn(
              "absolute inset-0 duration-500 flex items-center justify-center",
              theme === 'light' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 moon-animation'
            )}>
              <Moon className="h-5 w-5" />
            </div>
            <div className={cn(
              "absolute inset-0 duration-500 flex items-center justify-center",
              theme === 'dark' ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 sun-animation'
            )}>
              <Sun className="h-5 w-5" />
            </div>
          </div>
        </Button>
        
        <Popover onOpenChange={(open) => {
          // Quando o popover é aberto, marcar todas as notificações como lidas automaticamente
          if (open && unreadCount > 0) {
            markAllAsRead();
          }
        }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative animate-pulse-subtle">
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary rounded-full text-white text-[10px] flex items-center justify-center animate-bounce-subtle">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2 animate-scale-in" align="end">
            <div className="flex items-center justify-between px-1 pb-2">
              <div className="text-sm font-medium">Notificações</div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead} disabled={unreadCount === 0}>Marcar todas como lidas</Button>
            </div>
            {loadingNotifs ? (
              <div className="text-xs text-muted-foreground px-1 py-3">Carregando...</div>
            ) : notifications.length === 0 ? (
              <div className="text-xs text-muted-foreground px-1 py-3">Sem notificações</div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'p-2 rounded-md transition-all duration-200 cursor-pointer hover:bg-muted',
                      !n.lida ? 'bg-primary/5 border border-primary/10' : 'bg-transparent'
                    )}
                    onClick={() => handleNotifClick(n)}
                  >
                    <div className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString('pt-BR')}</div>
                    <div className="text-sm font-medium">{n.titulo}</div>
                    <div className="text-xs text-muted-foreground">{n.mensagem}</div>
                  </div>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 relative hover-lift">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user?.username?.substring(0, 2).toUpperCase() || ((user as any)?.nome || '').substring(0, 2).toUpperCase() || 'OP'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 animate-scale-in">
            <div className="px-2 py-1.5 text-sm font-medium">
              {user?.role === 'operator' 
                ? ((user as any)?.nome || (user as any)?.operadora?.nome || 'Operadora')
                : (user?.username || (user as any)?.nome || 'Usuário')
              }
            </div>
            <div className="px-2 pb-1.5 text-xs text-muted-foreground">
              {user?.role === 'operator' 
                ? ((user as any)?.operadora?.codigo || 'Código da Operadora')
                : roleLabel
              }
            </div>
            <DropdownMenuSeparator />

            {user?.role === 'clinic' && (
              <>
                <DropdownMenuItem 
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 flex items-center gap-2",
                    location.pathname === '/profile' && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => navigateWithTransition('/profile')}
                >
                  <Hospital className="h-4 w-4" />
                  <span className="flex-1">Perfil da Clínica</span>
                  <div className={cn(
                    "transition-all duration-200",
                    location.pathname === '/profile' ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 flex items-center gap-2",
                    location.pathname === '/corpo-clinico' && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => navigateWithTransition('/corpo-clinico')}
                >
                  <Users className="h-4 w-4" />
                  <span className="flex-1">Profissionais</span>
                  <div className={cn(
                    "transition-all duration-200",
                    location.pathname === '/corpo-clinico' ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 flex items-center gap-2",
                    location.pathname === '/cadastro-documentos' && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => navigateWithTransition('/cadastro-documentos')}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="flex-1">Documentos</span>
                  <div className={cn(
                    "transition-all duration-200",
                    location.pathname === '/cadastro-documentos' ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 flex items-center gap-2",
                    location.pathname === '/procedimentos' && "bg-primary/10 text-primary font-medium"
                  )}
                  onClick={() => navigateWithTransition('/procedimentos')}
                >
                  <DollarSign className="h-4 w-4" />
                  <span className="flex-1">Procedimentos</span>
                  <div className={cn(
                    "transition-all duration-200",
                    location.pathname === '/procedimentos' ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  )}>
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem className="cursor-pointer hover:text-destructive" onClick={logout}>
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;