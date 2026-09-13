import React, { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { onWriteError, WriteErrorEvent } from '../../lib/writeErrors';

// Aviso fixo na tela sempre que uma gravação falha. Ver src/lib/writeErrors.ts.
//
// A interface costuma atualizar a tela antes de o banco confirmar (atualização
// otimista). Quando a gravação falha, o que aparece na tela pode não refletir o
// que está salvo — por isso a mensagem pede para recarregar, em vez de fingir
// que está tudo certo.
//
// Fica no topo da tela: o rodapé já é ocupado pelo banner de cookies e pelo
// botão de voltar ao topo, e um aviso ali escondia os botões do banner.
export const WriteErrorToast: React.FC = () => {
  const [current, setCurrent] = useState<WriteErrorEvent | null>(null);

  useEffect(() => onWriteError(setCurrent), []);

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(() => setCurrent(null), 12000);
    return () => clearTimeout(timer);
  }, [current]);

  if (!current) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 shadow-lg flex items-start gap-3"
    >
      <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-900 dark:text-rose-100">
          Não foi salvo: {current.area}
        </p>
        <p className="text-xs text-rose-800 dark:text-rose-200 mt-0.5">
          {current.reason} Recarregue a página para ver o que realmente está gravado.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setCurrent(null)}
        className="p-1 rounded-lg text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900 shrink-0"
        aria-label="Fechar aviso"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
