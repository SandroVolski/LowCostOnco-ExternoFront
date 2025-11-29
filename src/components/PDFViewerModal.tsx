// src/components/PDFViewerModal.tsx - VERSÃO HÍBRIDA FINAL

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';
import { SolicitacaoFromAPI } from '@/services/api';
import { operadoraAuthService } from '@/services/operadoraAuthService';
import { TokenStore } from '@/services/authService';
import config from '@/config/environment';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitacao: SolicitacaoFromAPI;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}

type ViewMethod = 'object' | 'blob' | 'external';

const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, solicitacao, onApprove, onReject }) => {
  // Verificação de segurança
  if (!solicitacao) {
    return null;
  }

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [viewMethod, setViewMethod] = useState<ViewMethod>('blob');
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const objectRef = useRef<HTMLObjectElement>(null);
  const [confirmAction, setConfirmAction] = useState<null | { type: 'aprovar' | 'rejeitar' }>(null);

  // Resetar estado quando modal abrir/fechar ou solicitação mudar
  useEffect(() => {
    if (isOpen && solicitacao) {
      setViewMethod('blob');
      setPdfBlob(null);
      setLoading(true);
      setError(null);
      void loadPDF();
    }
  }, [isOpen, solicitacao?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfBlob) {
        URL.revokeObjectURL(pdfBlob);
      }
    };
  }, [pdfBlob]);

  // Função para carregar PDF
  const loadPDF = useCallback(async () => {
    if (!solicitacao) return;
    
    try {
      setLoading(true);
      setError(null);

      let pdfUrl: string;

      if (viewMethod === 'blob') {
        const token = TokenStore.getAccess();
        if (!token) {
          throw new Error('Token de autenticação não encontrado');
        }
        const res = await fetch(`${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Alguns backends retornam HTML (erro) com 200. Detectar por content-type
        const contentType = res?.headers?.get?.('content-type') || '';
        if (!res || !('ok' in res) || !res.ok || contentType.includes('text/html')) {
          throw new Error(`Resposta inválida (${res.status})`);
        }
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlob(blobUrl);
        pdfUrl = blobUrl;
      } else if (viewMethod === 'external') {
        pdfUrl = `${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf?view=true`;
      } else {
        pdfUrl = `${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf?view=true`;
      }

      // setPdfUrl(pdfUrl); // This line was not in the original file, so it's removed.
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar PDF:', error);
      setError('Erro ao carregar PDF. Tente novamente.');
      setLoading(false);
    }
  }, [solicitacao, viewMethod]);

  const loadWithObjectTag = async (): Promise<void> => {
    try {
      const pdfUrl = `${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf?view=true&inline=true&t=${Date.now()}`;
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar PDF com object tag:', error);
      throw error;
    }
  };

  const loadWithBlob = async (): Promise<void> => {
    try {
      const token = localStorage.getItem('operadora_access_token') || '';
      const res = await fetch(`${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const contentType = res?.headers?.get?.('content-type') || '';
      if (!res || !('ok' in res) || !res.ok || contentType.includes('text/html')) throw new Error(`HTTP ${res?.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlob(blobUrl);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar PDF como blob:', error);
      throw error;
    }
  };

  const handleLoadError = (error: any) => {
    setLoading(false);
    
    if (viewMethod === 'object' && retryCount === 0) {
      setViewMethod('blob');
      setRetryCount(1);
      loadPDF();
    } else if (viewMethod === 'blob' && retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setTimeout(loadPDF, 1000); // Aguardar 1 segundo antes de tentar novamente
    } else {
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
      const token = localStorage.getItem('operadora_access_token') || '';
      const res = await fetch(`${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `solicitacao_autorizacao_${solicitacao?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Download iniciado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleOpenExternal = async () => {
    try {
      // Tentar via blob com token
      const res = await operadoraAuthService.authorizedFetch(`${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf`);
      const contentType = res?.headers?.get?.('content-type') || '';
      if (!res || !('ok' in res) || !res.ok || contentType.includes('text/html')) {
        // Fallback final: abrir URL com token na querystring (se backend aceitar)
        const token = localStorage.getItem('operadora_access_token');
        const urlWithToken = `${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf?view=true&token=${encodeURIComponent(token || '')}`;
        window.open(urlWithToken, '_blank');
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const win = window.open(blobUrl, '_blank');
      if (!win) throw new Error('Pop-up bloqueado');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
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
        return 'bg-blue-100 text-blue-800 border-blue-200';
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
    if (loading || (viewMethod === 'blob' && !pdfBlob)) {
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
            const pdfUrl = viewMethod === 'blob' && pdfBlob ? pdfBlob : `${config.API_BASE_URL}/solicitacoes/${solicitacao?.id}/pdf?view=true&inline=true&t=${Date.now()}`;

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
        <DialogHeader className="p-2 border-b bg-muted/30">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <DialogTitle className="text-base font-semibold">
                  Visualização da Solicitação #{solicitacao?.id}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Documento PDF da solicitação de autorização para {solicitacao?.cliente_nome}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {solicitacao?.cliente_nome}
                  </span>
                  <Badge variant="outline" className={getStatusColor(solicitacao.status || 'pendente')}>
                    {solicitacao?.status?.toUpperCase() || 'PENDENTE'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(solicitacao?.created_at || '')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Controles do PDF (zoom/fullscreen + ações) */}
            {!loading && !error && viewMethod !== 'external' && (
              <div className="flex items-center gap-2 mr-8">
                {/* Ações Aprovar/Rejeitar - apenas para operadoras */}
                {onApprove && onReject && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(solicitacao?.status || 'pendente') !== 'pendente'}
                      onClick={() => setConfirmAction({ type: 'rejeitar' })}
                      className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Rejeitar solicitação"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      disabled={(solicitacao?.status || 'pendente') !== 'pendente'}
                      onClick={() => setConfirmAction({ type: 'aprovar' })}
                      className="bg-gradient-to-r from-[#1f4edd] to-[#65a3ee] text-white hover:from-[#2351c4] hover:to-[#83b4f8] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Aprovar solicitação"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>

                    <div className="w-px h-6 bg-border mx-1" />
                  </>
                )}

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
          ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[calc(90vh-100px)]'}
        `}>
          {renderPDFViewer()}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 border-t bg-muted/30">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Documento oficial de solicitação de autorização</span>
              {!loading && !error && viewMethod !== 'external' && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Método: {viewMethod === 'object' ? 'Nativo' : 'Blob'}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              {/* Ações da operadora dentro do popout */}
              {/* Botões de aprovar/rejeitar - apenas para operadoras */}
              {onApprove && onReject && (
                <>
                  <Button
                    variant="outline"
                    disabled={(solicitacao?.status || 'pendente') !== 'pendente'}
                    onClick={() => setConfirmAction({ type: 'rejeitar' })}
                    className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    disabled={(solicitacao?.status || 'pendente') !== 'pendente'}
                    onClick={() => setConfirmAction({ type: 'aprovar' })}
                    className="bg-gradient-to-r from-[#1f4edd] to-[#65a3ee] text-white hover:from-[#2351c4] hover:to-[#83b4f8] shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                </>
              )}
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
      {/* Confirmação aprovar/rejeitar */}
      <AlertDialog open={!!confirmAction} onOpenChange={(o) => { if (!o) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'aprovar' ? 'Confirmar aprovação' : 'Confirmar rejeição'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {confirmAction?.type === 'aprovar' ? 'aprovar' : 'rejeitar'} a solicitação #{solicitacao?.id}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.type === 'aprovar' ? 'bg-[#1f4edd] hover:bg-[#2351c4]' : 'bg-red-600 hover:bg-red-700'}
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === 'aprovar') {
                  onApprove?.(solicitacao?.id!);
                } else {
                  onReject?.(solicitacao?.id!);
                }
                setConfirmAction(null);
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default PDFViewerModal;