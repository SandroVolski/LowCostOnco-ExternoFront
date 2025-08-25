import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withText?: boolean;
}

const Logo = ({ variant = 'default', size = 'md', className, withText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-12 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-12 w-auto'
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <img 
        src="/images/SomenteLogoOnkhos.png" 
        alt="Onkhos" 
        className={cn(
          sizeClasses[size],
          "object-contain"
        )}
      />
      {withText && (
        <div className={cn(
          "font-bold text-white -translate-x-[2px] translate-y-[2px]", 
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl',
        )}>
          <span className="text-white">ONKHOS</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
