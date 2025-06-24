// src/components/PDFViewerModal.tsx - VERSÃO HÍBRIDA FINAL

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { SolicitacaoService, SolicitacaoFromAPI } from '@/services/api';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitacao: SolicitacaoFromAPI;
}

type ViewMethod = 'object' | 'blob' | 'external';

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, solicitacao }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewMethod, setViewMethod] = useState<ViewMethod>('object');
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const objectRef = useRef<HTMLObjectElement>(null);

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      setZoom(100);
      setIsFullscreen(false);
      setViewMethod('object');
      setPdfBlob(null);
      setRetryCount(0);
      
      // Tentar carregar PDF
      loadPDF();
    } else {
      // Cleanup blob URL when modal closes
      if (pdfBlob) {
        URL.revokeObjectURL(pdfBlob);
        setPdfBlob(null);
      }
    }
  }, [isOpen, solicitacao.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfBlob) {
        URL.revokeObjectURL(pdfBlob);
      }
    };
  }, [pdfBlob]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔧 Tentando carregar PDF, método:', viewMethod, 'tentativa:', retryCount + 1);
      
      if (viewMethod === 'object') {
        // Tentar com object tag primeiro (mais rápido)
        await loadWithObjectTag();
      } else if (viewMethod === 'blob') {
        // Fallback para blob
        await loadWithBlob();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar PDF:', error);
      handleLoadError(error);
    }
  };

  const loadWithObjectTag = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const pdfUrl = SolicitacaoService.getPDFViewUrl(solicitacao.id!);
      
      console.log('🔧 Carregando com object tag, URL:', pdfUrl);
      
      // Simular carregamento com timeout
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout ao carregar PDF com object tag'));
      }, 10000); // 10 segundos de timeout
      
      // Tentar carregar e verificar se funcionou
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeoutId);
        setLoading(false);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error('Falha ao carregar PDF com object tag'));
      };
      
      // Usar uma técnica para verificar se a URL responde
      fetch(pdfUrl, { method: 'HEAD' })
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            setLoading(false);
            resolve();
          } else {
            reject(new Error(`Servidor retornou: ${response.status}`));
          }
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  };

  const loadWithBlob = async (): Promise<void> => {
    try {
      console.log('🔧 Carregando PDF como blob para solicitação:', solicitacao.id);
      
      const blob = await SolicitacaoService.gerarPDF(solicitacao.id!);
      
      if (blob && blob.size > 0) {
        // Cleanup previous blob
        if (pdfBlob) {
          URL.revokeObjectURL(pdfBlob);
        }
        
        // Create new blob URL
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlob(blobUrl);
        setLoading(false);
        
        console.log('✅ PDF blob carregado com sucesso, tamanho:', (blob.size / 1024).toFixed(2), 'KB');
      } else {
        throw new Error('PDF vazio ou inválido recebido');
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLoadError = (error: any) => {
    setLoading(false);
    
    if (viewMethod === 'object' && retryCount === 0) {
      // Primeira tentativa falhou, tentar com blob
      console.log('🔄 Object tag falhou, tentando com blob...');
      setViewMethod('blob');
      setRetryCount(1);
      loadPDF();
    } else if (viewMethod === 'blob' && retryCount < 2) {
      // Blob falhou, tentar novamente
      console.log('🔄 Blob falhou, tentando novamente...');
      setRetryCount(prev => prev + 1);
      setTimeout(loadPDF, 1000); // Aguardar 1 segundo antes de tentar novamente
    } else {
      // Todas as tentativas falharam
      console.log('❌ Todas as tentativas falharam, sugerindo visualização externa');
      setError(error instanceof Error ? error.message : 'Erro ao carregar PDF');
      setViewMethod('external');
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setViewMethod('object');
    loadPDF();
  };

  const handleDownload = async () => {
    try {
      await SolicitacaoService.downloadPDF(
        solicitacao.id!, 
        `solicitacao_autorizacao_${solicitacao.id}_${solicitacao.cliente_nome?.replace(/\s+/g, '_')}.pdf`
      );
      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleOpenExternal = async () => {
    try {
      await SolicitacaoService.viewPDF(solicitacao.id!);
      toast.success('PDF aberto em nova aba');
    } catch (error) {
      console.error('Erro ao abrir PDF externamente:', error);
      toast.error('Erro ao abrir documento em nova aba');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const adjustZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(200, zoom + delta));
    setZoom(newZoom);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejeitada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em_analise':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const renderPDFViewer = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {viewMethod === 'object' ? 'Carregando visualizador...' : 
               viewMethod === 'blob' ? 'Preparando documento...' : 'Carregando...'}
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Tentativa {retryCount + 1}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (error || viewMethod === 'external') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="p-4 rounded-full bg-muted">
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium mb-2">Visualização Inline Indisponível</p>
              <p className="text-sm text-muted-foreground mb-4">
                {error || 'Seu navegador não suporta visualização inline de PDF. Use uma das opções abaixo:'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <Button
                onClick={handleOpenExternal}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir PDF em Nova Aba
              </Button>
              <Button
                variant="outline"
                onClick={handleDownload}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Renderizar PDF baseado no método que funcionou
    const pdfUrl = viewMethod === 'blob' && pdfBlob ? pdfBlob : SolicitacaoService.getPDFViewUrl(solicitacao.id!);

    return (
      <object
        ref={objectRef}
        data={pdfUrl}
        type="application/pdf"
        className="w-full h-full border-0"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          width: `${100 / (zoom / 100)}%`,
          height: `${100 / (zoom / 100)}%`
        }}
      >
        {/* Fallback embed */}
        <embed
          src={pdfUrl}
          type="application/pdf"
          className="w-full h-full"
        />
      </object>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`
          ${isFullscreen ? 'max-w-[100vw] max-h-[100vh] w-full h-full m-0 rounded-none' : 'max-w-6xl max-h-[90vh]'}
          transition-all duration-300 p-0 overflow-hidden
        `}
      >
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Visualização da Solicitação #{solicitacao.id}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Documento PDF da solicitação de autorização para {solicitacao.cliente_nome}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {solicitacao.cliente_nome}
                  </span>
                  <Badge variant="outline" className={getStatusColor(solicitacao.status || 'pendente')}>
                    {solicitacao.status?.toUpperCase() || 'PENDENTE'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(solicitacao.created_at || '')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Controles do PDF */}
            {!loading && !error && viewMethod !== 'external' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustZoom(-25)}
                  disabled={zoom <= 50}
                  title="Diminuir zoom"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {zoom}%
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustZoom(25)}
                  disabled={zoom >= 200}
                  title="Aumentar zoom"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <div className="w-px h-6 bg-border mx-1" />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* PDF Viewer Area */}
        <div className={`
          relative bg-muted/10 
          ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[600px]'}
        `}>
          {renderPDFViewer()}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/30">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Documento oficial de solicitação de autorização</span>
              {!loading && !error && viewMethod !== 'external' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                  Método: {viewMethod === 'object' ? 'Nativo' : 'Blob'}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleOpenExternal}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Nova Aba
              </Button>
              
              <Button
                onClick={handleDownload}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Baixar
              </Button>
              
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerModal;