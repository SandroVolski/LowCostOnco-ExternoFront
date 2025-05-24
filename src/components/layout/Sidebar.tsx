
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, FileText, PieChart, MessageSquare, 
  User, LogOut, ChevronLeft, ChevronRight,
  FlaskConical, Hospital, Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const roleLabel = user?.role === 'clinic' 
    ? 'Clínica' 
    : user?.role === 'operator' 
      ? 'Operadora' 
      : 'Plano de Saúde';

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center p-3 rounded-lg transition-all duration-200',
      isActive 
        ? 'bg-primary-green text-primary-gray font-medium' 
        : 'hover:bg-primary-green/10'
    );
  
  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        label: 'Chat',
        path: '/chat',
        icon: <MessageSquare className="w-5 h-5 mr-3" />,
      },
    ];

    if (user?.role === 'clinic') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Hospital className="w-5 h-5 mr-3" />,
        },
        {
          label: 'Pacientes',
          path: '/patients',
          icon: <Users className="w-5 h-5 mr-3" />,
        },
        {
          label: 'Relatórios',
          path: '/reports',
          icon: <FileText className="w-5 h-5 mr-3" />,
        },
        ...commonItems,
      ];
    } else if (user?.role === 'operator') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Database className="w-5 h-5 mr-3" />,
        },
        {
          label: 'Análise',
          path: '/analysis',
          icon: <PieChart className="w-5 h-5 mr-3" />,
        },
        ...commonItems,
      ];
    } else {
      // Health Plan
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <Database className="w-5 h-5 mr-3" />,
        },
        {
          label: 'Gastos',
          path: '/expenses',
          icon: <PieChart className="w-5 h-5 mr-3" />,
        },
        ...commonItems,
      ];
    }
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-border transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center px-4 h-16 border-b border-border">
        {!collapsed && (
          <div className="flex items-center flex-1">
            <FlaskConical className="h-6 w-6 text-primary-green mr-2" />
            <span className="font-semibold text-lg text-primary-gray">
              LCO
              <span className="text-primary-green">nco</span>
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-primary-gray hover:bg-primary-green/10"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="px-2 space-y-1">
          {getNavItems().map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={navLinkClass}
              end={item.path === '/dashboard'}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center mb-4">
          <div className="bg-primary-green/20 rounded-full p-2 text-primary-green">
            <User className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="ml-3">
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
              <p className="text-sm font-medium">{user?.username}</p>
            </div>
          )}
        </div>
        
        <Button
          variant="ghost"
          className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
