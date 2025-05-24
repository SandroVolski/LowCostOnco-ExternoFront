
import { useState, useRef, useEffect } from 'react';
import { PencilIcon, TrashIcon, ChevronRight, AlertTriangle, User, Calendar, Activity, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
}

interface PatientCardProps {
  patient: Patient;
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
}

const PatientCard = ({ patient, onEdit, onDelete }: PatientCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const getTreatmentColor = (treatment: string) => {
    const treatmentMap: Record<string, string> = {
      'Quimioterapia': 'bg-support-teal/20 text-support-teal',
      'Radioterapia': 'bg-support-yellow/20 text-support-yellow',
      'Cirurgia + Quimioterapia': 'bg-primary-green/20 text-primary-gray',
      'Imunoterapia': 'bg-highlight-peach/20 text-highlight-peach',
    };

    return treatmentMap[treatment] || 'bg-muted text-muted-foreground';
  };

  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Calculate mouse position relative to card
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Convert to rotation degrees (-10 to 10 degrees)
    const maxRotation = 5;
    const rotateY = (x / (rect.width / 2)) * maxRotation;
    const rotateX = -((y / (rect.height / 2)) * maxRotation);
    
    // Apply transform
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };
  
  // Reset transform when mouse leaves
  const handleMouseLeave = () => {
    setTransform('');
  };

  // Toggle card flip - now with a specific click handler
  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={cn(
          "card-flip-container h-[340px] w-full animate-entry",
          isFlipped && "flipped"
        )}
        style={{ transform: isFlipped ? '' : transform, transition: transform ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="card-flipper h-full">
          {/* Front of Card */}
          <div 
            className="card-front patient-card h-full"
            onClick={handleCardClick}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                <div className="text-muted-foreground text-sm flex items-center mt-1">
                  <User className="w-3.5 h-3.5 mr-1" />
                  <span>{patient.age} anos</span>
                </div>
              </div>
              
              <div>
                <Badge 
                  variant="outline"
                  className={cn(
                    "font-medium",
                    patient.status === 'Em remissão' 
                    ? 'bg-support-green/20 text-support-green' 
                    : 'bg-support-yellow/20 text-support-yellow'
                  )}
                >
                  {patient.status}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="bg-muted/50 rounded-md p-2">
                <div className="font-medium text-xs uppercase text-muted-foreground">Diagnóstico</div>
                <div className="mt-1 text-sm">
                  {patient.diagnosis} <span className="bg-border rounded px-1 text-xs">Estágio {patient.stage}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-muted/50 rounded-md p-2">
                  <div className="font-medium text-xs uppercase text-muted-foreground">Tratamento</div>
                  <div className="mt-1">
                    <Badge variant="outline" className={cn(getTreatmentColor(patient.treatment))}>
                      {patient.treatment}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex-1 bg-muted/50 rounded-md p-2">
                  <div className="font-medium text-xs uppercase text-muted-foreground">Data de Início</div>
                  <div className="mt-1 text-sm flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {patient.startDate}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-2 right-2">
              <ChevronRight className="h-5 w-5 text-muted-foreground animate-bounce-subtle" />
            </div>
          </div>
          
          {/* Back of Card */}
          <div 
            className="card-back patient-card h-full"
            onClick={handleCardClick}
          >
            <div className="h-full flex flex-col">
              <h3 className="font-semibold text-lg mb-2">Informações Adicionais</h3>
              
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-support-teal" />
                  <div className="text-sm">
                    <span className="font-medium">Frequência:</span> Semanal
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-support-yellow" />
                  <div className="text-sm">
                    <span className="font-medium">Duração:</span> 6 meses
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="font-medium text-sm mb-1">Progresso:</div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="text-xs text-right mt-1 text-muted-foreground">45% concluído</div>
                </div>
                
                <div className="mt-4">
                  <div className="font-medium text-sm mb-1">Próxima consulta:</div>
                  <div className="text-sm">15/06/2025 às 14:30</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(patient);
                  }}
                  className="flex items-center gap-1 hover-lift"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteAlert(true);
                  }}
                  className="text-destructive hover:text-destructive flex items-center gap-1 hover-lift"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                  <span>Excluir</span>
                </Button>
              </div>
              
              <div className="absolute bottom-2 left-2">
                <ChevronRight className="h-5 w-5 text-muted-foreground rotate-180 animate-bounce-subtle" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-destructive mr-2" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o paciente <span className="font-medium">{patient.name}</span>?
              <br />Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(patient.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PatientCard;
