import { cn } from '@/lib/utils';
import '@/styles/animated-text.css';

interface AnimatedTextProps {
  className?: string;
}

const AnimatedText = ({ className }: AnimatedTextProps) => {
  return (
    <div className={cn("content", className)}>
      <p className="content__text">
        Somos para
      </p>
      <ul className="content__list">
        <li className="content__list__item text-support-yellow">operadoras !</li>
        <li className="content__list__item text-support-green">clínicas !</li>
        <li className="content__list__item text-highlight-peach">planos de saúde !</li>
        <li className="content__list__item text-support-teal">pacientes !</li>
        <li className="content__list__item text-primary-gray">todos !</li>
        <li className="content__list__item text-support-yellow">operadoras !</li>
        <li className="content__list__item text-support-green">clínicas !</li>
      </ul>
    </div>
  );
};

export default AnimatedText; 