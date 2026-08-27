import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Compass, Map, Search, Sparkles } from "lucide-react";
/* Footer import removed */
import "../styles/pages/notfound.css";

const NotFound = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Página não encontrada · Globe Memories";
  }, []);

  return (
    <div className="gm-404">
      {/* Subtle background */}
      <div className="gm-404__bg" aria-hidden="true">
        <div className="gm-404__bg-blob gm-404__bg-blob--a" />
        <div className="gm-404__bg-blob gm-404__bg-blob--b" />
      </div>

      <div className="gm-404__inner">
        <motion.div
          className="gm-404__card"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="gm-404__icon">
            <Compass size={48} strokeWidth={1.25} />
          </div>

          <div className="gm-404__code">404</div>
          <h1 className="gm-404__title">Página não encontrada</h1>
          <p className="gm-404__sub">
            Esta rota não existe ou foi movida. Vamos ajudá-lo a encontrar o caminho.
          </p>

          <div className="gm-404__actions">
            <button
              type="button"
              className="gm-404__btn gm-404__btn--primary"
              onClick={() => navigate("/")}
            >
              <Home size={15} strokeWidth={1.75} /> Ir para a Home
            </button>
            <button
              type="button"
              className="gm-404__btn gm-404__btn--ghost"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={15} strokeWidth={1.75} /> Voltar atrás
            </button>
          </div>

          <div className="gm-404__quick">
            <h3>Ou explore diretamente</h3>
            <div className="gm-404__quick-grid">
              <button
                type="button"
                className="gm-404__quick-item"
                onClick={() => navigate("/travels")}
              >
                <span className="gm-404__quick-icon" style={{ background: "var(--gm-brand-soft)", color: "var(--gm-brand)" }}>
                  <Compass size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <strong>Descobrir</strong>
                  <span>Viagens da comunidade</span>
                </div>
              </button>
              <button
                type="button"
                className="gm-404__quick-item"
                onClick={() => navigate("/interactive-map")}
              >
                <span className="gm-404__quick-icon" style={{ background: "var(--gm-accent-soft)", color: "var(--gm-accent)" }}>
                  <Map size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <strong>Mapa</strong>
                  <span>Explorar o globo</span>
                </div>
              </button>
              <button
                type="button"
                className="gm-404__quick-item"
                onClick={() => navigate("/users")}
              >
                <span className="gm-404__quick-icon" style={{ background: "var(--gm-brand-soft)", color: "var(--gm-brand)" }}>
                  <Search size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <strong>Viajantes</strong>
                  <span>Encontrar pessoas</span>
                </div>
              </button>
              <button
                type="button"
                className="gm-404__quick-item"
                onClick={() => navigate("/qanda")}
              >
                <span className="gm-404__quick-icon" style={{ background: "var(--gm-accent-soft)", color: "var(--gm-accent)" }}>
                  <Sparkles size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <strong>Q&A</strong>
                  <span>Perguntas e respostas</span>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>    </div>
  );
};

export default NotFound;
