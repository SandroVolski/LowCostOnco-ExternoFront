import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CatalogService, type CatalogCidItem } from '@/services/api';
import { X, Search, Check } from 'lucide-react';

// Cache keys e TTL
const CID_CACHE_KEY = 'cid_catalog_cache_items';
const CID_CACHE_TOTAL = 'cid_catalog_cache_total';
const CID_CACHE_AT = 'cid_catalog_cache_at';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30min

export interface CIDSelectionValue extends CatalogCidItem {
  isFromPatient?: boolean;
}

interface CIDSelectionProps {
  value?: string | CIDSelectionValue | Array<string | CIDSelectionValue> | null;
  onChange?: (selected: CIDSelectionValue[]) => void;
  patientCID?: string | CIDSelectionValue | null;
  placeholder?: string;
  multiple?: boolean;
  pageSize?: number;
}

const CIDSelection: React.FC<CIDSelectionProps> = ({
  value,
  onChange,
  patientCID,
  placeholder = 'Selecione o CID...',
  multiple = false,
  pageSize = 100,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<CIDSelectionValue[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CIDSelectionValue[]>([]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Normalizar patientCID
  const patientCIDCode = useMemo(() => {
    if (!patientCID) return null;
    if (typeof patientCID === 'string') return patientCID;
    return patientCID.codigo;
  }, [patientCID]);

  // Inicializar selected a partir de value
  useEffect(() => {
    const toObj = (v: string | CIDSelectionValue): CIDSelectionValue =>
      typeof v === 'string' ? { codigo: v, descricao: '', isFromPatient: v === patientCIDCode } : { ...v, isFromPatient: v.codigo === patientCIDCode };

    if (!value) {
      setSelected([]);
      return;
    }
    if (Array.isArray(value)) {
      const arr = value.map(toObj);
      setSelected(arr);
    } else {
      setSelected([toObj(value)]);
    }
  }, [value, patientCIDCode]);

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

  // Cache helpers
  const loadFromCache = (q: string) => {
    try {
      const at = localStorage.getItem(CID_CACHE_AT);
      const cached = localStorage.getItem(CID_CACHE_KEY);
      const cachedTotal = localStorage.getItem(CID_CACHE_TOTAL);
      if (!at || !cached || !cachedTotal) return null;
      if (Date.now() - parseInt(at) > CACHE_TTL_MS) return null;
      const all: CatalogCidItem[] = JSON.parse(cached);
      const t = parseInt(cachedTotal);
      if (!q) return { items: all, total: t };
      const normalized = q.toLowerCase();
      const filtered = all.filter(c => c.codigo.toLowerCase().includes(normalized) || (c.descricao || '').toLowerCase().includes(normalized));
      return { items: filtered, total: filtered.length };
    } catch {
      return null;
    }
  };

  const saveCache = (data: CatalogCidItem[], totalNum: number) => {
    try {
      localStorage.setItem(CID_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CID_CACHE_TOTAL, String(totalNum));
      localStorage.setItem(CID_CACHE_AT, String(Date.now()));
    } catch {}
  };

  // Carregar página (reset quando search muda)
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      // tentar cache somente quando sem busca
      if (!search) {
        const cached = loadFromCache('');
        if (cached && active) {
          setItems(cached.items.map(i => ({ ...i, isFromPatient: i.codigo === patientCIDCode })));
          setTotal(cached.total);
          setOffset(cached.items.length);
          setLoading(false);
          return;
        }
      }
      const { items: page, total: tot } = await CatalogService.searchCid10Paged({ search, limit: pageSize, offset: 0 });
      if (!active) return;
      setItems(page.map(i => ({ ...i, isFromPatient: i.codigo === patientCIDCode })));
      setTotal(tot);
      setOffset(page.length);
      setLoading(false);
      if (!search) saveCache(page, tot);
    })();
    return () => { active = false; };
  }, [search, pageSize, patientCIDCode]);

  const loadMore = async () => {
    if (loading) return;
    if (items.length >= total) return;
    setLoading(true);
    const { items: page } = await CatalogService.searchCid10Paged({ search, limit: pageSize, offset });
    setItems(prev => [...prev, ...page.map(i => ({ ...i, isFromPatient: i.codigo === patientCIDCode }))]);
    setOffset(prev => prev + page.length);
    setLoading(false);
  };

  // Seleção
  const toggleSelect = (cid: CIDSelectionValue) => {
    if (multiple) {
      const exists = selected.some(s => s.codigo === cid.codigo);
      const next = exists ? selected.filter(s => s.codigo !== cid.codigo) : [...selected, cid];
      setSelected(next);
      onChange?.(next);
    } else {
      setSelected([cid]);
      onChange?.([cid]);
      setOpen(false);
    }
  };

  const removeSelected = (codigo: string) => {
    const next = selected.filter(s => s.codigo !== codigo);
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Display selecionado */}
      <div className="flex items-center min-h-[40px] p-2 border rounded-md cursor-pointer flex-wrap gap-2" onClick={() => setOpen(v => !v)}>
        {selected.length === 0 ? (
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        ) : (
          selected.map(cid => (
            <span key={cid.codigo} className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${cid.isFromPatient ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {cid.codigo}
              <button className="opacity-70 hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeSelected(cid.codigo); }}>
                <X className="h-3 w-3" />
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
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar CID por código ou descrição..." className="pl-7" />
            </div>
            {selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { setSelected([]); onChange?.([]); }}>
                Limpar
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y">
            {loading && items.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">Carregando...</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3">Nenhum CID encontrado</div>
            ) : (
              items.map(cid => {
                const isSel = selected.some(s => s.codigo === cid.codigo);
                return (
                  <div key={cid.codigo} className={`flex items-center justify-between p-2 cursor-pointer hover:bg-muted/40 ${isSel ? (cid.isFromPatient ? 'bg-red-50' : 'bg-green-50') : ''}`} onClick={() => toggleSelect(cid)}>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${cid.isFromPatient ? 'text-red-700' : (isSel ? 'text-green-700' : 'text-foreground')}`}>{cid.codigo}</div>
                      {cid.descricao && <div className={`text-xs truncate ${cid.isFromPatient ? 'text-red-600' : (isSel ? 'text-green-600' : 'text-muted-foreground')}`}>{cid.descricao}</div>}
                    </div>
                    {isSel && <Check className={`h-4 w-4 ${cid.isFromPatient ? 'text-red-600' : 'text-green-600'}`} />}
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

export default CIDSelection; 