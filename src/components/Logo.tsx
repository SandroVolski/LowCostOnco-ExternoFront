import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  withText?: boolean;
}

const Logo = ({ variant = 'default', size = 'md', className, withText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-10 w-auto',
    lg: 'h-12 w-auto'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img 
        src="/images/logoPadrao.png" 
        alt="Low Cost Onco" 
        className={cn(
          sizeClasses[size],
          "object-contain"
        )}
      />
      {withText && (
        <div className={cn(
          "font-bold", 
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : 'text-2xl',
          variant === 'white' ? "text-white" : "text-primary-gray"
        )}>
          <span className={variant === 'white' ? "text-white" : "text-primary-green"}>
            LOW COST
          </span>
          <span> ONCO</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
