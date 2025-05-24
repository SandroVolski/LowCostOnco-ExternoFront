import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import AnimatedText from '@/components/AnimatedText';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(username, password);
    } finally {
      setIsLoading(false);
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
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full lco-btn-primary"
              >
                {isLoading ? 'Autenticando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-center pt-4">
            <AnimatedText />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
