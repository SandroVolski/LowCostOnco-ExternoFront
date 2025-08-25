import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CatalogService, type CatalogPrincipioAtivoItem } from '@/services/api';
import { X, Search, Check } from 'lucide-react';

interface ActivePrincipleSelectionProps {
  value?: string | string[];
  onChange?: (selected: string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  pageSize?: number;
}

const ActivePrincipleSelection: React.FC<ActivePrincipleSelectionProps> = ({
  value,
  onChange,
  placeholder = 'Selecione o(s) princípio(s) ativo(s)...',
  multiple = true,
  pageSize = 100,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CatalogPrincipioAtivoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value) {
      setSelected([]);
    } else if (Array.isArray(value)) {
      setSelected(value);
    } else {
      setSelected([value]);
    }
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { items: page, total: tot } = await CatalogService.searchPrincipiosAtivosPaged({ search, limit: pageSize, offset: 0 });
      if (!active) return;
      setItems(page);
      setTotal(tot);
      setOffset(page.length);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [search, pageSize]);

  const loadMore = async () => {
    if (loading || items.length >= total) return;
    setLoading(true);
    const { items: page } = await CatalogService.searchPrincipiosAtivosPaged({ search, limit: pageSize, offset });
    setItems(prev => [...prev, ...page]);
    setOffset(prev => prev + page.length);
    setLoading(false);
  };

  const toggleSelect = (name: string) => {
    if (multiple) {
      const exists = selected.includes(name);
      const next = exists ? selected.filter(s => s !== name) : [...selected, name];
      setSelected(next);
      onChange?.(next);
    } else {
      setSelected([name]);
      onChange?.([name]);
      setOpen(false);
    }
  };

  const removeSelected = (name: string) => {
    const next = selected.filter(s => s !== name);
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-start min-h-[40px] max-h-[120px] p-2 border rounded-md cursor-pointer flex-wrap gap-2 overflow-y-auto" onClick={() => setOpen(v => !v)}>
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map(name => (
            <span key={name} className="px-2 py-1 rounded text-xs flex items-start gap-1 bg-primary/10 text-primary max-w-full min-w-0">
              <span className="break-all text-left leading-relaxed whitespace-normal flex-1">{name}</span>
              <button className="opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSelected(name); }}>
                <X className="h-3 w-3 flex-shrink-0" />
              </button>
            </span>
          ))
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border rounded-md shadow-md p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar princípio ativo..." className="pl-7" />
            </div>
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setSelected([]); onChange?.([]); }}>
                Limpar
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {loading && items.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">Nenhum resultado</div>
            ) : (
              items.map(it => {
                const isSel = selected.includes(it.nome);
                return (
                  <div key={it.nome} className={`flex items-start justify-between p-3 cursor-pointer hover:bg-muted/40 ${isSel ? 'bg-primary/10' : ''}`} onClick={() => toggleSelect(it.nome)}>
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-sm font-medium text-foreground break-all leading-relaxed">{it.nome}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {isSel && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">{items.length}/{total}</div>
            <Button variant="outline" size="sm" onClick={loadMore} disabled={loading || items.length >= total}>
              {loading ? 'Carregando...' : items.length >= total ? 'Tudo carregado' : 'Carregar mais'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivePrincipleSelection; 