import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContactDebugProps {
  telefones?: string[];
  emails?: string[];
  rawData?: any;
}

const ContactDebug: React.FC<ContactDebugProps> = ({ telefones, emails, rawData }) => {
  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">Debug: Dados de Contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dados brutos do backend */}
        {rawData && (
          <div>
            <h4 className="font-medium text-orange-800 mb-2">Dados Brutos do Backend:</h4>
            <div className="bg-white p-3 rounded border text-xs font-mono">
              <pre>{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium text-orange-800 mb-2">Telefones Processados:</h4>
          <div className="space-y-1">
            {telefones?.map((tel, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm font-mono">
                  {tel || '(vazio)'}
                </span>
                {tel && tel.trim() !== '' && (
                  <Badge variant="secondary" className="text-xs">
                    Válido
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-600 mt-1">
            Total: {telefones?.length || 0} telefone(s)
          </p>
        </div>

        <div>
          <h4 className="font-medium text-orange-800 mb-2">Emails Processados:</h4>
          <div className="space-y-1">
            {emails?.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
                <span className="text-sm font-mono">
                  {email || '(vazio)'}
                </span>
                {email && email.trim() !== '' && (
                  <Badge variant="secondary" className="text-xs">
                    Válido
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-orange-600 mt-1">
            Total: {emails?.length || 0} email(s)
          </p>
        </div>

        <div className="pt-2 border-t border-orange-200">
          <p className="text-xs text-orange-600">
            <strong>Status:</strong> {telefones?.some(t => t && t.trim()) || emails?.some(e => e && e.trim()) ? 'Dados encontrados' : 'Nenhum dado válido'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactDebug; 