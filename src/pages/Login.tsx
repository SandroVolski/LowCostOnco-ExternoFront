import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOperadoraAuth } from '@/contexts/OperadoraAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import AnimatedText from '@/components/AnimatedText';
import LoginTransition from '@/components/LoginTransition';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Building2, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AuthService } from '@/services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login, navigateToDashboard } = useAuth();
  const { login: operadoraLogin } = useOperadoraAuth();

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Estados para login administrativo discreto
  const [adminMode, setAdminMode] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);

  // Estados para login da operadora
  const [operadoraMode, setOperadoraMode] = useState(false);
  const [operadoraEmail, setOperadoraEmail] = useState('');
  const [operadoraPassword, setOperadoraPassword] = useState('');
  const [operadoraLoading, setOperadoraLoading] = useState(false);
  const [operadoraError, setOperadoraError] = useState('');

  // Acesso administrativo via teclas de atalho (Ctrl + Shift + A)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setAdminMode(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Verificar se são credenciais administrativas específicas
      if (username === 'OnkhosGlobal' && password === 'Douglas193') {
        // Armazenar dados administrativos
        localStorage.setItem('adminToken', 'admin-special-access');
        localStorage.setItem('adminUser', JSON.stringify({
          username: 'OnkhosGlobal',
          role: 'admin',
          isSpecialAdmin: true
        }));
        
        // Redirecionar para área administrativa
        window.location.href = '/admin/controle-sistema';
        return;
      }
      
      const success = await login(username, password, true); // Skip navigation
      if (success) {
        // Mostrar a transição antes de navegar
        setShowTransition(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    
    try {
      // Login administrativo via endpoint existente
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/clinicas/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          username: adminEmail, // Usar username em vez de email
          password: adminPassword 
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Login admin result:', result);
        
        // Verificar se o usuário tem role admin
        if (result.user?.role === 'admin') {
          // Armazenar token e dados do usuário
          localStorage.setItem('adminToken', result.token || '');
          localStorage.setItem('adminUser', JSON.stringify(result.user));
          
          // Redirecionar para dashboard administrativo
          window.location.href = '/admin/dashboard';
        } else {
          alert('Acesso negado. Apenas administradores podem acessar esta área.');
        }
      } else {
        const error = await response.json();
        console.error('Erro no login admin:', error);
        alert(error.message || 'Erro no login administrativo');
      }
    } catch (error) {
      console.error('Erro no login administrativo:', error);
      alert('Erro no login administrativo');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOperadoraLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setOperadoraLoading(true);
    setOperadoraError('');
    
    try {
      const success = await operadoraLogin(operadoraEmail, operadoraPassword);
      if (success) {
        // Redirecionar para página de análise da operadora
        window.location.href = '/analysis';
      } else {
        setOperadoraError('Email ou senha inválidos');
      }
    } catch (error) {
      console.error('Erro no login da operadora:', error);
      setOperadoraError('Erro ao fazer login. Tente novamente.');
    } finally {
      setOperadoraLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    // Navegar para o dashboard após a transição
    navigateToDashboard();
  };

  const handleForgotPassword = async () => {
    setForgotLoading(true);
    setForgotMessage(null);
    setForgotError(null);
    try {
      await AuthService.recuperarSenha(forgotEmail.trim());
      setForgotMessage('Se o e-mail existir na base, enviaremos instruções de recuperação.');
      setForgotEmail('');
    } catch (err: any) {
      setForgotError(err?.message || 'Não foi possível enviar a recuperação agora.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Generate random particles for the background
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20, // between 20px and 80px
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5, // animation delay
    color: i % 3 === 0 ? "bg-support-green/30" : 
           i % 3 === 1 ? "bg-support-yellow/30" : "bg-highlight-peach/30"
  }));

  // Generate blob animations
  const blobs = [
    { size: "w-64 h-64", top: "top-10", left: "left-1/4", delay: "animation-delay-2000" },
    { size: "w-80 h-80", top: "top-1/2", left: "left-3/4", delay: "animation-delay-4000" },
    { size: "w-96 h-96", top: "bottom-10", left: "left-1/3", delay: "animation-delay-6000" }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors duration-300 p-4 overflow-hidden">
      {/* Floating particles */}
      <div className="particles">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`particle ${particle.color}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: particle.left,
              top: particle.top,
              animationDuration: `${5 + Math.random() * 10}s`,
              animationDelay: `${particle.delay}s`,
              opacity: 0.4
            }}
          ></div>
        ))}
      </div>
      
      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {blobs.map((blob, index) => (
          <div 
            key={index} 
            className={`blob ${blob.size} ${blob.top} ${blob.left} ${blob.delay}`}
            style={{
              animationDelay: `${index * 2}s`,
              animationDuration: `${20 + index * 5}s`
            }}
          ></div>
        ))}
      </div>
      
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-4 right-4 z-10"
        onClick={toggleTheme}
      >
        {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </Button>

      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <Logo size="lg" className="animate-float" />
        </div>
        
        <Card className="w-full animate-scale-in border-border/50 bg-card/70 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">
                  Usuário
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  className="lco-input"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="lco-input"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">&nbsp;</span>
                <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                  <DialogTrigger asChild>
                    <button type="button" className="text-primary hover:underline">
                      Esqueceu a senha?
                    </button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Recuperar senha</DialogTitle>
                      <DialogDescription>
                        Informe seu e-mail cadastrado para enviarmos as instruções de redefinição.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        type="email"
                        placeholder="seuemail@exemplo.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="lco-input"
                      />
                      {forgotMessage && (
                        <p className="text-sm text-muted-foreground">{forgotMessage}</p>
                      )}
                      {forgotError && (
                        <p className="text-sm text-highlight-red">{forgotError}</p>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setForgotOpen(false)}>Fechar</Button>
                        <Button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail} className="lco-btn-primary">
                          {forgotLoading ? 'Enviando...' : 'Enviar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full lco-btn-primary"
              >
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>

            {/* Botões de acesso alternativo */}
            <div className="mt-6 space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Acesso Especial</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOperadoraMode(true)}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Operadora
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdminMode(true)}
                  className="flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Admin
                </Button>
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="flex justify-center pt-4">
            <AnimatedText />
          </CardFooter>
        </Card>
      </div>

      {/* Modal de Login Administrativo (Discreto) */}
      <Dialog open={adminMode} onOpenChange={setAdminMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">🔐 Acesso Restrito</DialogTitle>
            <DialogDescription className="text-center">
              Área administrativa - Apenas usuários autorizados
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="adminEmail" className="text-sm font-medium">
                Usuário Administrativo
              </label>
              <Input
                id="adminEmail"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="Digite o usuário admin"
                required
                className="lco-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="adminPassword" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="lco-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAdminMode(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={adminLoading || !adminEmail || !adminPassword}
                className="lco-btn-primary"
              >
                {adminLoading ? 'Autenticando...' : 'Acessar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Login da Operadora */}
      <Dialog open={operadoraMode} onOpenChange={setOperadoraMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Login da Operadora
            </DialogTitle>
            <DialogDescription className="text-center">
              Acesso para operadoras de planos de saúde
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOperadoraLogin} className="space-y-4">
            {operadoraError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {operadoraError}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="operadoraEmail" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="operadoraEmail"
                type="email"
                value={operadoraEmail}
                onChange={(e) => setOperadoraEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="lco-input"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="operadoraPassword" className="text-sm font-medium">
                Senha
              </label>
              <Input
                id="operadoraPassword"
                type="password"
                value={operadoraPassword}
                onChange={(e) => setOperadoraPassword(e.target.value)}
                placeholder="Digite sua senha"
                required
                className="lco-input"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOperadoraMode(false);
                  setOperadoraError('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={operadoraLoading || !operadoraEmail || !operadoraPassword}
                className="lco-btn-primary"
              >
                {operadoraLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transition Animation */}
      <LoginTransition 
        isVisible={showTransition} 
        onComplete={handleTransitionComplete}
      />
    </div>
  );
};

export default Login;