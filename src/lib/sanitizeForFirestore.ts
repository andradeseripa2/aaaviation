/**
 * Remove recursivamente todo valor `undefined` antes de gravar no Firestore.
 *
 * O SDK recusa qualquer campo undefined e lança antes mesmo de enviar
 * ("Unsupported field value: undefined"). Neste projeto isso derrubou em
 * silêncio comentários, inscrições na newsletter e atualizações de perfil:
 * bastava um campo opcional vazio (categoria, título do usuário, bio).
 *
 * Fica em src/lib, e não no BlogContext, porque o AuthContext também precisa
 * dela — e o BlogContext já importa o AuthContext.
 */
export function sanitizeForFirestore<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  if (obj === null) return null as any;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => (typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item)) as any;
  }
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        clean[key] = typeof value === 'object' && value !== null ? sanitizeForFirestore(value) : value;
      }
    }
    return clean as T;
  }
  return obj;
}
