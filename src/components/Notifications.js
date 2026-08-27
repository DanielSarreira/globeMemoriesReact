import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, Heart, MessageCircle, UserPlus, UserCheck,
  AtSign, MessageSquare, MoreHorizontal, Check, CheckCheck, Trash2,
  Inbox, Sparkles, X as IconX, Loader2, AlertCircle, RefreshCw, Compass,
} from "lucide-react";
import api, { toFullMediaUrl } from "../axios_helper";
import { getDisplayName } from "../utils/userDisplay";
import { useAuth } from "../context/AuthContext";
import { useToast, Avatar } from "./ui";
import "./Notifications.css";

/* ── Notification type config ────────────────────────────── */
const TYPE_META = {
  FOLLOW: { label: "Seguir", icon: UserPlus, color: "#007BFF" },
  FOLLOW_REQUEST: { label: "Pedido", icon: UserCheck, color: "#5BA8FF" },
  FOLLOW_ACCEPTED: { label: "Aceitou", icon: UserCheck, color: "#28A745" },
  TRIP_LIKE: { label: "Gosto", icon: Heart, color: "#FF4D6D" },
  TRIP_COMMENT: { label: "Comentário", icon: MessageCircle, color: "#007BFF" },
  TRIP_COMMENT_REPLY: { label: "Resposta", icon: MessageCircle, color: "#007BFF" },
  FORUM_QUESTION_COMMENT: { label: "Resposta", icon: MessageSquare, color: "#FF9900" },
  FORUM_COMMENT_REPLY: { label: "Resposta", icon: AtSign, color: "#FF9900" },
  // Round 77 (Bug 4): like notifications on the forum. Same icon
  // and colour as the trip-like row so the visual hierarchy is
  // consistent — the URL routing (qanda vs travel) is what
  // differentiates them.
  FORUM_QUESTION_LIKE: { label: "Gosto", icon: Heart, color: "#FF4D6D" },
  FORUM_COMMENT_LIKE: { label: "Gosto", icon: Heart, color: "#FF4D6D" },
};

/* ── Date helpers ───────────────────────────────────────── */
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
function daysAgo(d) {
  const now = new Date();
  const diff = startOfDay(now).getTime() - startOfDay(d).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}
function isValidDate(d) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}
function safeParse(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isValidDate(d) ? d : null;
}
function formatRelativeTime(dateString, now = new Date()) {
  const date = safeParse(dateString);
  if (!date) return "";
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 30) return "agora";
  if (diffSec < 60) return `há ${diffSec}s`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  if (sameDay(date, now)) return `hoje, ${date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(date, yesterday)) {
    return `ontem, ${date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const d = daysAgo(date);
  if (d < 7) return `há ${d} dias`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}
function formatTimeOfDay(dateString) {
  const d = safeParse(dateString);
  if (!d) return "";
  return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

/* Data + hora absolutas (pt-PT). Usada em cada notificação
   para que o user veja sempre a data e hora exatas, sem
   "há 5 min" relativo que pode ficar confuso em listas longas. */
function formatDateTime(dateString) {
  const d = safeParse(dateString);
  if (!d) return "";
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByPeriod(items) {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = { today: [], yesterday: [], last7: [], last30: [], older: [] };
  items.forEach((n) => {
    const d = safeParse(n.createdAt);
    if (!d) {
      groups.older.push(n);
      return;
    }
    if (sameDay(d, now)) groups.today.push(n);
    else if (sameDay(d, yesterday)) groups.yesterday.push(n);
    else if (d >= sevenDaysAgo) groups.last7.push(n);
    else if (d >= thirtyDaysAgo) groups.last30.push(n);
    else groups.older.push(n);
  });
  return groups;
}

function actorDisplayName(actor) {
  return getDisplayName(actor, "Alguém");
}

function actorHandle(actor) {
  if (!actor) return null;
  return actor.username || null;
}

/* ── Component ──────────────────────────────────────────── */
const PAGE_SIZE = 20;

const Notifications = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const myUserId = user?.id ? Number(user.id) : null;
  const myUsername = user?.username || null;

  const [tab, setTab] = useState("all"); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalUnreadElements, setTotalUnreadElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Flag para impedir que o auto-mark seja disparado mais de uma vez
  // por sessão. Queremos marcar como lidas APENAS na primeira vez que
  // o user entra em /notifications com notificações por ler.
  const autoMarkedRef = useRef(false);

  const [tripTitles, setTripTitles] = useState(() => ({}));

  const sentinelRef = useRef(null);
  const cancelRef = useRef(null);

  /* ── Fetch page ──────────────────────────────────────── */
  const fetchPage = useCallback(
    async (pageToLoad = 0, reset = false) => {
      if (cancelRef.current) cancelRef.current.abort();
      const controller = new AbortController();
      cancelRef.current = controller;

      try {
        if (reset) setLoading(true);
        else setLoadingMore(true);

        const isUnread = tab === "unread";
        const url = isUnread ? "/notifications/unread" : "/notifications";
        const { data } = await api.get(url, {
          params: { page: pageToLoad, size: PAGE_SIZE, sort: "createdAt,desc" },
          signal: controller.signal,
        });

        const content = Array.isArray(data?.content) ? data.content : [];
        if (isUnread) {
          setTotalUnreadElements(data?.totalElements ?? content.length);
        } else {
          setTotalElements(data?.totalElements ?? content.length);
        }
        setHasMore(!data?.last && content.length > 0);
        setPage(pageToLoad);

        setNotifications((prev) => {
          if (reset) return content;
          const seen = new Set(prev.map((n) => n.id));
          return [...prev, ...content.filter((n) => !seen.has(n.id))];
        });
        setError(null);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        setError(err?.response?.data?.message || "Não foi possível carregar as notificações.");
      } finally {
        if (cancelRef.current === controller) cancelRef.current = null;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [tab]
  );

  /* ── Fetch unread count ──────────────────────────────── */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/count");
      const count = typeof data?.unreadCount === "number" ? data.unreadCount : 0;
      setUnreadCount(count);
      setTotalUnreadElements(count);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("gm:unreadCount", String(count));
          window.dispatchEvent(new CustomEvent("gm:notifications-count", { detail: { count } }));
        }
      } catch (_) { /* no-op */ }
    } catch (err) {
      // Silent — count is non-critical
    }
  }, []);

  /* ── Initial + tab change ────────────────────────────── */
  useEffect(() => {
    setNotifications([]);
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
    fetchUnreadCount();
  }, [tab, fetchPage, fetchUnreadCount]);

  // Lazy-load trip titles
  useEffect(() => {
    const missing = new Set();
    notifications.forEach((n) => {
      if (!n.tripId) return;
      if (!tripTitles[n.tripId]) missing.add(n.tripId);
    });
    if (missing.size === 0) return undefined;
    const ctrl = new AbortController();
    (async () => {
      const updates = {};
      await Promise.all(
        Array.from(missing).map(async (id) => {
          try {
            const { data } = await api.get(`/trips/${id}`, { signal: ctrl.signal });
            const title = data?.title || data?.tripTitle || null;
            if (title) updates[id] = title;
          } catch (_) { /* silent — title is decorative */ }
        })
      );
      if (Object.keys(updates).length > 0) {
        setTripTitles((prev) => ({ ...prev, ...updates }));
      }
    })();
    return () => ctrl.abort();
  }, [notifications, tripTitles]);

  /* ── Refresh on focus ────────────────────────────────── */
  useEffect(() => {
    const onFocus = () => {
      fetchUnreadCount();
      if (tab === "unread") fetchPage(0, true);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchPage, fetchUnreadCount, tab]);

  /* ── Infinite scroll ─────────────────────────────────── */
  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPage(page + 1, false);
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, fetchPage]);

  /* ── Actions ─────────────────────────────────────────── */
  const handleMarkAsRead = useCallback(
    async (id) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      setTotalUnreadElements((c) => Math.max(0, c - 1));
      try {
        await api.put(`/notifications/${id}/read`);
      } catch (err) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
        setUnreadCount((c) => c + 1);
        setTotalUnreadElements((c) => c + 1);
      }
    },
    []
  );

  const handleMarkAllAsRead = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    const previousCount = unreadCount;
    setUnreadCount(0);
    setTotalUnreadElements(0);
    try {
      if (typeof window !== "undefined") {
        try { window.localStorage.setItem("gm:unreadCount", "0"); } catch (_) { /* no-op */ }
        try { window.dispatchEvent(new CustomEvent("gm:notifications-read-all")); } catch (_) { /* no-op */ }
      }
      const { data } = await api.put("/notifications/read-all");
      const serverCount = typeof data?.unreadCount === "number" ? data.unreadCount : null;
      if (serverCount !== null && serverCount !== 0) {
        setUnreadCount(serverCount);
        setTotalUnreadElements(serverCount);
        try { window.localStorage.setItem("gm:unreadCount", String(serverCount)); } catch (_) { /* no-op */ }
        try { window.dispatchEvent(new CustomEvent("gm:notifications-count", { detail: { count: serverCount } })); } catch (_) { /* no-op */ }
      }
    } catch (err) {
      setUnreadCount(previousCount);
      setTotalUnreadElements(previousCount);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: false })));
      toast.danger("Não foi possível marcar tudo como lido.");
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, unreadCount, toast]);

  /*
   * Auto-mark all as read on mount.
   *
   * PROBLEMA ANTERIOR: o effect tinha dependências vazias `[]`, o que
   * significava que corria apenas UMA vez no mount. Na primeira
   * renderização, `unreadCount` era 0 (ainda não tinha sido buscado
   * via `/notifications/count`). O fetch assíncrono (`fetchUnreadCount`
   * no effect do `[tab]`) só atualizava `unreadCount` DEPOIS deste
   * effect já ter corrido. Resultado: o auto-mark NUNCA disparava.
   *
   * SOLUÇÃO: o effect depende agora de `unreadCount`. Quando o fetch
   * assíncrono completa e actualiza `unreadCount` para > 0, o effect
   * reage e dispara o `handleMarkAllAsRead`.
   *
   * A `autoMarkedRef` impede que o auto-mark seja re-triggerado
   * depois de já ter sido feito (por exemplo, se o backend devolver
   * unreadCount > 0 após marcar porque entretanto chegou uma
   * notificação nova — o user já viu a página, não queremos marcar
   * automaticamente outra vez).
   */
  useEffect(() => {
    if (!autoMarkedRef.current && unreadCount > 0 && !actionLoading) {
      autoMarkedRef.current = true;
      handleMarkAllAsRead();
    }
  }, [unreadCount, actionLoading, handleMarkAllAsRead]);

  const handleDelete = useCallback(
    async (id) => {
      setNotifications((prev) => {
        const target = prev.find((n) => n.id === id);
        if (target && !target.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
          if (tab === "all") {
            setTotalElements((c) => Math.max(0, c - 1));
          } else {
            setTotalUnreadElements((c) => Math.max(0, c - 1));
          }
        } else if (target && target.isRead) {
          if (tab === "all") {
            setTotalElements((c) => Math.max(0, c - 1));
          }
        }
        return prev.filter((n) => n.id !== id);
      });
      try {
        await api.delete(`/notifications/${id}`);
      } catch (err) {
        const status = err?.response?.status;
        if (status !== 404) {
          toast.danger("Não foi possível apagar a notificação.");
          fetchPage(0, true);
        }
      }
    },
    [fetchPage, toast, tab]
  );

  const handleDeleteAll = useCallback(async () => {
    if (actionLoading) return;
    if (!window.confirm("Apagar todas as notificações? Esta ação não pode ser revertida.")) return;
    setActionLoading(true);
    const previous = notifications;
    setNotifications([]);
    try {
      await api.delete("/notifications/delete-all");
      setHasMore(false);
      setTotalElements(0);
      setUnreadCount(0);
      setTotalUnreadElements(0);
      toast.success("Notificações apagadas.");
    } catch (err) {
      setNotifications(previous);
      toast.danger("Não foi possível apagar as notificações.");
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, notifications, toast]);

  /* ── Click an item ─────────────────────────────────────
     Round 36 — Notification System Audit:
     - Navegação agora ancora em #comment-{id} para replies de trip
       e #forum-comment-{id} para replies de fórum, de modo a abrir
       directamente o thread da notificação.
     - Os tipos de follow caem sempre no perfil do actor, não no
       meu próprio perfil. */
  const handleItemClick = useCallback(
    async (n) => {
      if (!n.isRead) handleMarkAsRead(n.id);
      if (n.type === "FOLLOW_REQUEST" && myUsername) {
        navigate(`/profile/${myUsername}`);
        return;
      }
      let url = null;
      if (n.type === "TRIP_COMMENT_REPLY" && n.tripId) {
        url = n.commentId
          ? `/travel/${n.tripId}#comment-${n.commentId}`
          : `/travel/${n.tripId}`;
      } else if ((n.type === "TRIP_LIKE" || n.type === "TRIP_COMMENT") && n.tripId) {
        url = `/travel/${n.tripId}`;
      } else if (n.type === "FORUM_COMMENT_REPLY" && n.forumQuestionId) {
        url = n.forumCommentId
          ? `/qanda/${n.forumQuestionId}#forum-comment-${n.forumCommentId}`
          : `/qanda/${n.forumQuestionId}`;
      } else if (n.type === "FORUM_QUESTION_COMMENT" && n.forumQuestionId) {
        url = `/qanda/${n.forumQuestionId}`;
      } else if (n.type === "FORUM_QUESTION_LIKE" && n.forumQuestionId) {
        // Round 77 (Bug 4): jump straight to the question that got
        // liked. No comment anchor — the like is on the question,
        // not on a thread.
        url = `/qanda/${n.forumQuestionId}`;
      } else if (n.type === "FORUM_COMMENT_LIKE" && n.forumQuestionId) {
        // Same as above but anchored to the specific comment that
        // was liked, so the user lands on the right place in the
        // thread. The `#forum-comment-<id>` selector matches the
        // `id` attribute rendered by the CommentThread component.
        url = n.forumCommentId
          ? `/qanda/${n.forumQuestionId}#forum-comment-${n.forumCommentId}`
          : `/qanda/${n.forumQuestionId}`;
      } else if ((n.type === "FOLLOW" || n.type === "FOLLOW_ACCEPTED") && actorHandle(n.actor)) {
        url = `/profile/${actorHandle(n.actor)}`;
      }
      if (url) navigate(url);
    },
    [handleMarkAsRead, navigate, myUsername]
  );

  /* ── Accept / reject a follow request from a notification */
  const handleAcceptFromNotification = useCallback(
    async (n) => {
      if (!myUserId || !n?.actor?.id) return;
      try {
        const { data } = await api.get(`/users/${myUserId}/follow-requests`);
        const list = Array.isArray(data) ? data : [];
        const match = list.find((r) => r.requester?.id === Number(n.actor.id));
        if (!match) {
          toast.info("Este pedido já não está pendente.");
          handleDelete(n.id);
          return;
        }
        await api.post(`/users/${myUserId}/follow-requests/${match.id}/accept`);
        toast.success("Pedido aceite.");
        handleDelete(n.id);
      } catch (err) {
        const msg = err?.response?.data?.message || "Não foi possível aceitar o pedido.";
        toast.danger(msg);
      }
    },
    [myUserId, toast, handleDelete]
  );

  const handleRejectFromNotification = useCallback(
    async (n) => {
      if (!myUserId || !n?.actor?.id) return;
      try {
        const { data } = await api.get(`/users/${myUserId}/follow-requests`);
        const list = Array.isArray(data) ? data : [];
        const match = list.find((r) => r.requester?.id === Number(n.actor.id));
        if (!match) {
          toast.info("Este pedido já não está pendente.");
          handleDelete(n.id);
          return;
        }
        await api.post(`/users/${myUserId}/follow-requests/${match.id}/reject`);
        toast.info("Pedido rejeitado.");
        handleDelete(n.id);
      } catch (err) {
        const msg = err?.response?.data?.message || "Não foi possível rejeitar o pedido.";
        toast.danger(msg);
      }
    },
    [myUserId, toast, handleDelete]
  );

  /* ── Grouped items ───────────────────────────────────── */
  const grouped = useMemo(() => groupByPeriod(notifications), [notifications]);

  const periodLabels = {
    today: "Hoje",
    yesterday: "Ontem",
    last7: "Esta semana",
    last30: "Este mês",
    older: "Mais antigas",
  };

  const hasAny = notifications.length > 0;
  const hasUnread = unreadCount > 0;

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="gm-notif">
      {/* ── Header (glass) — title block removed (Round 33 cleanup) ──── */}
      <div className="gm-notif__head">
        <div className="gm-notif__controls">
          {/* ── Tabs (sticky glass segmented) ──────────── */}
          <div className="gm-notif__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === "all"}
              className={`gm-notif__tab ${tab === "all" ? "gm-notif__tab--active" : ""}`}
              onClick={() => setTab("all")}
            >
              <Inbox size={14} strokeWidth={1.75} />
              <span>Tudo</span>
              <span className="gm-notif__tab-count">{totalElements}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "unread"}
              className={`gm-notif__tab ${tab === "unread" ? "gm-notif__tab--active" : ""}`}
              onClick={() => setTab("unread")}
            >
              <Bell size={14} strokeWidth={1.75} />
              <span>Não lidas</span>
              {totalUnreadElements > 0 ? (
                <span className="gm-notif__tab-count gm-notif__tab-count--accent">{totalUnreadElements}</span>
              ) : (
                <span className="gm-notif__tab-count">0</span>
              )}
            </button>
          </div>

          <div className="gm-notif__head-actions">
            <button
              type="button"
              className="gm-notif__head-btn"
              onClick={() => fetchPage(0, true)}
              disabled={loading}
              aria-label="Atualizar"
            >
              <RefreshCw size={14} strokeWidth={1.75} className={loading ? "gm-spin" : ""} />
              <span>Atualizar</span>
            </button>
            {hasUnread && (
              <button
                type="button"
                className="gm-notif__head-btn gm-notif__head-btn--primary"
                onClick={handleMarkAllAsRead}
                disabled={actionLoading}
              >
                <CheckCheck size={14} strokeWidth={1.75} />
                <span>Marcar tudo lido</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────── */}
      <div className="gm-notif__body">
        {/* Error */}
        {error && !loading && (
          <div className="gm-notif__error" role="alert">
            <AlertCircle size={20} strokeWidth={1.75} />
            <div className="gm-notif__error-info">
              <strong>Algo correu mal</strong>
              <p>{error}</p>
            </div>
            <button type="button" className="gm-notif__error-retry" onClick={() => fetchPage(0, true)}>
              <RefreshCw size={14} strokeWidth={1.75} />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !hasAny && (
          <div className="gm-notif__skeleton-list" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="gm-notif__skeleton-item">
                <div className="gm-notif__skeleton-avatar" />
                <div className="gm-notif__skeleton-lines">
                  <div className="gm-notif__skeleton-line gm-notif__skeleton-line--lg" />
                  <div className="gm-notif__skeleton-line gm-notif__skeleton-line--sm" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasAny && !error && (
          <div className="gm-notif__empty">
            <div className="gm-notif__empty-icon">
              {tab === "unread" ? <BellOff size={36} strokeWidth={1.5} /> : <Sparkles size={36} strokeWidth={1.5} />}
            </div>
            <h2>{tab === "unread" ? "Estás em dia" : "Ainda sem notificações"}</h2>
            <p>
              {tab === "unread"
                ? "Não tens notificações por ler. Volta mais tarde para ver as últimas."
                : "Quando alguém gostar das tuas viagens, comentar ou começar a seguir-te, aparece aqui."}
            </p>
            <button
              type="button"
              className="gm-notif__empty-cta"
              onClick={() => navigate("/travels")}
            >
              <Compass size={14} strokeWidth={1.75} />
              Explorar comunidade
            </button>
          </div>
        )}

        {/* Grouped list */}
        {hasAny && (
          <div className="gm-notif__list">
            {Object.entries(grouped).map(([period, items]) => {
              if (!items.length) return null;
              return (
                <section key={period} className="gm-notif__group">
                  <header className="gm-notif__group-head">
                    <h2>{periodLabels[period]}</h2>
                    <span className="gm-notif__group-count">{items.length}</span>
                  </header>
                  <ul className="gm-notif__items">
                    <AnimatePresence initial={false}>
                      {items.map((n) => (
                        <NotificationItem
                          key={n.id}
                          notification={n}
                          tripTitle={n.tripId ? tripTitles[n.tripId] : undefined}
                          onClick={() => handleItemClick(n)}
                          onActorClick={() => {
                            if (!n.isRead) handleMarkAsRead(n.id);
                            const handle = actorHandle(n.actor);
                            if (handle) navigate(`/profile/${handle}`);
                          }}
                          onMarkRead={() => handleMarkAsRead(n.id)}
                          onDelete={() => handleDelete(n.id)}
                          onAccept={n.type === "FOLLOW_REQUEST" ? () => handleAcceptFromNotification(n) : undefined}
                          onReject={n.type === "FOLLOW_REQUEST" ? () => handleRejectFromNotification(n) : undefined}
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </section>
              );
            })}

            {/* Sentinel + spinner */}
            <div ref={sentinelRef} className="gm-notif__sentinel" aria-hidden="true">
              {loadingMore && (
                <div className="gm-notif__loading-more">
                  <Loader2 size={16} strokeWidth={2} className="gm-spin" />
                  <span>A carregar mais…</span>
                </div>
              )}
              {!hasMore && !loadingMore && (
                <div className="gm-notif__end">
                  <span className="gm-notif__end-line" />
                  <span className="gm-notif__end-label">Chegaste ao fim</span>
                  <span className="gm-notif__end-line" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Notification item (extracted) ───────────────────────── */
function NotificationItem({ notification, tripTitle, onClick, onActorClick, onMarkRead, onDelete, onAccept, onReject }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = TYPE_META[notification.type] || { label: "Nova", icon: Bell, color: "#007BFF" };
  const Icon = meta.icon;
  const isUnread = !notification.isRead;
  const actor = notification.actor;
  const name = actorDisplayName(actor);
  const aggregatedLikes = notification.type === "TRIP_LIKE" && notification.aggregatedCount > 1;
  const message = aggregatedLikes
    ? `Recebeste ${notification.aggregatedCount} novos gostos na tua viagem "${tripTitle || "viagem"}"`
    : defaultMessage(notification, tripTitle);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`gm-notif-item ${isUnread ? "gm-notif-item--unread" : ""}`}
    >
      {isUnread && <span className="gm-notif-item__dot" aria-hidden="true" />}

      {/* Round 59+ — the outer clickable wrapper used to be a
          <button>, with another <button> nested inside for the
          actor name (so clicking the name went to the profile
          instead of opening the notification target). HTML doesn't
          allow nested interactive elements, so React raised a
          hydration / console warning. Replaced the outer wrapper
          with a div[role=button] and let the inner <button> for
          the actor keep its semantics. */}
      <div
        role="button"
        tabIndex={0}
        className="gm-notif-item__main"
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}
        aria-label={`${name}: ${message}`}
      >
        <div className="gm-notif-item__avatar-wrap">
          <Avatar
            src={actor?.profilePhoto ? toFullMediaUrl(actor.profilePhoto) : null}
            name={name}
            size="md"
            onClick={onActorClick}
          />
          <span
            className="gm-notif-item__type-icon"
            style={{ background: meta.color }}
            aria-hidden="true"
          >
            <Icon size={11} strokeWidth={2} />
          </span>
        </div>

        <div className="gm-notif-item__body">
          <p className="gm-notif-item__message">
            <button
              type="button"
              className="gm-notif-item__actor"
              onClick={(e) => { e.stopPropagation(); onActorClick && onActorClick(); }}
            >
              {name}
            </button>
            <span className="gm-notif-item__text">{message}</span>
          </p>
          <span
            className="gm-notif-item__time"
            title={(() => {
              const d = safeParse(notification.createdAt);
              return d ? d.toLocaleString("pt-PT") : "";
            })()}
          >
            {formatDateTime(notification.createdAt)}
          </span>
        </div>
      </div>

      <div className="gm-notif-item__actions">
        {notification.type === "FOLLOW_REQUEST" && onAccept && onReject && (
          <div className="gm-notif-item__follow-cta">
            <button
              type="button"
              className="gm-notif-item__follow-accept"
              onClick={(e) => { e.stopPropagation(); onAccept(); }}
              title="Aceitar pedido"
            >
              <Check size={13} strokeWidth={2.25} />
              <span>Aceitar</span>
            </button>
            <button
              type="button"
              className="gm-notif-item__follow-reject"
              onClick={(e) => { e.stopPropagation(); onReject(); }}
              title="Rejeitar pedido"
            >
              <IconX size={13} strokeWidth={2.25} />
              <span>Rejeitar</span>
            </button>
          </div>
        )}
        {isUnread && (
          <button
            type="button"
            className="gm-notif-item__action"
            onClick={onMarkRead}
            aria-label="Marcar como lida"
            title="Marcar como lida"
          >
            <Check size={15} strokeWidth={1.75} />
          </button>
        )}
        <div className="gm-notif-item__menu-wrap">
          <button
            type="button"
            className="gm-notif-item__action"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Mais opções"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={15} strokeWidth={1.75} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="gm-notif-item__menu-backdrop" onClick={() => setMenuOpen(false)} />
                <motion.div
                  className="gm-notif-item__menu"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                  role="menu"
                >
                  {isUnread && (
                    <button
                      type="button"
                      role="menuitem"
                      className="gm-notif-item__menu-item"
                      onClick={() => { onMarkRead(); setMenuOpen(false); }}
                    >
                      <Check size={14} strokeWidth={1.75} />
                      <span>Marcar como lida</span>
                    </button>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    className="gm-notif-item__menu-item gm-notif-item__menu-item--danger"
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                    <span>Apagar</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

function defaultMessage(n, tripTitle) {
  // Round 77 (Bug 4): forum notifications don't carry a trip
  // title — they carry a `forumQuestionId` and (sometimes) the
  // question text via `n.content` set by the backend. The
  // FORUM_QUESTION_LIKE row uses a "pergunta" fallback so the
  // message reads naturally even if the backend omitted the
  // question text. The trip-related branches keep the existing
  // "viagem" fallback.
  const isForumLike = n.type === "FORUM_QUESTION_LIKE" || n.type === "FORUM_COMMENT_LIKE";
  const t = isForumLike ? "pergunta" : (tripTitle || "viagem");
  switch (n.type) {
    case "FOLLOW": return "começou a seguir-te";
    case "FOLLOW_REQUEST": return "pediu para te seguir";
    case "FOLLOW_ACCEPTED": return "aceitou o teu pedido para seguir";
    case "TRIP_LIKE": return `gostou da tua viagem "${t}"`;
    case "TRIP_COMMENT": return `comentou a tua viagem "${t}"`;
    case "TRIP_COMMENT_REPLY": return "respondeu ao teu comentário";
    case "FORUM_QUESTION_COMMENT": return "respondeu à tua pergunta";
    case "FORUM_COMMENT_REPLY": return "respondeu ao teu comentário";
    // Round 77 (Bug 4): forum like notifications. We use the
    // question's title (truncated) as context for the question
    // like, mirroring how TRIP_LIKE quotes the trip title.
    case "FORUM_QUESTION_LIKE": return `gostou da tua pergunta "${t}"`;
    case "FORUM_COMMENT_LIKE": return "gostou do teu comentário";
    default:
      if (n.content) {
        // Strip actor name prefix if content includes full name
        const name = actorDisplayName(n.actor);
        if (n.content.startsWith(name)) {
          return n.content.substring(name.length).trim();
        }
        return n.content;
      }
      return "nova atividade";
  }
}

export default Notifications;