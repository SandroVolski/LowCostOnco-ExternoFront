import { useState, useEffect } from "react";
import { organData, OrganData, convertAnalysisToOrganData, defaultOrganData } from "./AnatomyData";
import { AnatomyTooltip } from "./AnatomyTooltip";
import { AnalysisService, OrganAnalysisData, AnalysisFilters } from "@/services/analysisService";
import { Loader2 } from "lucide-react";

export interface InteractiveAnatomyProps {
  filters?: AnalysisFilters;
  TooltipComponent?: (props: { data: OrganData; position: { x: number; y: number }; hasSelection?: boolean }) => JSX.Element;
  onOrganSelect?: (organ: OrganData | null) => void;
}

export const InteractiveAnatomy = ({ filters, TooltipComponent, onOrganSelect }: InteractiveAnatomyProps) => {
  const [hoveredOrgan, setHoveredOrgan] = useState<OrganData | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedOrganId, setSelectedOrganId] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [organDataState, setOrganDataState] = useState<Record<string, OrganData>>(organData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados reais de análise
  useEffect(() => {
    const loadAnalysisData = async () => {
      try {
        setLoading(true);
        setError(null);

        const analysisData = await AnalysisService.getOrganAnalysisData(filters);

        // Converter dados de análise para formato de órgão
        const convertedData = convertAnalysisToOrganData(analysisData);

        // Sem fallback: se não houver dados, manter vazio (defaultOrganData com zeros)
        const mergedData = { ...defaultOrganData, ...convertedData };
        setOrganDataState(mergedData);
      } catch (err) {
        console.error('❌ Erro ao carregar dados de análise:', err);
        setError('Erro ao carregar dados de análise');
        // Manter dados padrão em caso de erro
        setOrganDataState(organData);
      } finally {
        setLoading(false);
      }
    };

    loadAnalysisData();
  }, [filters?.clinicId, filters?.sex, filters?.ageMin, filters?.ageMax]);

  const handleMouseEnter = (organId: string, event: React.MouseEvent) => {
    // Sempre mostrar tooltip ao fazer hover, independente da seleção
    setHoveredOrgan(organDataState[organId]);
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setMousePosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    // Se houver seleção, mantemos o tooltip do selecionado
    if (selectedOrganId) {
      setHoveredOrgan(organDataState[selectedOrganId]);
      return;
    }
    // Se não houver seleção, esconder o tooltip
    setHoveredOrgan(null);
  };

  const handleClick = (organId: string) => {
    if (selectedOrganId === organId) {
      setSelectedOrganId(null);
      setSelectedPosition(null);
      setHoveredOrgan(null);
      onOrganSelect?.(null); // Passar null para deselecionar
      return;
    }

    setSelectedOrganId(organId);
    // Congelar posição atual do mouse para o tooltip fixo
    setSelectedPosition(mousePosition);
    setHoveredOrgan(organDataState[organId]);

    // Chamar callback se fornecido
    if (onOrganSelect && organDataState[organId]) {
      try {
        onOrganSelect(organDataState[organId]);
      } catch (error) {
        console.error('❌ Erro ao executar onOrganSelect:', error);
      }
    } else {}
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="relative flex justify-center items-center min-h-screen p-8">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dados de análise...</p>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className="relative flex justify-center items-center min-h-screen p-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-2">Erro ao carregar dados</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const activeOrgan = selectedOrganId ? organDataState[selectedOrganId] : hoveredOrgan;
  const activePosition = selectedOrganId && selectedPosition ? selectedPosition : mousePosition;

  return (
    <div className="relative flex justify-center items-center min-h-screen p-8">
      <div className="relative max-w-lg mx-auto">
        {/* Background anatomy image */}
        <div className="relative">
          <img 
            src="/lovable-uploads/337aa282-1632-417e-8a49-700fa027a103.png"
            alt="Anatomia Humana"
            className="w-full h-auto opacity-90 drop-shadow-lg rounded-lg"
            style={{ maxHeight: '90vh' }}
          />
          
          {/* Interactive overlay SVG */}
          <svg
            viewBox="0 0 300 800"
            className="absolute inset-0 w-full h-full cursor-pointer"
            onMouseMove={handleMouseMove}
            style={{ pointerEvents: 'none' }}
          >
            {/* Brain - imagem cerebrocorreto.webp */}
            <image
              href="/images/orgaos/cerebrocorreto.webp"
              x="125"
              y="30"
              width="50"
              height="40"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'brain' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('brain', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('brain')}
            />
            
            {/* Pulmões - formato pulmonar realista (fundo) */}
            <g
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'lungs' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('lungs', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('lungs')}
            >
              <path
                d="M 105 170 Q 95 160, 105 155 Q 115 150, 125 155 Q 135 160, 130 170 Q 135 180, 130 190 Q 125 210, 115 220 Q 105 215, 100 200 Q 95 190, 105 170"
                fill="hsl(var(--medical-blue))"
              />
              <path
                d="M 195 170 Q 205 160, 195 155 Q 185 150, 175 155 Q 165 160, 170 170 Q 165 180, 170 190 Q 175 210, 185 220 Q 195 215, 200 200 Q 205 190, 195 170"
                fill="hsl(var(--medical-blue))"
              />
            </g>
            
            {/* Coração - imagem coracao.webp (meio) */}
            <image
              href="/images/orgaos/coracao.webp"
              x="130"
              y="160"
              width="55"
              height="50"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'heart' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('heart', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('heart')}
            />
            
            {/* Mamas - formato anatômico realista (frente) */}
            <g
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'breast' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('breast', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('breast')}
            >
              <ellipse
                cx="120"
                cy="190"
                rx="14"
                ry="10"
                fill="hsl(var(--medical-teal))"
              />
              <ellipse
                cx="180"
                cy="190"
                rx="14"
                ry="10"
                fill="hsl(var(--medical-teal))"
              />
            </g>
            
            {/* Fígado - imagem figado.webp */}
            <image
              href="/images/orgaos/figado.webp"
              x="95"
              y="210"
              width="80"
              height="65"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'liver' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('liver', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('liver')}
            />
            
            {/* Estômago - imagem estomago.webp */}
            <image
              href="/images/orgaos/estomago.webp"
              x="125"
              y="215"
              width="85"
              height="75"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'stomach' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('stomach', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('stomach')}
            />
            
            {/* Intestino - imagem intestino.webp (fundo) */}
            <image
              href="/images/orgaos/intestino.webp"
              x="90"
              y="270"
              width="120"
              height="80"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'colon' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('colon', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('colon')}
            />
            
            {/* Rins - formato renal realista (frente) */}
            <g
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'kidneys' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('kidneys', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('kidneys')}
            >
              <path
                d="M 115 260 Q 105 255, 110 270 Q 105 285, 115 290 Q 125 295, 130 290 Q 135 285, 130 270 Q 135 255, 115 260"
                fill="hsl(var(--medical-red))"
              />
              <path
                d="M 185 260 Q 195 255, 190 270 Q 195 285, 185 290 Q 175 295, 170 290 Q 165 285, 170 270 Q 165 255, 185 260"
                fill="hsl(var(--medical-red))"
              />
            </g>
            
            {/* Bexiga - formato vesical realista */}
            <path
              d="M 150 340 Q 125 335, 135 350 Q 150 365, 165 350 Q 175 335, 150 340"
              fill="hsl(var(--medical-blue))"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'bladder' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('bladder', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('bladder')}
            />
            
            {/* Próstata - formato prostático realista */}
            <path
              d="M 150 365 Q 135 360, 140 375 Q 150 390, 160 375 Q 165 360, 150 365"
              fill="hsl(var(--medical-purple))"
              className={`hover:brightness-110 cursor-pointer transition-all duration-300 ${selectedOrganId === 'prostate' ? 'opacity-70' : 'opacity-0 hover:opacity-70'}`}
              style={{ pointerEvents: 'all' }}
              onMouseEnter={(e) => handleMouseEnter('prostate', e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick('prostate')}
            />
          </svg>
        </div>
        
        {activeOrgan && (
          TooltipComponent ? (
            <TooltipComponent 
              data={activeOrgan} 
              position={activePosition} 
              hasSelection={!!selectedOrganId}
            />
          ) : (
            <AnatomyTooltip 
              data={activeOrgan} 
              position={activePosition}
              hasSelection={!!selectedOrganId}
            />
          )
        )}
      </div>
    </div>
  );
};
