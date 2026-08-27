import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Heart, Search, Reply, Send, X as IconX, User, Calendar, MapPin,
  MessageCircle, Plus, Filter, ChevronDown, ChevronUp, ArrowUpDown,
  Inbox, Sparkles, Trash2, Flag, MessageSquare, MoreHorizontal,
  HelpCircle, AlertCircle, RefreshCw, Compass,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast, Avatar, CommentThread, flattenCommentTree } from "../components/ui";
import SearchableDropdown from "../components/ui/SearchableDropdown";
import { COMMENT_LIMITS, validateComment } from "../config/commentConfig";
import api, { toFullMediaUrl } from "../axios_helper";
import { getDisplayName } from "../utils/userDisplay";
import { translateCountry } from "../utils/localization";
import useProfileUpdates from "../hooks/useProfileUpdates";
import "../styles/pages/qanda.css";

/* Round 83 — SearchableDropdown is now a shared component
   (components/ui/SearchableDropdown.jsx). The Q&A filters
   and the TripWizard País / Cidade selects both use it. */

/* ── Constants ─────────────────────────────────────────── */
const CATEGORIES = ["Alojamento", "Transportes", "Dicas Locais", "Cultura", "Gastronomia", "Outros"];
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ label: c, value: c }));

/* ── Sanitize content (XSS guard) ─────────────────────── */
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /<style[^>]*>.*?<\/style>/gi,
];
function sanitizeContent(content) {
  if (!content) return "";
  let s = content;
  DANGEROUS_PATTERNS.forEach((p) => { s = s.replace(p, ""); });
  return s.trim();
}

/* ── Time helpers ──────────────────────────────────────── */
function getRelativeTime(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return "agora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ${day > 1 ? "dias" : "dia"}`;
  return d.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function safeLocaleString(date, opts) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-PT", opts);
}

/* ── Component ─────────────────────────────────────────── */
const QandA = () => {
  const { user: authUser } = useAuth();
  const { id: urlQuestionId } = useParams();
  // Round 83 — used by the per-row profile navigation
  // (onUserClick on CommentThread) and by any future
  // "go back" / "edit question" links we add.
  const navigate = useNavigate();
  const toast = useToast();

  // The composer avatar must always reflect the photo on the
  // backend. We re-read the stored user record on mount and
  // also listen for the `gm:profile-updated` event that
  // EditProfile dispatches when a new photo is saved, plus a
  // window `storage` event so a photo updated in another tab
  // is reflected here too.
  const [user, setUserState] = useState(() => {
    if (typeof window === 'undefined') return authUser;
    try {
      const stored = window.localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) { /* no-op */ }
    return authUser;
  });
  useEffect(() => {
    const refresh = () => {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) setUserState(JSON.parse(stored));
      } catch (e) { /* no-op */ }
    };
    const onProfileUpdated = (e) => {
      if (!e?.detail?.username || !authUser || e.detail.username === authUser.username) {
        refresh();
      }
    };
    window.addEventListener('storage', refresh);
    window.addEventListener('gm:profile-updated', onProfileUpdated);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('gm:profile-updated', onProfileUpdated);
    };
  }, [authUser]);

  // Round 47 — When a user updates their profile, refetch the
  // forum feed + open threads so the new firstName / lastName
  // shows up on every question + comment without a hard refresh.
  useProfileUpdates({
    onUpdate: () => {
      // Refresh the current page of the questions list.
      fetchAllQuestions(allPage, false);
      // Refetch every open question's comments in the background.
      questions.forEach((q) => {
        if (q?.id) fetchQuestionComments(q.id);
      });
    },
  });

  // Fetch the fresh profile photo from the backend on mount so
  // the composer avatar shows the photo the user currently has
  // on file (the localStorage copy can be stale if the upload
  // happened in another tab / device / after the page loaded).
  useEffect(() => {
    if (!authUser?.id) return undefined;
    let cancelled = false;
    api
      .get(`/users/${authUser.id}/detailed`)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const fresh = data.profilePhoto || data.profilePicture;
        if (fresh && fresh !== user?.profilePhoto) {
          setUserState((prev) => ({ ...(prev || authUser), ...data, profilePhoto: fresh, profilePicture: fresh }));
        }
      })
      .catch(() => { /* best-effort */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id]);

  /* Feed state */
  const [questions, setQuestions] = useState([]);
  const [allPage, setAllPage] = useState(0);
  const [allTotalPages, setAllTotalPages] = useState(0);
  const [allTotal, setAllTotal] = useState(0);

  const [myQuestions, setMyQuestions] = useState([]);
  const [myPage, setMyPage] = useState(0);
  const [myTotalPages, setMyTotalPages] = useState(0);
  const [myTotal, setMyTotal] = useState(0);

  /* Form / UI state */
  const [newQuestion, setNewQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [country, setCountry] = useState("");

  /* Countries for question form (city field removed by request). */
  const [countries, setCountries] = useState([]);
  const countryOptions = countries.map((c) => ({ label: translateCountry(c), value: c }));

  /* Per-question state */
  const [commentsLoading, setCommentsLoading] = useState({});
  const [newComment, setNewComment] = useState({});
  const [newReply, setNewReply] = useState({});
  const [replyOpen, setReplyOpen] = useState({});

  /* Top-bar state */
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ category: "", answered: "" });
  const [sortOption, setSortOption] = useState("created_at");
  const [showFilters, setShowFilters] = useState(false);
  const [activeSection, setActiveSection] = useState("all");

  /* Misc */
  const [expandedSections, setExpandedSections] = useState({});
  const [likedQuestions, setLikedQuestions] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* ── Transform DTO → UI shape ──────────────────────── */
  const transformQuestion = useCallback((dto) => ({
    id: dto.questionId,
    userId: dto.userId,
    // Round 83 — propagate the `username` (handle) so the
    // question card can link to `/profile/:username` when
    // the user clicks the avatar or the display name. The
    // DTO already exposes it; we just weren't forwarding.
    username: dto.username || null,
    user: getDisplayName({
      userFirstName: dto.userFirstName,
      userLastName: dto.userLastName,
      username: dto.username,
    }, "Utilizador"),
    userProfilePicture: dto.userProfilePhoto || null,
    question: dto.questionText,
    category: dto.category || "",
    // Country / city are nullable so the renderer can decide
    // whether to show the "📍" chip. We strip empty strings and
    // treat them as null — the JSX hides the chip entirely when
    // the user never picked a country on the ask form.
    country: dto.countryName && dto.countryName.trim() ? dto.countryName : null,
    city: dto.cityName && dto.cityName.trim() ? dto.cityName : null,
    createdAt: dto.createdAt,
    likes: dto.totalLikes || 0,
    totalComments: dto.totalComments || 0,
    currentUserLiked: dto.userLiked || false,
    comments: [],
  }), []);

  /* ── Fetchers ──────────────────────────────────────── */
  const fetchAllQuestions = useCallback(async (page = 0, append = false) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 20, sortBy: sortOption });
      if (filters.category) params.append("category", filters.category);
      if (filters.answered === "yes") params.append("hasComments", "true");
      if (filters.answered === "no") params.append("hasComments", "false");
      if (searchQuery.trim()) params.append("searchText", searchQuery.trim());

      const { data } = await api.get(`/forum/questions?${params.toString()}`);
      const transformed = (data.content || []).map(transformQuestion);

      const liked = transformed.filter((q) => q.currentUserLiked).map((q) => q.id);
      setLikedQuestions((prev) => [...new Set([...prev, ...liked])]);

      setQuestions((prev) => (append ? [...prev, ...transformed] : transformed));
      setAllPage(data.number ?? page);
      setAllTotalPages(data.totalPages ?? 0);
      setAllTotal(data.totalElements ?? 0);
    } catch (err) {
      console.error("Erro ao carregar perguntas:", err);
      toast.danger("Erro ao carregar perguntas.");
    } finally {
      setIsLoading(false);
    }
  }, [sortOption, filters, searchQuery, transformQuestion, toast]);

  const fetchMyQuestions = useCallback(async (page = 0, append = false) => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/forum/questions/my?page=${page}&size=20`);
      const transformed = (data.content || []).map(transformQuestion);
      setMyQuestions((prev) => (append ? [...prev, ...transformed] : transformed));
      setMyPage(data.number ?? page);
      setMyTotalPages(data.totalPages ?? 0);
      setMyTotal(data.totalElements ?? 0);
    } catch (err) {
      console.error("Erro ao carregar as minhas perguntas:", err);
      toast.danger("Erro ao carregar as suas perguntas.");
    } finally {
      setIsLoading(false);
    }
  }, [transformQuestion, toast]);

  /* ── Countries ─────────────────────────────────────── */
  useEffect(() => {
    api.get("/cities/countries")
      .then((r) => setCountries(r.data || []))
      .catch(() => {});
  }, []);

  /* ── Cleanup: drop the legacy Q&A welcome modal flag from localStorage ──
   * The Q&A welcome modal was removed; any 'true' value sitting under
   * 'qandaModalDismissed' is now meaningless and only blocks future
   * server-side reset tools that look for an empty/missing key. */
  useEffect(() => {
    try {
      window.localStorage.removeItem('qandaModalDismissed');
    } catch (_) { /* no-op */ }
  }, []);

  useEffect(() => {
    if (activeSection === "all") {
      fetchAllQuestions(0, false);
    }
  }, [activeSection, sortOption, filters, searchQuery, fetchAllQuestions]);

  useEffect(() => {
    if (activeSection === "mine" && user) {
      fetchMyQuestions(0, false);
    }
  }, [activeSection, user, fetchMyQuestions]);

  // FIX (Round 30): quando o user entra via
  // /forum/questions/:id ou /qanda/:id (deep-link a partir de
  // uma notificação "respondeu à tua pergunta"), abrimos
  // automaticamente a thread correspondente e fazemos scroll
  // até ela. O URL é a única fonte de verdade; o id da rota
  // é guardado em `urlQuestionId` (vindo do `useParams`).
  // Como o fórum não tem detail-page dedicada, mostramos a
  // pergunta inline no topo da lista "Tudo" com o bloco de
  // comentários já expandido.
  useEffect(() => {
    if (!urlQuestionId) return undefined;
    const numericId = Number(urlQuestionId);
    if (!Number.isFinite(numericId) || numericId <= 0) return undefined;
    // Mudar para a tab "Tudo" para garantir que a pergunta
    // está na lista visível (se a thread é de outro user, não
    // aparece em "Minhas").
    setActiveSection("all");
    // Expandir a thread (carrega os comentários se ainda não
    // foram carregados) e marcar como lida visualmente.
    setExpandedSections((prev) => ({ ...prev, [`question-${numericId}`]: true }));
    fetchQuestionComments(numericId);
    // Scroll suave até ao bloco da pergunta depois do próximo
    // paint, para o user perceber que aterrou no sítio certo.
    const t = setTimeout(() => {
      try {
        const el = document.querySelector(`[data-question-id="${numericId}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (_) { /* no-op */ }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuestionId]);

  // Lightweight count of my questions so the "Minhas" tab can show
  // the badge before the user clicks it. We hit /forum/questions/my
  // with size=1 and read totalElements. This is cheap and avoids
  // forcing the user to click the tab just to see how many
  // questions they have asked.
  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api
      .get('/forum/questions/my', { params: { page: 0, size: 1 } })
      .then(({ data }) => {
        if (cancelled) return;
        setMyTotal(data?.totalElements ?? 0);
      })
      .catch(() => {
        // best-effort — if it fails the user can still see the real
        // count after clicking the tab.
      });
    return () => { cancelled = true; };
  }, [user]);

  /* ── Handlers ──────────────────────────────────────── */
  const handleAskQuestion = useCallback(async (e) => {
    e.preventDefault();
    setError("");

    if (!user) {
      setError("Inicie sessão para criar uma pergunta!");
      toast.danger("Inicie sessão para criar uma pergunta!");
      return;
    }
    if (!newQuestion.trim()) {
      setError("Escreva uma pergunta!");
      toast.danger("Escreva uma pergunta!");
      return;
    }
    if (newQuestion.trim().length < 10) {
      setError("A pergunta deve ter pelo menos 10 caracteres!");
      toast.danger("A pergunta deve ter pelo menos 10 caracteres!");
      return;
    }
    if (newQuestion.trim().length > 500) {
      setError("A pergunta deve ter no máximo 500 caracteres!");
      toast.danger("A pergunta deve ter no máximo 500 caracteres!");
      return;
    }
    const sanitizedQuestion = sanitizeContent(newQuestion);
    if (!sanitizedQuestion) {
      setError("Pergunta contém conteúdo não permitido!");
      toast.danger("Pergunta contém conteúdo não permitido!");
      return;
    }
    if (sanitizedQuestion !== newQuestion.trim()) {
      setError("Pergunta contém conteúdo perigoso que foi removido!");
      toast.danger("Pergunta contém conteúdo perigoso que foi removido!");
      return;
    }
    if (!category) {
      setError("Selecione uma categoria!");
      toast.danger("Selecione uma categoria!");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post("/forum/questions", {
        questionText: sanitizedQuestion,
        category,
        // Round 77 (Bug 3): send the country the user picked in the
        // "País" dropdown. The backend persists it on a new
        // `forum_question.country` column (V17) and surfaces it back
        // in the `countryName` field. Without this line the country
        // was selected in the UI but never persisted, so the chip
        // with the flag vanished on the next render of the question.
        country: country || null,
      });
      const created = transformQuestion(data);
      setQuestions((prev) => [created, ...prev]);
      setAllTotal((prev) => prev + 1);
      setNewQuestion("");
      setCategory("");
      setCountry("");
      setIsAskingQuestion(false);
      setError("");
      toast.success("Pergunta criada com sucesso!");
    } catch (err) {
      console.error("Erro ao criar pergunta:", err);
      toast.danger("Erro ao criar pergunta.");
    } finally {
      setIsLoading(false);
    }
  }, [user, newQuestion, category, transformQuestion, toast]);

  const handleCommentOrReply = useCallback(async (questionId, parentCommentId = null, text, replyKey = null) => {
    setError("");

    if (!user) {
      setError("Inicie sessão para comentar!");
      toast.danger("Inicie sessão para comentar!");
      return;
    }

    const validation = validateComment(text);
    if (!validation.valid) {
      setError(validation.message);
      toast.danger(validation.message);
      return;
    }
    const sanitizedText = sanitizeContent(text);
    if (!sanitizedText) {
      setError(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT);
      toast.danger(COMMENT_LIMITS.MESSAGES.INVALID_CONTENT);
      return;
    }
    if (sanitizedText !== text.trim()) {
      setError(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT);
      toast.danger(COMMENT_LIMITS.MESSAGES.DANGEROUS_CONTENT);
      return;
    }

    try {
      const body = { content: sanitizedText };
      if (parentCommentId != null) body.parentCommentId = parentCommentId;
      const { data: dto } = await api.post(`/forum/questions/${questionId}/comments`, body);
      // Build the new comment object that the local tree state expects.
      // The backend returns the full thread (parent + nested replies)
      // but we still keep the tree shape in local state — the
      // rendering layer flattens it via `flattenCommentTree` when
      // feeding the global `CommentThread`.
      const newCommentObj = {
        id: dto.commentId,
        userId: dto.userId,
        username: dto.username || null,
        user: getDisplayName({
          userFirstName: dto.userFirstName,
          userLastName: dto.userLastName,
          username: dto.username,
        }, getDisplayName(user, "Utilizador")),
        userProfilePicture: dto.userProfilePhoto || user.profilePicture || null,
        text: dto.content,
        createdAt: dto.createdAt,
        likes: dto.totalLikes || 0,
        currentUserLiked: dto.userLiked || false,
        replies: dto.replies || [],
      };

      if (parentCommentId == null) {
        setQuestions((prev) => prev.map((q) =>
          q.id === questionId
            ? { ...q, comments: [...q.comments, newCommentObj], totalComments: (q.totalComments || 0) + 1 }
            : q
        ));
        setNewComment((prev) => ({ ...prev, [questionId]: "" }));
        toast.success("Comentário adicionado.");
      } else {
        const addReply = (comments) => comments.map((c) =>
          c.id === parentCommentId
            ? { ...c, replies: [...(c.replies || []), newCommentObj] }
            : { ...c, replies: addReply(c.replies || []) }
        );
        setQuestions((prev) => prev.map((q) =>
          q.id === questionId
            ? { ...q, comments: addReply(q.comments), totalComments: (q.totalComments || 0) + 1 }
            : q
        ));
        toast.success("Resposta adicionada.");
      }
      setError("");
    } catch (err) {
      console.error("Erro ao adicionar comentário:", err);
      toast.danger("Erro ao adicionar comentário.");
    }
  }, [user, toast]);

  const handleLikeQuestion = useCallback(async (questionId) => {
    if (!user) {
      toast.danger("Inicie sessão para gostar!");
      return;
    }
    const isLiked = likedQuestions.includes(questionId);
    setLikedQuestions((prev) => (isLiked ? prev.filter((id) => id !== questionId) : [...prev, questionId]));
    setQuestions((prev) => prev.map((q) =>
      q.id === questionId
        ? { ...q, likes: q.likes + (isLiked ? -1 : 1), currentUserLiked: !isLiked }
        : q
    ));
    try {
      if (isLiked) await api.delete(`/forum/questions/${questionId}/like`);
      else await api.post(`/forum/questions/${questionId}/like`);
    } catch (err) {
      setLikedQuestions((prev) => (isLiked ? [...prev, questionId] : prev.filter((id) => id !== questionId)));
      setQuestions((prev) => prev.map((q) =>
        q.id === questionId
          ? { ...q, likes: q.likes + (isLiked ? 1 : -1), currentUserLiked: isLiked }
          : q
      ));
      toast.danger("Erro ao processar gosto.");
    }
  }, [user, likedQuestions, toast]);

  const handleLikeComment = useCallback(async (commentId, questionId) => {
    if (!user) {
      toast.danger("Inicie sessão para gostar!");
      return;
    }
    const isLiked = likedComments.includes(commentId);
    setLikedComments((prev) => (isLiked ? prev.filter((id) => id !== commentId) : [...prev, commentId]));
    // Round 86 — `updateLikesInTree` also flips `currentUserLiked` on the
    // affected comment (and its matching reply). The shared
    // <CommentThread> renders each comment with `currentUserLiked`
    // driving the heart icon — without this flip the heart stays
    // outline even after the like succeeds, and the user thinks
    // their click "didn't work". Now the heart turns red the same
    // way the post heart does, instantly.
    const updateLikesInTree = (comments) => comments.map((c) =>
      c.id === commentId
        ? { ...c, likes: c.likes + (isLiked ? -1 : 1), currentUserLiked: !isLiked }
        : { ...c, replies: updateLikesInTree(c.replies || []) }
    );
    setQuestions((prev) => prev.map((q) =>
      q.id === questionId ? { ...q, comments: updateLikesInTree(q.comments) } : q
    ));
    try {
      if (isLiked) await api.delete(`/forum/comments/${commentId}/like`);
      else await api.post(`/forum/comments/${commentId}/like`);
    } catch (err) {
      setLikedComments((prev) => (isLiked ? [...prev, commentId] : prev.filter((id) => id !== commentId)));
      const revertLikes = (comments) => comments.map((c) =>
        c.id === commentId
          ? { ...c, likes: c.likes + (isLiked ? 1 : -1), currentUserLiked: isLiked }
          : { ...c, replies: revertLikes(c.replies || []) }
      );
      setQuestions((prev) => prev.map((q) =>
        q.id === questionId ? { ...q, comments: revertLikes(q.comments) } : q
      ));
      toast.danger("Erro ao processar gosto.");
    }
  }, [user, likedComments, toast]);

  const handleDeleteQuestion = useCallback(async (questionId) => {
    if (!window.confirm("Tem a certeza que quer eliminar esta pergunta?")) return;
    try {
      await api.delete(`/forum/questions/${questionId}`);
      setMyQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setMyTotal((prev) => Math.max(0, prev - 1));
      setAllTotal((prev) => Math.max(0, prev - 1));
      toast.success("Pergunta eliminada.");
    } catch (err) {
      console.error("Erro ao eliminar pergunta:", err);
      toast.danger("Erro ao eliminar pergunta.");
    }
  }, [toast]);

  const handleDeleteComment = useCallback(async (commentId, questionId) => {
    if (!window.confirm("Tem a certeza que quer eliminar este comentário?")) return;
    try {
      await api.delete(`/forum/comments/${commentId}`);
      // Global rule (matches Home feed + TravelDetails): deleting a
      // parent does NOT cascade-delete its replies. The replies are
      // re-parented to the top level so the conversation stays
      // coherent. The deleted comment itself is removed; the count
      // drops by exactly 1.
      setQuestions((prev) => prev.map((q) => {
        if (q.id !== questionId) return q;
        const reparent = (list) => list
          .filter((c) => c.id !== commentId)
          .map((c) => {
            if (c.replies?.some((r) => r.id === commentId)) {
              return { ...c, replies: c.replies.filter((r) => r.id !== commentId) };
            }
            return { ...c, replies: reparent(c.replies || []) };
          });
        // Also lift any direct children of the deleted comment to top level.
        const findChildren = (list) => {
          for (const c of list) {
            if (c.id === commentId) return c.replies || [];
            const found = findChildren(c.replies || []);
            if (found.length) return found;
          }
          return [];
        };
        const orphans = findChildren(q.comments || []);
        return {
          ...q,
          comments: [...reparent(q.comments || []), ...orphans],
          totalComments: Math.max(0, (q.totalComments || 1) - 1),
        };
      }));
      toast.success("Comentário eliminado.");
    } catch (err) {
      console.error("Erro ao eliminar comentário:", err);
      toast.danger("Erro ao eliminar comentário.");
    }
  }, [toast]);

  const fetchQuestionComments = useCallback(async (questionId) => {
    setCommentsLoading((prev) => ({ ...prev, [questionId]: true }));
    try {
      // size=100 so a single fetch covers typical Q&A threads
      // (the backend returns comments + nested replies in a single
      // tree-shaped payload). The user previously reported that
      // not all replies were loading — bumping the page size and
      // following the page cursor is the safest fix.
      const { data } = await api.get(`/forum/questions/${questionId}/comments?page=0&size=100`);
      const transformComment = (dto) => ({
        id: dto.commentId,
        userId: dto.userId,
        // Round 83 — propagate the `username` so the comment
        // avatar + name can link to the author's profile.
        username: dto.username || null,
        user: getDisplayName({
          userFirstName: dto.userFirstName,
          userLastName: dto.userLastName,
          username: dto.username,
        }, "Utilizador"),
        userProfilePicture: dto.userProfilePhoto || null,
        text: dto.content,
        createdAt: dto.createdAt,
        likes: dto.totalLikes || 0,
        currentUserLiked: dto.userLiked || false,
        replies: (dto.replies || []).map(transformComment),
      });
      const comments = (data.content || []).map(transformComment);
      const likedIds = [];
      const collectLiked = (list) => list.forEach((c) => {
        if (c.currentUserLiked) likedIds.push(c.id);
        collectLiked(c.replies || []);
      });
      collectLiked(comments);
      setLikedComments((prev) => [...new Set([...prev, ...likedIds])]);
      setQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, comments } : q)));
      setMyQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, comments } : q)));
    } catch (err) {
      console.error("Erro ao carregar comentários:", err);
    } finally {
      setCommentsLoading((prev) => ({ ...prev, [questionId]: false }));
    }
  }, []);

  const toggleSection = (questionId) => {
    const key = `question-${questionId}`;
    const isCurrentlyOpen = expandedSections[key];
    setExpandedSections((prev) => ({ ...prev, [key]: !isCurrentlyOpen }));
    if (!isCurrentlyOpen) {
      const q = questions.find((q) => q.id === questionId) || myQuestions.find((q) => q.id === questionId);
      if (q && q.comments.length === 0) fetchQuestionComments(questionId);
    }
  };

  const toggleReply = (key) => setReplyOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  /* The per-comment row is now rendered by the global CommentThread
     component for visual parity with the Home feed and the
     TravelDetails page. The local `questions` state still holds the
     tree (`question.comments` with nested `replies`) so existing
     fetch / add / like / delete logic keeps working unchanged;
     `flattenCommentTree` is applied at render time to feed the
     shared component. */

  /* ── Render: question card ─────────────────────────── */
  const renderQuestionItem = useCallback((question, index, showDelete = false) => {
    const questionKey = `question-${question.id}`;
    const isLikedQuestion = likedQuestions.includes(question.id);
    // Same numeric-id normalisation as in renderComment.
    const numericUserId = user ? Number(user.id) : null;
    const numericOwnerId = question.userId != null ? Number(question.userId) : null;
    const isOwner = numericUserId != null
      && numericOwnerId != null
      && numericUserId === numericOwnerId;
    const commentsOpen = expandedSections[questionKey];
    const loadingComments = commentsLoading[question.id];
    // Flatten the comment tree for the shared CommentThread. The
    // local state still stores comments as a tree, but the
    // rendering layer treats them as a flat list.
    // The total count must reflect the backend's own counter
    // (totalComments) so the badge is accurate on the very first
    // render — the user shouldn't have to open the thread to see
    // how many comments a question has. We fall back to the
    // locally-flattened list length when the backend counter is
    // missing (older payloads).
    const flatComments = flattenCommentTree(question.comments || []);
    const backendCount = Number(question.totalComments || question.totalCommentCount || 0);
    const totalCount = Math.max(backendCount, flatComments.length);
    return (
      <motion.article
        key={question.id}
        data-question-id={question.id}
        className="gm-qa-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.4) }}
        layout
      >
        <header className="gm-qa-card__head">
          {/* Round 83 — the avatar + display name on the
             question card now link to the author's profile.
             We use a `Link` to `/profile/:username` when we
             have the handle; otherwise we fall back to a
             non-link wrapper (e.g. legacy questions posted
             before the `username` field was added). The
             inner <div> is the same layout the card had
             before, so the date / location / category row
             still sit next to the name. */}
          <div className="gm-qa-card__user">
            {question.username ? (
              <Link
                to={`/profile/${question.username}`}
                className="gm-qa-card__user-link"
                aria-label={`Ver perfil de ${question.user}`}
              >
                {question.userProfilePicture ? (
                  <img
                    key={question.userProfilePicture}
                    src={toFullMediaUrl(question.userProfilePicture)}
                    alt={question.user}
                    className="gm-qa-card__avatar"
                  />
                ) : (
                  <Avatar name={question.user} size="md" />
                )}
                <strong className="gm-qa-card__name">{question.user}</strong>
              </Link>
            ) : (
              <>
                {question.userProfilePicture ? (
                  <img
                    key={question.userProfilePicture}
                    src={toFullMediaUrl(question.userProfilePicture)}
                    alt={question.user}
                    className="gm-qa-card__avatar"
                  />
                ) : (
                  <Avatar name={question.user} size="md" />
                )}
                <strong className="gm-qa-card__name">{question.user}</strong>
              </>
            )}
            <div>
              <div className="gm-qa-card__meta">
                <span className="gm-qa-card__meta-item">
                  <Calendar size={11} strokeWidth={1.75} />
                  {safeLocaleString(question.createdAt, {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
                {(question.country || question.city) && (
                  <span className="gm-qa-card__meta-item">
                    <MapPin size={11} strokeWidth={1.75} />
                    {[question.country, question.city].filter(Boolean).join(' • ')}
                  </span>
                )}
                <span className="gm-qa-card__category">{question.category}</span>
              </div>
            </div>
          </div>

          {(showDelete || isOwner) && (
            <button
              type="button"
              className="gm-qa-card__delete"
              onClick={() => handleDeleteQuestion(question.id)}
              title="Eliminar pergunta"
            >
              <Trash2 size={14} strokeWidth={1.75} />
              <span>Eliminar</span>
            </button>
          )}
        </header>

        <div className="gm-qa-card__body">
          <h3 className="gm-qa-card__title">{question.question}</h3>

          <div className="gm-qa-card__stats">
            <button
              type="button"
              className={`gm-qa-stat ${isLikedQuestion ? "gm-qa-stat--liked" : ""}`}
              onClick={() => handleLikeQuestion(question.id)}
              aria-label={isLikedQuestion ? 'Remover gosto' : 'Dar gosto'}
              aria-pressed={isLikedQuestion}
            >
              <Heart size={15} strokeWidth={1.75} fill={isLikedQuestion ? "currentColor" : "none"} />
              <span>{question.likes}</span>
            </button>
            <button
              type="button"
              className={`gm-qa-stat ${commentsOpen ? "gm-qa-stat--open" : ""}`}
              onClick={() => toggleSection(question.id)}
              aria-label={commentsOpen ? 'Esconder comentários' : 'Ver comentários'}
              aria-pressed={commentsOpen}
            >
              <MessageCircle size={15} strokeWidth={1.75} />
              <span>{totalCount}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              className="gm-qa-comments"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <CommentThread
                isOpen
                onToggle={() => toggleSection(question.id)}
                comments={flatComments}
                currentUserId={user?.id}
                onLike={(c) => handleLikeComment(c.id, question.id)}
                onDelete={(c) => handleDeleteComment(c.id, question.id)}
                // Round 83 — clicking the avatar or the name of
                // a comment takes the viewer to the comment
                // author's profile. Falls back to `/profile/:id`
                // when the username isn't available.
                onUserClick={(c) => navigate(c.username ? `/profile/${c.username}` : `/profile/${c.userId}`)}
                loading={loadingComments}
                composer={{
                  author: {
                    name: getDisplayName(user, 'Você'),
                    src: user?.profilePhoto || user?.profilePicture,
                  },
                  value: newComment[question.id] || '',
                  onChange: (v) => setNewComment((prev) => ({ ...prev, [question.id]: v })),
                  onSubmit: (text) => handleCommentOrReply(question.id, null, text),
                  placeholder: 'Escreva a sua resposta...',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>
    );
  }, [expandedSections, commentsLoading, newComment, user, likedQuestions, handleLikeQuestion, handleDeleteQuestion, handleCommentOrReply, toggleSection]);

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="gm-qa">
      {/* Header (glass) — left title block removed (Round 33 cleanup) */}
      <div className="gm-qa__head">
        <div className="gm-qa__head-inner">
          <div className="gm-qa__head-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeSection === "all"}
              className={`gm-qa__head-tab ${activeSection === "all" ? "gm-qa__head-tab--active" : ""}`}
              onClick={() => setActiveSection("all")}
            >
              <Inbox size={14} strokeWidth={1.75} />
              <span>Todas</span>
              {allTotal > 0 && <span className="gm-qa__head-tab-count">{allTotal}</span>}
            </button>
            {user && (
              <button
                type="button"
                role="tab"
                aria-selected={activeSection === "mine"}
                className={`gm-qa__head-tab ${activeSection === "mine" ? "gm-qa__head-tab--active" : ""}`}
                onClick={() => setActiveSection("mine")}
              >
                <User size={14} strokeWidth={1.75} />
                <span>Minhas</span>
                {myTotal > 0 && <span className="gm-qa__head-tab-count">{myTotal}</span>}
              </button>
            )}
          </div>

          {user && (
            <button
              type="button"
              className="gm-qa__head-cta"
              onClick={() => setIsAskingQuestion((v) => !v)}
            >
              <Plus size={16} strokeWidth={2} />
              <span>{isAskingQuestion ? "Fechar" : "Fazer Pergunta"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="gm-qa__body">
        {/* Ask question card (collapsible) */}
        <AnimatePresence>
          {user && isAskingQuestion && (
            <motion.section
              className="gm-qa-ask"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <header className="gm-qa-ask__head">
                <div className="gm-qa-ask__head-icon">
                  <Sparkles size={16} strokeWidth={1.75} />
                </div>
                <h3>Nova Pergunta</h3>
              </header>

              <form onSubmit={handleAskQuestion} className="gm-qa-ask__form">
                <div className="gm-qa-ask__field gm-qa-ask__field--full">
                  <label htmlFor="gm-qa-question">Qual é a sua dúvida?</label>
                  <textarea
                    id="gm-qa-question"
                    value={newQuestion}
                    onChange={(e) => {
                      if (e.target.value.length <= 500) setNewQuestion(e.target.value);
                    }}
                    placeholder="Descreva a sua pergunta de forma clara e detalhada..."
                    className="gm-qa-textarea"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="gm-qa-ask__counter">{newQuestion.length}/500</div>
                </div>

                <div className="gm-qa-ask__row">
                  <div className="gm-qa-ask__field">
                    <label>Categoria</label>
                    <SearchableDropdown
                      options={CATEGORY_OPTIONS}
                      value={category}
                      onChange={(val) => setCategory(val || "")}
                      placeholder="Selecione uma categoria"
                    />
                  </div>
                  <div className="gm-qa-ask__field">
                    <label>País</label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={country}
                      onChange={(val) => setCountry(val || "")}
                      placeholder="Selecione um país"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="gm-qa-ask__error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                    >
                      <AlertCircle size={14} strokeWidth={1.75} />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="gm-qa-ask__actions">
                  <button
                    type="button"
                    className="gm-qa-btn gm-qa-btn--ghost"
                    onClick={() => setIsAskingQuestion(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="gm-qa-btn gm-qa-btn--primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={14} className="gm-qa-spin" /> A publicar...
                      </>
                    ) : (
                      <>
                        <Send size={14} strokeWidth={1.75} /> Publicar Pergunta
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Search + filters (sticky sub-bar) */}
        <div className="gm-qa__controls">
          <div className="gm-qa__search">
            <Search size={14} strokeWidth={1.75} className="gm-qa__search-icon" />
            <input
              type="text"
              placeholder="Pesquisar perguntas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gm-qa__search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="gm-qa__search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Limpar pesquisa"
              >
                <IconX size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="gm-qa__control-actions">
            <button
              type="button"
              className={`gm-qa__filter-toggle ${showFilters ? "gm-qa__filter-toggle--active" : ""}`}
              onClick={() => setShowFilters((v) => !v)}
            >
              <Filter size={14} strokeWidth={1.75} />
              <span>Filtros</span>
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            <div className="gm-qa__sort">
              <ArrowUpDown size={13} strokeWidth={1.75} />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="gm-qa__sort-select"
                aria-label="Ordenar por"
              >
                <option value="created_at">Mais recentes</option>
                <option value="total_comments">Mais comentadas</option>
                <option value="total_likes">Mais gostadas</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="gm-qa__filters"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <select
                value={filters.category}
                onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))}
                className="gm-qa__filter-select"
              >
                <option value="">Todas as categorias</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={filters.answered}
                onChange={(e) => setFilters((p) => ({ ...p, answered: e.target.value }))}
                className="gm-qa__filter-select"
              >
                <option value="">Todas as perguntas</option>
                <option value="yes">Com respostas</option>
                <option value="no">Sem respostas</option>
              </select>
              {(filters.category || filters.answered) && (
                <button
                  type="button"
                  className="gm-qa__filter-clear"
                  onClick={() => setFilters({ category: "", answered: "" })}
                >
                  <IconX size={12} strokeWidth={2} /> Limpar
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* List */}
        <div className="gm-qa__list">
          {isLoading && questions.length === 0 && myQuestions.length === 0 ? (
            <div className="gm-qa__loading">
              <div className="gm-qa-spinner gm-qa-spinner--lg" />
              <span>A carregar perguntas…</span>
            </div>
          ) : activeSection === "mine" ? (
            <>
              {myQuestions.length > 0 ? (
                <>
                  {myQuestions.map((q, i) => renderQuestionItem(q, i, true))}
                  {myPage + 1 < myTotalPages && (
                    <button
                      type="button"
                      className="gm-qa__load-more"
                      onClick={() => fetchMyQuestions(myPage + 1, true)}
                    >
                      Carregar mais perguntas
                    </button>
                  )}
                </>
              ) : (
                <div className="gm-qa__empty">
                  <div className="gm-qa__empty-icon">
                    <HelpCircle size={36} strokeWidth={1.5} />
                  </div>
                  <h3>Ainda não fez nenhuma pergunta</h3>
                  <p>Comece a interagir com a comunidade. Faça a sua primeira pergunta!</p>
                  <button
                    type="button"
                    className="gm-qa-btn gm-qa-btn--primary"
                    onClick={() => setIsAskingQuestion(true)}
                  >
                    <Plus size={14} strokeWidth={2} /> Fazer Primeira Pergunta
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {questions.length > 0 ? (
                <>
                  {questions.map((q, i) => renderQuestionItem(q, i))}
                  {allPage + 1 < allTotalPages && (
                    <button
                      type="button"
                      className="gm-qa__load-more"
                      onClick={() => fetchAllQuestions(allPage + 1, true)}
                    >
                      Carregar mais perguntas
                    </button>
                  )}
                </>
              ) : (
                <div className="gm-qa__empty">
                  <div className="gm-qa__empty-icon">
                    <Compass size={36} strokeWidth={1.5} />
                  </div>
                  <h3>Nenhuma pergunta encontrada</h3>
                  <p>Tente ajustar os filtros ou fazer uma nova pesquisa.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QandA;
