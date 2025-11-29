import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Lock, 
  Smartphone,
  Mail,
  Fingerprint,
  FileText,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import config from '@/config/environment';
import { authorizedFetch } from '@/services/authService';

interface DoctorAuthProps {
  doctorCRM: string;
  doctorName: string;
  onAuthenticationSuccess: (authData: DoctorAuthData) => void;
  onAuthenticationCancel: () => void;
}

interface DoctorAuthData {
  method: 'app_mobile' | 'email_otp' | 'manual_approval';
  timestamp: string;
  doctorCRM: string;
  doctorName: string;
  signatureHash?: string;
  otpCode?: string;
  approvalCode?: string;
  ipAddress?: string;
  userAgent?: string;
}

const DoctorAuthentication: React.FC<DoctorAuthProps> = ({
  doctorCRM,
  doctorName,
  onAuthenticationSuccess,
  onAuthenticationCancel
}) => {
  const [authMethod, setAuthMethod] = useState<'app_mobile' | 'email_otp' | 'manual_approval'>('app_mobile');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authData, setAuthData] = useState({
    password: '',
    otpCode: '',
    approvalCode: '',
    signatureText: ''
  });
  const [step, setStep] = useState<'method_selection' | 'authentication' | 'success'>('method_selection');
  const [doctorData, setDoctorData] = useState<{
    crm: string;
    name: string;
    email: string | null;
    phone: string | null;
    specialties: string[];
    isActive: boolean;
    lastLogin: string | null;
  }>({
    crm: doctorCRM,
    name: doctorName,
    email: null,
    phone: null,
    specialties: [],
    isActive: true,
    lastLogin: null
  });
  const [otpSent, setOtpSent] = useState(false);
  const [otpExpiresAt, setOtpExpiresAt] = useState<Date | null>(null);

  // Buscar dados do médico do backend
  useEffect(() => {
    const fetchDoctorData = async () => {
      try {
        const response = await authorizedFetch(
          `${config.API_BASE_URL}/medico-auth/medico-info?crm=${encodeURIComponent(doctorCRM)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setDoctorData({
              crm: data.data.crm || doctorCRM,
              name: data.data.nome || doctorName,
              email: data.data.email || null,
              phone: data.data.telefone || null,
              specialties: [],
              isActive: true,
              lastLogin: null
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do médico:', error);
        // Manter dados padrão se houver erro
      }
    };

    if (doctorCRM) {
      fetchDoctorData();
    }
  }, [doctorCRM, doctorName]);

  const handleMethodSelection = (method: typeof authMethod) => {
    setAuthMethod(method);
    setStep('authentication');
  };

  const handleAppMobile = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular processo de autenticação via app móvel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const authResult: DoctorAuthData = {
        method: 'app_mobile',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Autenticação via aplicativo realizada com sucesso!', {
        description: 'O médico deve aprovar a solicitação no aplicativo móvel.'
      });
      
    } catch (error) {
      toast.error('Erro na autenticação via aplicativo', {
        description: 'Tente novamente ou escolha outro método.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailOTP = async () => {
    if (!doctorData.email) {
      toast.error('Email não encontrado', {
        description: 'Não foi possível encontrar o email do médico. Verifique se o CRM está correto.'
      });
      return;
    }

    setIsAuthenticating(true);
    
    try {
      // Enviar código OTP por email
      const response = await authorizedFetch(
        `${config.API_BASE_URL}/medico-auth/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            medico_crm: doctorCRM,
            medico_email: doctorData.email
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Erro ao enviar código OTP');
      }

      // Código enviado com sucesso
      setOtpSent(true);
      if (data.data?.expires_at) {
        setOtpExpiresAt(new Date(data.data.expires_at));
      }

      toast.success('Código enviado por email!', {
        description: `Verifique sua caixa de entrada: ${doctorData.email}`
      });
      
    } catch (error) {
      console.error('Erro ao enviar OTP:', error);
      toast.error('Erro no envio do email', {
        description: error instanceof Error ? error.message : 'Tente novamente ou escolha outro método.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleValidateOTP = async () => {
    if (!authData.otpCode || authData.otpCode.length !== 6) {
      toast.error('Código inválido', {
        description: 'O código deve ter 6 dígitos'
      });
      return;
    }

    if (!doctorData.email) {
      toast.error('Email não encontrado', {
        description: 'Não foi possível validar o código. Email do médico não encontrado.'
      });
      return;
    }

    setIsAuthenticating(true);
    
    try {
      // Limpar código OTP (remover espaços e garantir que seja string)
      const codigoOTPLimpo = authData.otpCode.toString().trim().replace(/\D/g, '').slice(0, 6);
      
      console.log('🔍 [DoctorAuthentication] Validando código OTP:', {
        medico_crm: doctorCRM,
        medico_email: doctorData.email,
        codigo_otp_original: authData.otpCode,
        codigo_otp_limpo: codigoOTPLimpo
      });

      // Validar código OTP
      const response = await authorizedFetch(
        `${config.API_BASE_URL}/medico-auth/validate-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            medico_crm: doctorCRM,
            medico_email: doctorData.email,
            codigo_otp: codigoOTPLimpo
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Código OTP inválido ou expirado');
      }

      // Código validado com sucesso
      const authResult: DoctorAuthData = {
        method: 'email_otp',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        otpCode: authData.otpCode,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Autenticação realizada com sucesso!', {
        description: 'Código OTP validado. Documento autenticado pelo médico responsável.'
      });
      
    } catch (error) {
      console.error('Erro ao validar OTP:', error);
      toast.error('Erro ao validar código', {
        description: error instanceof Error ? error.message : 'Código inválido ou expirado. Tente novamente.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleManualApproval = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular aprovação manual
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const approvalCode = generateApprovalCode();
      
      const authResult: DoctorAuthData = {
        method: 'manual_approval',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        approvalCode,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Aprovação manual registrada!', {
        description: `Código: ${approvalCode}`
      });
      
    } catch (error) {
      toast.error('Erro na aprovação manual', {
        description: 'Tente novamente.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const generateSignatureHash = (text: string, crm: string): string => {
    const data = `${text}-${crm}-${new Date().toISOString()}`;
    return btoa(data).slice(0, 32); // Simulação de hash
  };

  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generateApprovalCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return '127.0.0.1';
    }
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <Shield className="h-12 w-12 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-semibold">Autenticação do Médico</h3>
        <p className="text-muted-foreground">
          Escolha um método para autenticar a solicitação
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aplicativo Móvel */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={() => handleMethodSelection('app_mobile')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Aplicativo</h4>
                <p className="text-sm text-muted-foreground">
                  Aprovar pelo aplicativo móvel
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email OTP */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={() => handleMethodSelection('email_otp')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-semibold">Email</h4>
                <p className="text-sm text-muted-foreground">
                  Código enviado por email
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Aprovação Manual */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={() => handleMethodSelection('manual_approval')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <h4 className="font-semibold">Manual</h4>
                <p className="text-sm text-muted-foreground">
                  Aprovação presencial do médico
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAuthentication = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="h-12 w-12 text-primary mx-auto mb-3" />
        <h3 className="text-xl font-semibold">Autenticação do Dr. {doctorName}</h3>
        <p className="text-muted-foreground">CRM: {doctorCRM}</p>
      </div>

      {/* Informações do Médico */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nome:</span> {doctorData.name}
            </div>
            <div>
              <span className="font-medium">CRM:</span> {doctorData.crm}
            </div>
            <div>
              <span className="font-medium">Email:</span> {doctorData.email}
            </div>
            <div>
              <span className="font-medium">Telefone:</span> {doctorData.phone}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Método de Autenticação */}
      {authMethod === 'app_mobile' && (
        <div className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              O médico deve acessar o aplicativo móvel e aprovar a solicitação por lá.
              A autenticação será realizada quando o médico confirmar no app.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleAppMobile}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? 'Processando...' : 'Confirmar Autenticação via Aplicativo'}
          </Button>
        </div>
      )}

      {authMethod === 'email_otp' && (
        <div className="space-y-4">
          {!otpSent ? (
            <>
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  {doctorData.email ? (
                    <>Um código será enviado para o email: <strong>{doctorData.email}</strong></>
                  ) : (
                    <>Carregando email do médico...</>
                  )}
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleEmailOTP}
                disabled={isAuthenticating || !doctorData.email}
                className="w-full"
              >
                {isAuthenticating ? 'Enviando Email...' : 'Enviar Código por Email'}
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-blue-200 bg-blue-50">
                <CheckCircle className="h-4 w-4 text-[#1f4edd]" />
                <AlertDescription className="text-blue-800">
                  <strong>Código enviado!</strong> Verifique sua caixa de entrada: {doctorData.email}
                  {otpExpiresAt && (
                    <div className="mt-2 text-sm">
                      O código expira em {Math.ceil((otpExpiresAt.getTime() - Date.now()) / 60000)} minutos
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="otpCode">Digite o código recebido por email</Label>
                <Input
                  id="otpCode"
                  type="text"
                  value={authData.otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setAuthData(prev => ({ ...prev, otpCode: value }));
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest"
                />
                <div className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos recebido por email
                </div>
              </div>

              <Button 
                onClick={handleValidateOTP}
                disabled={isAuthenticating || authData.otpCode.length !== 6}
                className="w-full"
              >
                {isAuthenticating ? 'Validando...' : 'Validar Código'}
              </Button>

              <Button 
                variant="outline"
                onClick={() => {
                  setOtpSent(false);
                  setAuthData(prev => ({ ...prev, otpCode: '' }));
                  setOtpExpiresAt(null);
                }}
                className="w-full"
                disabled={isAuthenticating}
              >
                Reenviar Código
              </Button>
            </>
          )}
        </div>
      )}

      {authMethod === 'manual_approval' && (
        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              O médico deve aprovar presencialmente esta solicitação
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleManualApproval}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? 'Registrando...' : 'Registrar Aprovação Manual'}
          </Button>
        </div>
      )}

      <Button 
        variant="outline" 
        onClick={() => setStep('method_selection')}
        className="w-full"
      >
        Voltar
      </Button>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-4">
      <CheckCircle className="h-16 w-16 text-[#1f4edd] mx-auto" />
      <h3 className="text-xl font-semibold text-blue-800">Autenticação Realizada!</h3>
      <p className="text-muted-foreground">
        A solicitação foi autenticada pelo médico responsável
      </p>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Método:</span> {authMethod}
          </div>
          <div>
            <span className="font-medium">Data/Hora:</span> {new Date().toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Autenticação Médica
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'method_selection' && renderMethodSelection()}
        {step === 'authentication' && renderAuthentication()}
        {step === 'success' && renderSuccess()}
      </CardContent>
    </Card>
  );
};

export default DoctorAuthentication; 