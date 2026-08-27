import React from "react";
import { UserPlus, UserCheck, Clock, Lock } from "lucide-react";
import { useToast } from "./Toast";
import useFollowRelationship, { FOLLOW_STATES } from "../../hooks/useFollowRelationship";
import "./FollowButton.css";

/* ─────────────────────────────────────────────────────────────
   FollowButton — the single Instagram-style follow control used
   anywhere in the app (UserProfile hero, TravellerCard, future
   home feed inline buttons, etc.).

   The button's label and behaviour depend on the *target's*
   privacy at the moment the user clicks:

   ┌─────────────────────┬──────────────────────────────────────┐
   │ Target is public    │ "Seguir"      → "A seguir"           │
   │ Target is private   │ "Pedir para seguir" → "Pendente"    │
   │ Already following   │ "A seguir"    (click to unfollow)    │
   │ Pending request     │ "Pendente"    (click to cancel)      │
   └─────────────────────┴──────────────────────────────────────┘

   We pass `privateProfile` in via props when we already know it
   (e.g. the user profile page that loaded `/users/{id}/detailed`)
   so the label is correct on the very first render. If the prop
   is missing, the button falls back to "Seguir" until the
   relationship fetch comes back and the user clicks — at which
   point the hook + endpoint take over.
   ───────────────────────────────────────────────────────────── */

const FollowButton = ({
  userId,
  username,
  privateProfile = false,
  initialIsFollowing = false,
  initialIsPending = false,
  size = "md", // 'sm' | 'md' | 'lg'
  variant = "auto", // 'auto' | 'primary' | 'compact'
  onChange,
  className = "",
  labelOnly = false, // quando true, sem ícone
  // Permite ao consumidor saber o estado sem olhar o hook
  onStateReady,
}) => {
  const toast = useToast();
  const rel = useFollowRelationship({
    userId,
    username,
    privateProfile,
    initialIsFollowing,
    initialIsPending,
    onChange,
  });

  // Notifica o pai do state inicial resolvido (sem causar re-render loop).
  React.useEffect(() => {
    if (onStateReady) onStateReady(rel.state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rel.state]);

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (rel.busy) return;
    // Nome para mostrar no toast (com @ à la Instagram). Se não
    // houver username (avatar click rápida), cai para "este
    // viajante" para a frase continuar a fazer sentido.
    const handle = rel.username ? `@${rel.username}` : "este viajante";
    // Optimistic parent notification: avisamos o pai do state
    // esperado **antes** de chamar o hook. O hook vai
    // eventualmente chamar `onChange` quando o `setState`
    // otimista + useEffect reagir, mas para o pai que precisa
    // de actualizar contadores em tempo real (ex: UserProfile
    // ListModal "A seguir" / "Seguidores") a propagação via
    // useEffect tem 1 render de atraso suficiente para parecer
    // "delay". Disparar `onChange` síncronamente antes da
    // chamada de rede garante que o contador actualiza no
    // mesmo frame do click. O `useEffect` que o hook dispara
    // depois é idempotente (o pai recebe o mesmo state duas
    // vezes, mas as duas produzem o mesmo +/-1).
    const notifyOptimistic = (next) => {
      if (typeof onChange === 'function') onChange(next);
    };
    try {
      if (rel.state === FOLLOW_STATES.NOT_FOLLOWING) {
        // FIX (Round 32): quando JÁ SABEMOS que o target é
        // privado (`rel.privateProfile` é `true` no momento do
        // click), abrimos o optimistic como `PENDING` em vez de
        // `FOLLOWING`. Sem isto, o `notifyOptimistic(FOLLOWING)`
        // faz o pai (UserProfile) incrementar `numberOfFollowers`
        // E o botão mostra "A seguir" durante a janela até o
        // reconcile descobrir que é FollowRequest. O user via
        // "por breves segundos mostra uma badge a dizer 'A
        // seguir' e o contador de seguidores aumenta" mesmo
        // antes de o owner aceitar. Agora a janela de erro
        // visual desaparece — quem é alvo privado, vê "Pedir
        // para seguir" → "Pendente" sem piscar "A seguir".
        if (rel.privateProfile) {
          notifyOptimistic(FOLLOW_STATES.PENDING);
        } else {
          notifyOptimistic(FOLLOW_STATES.FOLLOWING);
        }
        await rel.follow();
        // Distingue entre "Seguir" (público → fica a seguir) e
        // "Pedir para seguir" (privado → fica pendente). Igual
        // ao Instagram: dois fluxos com mensagens diferentes.
        if (rel.privateProfile) {
          toast?.info?.(`Pedido de seguimento enviado a ${handle}.`);
        } else {
          toast?.success?.(`Agora segues ${handle}.`);
        }
      } else if (rel.state === FOLLOW_STATES.FOLLOWING) {
        notifyOptimistic(FOLLOW_STATES.NOT_FOLLOWING);
        await rel.unfollow();
        toast?.info?.(`Deixaste de seguir ${handle}.`);
      } else if (rel.state === FOLLOW_STATES.PENDING) {
        notifyOptimistic(FOLLOW_STATES.NOT_FOLLOWING);
        await rel.cancelRequest();
        toast?.info?.(`Pedido a ${handle} cancelado.`);
      }
    } catch (err) {
      const raw = err?.response?.data?.message || "Não foi possível atualizar a relação.";
      // O backend devolve "You are not following this user" em
      // alguns fluxos edge. Não é útil para o user final.
      const msg = /not following/i.test(raw)
        ? "Não foi possível atualizar a relação. Tenta novamente."
        : raw;
      toast?.danger?.(msg);
      // Em caso de erro o hook reverte o state, mas precisamos
      // também notificar o pai para reverter o contador
      // optimista que disparámos em cima.
      if (rel.state === FOLLOW_STATES.NOT_FOLLOWING) {
        notifyOptimistic(FOLLOW_STATES.FOLLOWING);
      } else if (rel.state === FOLLOW_STATES.FOLLOWING) {
        notifyOptimistic(FOLLOW_STATES.NOT_FOLLOWING);
      }
    }
  };

  // Não mostrar nada para o próprio user ou anónimos.
  if (rel.state === FOLLOW_STATES.SELF) return null;
  if (rel.state === FOLLOW_STATES.NOT_AUTH) return null;
  // Estado de deteção inicial — esconde até sabermos a verdade.
  if (rel.state === FOLLOW_STATES.LOADING) {
    return (
      <button
        type="button"
        className={`gm-follow-btn gm-follow-btn--${size} gm-follow-btn--skeleton ${className}`}
        disabled
        aria-busy="true"
      >
        <span className="gm-follow-btn__skeleton" />
      </button>
    );
  }

  // Determinar label/ícone/variant
  const isPrivate = Boolean(rel.privateProfile);
  let label;
  let Icon;
  let buttonVariant;

  if (rel.state === FOLLOW_STATES.FOLLOWING) {
    label = "A seguir";
    Icon = UserCheck;
    buttonVariant = "ghost";
  } else if (rel.state === FOLLOW_STATES.PENDING) {
    label = "Pendente";
    Icon = Clock;
    buttonVariant = "ghost";
  } else if (isPrivate) {
    label = "Pedir para seguir";
    Icon = Lock;
    buttonVariant = variant === "compact" ? "ghost" : "primary";
  } else {
    label = "Seguir";
    Icon = UserPlus;
    buttonVariant = variant === "compact" ? "ghost" : "primary";
  }

  if (variant !== "auto") buttonVariant = variant;

  const cls = [
    "gm-follow-btn",
    `gm-follow-btn--${size}`,
    `gm-follow-btn--${buttonVariant}`,
    rel.busy && "gm-follow-btn--busy",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      onClick={handleClick}
      disabled={rel.busy}
      aria-label={label}
      title={label}
    >
      {!labelOnly && <Icon size={size === "sm" ? 13 : 15} strokeWidth={1.75} />}
      <span>{rel.busy ? "A processar…" : label}</span>
    </button>
  );
};

export default FollowButton;
