import { useEffect } from 'react';

/**
 * Hook partilhado: subscreve o evento `gm:profile-updated` e
 * executa o callback quando outro componente (geralmente
 * EditProfile) atualizou o perfil do utilizador.
 *
 * O payload do evento traz `{ username, firstName, lastName,
 * profilePhoto }` para o caso de o consumidor querer usar
 * imediatamente o novo nome sem refazer fetch (já em memória).
 *
 * @param {object} options
 * @param {() => void} [options.onUpdate]      - chamado sempre que o evento dispara.
 * @param {(username: string) => boolean} [options.match] -
 *   predicado opcional; se retornar false, o callback NÃO é
 *   chamado (evita refetch em cards que não pertencem ao user
 *   que foi atualizado).
 * @param {() => void} [options.onAny]        - chamado SEMPRE (refetch do feed inteiro, por exemplo).
 *
 * Exemplo:
 *   useProfileUpdates({ onUpdate: () => refetch() });
 *   useProfileUpdates({
 *     match: (u) => u === travel?.user?.username,
 *     onUpdate: loadTrip,
 *   });
 */
export default function useProfileUpdates({ onUpdate, match, onAny } = {}) {
  useEffect(() => {
    const handler = (e) => {
      if (onAny) onAny(e?.detail);
      if (!onUpdate) return;
      if (match && !match(e?.detail?.username)) return;
      onUpdate(e?.detail);
    };
    window.addEventListener('gm:profile-updated', handler);
    return () => window.removeEventListener('gm:profile-updated', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, onUpdate, onAny]);
}
