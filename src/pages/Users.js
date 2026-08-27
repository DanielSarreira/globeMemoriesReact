import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Users as UsersIcon, Flag, Ban, MoreHorizontal, Check, UserPlus,
  Clock, Sparkles, ChevronRight, ChevronLeft, X as IconX, AlertCircle,
  MapPin, Loader2, Compass,
} from "lucide-react";
import api, { toFullMediaUrl } from "../axios_helper";
import { useAuth } from "../context/AuthContext";
import { useToast, Avatar, FollowButton } from "../components/ui";
import { getDisplayName } from "../utils/userDisplay";
import useProfileUpdates from "../hooks/useProfileUpdates";
import { usersModalUtils } from "../utils/modalUtils";
import "../styles/pages/users.css";

/* ── Country code helper (ISO 3166-1 alpha-2 for flagcdn) ── */
function getCountryCode(countryName) {
  const map = {
    'Afeganistão': 'af', 'África do Sul': 'za', 'Albânia': 'al', 'Alemanha': 'de',
    'Andorra': 'ad', 'Angola': 'ao', 'Antígua e Barbuda': 'ag', 'Arábia Saudita': 'sa',
    'Argélia': 'dz', 'Argentina': 'ar', 'Armênia': 'am', 'Austrália': 'au',
    'Áustria': 'at', 'Azerbaijão': 'az', 'Bahamas': 'bs', 'Bangladesh': 'bd',
    'Barbados': 'bb', 'Bahrein': 'bh', 'Bélgica': 'be', 'Belize': 'bz', 'Benin': 'bj',
    'Bielorrússia': 'by', 'Bolívia': 'bo', 'Bósnia e Herzegovina': 'ba', 'Botsuana': 'bw',
    'Brasil': 'br', 'Brunei': 'bn', 'Bulgária': 'bg', 'Burquina Faso': 'bf', 'Burundi': 'bi',
    'Butão': 'bt', 'Cabo Verde': 'cv', 'Camarões': 'cm', 'Camboja': 'kh', 'Canadá': 'ca',
    'Catar': 'qa', 'Cazaquistão': 'kz', 'Chade': 'td', 'Chile': 'cl', 'China': 'cn',
    'Chipre': 'cy', 'Colômbia': 'co', 'Comores': 'km', 'Congo': 'cg',
    'República Democrática do Congo': 'cd', 'Coreia do Norte': 'kp', 'Coreia do Sul': 'kr',
    'Costa do Marfim': 'ci', 'Costa Rica': 'cr', 'Croácia': 'hr', 'Cuba': 'cu',
    'Dinamarca': 'dk', 'Djibuti': 'dj', 'Dominica': 'dm', 'Egito': 'eg', 'El Salvador': 'sv',
    'Emirados Árabes Unidos': 'ae', 'Equador': 'ec', 'Eritreia': 'er', 'Eslováquia': 'sk',
    'Eslovênia': 'si', 'Espanha': 'es', 'Estados Unidos': 'us', 'Estônia': 'ee', 'Etiópia': 'et',
    'Fiji': 'fj', 'Filipinas': 'ph', 'Finlândia': 'fi', 'França': 'fr', 'Gabão': 'ga',
    'Gâmbia': 'gm', 'Gana': 'gh', 'Geórgia': 'ge', 'Granada': 'gd', 'Grécia': 'gr',
    'Guatemala': 'gt', 'Guiana': 'gy', 'Guiné': 'gn', 'Guiné Equatorial': 'gq',
    'Guiné-Bissau': 'gw', 'Haiti': 'ht', 'Holanda': 'nl', 'Honduras': 'hn', 'Hungria': 'hu',
    'Iémen': 'ye', 'Ilhas Marshall': 'mh', 'Ilhas Maurício': 'mu', 'Ilhas Salomão': 'sb',
    'Índia': 'in', 'Indonésia': 'id', 'Irã': 'ir', 'Iraque': 'iq', 'Irlanda': 'ie',
    'Islândia': 'is', 'Israel': 'il', 'Itália': 'it', 'Jamaica': 'jm', 'Japão': 'jp',
    'Jordânia': 'jo', 'Kiribati': 'ki', 'Kosovo': 'xk', 'Kuwait': 'kw', 'Laos': 'la',
    'Lesoto': 'ls', 'Letônia': 'lv', 'Líbano': 'lb', 'Libéria': 'lr', 'Líbia': 'ly',
    'Liechtenstein': 'li', 'Lituânia': 'lt', 'Luxemburgo': 'lu', 'Macedônia do Norte': 'mk',
    'Madagáscar': 'mg', 'Malásia': 'my', 'Malawi': 'mw', 'Maldivas': 'mv', 'Mali': 'ml',
    'Malta': 'mt', 'Marrocos': 'ma', 'Mauritânia': 'mr', 'México': 'mx', 'Micronésia': 'fm',
    'Moçambique': 'mz', 'Moldávia': 'md', 'Mônaco': 'mc', 'Mongólia': 'mn', 'Montenegro': 'me',
    'Myanmar': 'mm', 'Namíbia': 'na', 'Nauru': 'nr', 'Nepal': 'np', 'Nicarágua': 'ni',
    'Níger': 'ne', 'Nigéria': 'ng', 'Noruega': 'no', 'Nova Zelândia': 'nz', 'Omã': 'om',
    'Países Baixos': 'nl', 'Palau': 'pw', 'Palestina': 'ps', 'Panamá': 'pa',
    'Papua-Nova Guiné': 'pg', 'Paquistão': 'pk', 'Paraguai': 'py', 'Peru': 'pe',
    'Polônia': 'pl', 'Portugal': 'pt', 'Quênia': 'ke', 'Quirguistão': 'kg', 'Reino Unido': 'gb',
    'República Centro-Africana': 'cf', 'República Checa': 'cz', 'República Dominicana': 'do',
    'Romênia': 'ro', 'Ruanda': 'rw', 'Rússia': 'ru', 'Saara Ocidental': 'eh',
    'Saint Kitts e Nevis': 'kn', 'Saint Vincent e Granadinas': 'vc', 'Samoa': 'ws',
    'San Marino': 'sm', 'Santa Lúcia': 'lc', 'São Tomé e Príncipe': 'st', 'Senegal': 'sn',
    'Serra Leoa': 'sl', 'Sérvia': 'rs', 'Singapura': 'sg', 'Síria': 'sy', 'Somália': 'so',
    'Sri Lanka': 'lk', 'Suazilândia': 'sz', 'Sudão': 'sd', 'Sudão do Sul': 'ss', 'Suécia': 'se',
    'Suíça': 'ch', 'Suriname': 'sr', 'Tailândia': 'th', 'Taiwan': 'tw', 'Tajiquistão': 'tj',
    'Tanzânia': 'tz', 'Timor-Leste': 'tl', 'Togo': 'tg', 'Tonga': 'to', 'Trindade e Tobago': 'tt',
    'Tunísia': 'tn', 'Turcomenistão': 'tm', 'Turquia': 'tr', 'Tuvalu': 'tv', 'Ucrânia': 'ua',
    'Uganda': 'ug', 'Uruguai': 'uy', 'Uzbequistão': 'uz', 'Vanuatu': 'vu', 'Vaticano': 'va',
    'Venezuela': 've', 'Vietnã': 'vn', 'Zâmbia': 'zm', 'Zimbábue': 'zw',
    'Outros': 'un', 'Desconhecido': 'un',
  };
  if (!countryName) return 'un';
  if (map[countryName]) return map[countryName];
  const norm = countryName.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  for (const key of Object.keys(map)) {
    const k = key.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    if (k === norm) return map[key];
  }
  return 'un';
}

/* ── Sanitize search ───────────────────────────────────── */
function sanitizeSearchInput(input) {
  if (!input) return "";
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[<>]/g, "");
}

const REPORT_REASONS = [
  { key: "inappropriate", label: "Conteúdo inapropriado", description: "Imagens, descrições ou publicações ofensivas, nudez, etc." },
  { key: "falseInfo", label: "Informação falsa ou enganosa", description: "Viagens inventadas, perfis falsos, dados incorretos." },
  { key: "abusive", label: "Comportamento abusivo", description: "Linguagem agressiva, insultos, bullying, provocações." },
  { key: "spam", label: "Spam ou autopromoção", description: "Publicidade excessiva, links externos, promoção constante." },
  { key: "identity", label: "Roubo de identidade", description: "Uso de fotos ou informações de outra pessoa sem autorização." },
  { key: "harassment", label: "Assédio ou comportamento inadequado", description: "Mensagens, comentários ou perseguição indesejada." },
  { key: "other", label: "Outro (especificar)", description: "Outro motivo que não se enquadra nas opções acima." },
];

/* ── Component ─────────────────────────────────────────── */
const UsersPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  /* Feed state */
  const [usersList, setUsersList] = useState([]);
  const [followingStatusById, setFollowingStatusById] = useState({});
  const [pendingStatusById, setPendingStatusById] = useState({});
  const [followActionLoadingById, setFollowActionLoadingById] = useState({});

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("followers");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  /* Dropdown / modals */
  const [showDropdown, setShowDropdown] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRequestToast, setShowRequestToast] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportReasons, setReportReasons] = useState(
    REPORT_REASONS.reduce((acc, r) => ({ ...acc, [r.key]: false }), {})
  );
  const [otherReason, setOtherReason] = useState("");

  /* Blocked users */
  const [blockedUsers, setBlockedUsers] = useState([]);

  /* Welcome modal */
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => usersModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const currentUserId = user?.id ? Number(user.id) : null;

  /* ── Country list (unique, sorted) ──────────────────── */
  const countryList = useMemo(() => {
    const set = new Set(usersList.map((u) => u.nationality).filter(Boolean));
    return Array.from(set).sort();
  }, [usersList]);

  /* ── Fetch discoverable users ───────────────────────── */
  // Bump on profile updates so the user list refetches when
  // someone changes their name (the /users/discover endpoint
  // returns the live firstName/lastName so the cards always
  // show the fresh name).
  const [usersVersion, setUsersVersion] = useState(0);
  useProfileUpdates({ onUpdate: () => setUsersVersion((v) => v + 1) });
  useEffect(() => {
    if (!user) {
      setUsersList([]);
      setTotalPages(0);
      setTotalElements(0);
      setLoadingUsers(false);
      return;
    }
    let cancel = false;
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const params = { sortBy: sortOption, page, size };
        if (selectedCountry) params.nationality = selectedCountry;
        if (searchTerm.trim()) params.username = searchTerm.trim();
        const { data } = await api.get("/users/discover", { params });
        if (cancel) return;
        const content = Array.isArray(data.content) ? data.content : [];
        const mapped = content.map((b) => {
          const fullName = getDisplayName(b, b.username);
          return {
            id: b.id,
            username: b.username,
            name: fullName,
            nationality: b.nationality || "Desconhecido",
            // Only set profilePicture when the backend actually
            // returned one. The Avatar component will fall back to
            // initials on its own when `src` is null — we must NOT
            // inject a local mock image here, otherwise users with
            // no photo would see a generic placeholder forever.
            profilePicture: b.profilePhoto ? toFullMediaUrl(b.profilePhoto) : null,
            travelCount: b.totalTripPosts || 0,
            followersCount: b.followersCount || 0,
            privacy: b.privacy || "public",
          };
        });
        setUsersList(mapped);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        if (cancel) return;
        console.error("Erro ao descobrir viajantes:", err);
        toast.danger("Não foi possível carregar os viajantes neste momento.");
        setUsersList([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        if (!cancel) setLoadingUsers(false);
      }
    };
    fetchUsers();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, sortOption, selectedCountry, searchTerm, page, size, toast, usersVersion]);

  /* ── Load relationship status per user ──────────────── */
  useEffect(() => {
    const loadRelationships = async () => {
      if (!currentUserId || usersList.length === 0) {
        setFollowingStatusById({});
        setPendingStatusById({});
        return;
      }
      const nextFollow = {};
      const nextPending = {};
      await Promise.all(usersList.map(async (u) => {
        try {
          const { data: isF } = await api.get("/users/is-following", {
            params: { followerId: currentUserId, followedId: u.id },
          });
          const following = Boolean(isF);
          nextFollow[u.id] = following;
          if (following) {
            nextPending[u.id] = false;
            return;
          }
          const { data: isP } = await api.get("/users/follow-request-status", {
            params: { requesterId: currentUserId, targetId: u.id },
          });
          nextPending[u.id] = Boolean(isP);
        } catch {
          nextFollow[u.id] = false;
          nextPending[u.id] = false;
        }
      }));
      setFollowingStatusById(nextFollow);
      setPendingStatusById(nextPending);
    };
    loadRelationships();
  }, [currentUserId, usersList]);

  /* ── Blocked users ──────────────────────────────────── */
  useEffect(() => {
    const loadBlocked = async () => {
      if (!currentUserId || !user) {
        setBlockedUsers([]);
        return;
      }
      try {
        const { data } = await api.get("/users-management/blocked-list");
        const list = Array.isArray(data) ? data : [];
        setBlockedUsers(list.map((u) => u.username || u));
      } catch (err) {
        console.error("Erro ao carregar utilizadores bloqueados:", err);
        setBlockedUsers([]);
      }
    };
    loadBlocked();
  }, [currentUserId, user]);

  /* ── Click outside to close dropdown ────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(null);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showDropdown]);

  /* ── Handlers ───────────────────────────────────────── */
  const refreshRelationshipStatus = useCallback(async (targetUserId) => {
    if (!currentUserId || !targetUserId) return null;
    try {
      const { data: isF } = await api.get("/users/is-following", {
        params: { followerId: currentUserId, followedId: targetUserId },
      });
      const following = Boolean(isF);
      setFollowingStatusById((p) => ({ ...p, [targetUserId]: following }));
      if (following) {
        setPendingStatusById((p) => ({ ...p, [targetUserId]: false }));
        return { isFollowing: true, isPending: false };
      }
      const { data: isP } = await api.get("/users/follow-request-status", {
        params: { requesterId: currentUserId, targetId: targetUserId },
      });
      const pending = Boolean(isP);
      setPendingStatusById((p) => ({ ...p, [targetUserId]: pending }));
      return { isFollowing: false, isPending: pending };
    } catch (err) {
      console.error("Erro ao verificar estado de seguimento:", err);
      return null;
    }
  }, [currentUserId]);

  // Os handlers de seguir / deixar de seguir / cancelar pedido
  // foram substituídos pelo `FollowButton` partilhado
  // (components/ui/FollowButton.jsx + hooks/useFollowRelationship.js).
  // Mantemos aqui só o `handleUnblock` que continua a ser usado
  // no card quando o user está bloqueado.

  const handleUnblock = async (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!targetUser) return;
    setFollowActionLoadingById((p) => ({ ...p, [targetUser.id]: true }));
    try {
      await api.delete(`/users-management/${targetUser.id}/unblock`);
      setBlockedUsers((prev) => prev.filter((u) => u !== targetUser.username));
      toast.success(`${targetUser.username} foi desbloqueado.`);
    } catch (err) {
      console.error("Erro ao desbloquear:", err);
      toast.danger("Não foi possível desbloquear este viajante.");
    } finally {
      setFollowActionLoadingById((p) => ({ ...p, [targetUser.id]: false }));
    }
  };

  const handleSearchChange = (e) => {
    const raw = e.target.value;
    if (raw.length > 50) {
      toast.danger("Pesquisa não pode exceder 50 caracteres.");
      return;
    }
    const clean = sanitizeSearchInput(raw);
    if (clean !== raw && raw !== "") {
      toast.danger("Pesquisa contém caracteres não permitidos que foram removidos.");
    }
    setSearchTerm(clean);
    setPage(0);
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setPage(0);
  };

  const handleCountryFilterChange = (country) => {
    setSelectedCountry((prev) => (prev === country ? "" : country));
    setPage(0);
  };

  const handleReportUser = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.danger("Inicie sessão para denunciar viajantes.");
      return;
    }
    setSelectedUser(targetUser);
    setShowReportModal(true);
    setShowDropdown(null);
  };

  const handleBlockUser = (targetUser, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.danger("Inicie sessão para bloquear viajantes.");
      return;
    }
    setSelectedUser(targetUser);
    setShowBlockModal(true);
    setShowDropdown(null);
  };

  const handleReasonChange = (reason) => {
    setReportReasons((p) => ({ ...p, [reason]: !p[reason] }));
  };

  const confirmReportUser = () => {
    if (!selectedUser) return;
    const hasReason = Object.entries(reportReasons).some(([k, v]) => k === "other" ? v && otherReason.trim() : v);
    if (!hasReason) {
      toast.danger("Por favor, selecione pelo menos um motivo.");
      return;
    }
    toast.success("Viajante denunciado com sucesso!");
    setShowReportModal(false);
    setSelectedUser(null);
    setReportReasons(REPORT_REASONS.reduce((acc, r) => ({ ...acc, [r.key]: false }), {}));
    setOtherReason("");
  };

  const confirmBlockUser = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/users-management/${selectedUser.id}/block`);
      setBlockedUsers((p) => [...p, selectedUser.username]);
      toast.success("Viajante bloqueado com sucesso!");
      setShowBlockModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Erro ao bloquear:", err);
      toast.danger("Não foi possível bloquear este viajante.");
    }
  };

  const toggleDropdown = (userId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown((p) => (p === userId ? null : userId));
  };

  const closeWelcome = () => {
    if (dontShowAgain) usersModalUtils.dismiss();
    setShowWelcomeModal(false);
  };

  const visibleUsers = usersList;

  /* ── Render ────────────────────────────────────────── */
  return (
    <div className="gm-users">
      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            className="gm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWelcome}
          >
            <motion.div
              className="gm-modal__panel gm-users-welcome"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="gm-modal__close" aria-label="Fechar" onClick={closeWelcome}>
                <IconX size={18} strokeWidth={1.75} />
              </button>
              <div className="gm-users-welcome__hero">
                <div className="gm-users-welcome__icon"><UsersIcon size={36} strokeWidth={1.5} /></div>
                <h2>Rede Social de Viajantes</h2>
                <p>Conecte-se a uma comunidade global de exploradores, descubra companheiros de viagem e partilhe experiências.</p>
              </div>
              <div className="gm-users-welcome__features">
                <div className="gm-users-welcome__feature">
                  <span className="gm-users-welcome__feature-icon"><Compass size={18} strokeWidth={1.75} /></span>
                  <div>
                    <strong>Pesquisa global</strong>
                    <p>Encontre utilizadores por nome, nacionalidade ou interesses em comum.</p>
                  </div>
                </div>
                <div className="gm-users-welcome__feature">
                  <span className="gm-users-welcome__feature-icon"><UserPlus size={18} strokeWidth={1.75} /></span>
                  <div>
                    <strong>Sistema de seguir</strong>
                    <p>Siga viajantes e veja as suas aventuras no seu feed.</p>
                  </div>
                </div>
                <div className="gm-users-welcome__feature">
                  <span className="gm-users-welcome__feature-icon"><Search size={18} strokeWidth={1.75} /></span>
                  <div>
                    <strong>Filtros avançados</strong>
                    <p>Procure por país, popularidade ou atividade.</p>
                  </div>
                </div>
                <div className="gm-users-welcome__feature">
                  <span className="gm-users-welcome__feature-icon"><Sparkles size={18} strokeWidth={1.75} /></span>
                  <div>
                    <strong>Ambiente seguro</strong>
                    <p>Sistema completo de denúncias e bloqueios para uma comunidade saudável.</p>
                  </div>
                </div>
              </div>
              <div className="gm-users-welcome__footer">
                <label className="gm-users-welcome__check">
                  <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
                  <span>Não mostrar novamente esta mensagem</span>
                </label>
                <button type="button" className="gm-users-welcome__cta" onClick={closeWelcome}>
                  Descobrir viajantes!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request sent toast (small inline chip) */}
      <AnimatePresence>
        {showRequestToast && (
          <motion.div
            className="gm-users-request-chip"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <Clock size={14} strokeWidth={1.75} />
            Pedido enviado
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (glass) */}
      <div className="gm-users__head">
        <div className="gm-users__head-icon">
          <UsersIcon size={20} strokeWidth={1.75} />
        </div>
        <div className="gm-users__head-info">
          <h1 className="gm-users__head-title">Descobrir Viajantes</h1>
          <p className="gm-users__head-sub">
            {totalElements > 0
              ? `${totalElements} ${totalElements === 1 ? "viajante" : "viajantes"} na comunidade`
              : "A carregar comunidade..."}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="gm-users__body">
        {/* Controls */}
        <div className="gm-users__controls">
          <div className="gm-users__search">
            <Search size={14} strokeWidth={1.75} className="gm-users__search-icon" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou username..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="gm-users__search-input"
              maxLength={50}
            />
            {searchTerm && (
              <button
                type="button"
                className="gm-users__search-clear"
                aria-label="Limpar"
                onClick={() => { setSearchTerm(""); setPage(0); }}
              >
                <IconX size={12} strokeWidth={2} />
              </button>
            )}
          </div>

          <div className="gm-users__sort">
            <button
              type="button"
              className={`gm-users__sort-btn ${sortOption === "followers" ? "gm-users__sort-btn--active" : ""}`}
              onClick={() => handleSortChange("followers")}
            >
              Mais Seguidos
            </button>
            <button
              type="button"
              className={`gm-users__sort-btn ${sortOption === "trips" ? "gm-users__sort-btn--active" : ""}`}
              onClick={() => handleSortChange("trips")}
            >
              Mais Viagens
            </button>
          </div>
        </div>

        {/* Country filter chips */}
        {countryList.length > 0 && (
          <div className="gm-users__countries">
            <span className="gm-users__countries-label">
              <MapPin size={12} strokeWidth={1.75} /> Filtrar por país
            </span>
            <div className="gm-users__country-list">
              <button
                type="button"
                className={`gm-users__country-chip ${!selectedCountry ? "gm-users__country-chip--active" : ""}`}
                onClick={() => { setSelectedCountry(""); setPage(0); }}
              >
                Todos
              </button>
              {countryList.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`gm-users__country-chip ${selectedCountry === c ? "gm-users__country-chip--active" : ""}`}
                  onClick={() => handleCountryFilterChange(c)}
                >
                  <img
                    src={`https://flagcdn.com/24x18/${getCountryCode(c)}.png`}
                    alt={c}
                    className="gm-users__country-flag"
                  />
                  <span>{c}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {loadingUsers ? (
          <div className="gm-users__loading">
            <Loader2 size={28} className="gm-users__spin" strokeWidth={1.5} />
            <span>A descobrir viajantes...</span>
          </div>
        ) : visibleUsers.length > 0 ? (
          <div className="gm-users__grid">
            {visibleUsers.map((u) => {
              const isFollowing = followingStatusById[u.id];
              const isPending = pendingStatusById[u.id];
              const isBlocked = blockedUsers.includes(u.username);
              const flag = getCountryCode(u.nationality);
              const showDropdownForUser = showDropdown === u.id;

              return (
                <article key={u.id} className={`gm-user-card ${isBlocked ? "gm-user-card--blocked" : ""}`}>
                  <Link to={`/profile/${u.username}`} className="gm-user-card__cover">
                    <div className="gm-user-card__cover-grad" />
                  </Link>

                  <div className="gm-user-card__avatar-wrap">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt={u.username} className="gm-user-card__avatar" />
                    ) : (
                      <Avatar name={u.name} size="lg" />
                    )}
                    {isFollowing && !isBlocked && (
                      <span className="gm-user-card__following-badge" title="A seguir">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  <div className="gm-user-card__body">
                    <Link to={`/profile/${u.username}`} className="gm-user-card__name">
                      {u.name}
                    </Link>
                    <span className="gm-user-card__handle">@{u.username}</span>

                    {u.nationality && u.nationality !== "Desconhecido" && (
                      <div className="gm-user-card__location">
                        <img
                          src={`https://flagcdn.com/24x18/${flag}.png`}
                          alt={u.nationality}
                          className="gm-user-card__flag"
                        />
                        <span>{u.nationality}</span>
                      </div>
                    )}

                    <div className="gm-user-card__stats">
                      <div className="gm-user-card__stat">
                        <strong>{u.travelCount}</strong>
                        <span>Viagens</span>
                      </div>
                      <div className="gm-user-card__stat">
                        <strong>{u.followersCount || 0}</strong>
                        <span>Seguidores</span>
                      </div>
                    </div>

                    {isBlocked && (
                      <div className="gm-user-card__blocked-banner">
                        <Ban size={12} strokeWidth={1.75} /> Bloqueou este viajante
                      </div>
                    )}

                    {/* Actions */}
                    {user && (
                      <div className="gm-user-card__actions">
                        {isBlocked ? (
                          <button
                            type="button"
                            className="gm-user-card__btn gm-user-card__btn--accent"
                            onClick={(e) => handleUnblock(u, e)}
                            disabled={Boolean(followActionLoadingById[u.id])}
                          >
                            {followActionLoadingById[u.id] ? "A processar..." : "Desbloquear"}
                          </button>
                        ) : (
                          <FollowButton
                            userId={u.id}
                            username={u.username}
                            privateProfile={Boolean(u.privateProfile)}
                            initialIsFollowing={isFollowing}
                            initialIsPending={isPending}
                            size="sm"
                            className="gm-user-card__btn"
                            onChange={(state) => {
                              // Mantém o mapa local em sincronia para que
                              // a próxima renderização do card leia o
                              // estado correto (a UI dos botões é
                              // controlada pelo próprio FollowButton;
                              // aqui só mantemos a cache consistente).
                              if (state === 'following') {
                                setFollowingStatusById((prev) => ({ ...prev, [u.id]: true }));
                                setPendingStatusById((prev) => { const n = { ...prev }; delete n[u.id]; return n; });
                              } else if (state === 'pending') {
                                setFollowingStatusById((prev) => { const n = { ...prev }; delete n[u.id]; return n; });
                                setPendingStatusById((prev) => ({ ...prev, [u.id]: true }));
                              } else if (state === 'not_following') {
                                setFollowingStatusById((prev) => { const n = { ...prev }; delete n[u.id]; return n; });
                                setPendingStatusById((prev) => { const n = { ...prev }; delete n[u.id]; return n; });
                              }
                            }}
                          />
                        )}

                        <div className="gm-user-card__menu-wrap" ref={showDropdownForUser ? dropdownRef : null}>
                          <button
                            type="button"
                            className="gm-user-card__menu"
                            onClick={(e) => toggleDropdown(u.id, e)}
                            aria-label="Mais opções"
                            aria-expanded={showDropdownForUser}
                          >
                            <MoreHorizontal size={15} strokeWidth={1.75} />
                          </button>
                          <AnimatePresence>
                            {showDropdownForUser && (
                              <motion.div
                                className="gm-user-card__menu-list"
                                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                                transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                                role="menu"
                              >
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="gm-user-card__menu-item gm-user-card__menu-item--danger"
                                  onClick={(e) => handleReportUser(u, e)}
                                >
                                  <Flag size={14} strokeWidth={1.75} /> Denunciar
                                </button>
                                <button
                                  type="button"
                                  role="menuitem"
                                  className="gm-user-card__menu-item gm-user-card__menu-item--danger"
                                  onClick={(e) => handleBlockUser(u, e)}
                                >
                                  <Ban size={14} strokeWidth={1.75} /> Bloquear
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="gm-users__empty">
            <div className="gm-users__empty-icon">
              <Compass size={36} strokeWidth={1.5} />
            </div>
            <h3>Nenhum viajante encontrado</h3>
            <p>
              {searchTerm || selectedCountry
                ? "Tente ajustar os filtros ou a pesquisa."
                : "A nossa comunidade está a crescer — volte em breve!"}
            </p>
            {(searchTerm || selectedCountry) && (
              <button
                type="button"
                className="gm-profile__btn gm-profile__btn--primary"
                onClick={() => { setSearchTerm(""); setSelectedCountry(""); setPage(0); }}
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loadingUsers && totalPages > 1 && (
          <div className="gm-users__pagination">
            <button
              type="button"
              className="gm-users__page-btn"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              aria-label="Página anterior"
            >
              <ChevronLeft size={14} strokeWidth={1.75} /> Anterior
            </button>
            <span className="gm-users__page-info">
              Página <strong>{page + 1}</strong> de {totalPages}
            </span>
            <button
              type="button"
              className="gm-users__page-btn"
              onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
              disabled={page + 1 >= totalPages}
              aria-label="Próxima página"
            >
              Próxima <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>
      {/* Report modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            className="gm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              className="gm-modal__panel gm-confirm-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="gm-modal__close" aria-label="Fechar" onClick={() => setShowReportModal(false)}>
                <IconX size={18} strokeWidth={1.75} />
              </button>
              <h3>Denunciar viajante</h3>
              <p>Porque deseja denunciar <strong>{selectedUser?.username}</strong>?</p>
              <div className="gm-users__reasons">
                {REPORT_REASONS.map((r) => (
                  <label key={r.key} className={`gm-opt ${reportReasons[r.key] ? "gm-opt--active" : ""}`}>
                    <div className="gm-opt__indicator">
                      {reportReasons[r.key] && <Check size={12} strokeWidth={2.5} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={reportReasons[r.key]}
                      onChange={() => handleReasonChange(r.key)}
                      className="gm-opt__native"
                    />
                    <div className="gm-opt__body">
                      <strong>{r.label}</strong>
                      {r.description && <span>{r.description}</span>}
                    </div>
                  </label>
                ))}
                {reportReasons.other && (
                  <textarea
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value)}
                    placeholder="Descreva o motivo da denúncia..."
                    rows={3}
                    className="gm-users__other-textarea"
                  />
                )}
              </div>
              <div className="gm-confirm-modal__actions">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--ghost"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReasons(REPORT_REASONS.reduce((acc, r) => ({ ...acc, [r.key]: false }), {}));
                    setOtherReason("");
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--danger"
                  onClick={confirmReportUser}
                >
                  <Flag size={14} strokeWidth={1.75} /> Denunciar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Block modal */}
      <AnimatePresence>
        {showBlockModal && (
          <motion.div
            className="gm-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowBlockModal(false)}
          >
            <motion.div
              className="gm-modal__panel gm-confirm-modal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="gm-modal__close" aria-label="Fechar" onClick={() => setShowBlockModal(false)}>
                <IconX size={18} strokeWidth={1.75} />
              </button>
              <h3>Bloquear viajante</h3>
              <p>Tem certeza que quer bloquear <strong>{selectedUser?.username}</strong>? Não verá mais este viajante na lista e ele não poderá interagir consigo.</p>
              <div className="gm-confirm-modal__actions">
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--ghost"
                  onClick={() => setShowBlockModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="gm-profile__btn gm-profile__btn--danger"
                  onClick={confirmBlockUser}
                >
                  <Ban size={14} strokeWidth={1.75} /> Bloquear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersPage;
