import { useState } from 'react';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, UserCog, Eye, EyeOff, AlertCircle } from 'lucide-react';

const AuditorLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuditorAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Usuário ou senha inválidos');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate random particles for the background
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    color: i % 3 === 0 ? "bg-support-green/30" :
           i % 3 === 1 ? "bg-support-yellow/30" : "bg-highlight-peach/30"
  }));

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
            <div className="flex justify-center mb-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <UserCog className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Acesso de Auditor
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Área exclusiva para auditores médicos
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-2 border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

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
                  'Acessar Sistema'
                )}
              </Button>
            </form>

            <div className="text-center pt-2">
              <a
                href="/"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Voltar para login principal
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuditorLogin;
