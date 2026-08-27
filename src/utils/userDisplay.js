/**
 * Helpers de apresentação de utilizadores.
 *
 * O backend devolve os utilizadores com `firstName` e `lastName`
 * (camelCase) e os DTOs de viagem usam o prefixo `userFirstName` /
 * `userLastName`. Esta função aceita QUALQUER forma e devolve o
 * nome de apresentação canónico: firstName + lastName, ou username,
 * ou um fallback.
 *
 * Aceita:
 *   - um objeto User com { firstName, lastName, username }
 *   - um objeto com { userFirstName, userLastName, userUsername }
 *   - um objeto com { first_name, last_name }  (snake case, raro)
 *   - um objeto "trip author" com { user: { firstName, lastName, username } }
 *
 * Nunca devolve string vazia. Se não houver nada, devolve o fallback.
 */
export function getDisplayName(source, fallback = '') {
  if (!source) return fallback;

  // Objeto aninhado { user: {...} } — usar o user
  const u = source.user && typeof source.user === 'object' ? source.user : source;

  const first = (u.firstName ?? u.userFirstName ?? u.first_name ?? '').toString().trim();
  const last = (u.lastName ?? u.userLastName ?? u.last_name ?? '').toString().trim();
  const username = (u.username ?? u.userUsername ?? u.name ?? '').toString().trim();

  const full = [first, last].filter(Boolean).join(' ').trim();
  if (full) return full;
  if (username) return username;
  return fallback;
}

/**
 * Iniciais para avatares: pega nas primeiras letras do display
 * name. Se não houver nada, devolve "?".
 */
export function getDisplayInitials(source, fallback = '?') {
  const name = getDisplayName(source, '');
  if (!name) return fallback;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Dispara o evento global `gm:profile-updated`. Usar DEPOIS de
 * atualizar o perfil no backend, para que todos os componentes
 * abertos refaçam fetch e mostrem o novo nome.
 */
export function dispatchProfileUpdated(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('gm:profile-updated', { detail }));
  } catch (_) { /* no-op */ }
}

/**
 * Dispara o evento global `gm:trips-changed`. Usar DEPOIS de criar,
 * editar ou remover uma viagem (ou mudar a sua privacidade), para
 * que todos os contadores / listas abertos em outras páginas
 * (ex: o contador "Viagens" no /profile/:username) refaçam fetch
 * imediatamente — sem reload.
 *
 * O `detail` aceita:
 *   - `ownerUsername` (string) — username do dono da viagem
 *     afectada. Componentes que filtrarem por este username podem
 *     reagir selectivamente; quem não filtrar reage a qualquer
 *     mudança.
 *   - `tripId` (number) — id da viagem, se aplicável
 *   - `reason` (string) — 'created' | 'updated' | 'deleted' |
 *     'privacy' para debugging/telemetria
 */
export function dispatchTripsChanged(detail = {}) {
  try {
    window.dispatchEvent(new CustomEvent('gm:trips-changed', { detail }));
  } catch (_) { /* no-op */ }
}
