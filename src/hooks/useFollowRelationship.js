import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "../axios_helper";
import { useAuth } from "../context/AuthContext";

/* ─────────────────────────────────────────────────────────────
   useFollowRelationship(targetUser)

   Single source of truth for the "Seguir / Pedir para seguir /
   Pendente / A seguir" lifecycle anywhere in the app — the same
   Instagram-style states the user asked for.

   The hook owns:
   - the current relationship state (NOT_AUTH, SELF, NOT_FOLLOWING,
     PENDING, FOLLOWING)
   - the in-flight flag for the button
   - an "optimistic + reconcile" transition pipeline that calls
     the existing backend endpoints
     • POST   /users/{id}/follow               (creates Follow or
                                                FollowRequest + creates
                                                a notification)
     • POST   /users/{id}/unfollow             (removes Follow)
     • GET    /users/is-following?followerId=A&followedId=B
     • GET    /users/follow-request-status?requesterId=A&targetId=B

   Any consumer (FollowButton, the hero on UserProfile, the
   traveller cards in /travels, future inline follow buttons in
   the home feed) just renders `state` and calls the action
   functions. The visual rules (private vs public) live in the
   FollowButton component so the wording stays consistent across
   the app.
   ───────────────────────────────────────────────────────────── */

export const FOLLOW_STATES = Object.freeze({
  NOT_AUTH: "not_authenticated",
  SELF: "self",
  NOT_FOLLOWING: "not_following", // mostra "Seguir" (público) ou "Pedir para seguir" (privado)
  PENDING: "pending",             // pedido enviado, ainda não aceite
  FOLLOWING: "following",         // já é seguido
  LOADING: "loading",             // primeira deteção do estado (não mostrar ações)
  ERROR: "error",
});

/**
 * @param {object}   opts
 * @param {number|string} opts.userId      id do user alvo
 * @param {string}   [opts.username]       username do alvo (para deteção SELF)
 * @param {boolean}  [opts.privateProfile] se já sabemos (ex: do profile page)
 *                                        que o alvo é privado, evita o 1º render
 *                                        a mostrar "Seguir" antes de saber.
 * @param {boolean}  [opts.initialIsFollowing] hint inicial (ex: lista de users
 *                                              que a API já devolve como seguidos)
 * @param {boolean}  [opts.initialIsPending]   hint inicial
 * @param {function} [opts.onChange]       callback(state) quando o state muda
 *                                        (útil para refresh de listas)
 */
export default function useFollowRelationship({
  userId,
  username,
  privateProfile = false,
  initialIsFollowing = false,
  initialIsPending = false,
  onChange,
} = {}) {
  const { user } = useAuth();
  const myUserId = user?.id ? Number(user.id) : null;
  const isSelf = myUserId && userId ? Number(myUserId) === Number(userId) : false;

  // Estado base. Começamos em LOADING para evitar piscar o botão
  // errado; o efeito abaixo deteta o estado real em paralelo.
  const [state, setState] = useState(FOLLOW_STATES.LOADING);
  const [busy, setBusy] = useState(false);

  // Permite ao consumidor passar hints iniciais (ex: traveller
  // cards que já sabem o estado de `is-following` para a página).
  const hasInitialHint = initialIsFollowing || initialIsPending;

  const computeBaseState = useCallback(
    (isFollowing, isPending) => {
      if (!myUserId) return FOLLOW_STATES.NOT_AUTH;
      if (isSelf) return FOLLOW_STATES.SELF;
      if (isFollowing) return FOLLOW_STATES.FOLLOWING;
      if (isPending) return FOLLOW_STATES.PENDING;
      return FOLLOW_STATES.NOT_FOLLOWING;
    },
    [myUserId, isSelf]
  );

  // `onChange` precisa de ser estável em referências, caso contrário
  // o useEffect que o escuta no final deste hook re-dispara a cada
  // render do consumidor (que normalmente passa uma arrow function
  // inline) e o consumidor pode acabar em loop de re-renders
  // (TravellerCard → onTravellerRelationshipChange → onChange → hook).
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // Estratégia de propagação para o pai:
  //   1. O `FollowButton` chama `onChange` síncronamente no click
  //      (optimistic, ANTES da chamada de rede). Garante que o
  //      contador / UI actualiza no mesmo frame do click.
  //   2. O `useEffect` abaixo (state watcher) chama `onChange`
  //      em cada mudança. Para evitar duplicar com (1), o pai
  //      deduplica pelo state recebido.
  //   3. A PRIMEIRA mudança para um state NÃO-LOADING (a deteção
  //      inicial, ex: LOADING → FOLLOWING) é silenciada — é
  //      apenas a leitura inicial do estado real, não uma
  //      acção do user. Caso contrário, ao abrir o modal
  //      "Seguidores" cada item dispararia `onChange(FOLLOWING)`
  //      ou `onChange(NOT_FOLLOWING)` consoante o seu state
  //      real, e o pai incrementaria `numberOfFollowing`
  //      indevidamente. O pai só precisa de saber de
  //      **mudanças causadas por acções do user**.
  const skipNextNonLoadingOnChangeRef = useRef(true);
  const stableOnChange = useCallback((s) => {
    if (s === 'loading') return; // estado de deteção, nunca propaga
    if (skipNextNonLoadingOnChangeRef.current) {
      skipNextNonLoadingOnChangeRef.current = false;
      return;
    }
    if (onChangeRef.current) onChangeRef.current(s);
  }, []);

  /* ── Deteção inicial do estado real ─────────────────── */
  useEffect(() => {
    let cancelled = false;
    async function detect() {
      if (!userId || isSelf || !myUserId) {
        if (!cancelled) {
          if (!userId) setState(FOLLOW_STATES.NOT_FOLLOWING);
          else if (isSelf) setState(FOLLOW_STATES.SELF);
          else setState(FOLLOW_STATES.NOT_AUTH);
        }
        return;
      }
      // Se já temos hints iniciais, saltamos a deteção.
      if (hasInitialHint) {
        const next = computeBaseState(initialIsFollowing, initialIsPending);
        if (!cancelled) setState(next);
        return;
      }
      try {
        const [followingRes, pendingRes] = await Promise.allSettled([
          api.get("/users/is-following", {
            params: { followerId: myUserId, followedId: userId },
          }),
          api.get("/users/follow-request-status", {
            params: { requesterId: myUserId, targetId: userId },
          }),
        ]);
        if (cancelled) return;
        const isFollowing =
          followingRes.status === "fulfilled" ? Boolean(followingRes.value?.data) : false;
        const isPending =
          pendingRes.status === "fulfilled" ? Boolean(pendingRes.value?.data) : false;
        setState(computeBaseState(isFollowing, isPending));
      } catch (err) {
        if (cancelled) return;
        setState(FOLLOW_STATES.NOT_FOLLOWING);
      }
    }
    detect();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isSelf, myUserId, hasInitialHint]);

  // Notifica o pai quando o state muda. Usamos `stableOnChange`
  // (estável em referência) em vez do `onChange` original para
  // evitar loops de re-render quando o consumidor passa uma arrow
  // function inline. O pai recebe o state *atual* — as transições
  // NOT_FOLLOWING → FOLLOWING, FOLLOWING → NOT_FOLLOWING, PENDING →
  // NOT_FOLLOWING são todas refletidas em tempo real, igual ao
  // Instagram.
  useEffect(() => {
    stableOnChange(state);
  }, [state, stableOnChange]);

  /* ── follow (optimistic + reconcile) ───────────────── */
  const follow = useCallback(async () => {
    if (!userId || !myUserId || busy) return;
    setBusy(true);
    const previous = state;
    // Optimistic: o backend decide se é Follow ou FollowRequest.
    // Em alvos públicos fica FOLLOWING, em privados PENDING. Como
    // não sabemos à partida, abrimos com FOLLOWING e o reconcile
    // ajusta se o target for privado.
    setState(FOLLOW_STATES.FOLLOWING);
    try {
      await api.post(`/users/${userId}/follow`);
      // Re-fetch do estado real para refletir FOLLOWING vs PENDING.
      const [followingRes, pendingRes] = await Promise.allSettled([
        api.get("/users/is-following", {
          params: { followerId: myUserId, followedId: userId },
        }),
        api.get("/users/follow-request-status", {
          params: { requesterId: myUserId, targetId: userId },
        }),
      ]);
      const isFollowing =
        followingRes.status === "fulfilled" ? Boolean(followingRes.value?.data) : false;
      const isPending =
        pendingRes.status === "fulfilled" ? Boolean(pendingRes.value?.data) : false;
      setState(computeBaseState(isFollowing, isPending));
    } catch (err) {
      setState(previous);
      throw err;
    } finally {
      setBusy(false);
    }
  }, [userId, myUserId, busy, state, computeBaseState]);

  /* ── unfollow (optimistic + reconcile) ─────────────── */
  // O backend devolve 400 BAD_REQUEST "You are not following this
  // user" se o `Follow` já não existir (caso comum quando o user
  // clica unfollow duas vezes seguidas, ou quando o backend e o
  // client ficaram dessincronizados por um erro anterior). Isso
  // NÃO é um erro do ponto de vista do user final — o resultado
  // é exatamente o estado que ele queria (NOT_FOLLOWING). Por
  // isso toleramos esse 400 e revalidamos sempre no fim.
  const unfollow = useCallback(async () => {
    if (!userId || !myUserId || busy) return;
    setBusy(true);
    const previous = state;
    setState(FOLLOW_STATES.NOT_FOLLOWING);
    try {
      try {
        await api.post(`/users/${userId}/unfollow`);
      } catch (err) {
        const msg = err?.response?.data?.message || "";
        // "You are not following this user" é o caso benigno:
        // o user já não seguia, portanto o objetivo já está
        // cumprido. Qualquer outro erro é genuíno e propaga-se.
        if (msg && !/not following/i.test(msg)) throw err;
      }
      // Revalidação: garante que o estado local bate com o backend
      // (especialmente importante se o user clicou duas vezes
      // seguidas e o segundo unfollow foi um 400).
      try {
        const { data: isFollowingNow } = await api.get("/users/is-following", {
          params: { followerId: myUserId, followedId: userId },
        });
        if (!isFollowingNow) {
          // Confirmado: já não é seguido. Mantém o state
          // otimista em NOT_FOLLOWING sem reverter.
          setState(FOLLOW_STATES.NOT_FOLLOWING);
        } else {
          setState(FOLLOW_STATES.FOLLOWING);
        }
      } catch (_) {
        // best-effort
      }
    } catch (err) {
      setState(previous);
      throw err;
    } finally {
      setBusy(false);
    }
  }, [userId, myUserId, busy, state]);

  /* ── cancel pending request ─────────────────────────── */
  // O backend expõe `POST /users/{id}/follow-requests/cancel` (idempotente:
  // apaga o `FollowRequest` se existir, 200 OK se não existir) e
  // `POST /users/{id}/unfollow` (apaga o `Follow` se existir, 400
  // BAD_REQUEST "You are not following this user" se não existir).
  // Para cobrir os dois cenários (target público já seguido OU
  // target privado com pedido pendente) chamamos os dois. O
  // 400 do unfollow é esperado quando só há FollowRequest.
  const cancelRequest = useCallback(async () => {
    if (!userId || busy) return;
    setBusy(true);
    const previous = state;
    // Optimistic: o estado passa a NOT_FOLLOWING; a reconcile
    // confirma revalidando os endpoints.
    setState(FOLLOW_STATES.NOT_FOLLOWING);
    try {
      // Apaga o FollowRequest (se existir) — idempotente.
      try {
        await api.post(`/users/${userId}/follow-requests/cancel`);
      } catch (_) { /* silencioso: idempotente, mas toleramos 4xx */ }
      // Apaga o Follow (se existir). Pode dar 400 BAD_REQUEST
      // "You are not following this user" — isso é o caso comum
      // quando o user só tem FollowRequest, e não é um erro.
      try {
        await api.post(`/users/${userId}/unfollow`);
      } catch (err) {
        const msg = err?.response?.data?.message || "";
        if (msg && !/not following/i.test(msg)) throw err;
      }
      // Revalidar para garantir que o estado final está sincronizado.
      const [followingRes, pendingRes] = await Promise.allSettled([
        api.get("/users/is-following", {
          params: { followerId: myUserId, followedId: userId },
        }),
        api.get("/users/follow-request-status", {
          params: { requesterId: myUserId, targetId: userId },
        }),
      ]);
      const isFollowing =
        followingRes.status === "fulfilled" ? Boolean(followingRes.value?.data) : false;
      const isPending =
        pendingRes.status === "fulfilled" ? Boolean(pendingRes.value?.data) : false;
      setState(computeBaseState(isFollowing, isPending));
    } catch (err) {
      setState(previous);
      throw err;
    } finally {
      setBusy(false);
    }
  }, [userId, myUserId, busy, state, computeBaseState]);

  /* ── refresh() — usado quando o pai quer revalidar ─── */
  const refresh = useCallback(async () => {
    if (!userId || !myUserId) return;
    try {
      const [followingRes, pendingRes] = await Promise.allSettled([
        api.get("/users/is-following", {
          params: { followerId: myUserId, followedId: userId },
        }),
        api.get("/users/follow-request-status", {
          params: { requesterId: myUserId, targetId: userId },
        }),
      ]);
      const isFollowing =
        followingRes.status === "fulfilled" ? Boolean(followingRes.value?.data) : false;
      const isPending =
        pendingRes.status === "fulfilled" ? Boolean(pendingRes.value?.data) : false;
      setState(computeBaseState(isFollowing, isPending));
    } catch (_) {
      /* silent */
    }
  }, [userId, myUserId, computeBaseState]);

  return useMemo(
    () => ({
      state,
      busy,
      isSelf,
      isAuthenticated: Boolean(myUserId),
      follow,
      unfollow,
      cancelRequest,
      refresh,
      privateProfile, // exposto para o FollowButton
      myUserId,
      username, // username do target
    }),
    [state, busy, isSelf, myUserId, follow, unfollow, cancelRequest, refresh, privateProfile, username]
  );
}
