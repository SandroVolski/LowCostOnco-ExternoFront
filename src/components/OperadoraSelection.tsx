import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Search, Check } from 'lucide-react';

export interface Operadora {
  id: number;
  nome: string;
  codigo?: string;
  cnpj?: string;
}

interface OperadoraSelectionProps {
  value?: number[]; // IDs das operadoras selecionadas
  onChange?: (selected: Operadora[]) => void;
  operadoras: Operadora[]; // Lista completa de operadoras disponíveis
  placeholder?: string;
  multiple?: boolean;
}

const OperadoraSelection: React.FC<OperadoraSelectionProps> = ({
  value = [],
  onChange,
  operadoras = [],
  placeholder = 'Selecione uma ou mais operadoras...',
  multiple = true,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Operadora[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Inicializar selected a partir de value (IDs)
  useEffect(() => {
    console.log('🔍 OperadoraSelection - value:', value);
    console.log('🔍 OperadoraSelection - operadoras disponíveis:', operadoras);
    
    if (!value || value.length === 0) {
      setSelected([]);
      return;
    }
    const selectedOps = operadoras.filter(op => value.includes(op.id));
    console.log('✅ OperadoraSelection - operadoras selecionadas:', selectedOps);
    setSelected(selectedOps);
  }, [value, operadoras]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Filtrar operadoras pela busca
  const filteredOperadoras = useMemo(() => {
    if (!search) return operadoras;
    const normalized = search.toLowerCase();
    return operadoras.filter(op =>
      op.nome.toLowerCase().includes(normalized) ||
      (op.codigo && op.codigo.toLowerCase().includes(normalized)) ||
      (op.cnpj && op.cnpj.toLowerCase().includes(normalized))
    );
  }, [search, operadoras]);

  // Seleção
  const toggleSelect = (operadora: Operadora) => {
    if (multiple) {
      const exists = selected.some(s => s.id === operadora.id);
      const next = exists
        ? selected.filter(s => s.id !== operadora.id)
        : [...selected, operadora];
      setSelected(next);
      onChange?.(next);
    } else {
      setSelected([operadora]);
      onChange?.([operadora]);
      setOpen(false);
    }
  };

  const removeSelected = (id: number) => {
    const next = selected.filter(s => s.id !== id);
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display selecionado */}
      <div
        className="flex items-center min-h-[40px] p-2 border rounded-md cursor-pointer flex-wrap gap-2 bg-card hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map(op => (
            <span
              key={op.id}
              className="px-2 py-1 rounded text-xs flex items-center gap-1 bg-primary/10 text-primary border border-primary/20"
            >
              {op.nome}
              {op.codigo && (
                <span className="opacity-70 text-xs">({op.codigo})</span>
              )}
              <button
                className="opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSelected(op.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border rounded-md shadow-lg p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, código ou CNPJ..."
                className="pl-7"
              />
            </div>
            {selected.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelected([]);
                  onChange?.([]);
                }}
              >
                Limpar
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {filteredOperadoras.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">
                Nenhuma operadora encontrada
              </div>
            ) : (
              filteredOperadoras.map(op => {
                const isSel = selected.some(s => s.id === op.id);
                return (
                  <div
                    key={op.id}
                    className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                    onClick={() => toggleSelect(op)}
                  >
                    {multiple && (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSel ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}
                      >
                        {isSel && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{op.nome}</div>
                      {(op.codigo || op.cnpj) && (
                        <div className="text-xs text-muted-foreground flex gap-2">
                          {op.codigo && <span>Código: {op.codigo}</span>}
                          {op.cnpj && <span>CNPJ: {op.cnpj}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {filteredOperadoras.length < operadoras.length && (
            <div className="text-xs text-muted-foreground p-2 text-center">
              Mostrando {filteredOperadoras.length} de {operadoras.length} operadoras
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperadoraSelection;

