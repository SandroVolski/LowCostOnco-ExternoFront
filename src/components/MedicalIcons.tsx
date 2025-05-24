
import { ReactNode } from 'react';

interface IconProps {
  className?: string;
}

export const VialIcon = ({ className = "" }: IconProps) => {
  return (
    <div className={`relative w-8 h-12 icon-hover ${className}`}>
      <div className="absolute w-full h-full bg-blue-50 rounded-full border border-gray-300"></div>
      <div className="absolute top-0 left-1/4 right-1/4 h-2 bg-support-teal rounded-t-full"></div>
      <div className="absolute top-1/2 left-0 right-0 bottom-3 bg-support-yellow opacity-70 rounded-b-lg"></div>
      <div className="absolute top-1 left-1/4 right-1/4 h-1 bg-white opacity-50 rounded-full"></div>
    </div>
  );
};

export const PillIcon = ({ className = "" }: IconProps) => {
  return (
    <div className={`relative w-8 h-12 transform rotate-45 icon-hover ${className}`}>
      <div className="absolute w-full h-full bg-primary-green rounded-full border border-gray-300"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-white opacity-30 rounded-t-full"></div>
    </div>
  );
};

export const SyringeIcon = ({ className = "" }: IconProps) => {
  return (
    <div className={`relative w-12 h-4 icon-hover ${className}`}>
      <div className="absolute w-full h-full bg-white rounded-full border border-gray-300"></div>
      <div className="absolute top-0 bottom-0 left-0 w-2 bg-highlight-red rounded-l-full"></div>
      <div className="absolute top-0 bottom-0 right-0 w-1/4 bg-support-gray rounded-r-full border-l border-gray-300"></div>
    </div>
  );
};

interface CardProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}

export const MedicalCard = ({ icon, title, children, className = "" }: CardProps) => {
  return (
    <div className={`medical-card ${className}`}>
      <div className="flex items-center mb-4">
        {icon && <div className="mr-3">{icon}</div>}
        <h3 className="text-lg font-semibold text-support-teal">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
};
