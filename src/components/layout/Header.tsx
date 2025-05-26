import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { NavLink } from 'react-router-dom';
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
  Search
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

const Header = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
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
  
  const roleLabel = user?.role === 'clinic' 
    ? 'Clínica' 
    : user?.role === 'operator' 
      ? 'Operadora' 
      : 'Plano de Saúde';
  
  const roleBadgeClass = user?.role === 'clinic'
    ? 'bg-support-green'
    : user?.role === 'operator'
      ? 'bg-support-yellow'
      : 'bg-highlight-peach';
  
  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        label: 'Chat',
        path: '/chat',
        icon: <MessageSquare className="w-5 h-5" />,
      },
    ];

    if (user?.role === 'clinic') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Hospital className="w-5 h-5" />,
        },
        {
          label: 'Pacientes',
          path: '/patients',
          icon: <Users className="w-5 h-5" />,
        },
        {
          label: 'Solicitação de Autorização',
          path: '/reports',
          icon: <FileText className="w-5 h-5" />,
        },
        {
          label: 'Recursos de Glosas',
          path: '/recursos-glosas',
          icon: <Search className="w-5 h-5" />,
        },
        ...commonItems,
      ];
    } else if (user?.role === 'operator') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Database className="w-5 h-5" />,
        },
        {
          label: 'Análise',
          path: '/analysis',
          icon: <PieChart className="w-5 h-5" />,
        },
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

  return (
    <header className={cn(
      "h-16 flex items-center justify-between px-6 z-50 transition-all duration-300",
      scrolled 
        ? "modern-header" 
        : "bg-card border-b border-border animate-slide-down"
    )}>
      <div className="flex items-center gap-4">
        <Logo size="sm" className="hidden md:flex animate-fade-in" />
        
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden icon-hover">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[240px] sm:w-[300px]">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 pt-4">
                <Logo size="sm" />
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="icon-hover">
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-2">
                {getNavItems().map((item, index) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300 w-full",
                      isActive 
                        ? "bg-primary/20 text-primary font-medium" 
                        : "hover:bg-muted hover:translate-x-1"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-auto pt-4 border-t border-border">
                <Badge className={cn("mb-2", roleBadgeClass)}>
                  {roleLabel}
                </Badge>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{user?.username}</span>
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
        
        {/* Search button */}
        
      </div>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {getNavItems().map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "nav-link hover-lift",
              isActive && "active",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative animate-pulse-subtle">
              <BellIcon className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-highlight-red rounded-full text-white text-xs flex items-center justify-center animate-bounce-subtle">
                2
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-2 animate-scale-in" align="end">
            <div className="space-y-2">
              <div className="p-2 hover:bg-muted rounded-md transition-all duration-300 hover:scale-[1.02]">
                <div className="text-sm font-medium">Nova mensagem</div>
                <div className="text-xs text-muted-foreground">
                  Você recebeu uma nova mensagem da Operadora
                </div>
              </div>
              <div className="p-2 hover:bg-muted rounded-md transition-all duration-300 hover:scale-[1.02]">
                <div className="text-sm font-medium">Relatório aprovado</div>
                <div className="text-xs text-muted-foreground">
                  Seu relatório de tratamento foi aprovado
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 relative hover-lift">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {user?.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 animate-scale-in">
            <div className="px-2 py-1.5 text-sm font-medium">{user?.username}</div>
            <div className="px-2 pb-1.5 text-xs text-muted-foreground">{roleLabel}</div>
            <DropdownMenuSeparator />
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
