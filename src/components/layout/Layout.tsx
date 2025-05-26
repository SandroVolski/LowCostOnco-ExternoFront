import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

// Intersection Observer para animações de scroll
const useIntersectionObserver = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, []);
};

const Layout = ({ children, pageTitle }: LayoutProps) => {
  const { isAuthenticated } = useAuth();
  const [loaded, setLoaded] = useState(false);
  
  useIntersectionObserver();
  
  // Simular um efeito de carregamento para animações
  useEffect(() => {
    setLoaded(true);
  }, []);
  
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`flex flex-col h-screen bg-background ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      <Header pageTitle={pageTitle} />
      
      <main className="flex-1 p-4 md:p-6 overflow-y-auto pt-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
