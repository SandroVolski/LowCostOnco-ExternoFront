import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Plus, Trash2 } from 'lucide-react';

interface ContactInfo {
  telefones: string[];
  emails: string[];
}

const MultipleContactsExample: React.FC = () => {
  const [contactInfo, setContactInfo] = React.useState<ContactInfo>({
    telefones: [''],
    emails: [''],
  });

  const addTelefone = () => {
    setContactInfo(prev => ({
      ...prev,
      telefones: [...prev.telefones, ''],
    }));
  };

  const removeTelefone = (index: number) => {
    setContactInfo(prev => ({
      ...prev,
      telefones: prev.telefones.filter((_, i) => i !== index),
    }));
  };

  const updateTelefone = (index: number, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      telefones: prev.telefones.map((tel, i) => i === index ? value : tel),
    }));
  };

  const addEmail = () => {
    setContactInfo(prev => ({
      ...prev,
      emails: [...prev.emails, ''],
    }));
  };

  const removeEmail = (index: number) => {
    setContactInfo(prev => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }));
  };

  const updateEmail = (index: number, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email),
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo: Múltiplos Telefones e Emails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Telefones e Emails lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Telefones */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Telefones</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTelefone}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Telefone
                </Button>
              </div>
              
              <div className="space-y-3">
                {contactInfo.telefones.map((telefone, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={telefone}
                        onChange={(e) => updateTelefone(index, e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        maxLength={15}
                      />
                    </div>
                    {contactInfo.telefones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTelefone(index)}
                        className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Emails */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">E-mails</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar E-mail
                </Button>
              </div>
              
              <div className="space-y-3">
                {contactInfo.emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="contato@clinica.com.br"
                        className="pl-10"
                      />
                    </div>
                    {contactInfo.emails.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEmail(index)}
                        className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview dos dados */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Dados atuais:</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Telefones:</strong> {contactInfo.telefones.filter(t => t.trim()).join(', ') || 'Nenhum'}
              </div>
              <div>
                <strong>Emails:</strong> {contactInfo.emails.filter(e => e.trim()).join(', ') || 'Nenhum'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MultipleContactsExample; 