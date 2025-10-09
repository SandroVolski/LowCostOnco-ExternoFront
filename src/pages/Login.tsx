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
import { Sun, Moon, Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AuthService } from '@/services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login, navigateToDashboard } = useAuth();
  const { login: operadoraLogin } = useOperadoraAuth();

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);


  // Estados para login da operadora
  const [operadoraMode, setOperadoraMode] = useState(false);
  const [operadoraEmail, setOperadoraEmail] = useState('');
  const [operadoraPassword, setOperadoraPassword] = useState('');
  const [operadoraLoading, setOperadoraLoading] = useState(false);
  const [operadoraError, setOperadoraError] = useState('');
  const [showOperadoraPassword, setShowOperadoraPassword] = useState(false);


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
    <div className="h-screen flex flex-col items-center justify-center bg-background transition-colors duration-300 p-4 overflow-hidden">
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
        <div className="flex justify-center mb-6">
          <Logo size="md" className="animate-float" />
        </div>
        
        <Card className="w-full animate-scale-in border-border/50 bg-card/80 backdrop-blur-lg shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-semibold text-foreground">
                  Usuário
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  required
                  className="h-10 text-sm border-2 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="h-10 text-sm border-2 focus:border-primary/50 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
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
                className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Autenticando...
                  </div>
                ) : (
                  'Entrar no Sistema'
                )}
              </Button>
            </form>

            {/* Botão de acesso da Operadora */}
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wider">
                  <span className="bg-card px-2 text-muted-foreground font-medium">Acesso Operadora</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setOperadoraMode(true)}
                className="w-full h-9 flex items-center justify-center gap-2 text-sm font-medium border-2 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-200"
              >
                <Shield className="h-4 w-4" />
                Acesso para Operadoras
              </Button>
            </div>

          </CardContent>
          
          <CardFooter className="flex justify-center pt-2">
            <AnimatedText />
          </CardFooter>
        </Card>
      </div>


      {/* Modal de Login da Operadora */}
      <Dialog open={operadoraMode} onOpenChange={setOperadoraMode}>
        <DialogContent className="sm:max-w-md border-primary/20 shadow-2xl">
          <DialogHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Login da Operadora
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Acesso exclusivo para operadoras
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOperadoraLogin} className="space-y-4">
            {operadoraError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {operadoraError}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="operadoraEmail" className="text-sm font-semibold text-foreground">
                Email
              </label>
              <Input
                id="operadoraEmail"
                type="email"
                value={operadoraEmail}
                onChange={(e) => setOperadoraEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-10 text-sm border-2 focus:border-primary/50 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="operadoraPassword" className="text-sm font-semibold text-foreground">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="operadoraPassword"
                  type={showOperadoraPassword ? "text" : "password"}
                  value={operadoraPassword}
                  onChange={(e) => setOperadoraPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="h-10 text-sm border-2 focus:border-primary/50 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowOperadoraPassword(!showOperadoraPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showOperadoraPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setOperadoraMode(false);
                  setOperadoraError('');
                }}
                className="flex-1 h-9"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={operadoraLoading || !operadoraEmail || !operadoraPassword}
                className="flex-1 h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {operadoraLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
                    Autenticando...
                  </div>
                ) : (
                  'Entrar'
                )}
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