import { useState } from 'react';
import { ChevronRight, FileText, Activity, Clock, PencilIcon, TrashIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface Authorization {
  id: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  protocol: string;
  description: string;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
  authorizations: Authorization[];
}

interface PatientCardProps {
  patient: Patient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const getPatientStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'em tratamento':
      return 'bg-support-yellow/10 text-support-yellow border-support-yellow/20';
    case 'em remissão':
      return 'bg-support-green/10 text-support-green border-support-green/20';
    case 'alta':
      return 'bg-support-teal/10 text-support-teal border-support-teal/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getTreatmentColor = (treatment: string) => {
  switch (treatment.toLowerCase()) {
    case 'quimioterapia':
      return 'bg-support-yellow/10 text-support-yellow border-support-yellow/20';
    case 'radioterapia':
      return 'bg-support-teal/10 text-support-teal border-support-teal/20';
    case 'cirurgia':
      return 'bg-support-green/10 text-support-green border-support-green/20';
    case 'imunoterapia':
      return 'bg-highlight-peach/10 text-highlight-peach border-highlight-peach/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-support-green/10 border-support-green/20';
    case 'pending':
      return 'bg-support-yellow/10 border-support-yellow/20';
    case 'rejected':
      return 'bg-highlight-red/10 border-highlight-red/20';
    default:
      return 'bg-muted';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved':
      return <Activity className="h-4 w-4 text-support-green" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-support-yellow" />;
    case 'rejected':
      return <AlertTriangle className="h-4 w-4 text-highlight-red" />;
    default:
      return null;
  }
};

const PatientCard = ({ patient, onEdit, onDelete }: PatientCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSolicitacaoClick = (id: string) => {
    navigate(`/reports?solicitacaoId=${id}`);
  };

  return (
    <>
      <div className="relative h-[300px] perspective-1000">
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-500 transform-style-3d",
            isFlipped ? "rotate-y-180" : ""
          )}
        >
          {/* Front of Card */}
          <div
            className="absolute w-full h-full backface-hidden rounded-lg border p-4 cursor-pointer patient-card"
            onClick={handleCardClick}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{patient.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{patient.age} anos</span>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{patient.gender}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn("font-medium", getPatientStatusColor(patient.status))}>
                {patient.status}
              </Badge>
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
                    <Clock className="w-3.5 h-3.5 mr-1" />
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
            className="absolute w-full h-full backface-hidden rounded-lg border p-4 rotate-y-180 patient-card flex flex-col"
            onClick={handleCardClick}
          >
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-support-teal" />
                  Solicitações de Autorização
                </h3>
                
                <div className="space-y-3 max-h-[150px] overflow-y-auto">
                  {patient.authorizations && Array.isArray(patient.authorizations) && patient.authorizations.length > 0 ? (
                    patient.authorizations.map((auth) => (
                      <button
                        key={auth.id}
                        type="button"
                        onClick={e => { e.stopPropagation(); handleSolicitacaoClick(auth.id); }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-primary/10 cursor-pointer",
                          getStatusColor(auth.status)
                        )}
                        style={{ outline: 'none' }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(auth.status)}
                            <span className="text-sm font-medium">
                              {auth.status === 'approved' ? 'Aprovado' : 
                               auth.status === 'pending' ? 'Pendente' : 'Rejeitado'}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{auth.date}</span>
                        </div>
                        <div className="text-sm font-medium mb-1">{auth.protocol}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">{auth.description}</div>
                      </button>
                    ))
                  ) :
                    <div className="text-center text-muted-foreground italic">
                      Nenhuma solicitação de autorização encontrada para este paciente.
                    </div>
                  }
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-lg mb-2">Informações Adicionais</h3>
                
                <div className="space-y-3">
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
                    <div className="text-xs text-right mt-1 text-muted-foreground">45% concluído
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="font-medium text-sm mb-1">Próxima consulta:</div>
                    <div className="text-sm">15/06/2025 às 14:30
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(patient.id);
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
              <ChevronRight className="h-5 w-5 rotate-180 text-muted-foreground animate-bounce-subtle" />
            </div>
          </div>
        </div>
      </div>
      
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
