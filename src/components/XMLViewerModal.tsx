import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FileText, 
  Download, 
  Copy, 
  Check,
  Code,
  Eye,
  Calendar,
  HardDrive,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface XMLViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlData: {
    rawContent: string;
    fileName: string;
    fileSize: number;
    uploadDate: string;
  };
}

const XMLViewerModal: React.FC<XMLViewerModalProps> = ({ isOpen, onClose, xmlData }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');

  const formatXML = (xml: string): string => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');
      const serializer = new XMLSerializer();
      
      // Formatar com indentação
      const formatted = serializer.serializeToString(xmlDoc);
      
      // Adicionar indentação manual
      let formattedXML = formatted;
      let indent = 0;
      const indentSize = 2;
      
      formattedXML = formattedXML
        .replace(/></g, '>\n<')
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('</')) {
            indent -= indentSize;
          }
          const indented = ' '.repeat(Math.max(0, indent)) + trimmed;
          if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
            indent += indentSize;
          }
          return indented;
        })
        .join('\n');
      
      return formattedXML;
    } catch (error) {
      return xml;
    }
  };

  const handleCopyXML = async () => {
    try {
      const contentToCopy = viewMode === 'formatted' ? formatXML(xmlData.rawContent) : xmlData.rawContent;
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast({
        title: 'XML copiado',
        description: 'Conteúdo XML copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o conteúdo XML.',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadXML = () => {
    try {
      const contentToDownload = viewMode === 'formatted' ? formatXML(xmlData.rawContent) : xmlData.rawContent;
      const blob = new Blob([contentToDownload], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = xmlData.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Download iniciado',
        description: 'Arquivo XML está sendo baixado.',
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo XML.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-6 w-6 text-blue-600" />
                Visualizador de XML TISS
              </DialogTitle>
              <DialogDescription className="mt-2">
                Visualize e analise o conteúdo do arquivo XML TISS carregado
              </DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Arquivo */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nome do Arquivo</p>
                    <p className="font-semibold text-gray-900">{xmlData.fileName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HardDrive className="h-5 w-5 text-[#1f4edd]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tamanho</p>
                    <p className="font-semibold text-gray-900">{formatFileSize(xmlData.fileSize)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Upload</p>
                    <p className="font-semibold text-gray-900">{formatDate(xmlData.uploadDate)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controles */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'formatted' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('formatted')}
                className="gap-2"
              >
                <Code className="h-4 w-4" />
                Formatado
              </Button>
              <Button
                variant={viewMode === 'raw' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('raw')}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Raw
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyXML}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#1f4edd]" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar XML
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadXML}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>

          {/* Visualizador de XML */}
          <Card className="border-2 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Conteúdo XML
                <Badge variant="secondary" className="ml-2">
                  {viewMode === 'formatted' ? 'Formatado' : 'Raw'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 p-6 overflow-auto max-h-96 text-sm font-mono leading-relaxed">
                  <code>
                    {viewMode === 'formatted' ? formatXML(xmlData.rawContent) : xmlData.rawContent}
                  </code>
                </pre>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-gray-800 text-gray-300 border-gray-600">
                    XML TISS
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Adicionais */}
          <Card className="bg-gradient-to-r from-blue-50 to-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-5 w-5 text-[#1f4edd]" />
                <h3 className="font-semibold text-gray-900">Informações do XML</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Tipo de Arquivo:</p>
                  <Badge className="bg-blue-100 text-blue-800">TISS XML</Badge>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Encoding:</p>
                  <Badge className="bg-blue-100 text-blue-800">UTF-8</Badge>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Status:</p>
                  <Badge className="bg-blue-100 text-blue-800">Válido</Badge>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Linhas:</p>
                  <Badge className="bg-purple-100 text-purple-800">
                    {xmlData.rawContent.split('\n').length} linhas
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default XMLViewerModal;
