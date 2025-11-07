import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  UserCog,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  User
} from 'lucide-react';
import Logo from '@/components/Logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeContext';

interface AuditorLayoutProps {
  children: ReactNode;
}

const AuditorLayout = ({ children }: AuditorLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { auditor, logout } = useAuditorAuth();
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

  const navItems = [
    {
      label: 'Dashboard',
      path: '/auditor/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      label: 'Recursos',
      path: '/auditor/recursos',
      icon: <FileText className="h-5 w-5" />
    },
    {
      label: 'Histórico do Paciente',
      path: '/auditor/historico-paciente',
      icon: <User className="h-5 w-5" />
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMobileNavClick = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className={cn(
        "h-16 flex items-center justify-between px-6 z-50 transition-all duration-300 relative",
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
                  {navItems.map((item, index) => (
                    <button
                      key={item.path}
                      onClick={() => handleMobileNavClick(item.path)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 rounded-md transition-all duration-300 w-full text-base",
                        isActive(item.path)
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
                  <div className="px-4 py-3 space-y-3">
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <UserCog className="h-3 w-3 mr-1" />
                      Auditor
                    </Badge>
                    <div className="text-sm font-medium">
                      {auditor?.nome || 'Auditor'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {auditor?.registro_profissional || 'CRM'}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleLogout}
                      size="sm"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation - Centralizado */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-link hover-lift flex items-center gap-1 px-3 py-2 rounded-md transition-all duration-300",
                isActive(item.path) && "bg-primary/20 text-primary font-medium",
                !isActive(item.path) && "hover:bg-muted"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="flex items-center space-x-3">
          <Badge className={cn(
            "hidden sm:flex animate-fade-in transition-all", 
            "bg-primary/10 text-primary border-primary/20",
            "hover:scale-105"
          )}>
            <UserCog className="h-3 w-3 mr-1" />
            Auditor
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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 p-0 relative hover-lift">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {auditor?.nome?.substring(0, 2).toUpperCase() || 'AU'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 animate-scale-in">
              <div className="px-2 py-1.5 text-sm font-medium">
                {auditor?.nome || 'Auditor'}
              </div>
              <div className="px-2 pb-1.5 text-xs text-muted-foreground">
                {auditor?.registro_profissional || 'Registro'}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto py-6">
        {children}
      </main>
    </div>
  );
};

export default AuditorLayout;
