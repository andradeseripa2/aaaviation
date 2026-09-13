// ---------------------------------------------------------------------------
// CANAL ÚNICO DE FALHAS DE GRAVAÇÃO
//
// Até aqui, quase toda gravação no Firestore terminava em
// `catch (e) { console.warn(...) }` e seguia como se tivesse dado certo. Foi
// assim que leads, comentários e inscrições na newsletter se perderam por meses
// sem ninguém perceber: a interface dizia "sucesso" e o erro ficava num console
// que nenhum usuário abre.
//
// Qualquer gravação iniciada por uma pessoa (clicar em salvar, publicar,
// curtir, apagar) deve reportar a falha aqui. O WriteErrorToast escuta este
// canal e mostra o aviso na tela.
//
// NÃO use para:
//  - leituras (listeners): um visitante sem permissão para ler `leads` é o
//    comportamento correto, não um erro;
//  - gravações automáticas em segundo plano (contador de visualizações,
//    publicação agendada, sincronização de perfil): elas rodam no navegador de
//    qualquer visitante, e um aviso ali apareceria para leitores que não
//    fizeram nada. Nesses casos, use console.error.
//
// É um módulo simples, fora dos contextos React, porque AuthContext e
// BlogContext são provedores separados e ambos precisam reportar.
// ---------------------------------------------------------------------------

export interface WriteErrorEvent {
  id: number;
  // O que a pessoa estava tentando fazer, em linguagem de usuário.
  area: string;
  // Causa provável, também em linguagem de usuário.
  reason: string;
}

type Listener = (event: WriteErrorEvent) => void;

const listeners = new Set<Listener>();
let sequence = 0;

function describe(err: unknown): string {
  const code = (err as { code?: string } | null)?.code;
  switch (code) {
    case 'permission-denied':
      return 'Sem permissão para esta ação.';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Sem conexão com o servidor.';
    case 'invalid-argument':
      return 'Os dados enviados foram recusados pelo banco.';
    case 'unauthenticated':
      return 'Sua sessão expirou. Entre novamente.';
    default:
      return 'Erro ao gravar no banco de dados.';
  }
}

export function reportWriteError(area: string, err: unknown): void {
  console.error(`[gravação falhou] ${area}:`, err);
  const event: WriteErrorEvent = { id: ++sequence, area, reason: describe(err) };
  listeners.forEach(listener => listener(event));
}

export function onWriteError(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
