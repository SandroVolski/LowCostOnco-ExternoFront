import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  User,
  Clock,
  FileText,
  Lock,
  Smartphone,
  Mail
} from 'lucide-react';
import DoctorAuthentication from './DoctorAuthentication';

interface DoctorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorCRM: string;
  doctorName: string;
  onAuthenticationSuccess: (authData: any) => void;
  solicitacaoData?: any;
}

const DoctorAuthModal: React.FC<DoctorAuthModalProps> = ({
  isOpen,
  onClose,
  doctorCRM,
  doctorName,
  onAuthenticationSuccess,
  solicitacaoData
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState<any>(null);

  const handleAuthenticationSuccess = (data: any) => {
    setAuthData(data);
    setIsAuthenticated(true);
    onAuthenticationSuccess(data);
  };

  const handleClose = () => {
    if (!isAuthenticated) {
      // Se não foi autenticado, perguntar se quer cancelar
      if (window.confirm('A autenticação médica é obrigatória. Deseja realmente cancelar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'app_mobile':
        return <Smartphone className="h-4 w-4 text-primary" />;
      case 'email_otp':
        return <Mail className="h-4 w-4 text-blue-600" />;
      case 'manual_approval':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'app_mobile':
        return 'Aplicativo';
      case 'email_otp':
        return 'Email';
      case 'manual_approval':
        return 'Manual';
      default:
        return method;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Autenticação Médica Obrigatória
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Solicitação */}
          {solicitacaoData && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Detalhes da Solicitação
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Paciente:</span> {solicitacaoData.cliente_nome}
                </div>
                <div>
                  <span className="font-medium">Diagnóstico:</span> {solicitacaoData.diagnostico_cid}
                </div>
                <div>
                  <span className="font-medium">Finalidade:</span> {solicitacaoData.finalidade}
                </div>
                <div>
                  <span className="font-medium">Data:</span> {new Date().toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          )}

          {/* Alertas de Segurança */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> A autenticação médica é obrigatória para validar legalmente 
              esta solicitação de autorização. Sem a autenticação, o documento não terá validade legal.
            </AlertDescription>
          </Alert>

          {/* Status de Autenticação */}
          {isAuthenticated && authData && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-[#1f4edd]" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-semibold text-blue-800">
                    ✅ Autenticação Realizada com Sucesso
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Método:</span> {getMethodLabel(authData.method)}
                    </div>
                    <div>
                      <span className="font-medium">Data/Hora:</span> {new Date(authData.timestamp).toLocaleString('pt-BR')}
                    </div>
                    <div>
                      <span className="font-medium">Médico:</span> {authData.doctorName}
                    </div>
                    <div>
                      <span className="font-medium">CRM:</span> {authData.doctorCRM}
                    </div>
                  </div>
                  {authData.signatureHash && (
                    <div className="text-xs bg-blue-100 p-2 rounded">
                      <span className="font-medium">Hash da Assinatura:</span> {authData.signatureHash}
                    </div>
                  )}
                  {authData.otpCode && (
                    <div className="text-xs bg-blue-100 p-2 rounded">
                      <span className="font-medium">Código OTP:</span> {authData.otpCode}
                    </div>
                  )}
                  {authData.approvalCode && (
                    <div className="text-xs bg-blue-100 p-2 rounded">
                      <span className="font-medium">Código de Aprovação:</span> {authData.approvalCode}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Componente de Autenticação */}
          {!isAuthenticated && (
            <DoctorAuthentication
              doctorCRM={doctorCRM}
              doctorName={doctorName}
              onAuthenticationSuccess={handleAuthenticationSuccess}
              onAuthenticationCancel={handleClose}
            />
          )}

          {/* Informações Legais */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Informações Legais
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Esta autenticação garante a validade legal do documento</p>
              <p>• O médico assume total responsabilidade pela solicitação</p>
              <p>• Todos os dados são registrados com timestamp e IP</p>
              <p>• O documento será assinado digitalmente no PDF final</p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Autenticação obrigatória para validade legal</span>
            </div>
            
            <div className="flex gap-2">
              {isAuthenticated ? (
                <Button onClick={handleClose} className="bg-[#1f4edd] hover:bg-[#2351c4]">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Continuar
                </Button>
              ) : (
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorAuthModal; 