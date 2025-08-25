import React, { useState, useRef, useEffect } from 'react';
import { Pill, Calendar, Clock, Droplet, Edit, Info, Database, ArrowLeft, Activity, Bookmark, Trash2 } from 'lucide-react';
import { MouseTilt } from './MouseTilt';

const cardFlipStyles = `
.protocol-card {
  position: relative;
  perspective: 1000px;
  height: 340px;
  width: 100%;
  cursor: pointer;
  margin-bottom: 16px;
  transition: height 0.3s ease-out;
}
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: left;
  transition: transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  border-radius: 0.75rem;
}
.card-inner.flipped {
  transform: rotateY(180deg);
}
.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.card-front {
  z-index: 2;
}
.card-back {
  transform: rotateY(180deg);
}
`;

// Efeito outdoor para nome longo
const OutdoorText = ({ text, className = '' }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const checkScroll = () => {
      if (containerRef.current && textRef.current) {
        setShouldScroll(textRef.current.scrollWidth > containerRef.current.offsetWidth);
      }
    };
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [text]);

  useEffect(() => {
    if (!shouldScroll) return;
    let timeout1, timeout2, timeout3;
    setIsScrolling(false);
    setResetting(false);
    // Espera inicial
    timeout1 = setTimeout(() => {
      setIsScrolling(true);
      setResetting(false);
      const duration = (textRef.current.scrollWidth - containerRef.current.offsetWidth) * 25;
      // Espera no final
      timeout2 = setTimeout(() => {
        setIsScrolling(false);
        setResetting(true);
        // Volta suavemente ao início
        timeout3 = setTimeout(() => {
          setResetting(false);
          setCycle((c) => c + 1); // força reinício do ciclo
        }, 600);
      }, duration + 300); // espera final de 0.3 segundo
    }, 3000);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [shouldScroll, text, cycle]);

  // Cálculo do deslocamento
  let scrollDistance = 0;
  if (containerRef.current && textRef.current) {
    scrollDistance = textRef.current.scrollWidth - containerRef.current.offsetWidth;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden whitespace-nowrap ${className}`}
      style={{ minHeight: 24 }}
    >
      <span
        ref={textRef}
        className="inline-block"
        style={shouldScroll ? (
          resetting
            ? {
                transform: 'translateX(0)',
                transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)',
              }
            : isScrolling
            ? {
                transform: `translateX(-${scrollDistance}px)`,
                transition: `transform ${scrollDistance * 0.025}s linear`,
              }
            : {
                transform: 'translateX(0)',
                transition: 'transform 0.5s',
              }
        ) : {
          transform: 'translateX(0)',
          transition: 'transform 0.5s',
        }}
      >
        {text}
      </span>
    </div>
  );
};

const ProtocoloFlipCard = ({
  protocolo,
  isSelected,
  showProtocoloDetails,
  handleEditFixedWithSelection,
  handleDelete,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);
  const frontRef = useRef(null);
  const backRef = useRef(null);

  // Adiciona o CSS do flip apenas uma vez
  useEffect(() => {
    if (!document.getElementById('protocol-card-flip-css')) {
      const style = document.createElement('style');
      style.id = 'protocol-card-flip-css';
      style.innerHTML = cardFlipStyles;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <MouseTilt maxTilt={5} scale={1.02} className="h-full">
    <div
        className={`relative protocol-card rounded-lg bg-gradient-to-br from-card via-card to-card/90 shadow-lg transition-all duration-300 overflow-hidden border-2 border-border hover:shadow-xl hover:border-primary/30 ${isSelected ? 'selected' : ''} h-[340px]`}
      ref={cardRef}
      onClick={() => setIsFlipped((f) => !f)}
    >
      <div className={`card-inner ${isFlipped ? 'flipped' : ''}`} style={{ height: '100%' }}>
        {/* Frente do card */}
        <div className="card-front absolute inset-0 w-full h-full backface-hidden bg-card rounded-lg shadow-md border border-border flex flex-col" ref={frontRef}>
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-primary text-lg truncate">
                  <OutdoorText text={protocolo.nome} className="text-lg font-bold text-primary" />
                </div>
              <div className="flex gap-1">
                <button className="p-1 rounded hover:bg-primary/10" onClick={e => { e.stopPropagation(); showProtocoloDetails(protocolo.id); }} title="Informações Completas"><Info size={16} /></button>
                <button className="p-1 rounded hover:bg-primary/10" onClick={e => { e.stopPropagation(); handleEditFixedWithSelection(protocolo); }} title="Editar"><Edit size={16} /></button>
                <button className="p-1 rounded hover:bg-destructive/10 text-destructive" onClick={e => { e.stopPropagation(); handleDelete(protocolo.id); }} title="Excluir"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mb-2">{protocolo.descricao}</div>
            <div className="flex flex-wrap gap-2 text-sm mb-2">
              <span className="flex items-center gap-1"><Calendar size={14} /> {protocolo.intervalo_ciclos || 'N/D'} dias</span>
              <span className="flex items-center gap-1"><Activity size={14} /> {protocolo.ciclos_previstos || 'N/D'} ciclos</span>
              <span className="flex items-center gap-1"><Bookmark size={14} /> Linha: {protocolo.linha || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Pill size={14} /> {protocolo.medicamentos.length} medicamento(s)
            </div>
          </div>
          <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 rounded-b-lg">Clique para ver medicamentos</div>
        </div>
        {/* Verso do card */}
        <div className="card-back absolute inset-0 w-full h-full backface-hidden bg-card rounded-lg shadow-md border border-border flex flex-col" ref={backRef}>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-primary text-base">Medicamentos</div>
              <button className="p-1 rounded hover:bg-primary/10" onClick={e => { e.stopPropagation(); setIsFlipped(false); }} title="Voltar"><ArrowLeft size={16} /></button>
            </div>
            {protocolo.medicamentos.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Pill size={32} className="mx-auto mb-2" />
                Nenhum medicamento cadastrado
              </div>
            ) : (
              <div className="space-y-2">
                {protocolo.medicamentos.map((med, idx) => (
                  <div key={idx} className="bg-muted/50 rounded p-2 border border-border/50">
                    <div className="font-medium text-sm text-primary mb-1 flex items-center gap-2"><Pill size={14} />{med.nome}</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1"><Droplet size={12} />{med.dose} {med.unidade_medida}</span>
                      <span className="flex items-center gap-1"><Calendar size={12} />{med.dias_adm}</span>
                      <span className="flex items-center gap-1"><Clock size={12} />{med.frequencia}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 flex justify-center gap-2 bg-muted/30 rounded-b-lg">
            <button className="flex items-center gap-1 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 text-xs" onClick={e => { e.stopPropagation(); showProtocoloDetails(protocolo.id); }}>
              <Info size={14} /> Informações Completas
            </button>
          </div>
        </div>
      </div>
    </div>
    </MouseTilt>
  );
};

export default ProtocoloFlipCard; 