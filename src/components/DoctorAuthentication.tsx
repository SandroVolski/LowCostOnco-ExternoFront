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

interface DoctorAuthProps {
  doctorCRM: string;
  doctorName: string;
  onAuthenticationSuccess: (authData: DoctorAuthData) => void;
  onAuthenticationCancel: () => void;
}

interface DoctorAuthData {
  method: 'digital_signature' | 'sms_otp' | 'email_otp' | 'manual_approval';
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
  const [authMethod, setAuthMethod] = useState<'digital_signature' | 'sms_otp' | 'email_otp' | 'manual_approval'>('digital_signature');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authData, setAuthData] = useState({
    password: '',
    otpCode: '',
    approvalCode: '',
    signatureText: ''
  });
  const [step, setStep] = useState<'method_selection' | 'authentication' | 'success'>('method_selection');

  // Simular dados do médico (em produção viria do backend)
  const doctorData = {
    crm: doctorCRM,
    name: doctorName,
    email: 'medico@clinica.com',
    phone: '+55 11 99999-9999',
    specialties: ['Oncologia', 'Hematologia'],
    isActive: true,
    lastLogin: '2024-01-15T10:30:00Z'
  };

  const handleMethodSelection = (method: typeof authMethod) => {
    setAuthMethod(method);
    setStep('authentication');
  };

  const handleDigitalSignature = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular processo de assinatura digital
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const signatureHash = generateSignatureHash(authData.signatureText, doctorCRM);
      
      const authResult: DoctorAuthData = {
        method: 'digital_signature',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        signatureHash,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Assinatura digital realizada com sucesso!', {
        description: 'Documento autenticado pelo médico responsável.'
      });
      
    } catch (error) {
      toast.error('Erro na assinatura digital', {
        description: 'Tente novamente ou escolha outro método.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSMSOTP = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular envio de SMS
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const otpCode = generateOTP();
      
      const authResult: DoctorAuthData = {
        method: 'sms_otp',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        otpCode,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Código SMS enviado e validado!', {
        description: `Código: ${otpCode} (simulado)`
      });
      
    } catch (error) {
      toast.error('Erro no envio do SMS', {
        description: 'Tente novamente ou escolha outro método.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmailOTP = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simular envio de email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const otpCode = generateOTP();
      
      const authResult: DoctorAuthData = {
        method: 'email_otp',
        timestamp: new Date().toISOString(),
        doctorCRM,
        doctorName,
        otpCode,
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      setStep('success');
      onAuthenticationSuccess(authResult);
      
      toast.success('Código enviado por email!', {
        description: `Código: ${otpCode} (simulado)`
      });
      
    } catch (error) {
      toast.error('Erro no envio do email', {
        description: 'Tente novamente ou escolha outro método.'
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Assinatura Digital */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={() => handleMethodSelection('digital_signature')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Fingerprint className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-semibold">Assinatura Digital</h4>
                <p className="text-sm text-muted-foreground">
                  Assinatura eletrônica com senha
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS OTP */}
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
          onClick={() => handleMethodSelection('sms_otp')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-green-600" />
              <div>
                <h4 className="font-semibold">Código SMS</h4>
                <p className="text-sm text-muted-foreground">
                  Código enviado por SMS
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
                <h4 className="font-semibold">Código Email</h4>
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
                <h4 className="font-semibold">Aprovação Manual</h4>
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
      {authMethod === 'digital_signature' && (
        <div className="space-y-4">
          <Label htmlFor="password">Senha de Assinatura Digital</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={authData.password}
              onChange={(e) => setAuthData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Digite sua senha de assinatura"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          
          <Label htmlFor="signatureText">Texto para Assinatura</Label>
          <Input
            id="signatureText"
            value={authData.signatureText}
            onChange={(e) => setAuthData(prev => ({ ...prev, signatureText: e.target.value }))}
            placeholder="Digite um texto para assinar (ex: 'Aprovo esta solicitação')"
          />
          
          <Button 
            onClick={handleDigitalSignature}
            disabled={isAuthenticating || !authData.password || !authData.signatureText}
            className="w-full"
          >
            {isAuthenticating ? 'Assinando...' : 'Assinar Digitalmente'}
          </Button>
        </div>
      )}

      {authMethod === 'sms_otp' && (
        <div className="space-y-4">
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Um código será enviado para o telefone cadastrado: {doctorData.phone}
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleSMSOTP}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? 'Enviando SMS...' : 'Enviar Código SMS'}
          </Button>
        </div>
      )}

      {authMethod === 'email_otp' && (
        <div className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Um código será enviado para o email: {doctorData.email}
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleEmailOTP}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating ? 'Enviando Email...' : 'Enviar Código por Email'}
          </Button>
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
      <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
      <h3 className="text-xl font-semibold text-green-800">Autenticação Realizada!</h3>
      <p className="text-muted-foreground">
        A solicitação foi autenticada pelo médico responsável
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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