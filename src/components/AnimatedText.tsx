import { cn } from '@/lib/utils';
import '@/styles/animated-text.css';

interface AnimatedTextProps {
  className?: string;
}

const AnimatedText = ({ className }: AnimatedTextProps) => {
  return (
    <div className={cn("content", className)}>
      <p className="content__text">
        Integramos
      </p>
      <ul className="content__list">
        <li className="content__list__item text-support-yellow">cuidados !</li>
        <li className="content__list__item text-support-green">gestão !</li>
        <li className="content__list__item text-highlight-peach">processos !</li>
        <li className="content__list__item text-support-teal">cuidados !</li>
        <li className="content__list__item text-primary-gray">gestão !</li>
        <li className="content__list__item text-support-yellow">processos !</li>
        <li className="content__list__item text-support-green">cuidados !</li>
      </ul>
    </div>
  );
};

export default AnimatedText; 