/**
 * MapWelcome.jsx — the welcome modal shown on the user's first
 * visit to the page (or when the welcome copy version changes).
 *
 * Reads dismissal state from localStorage via the WELCOME_DISMISS_KEY
 * constant; if dismissed, the parent shouldn't render this at all.
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Eye, Layers, X as IconX, Globe2 } from "lucide-react";

const FEATURES = [
  { icon: Search, title: "Pesquisa global", text: "Encontre qualquer país, cidade ou ponto de interesse." },
  { icon: Sparkles, title: "Destino surpresa", text: "Clique em \"Destino surpresa\" e descubra um destino aleatório." },
  { icon: Eye, title: "Street View", text: "Veja qualquer ponto do mapa em 360° antes de viajar." },
  { icon: Layers, title: "4 tipos de mapa", text: "Básico, ruas, terreno e satélite — escolha o que prefere." },
];

const MapWelcome = ({ open, dontShowAgain, onClose, onToggleDontShow }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="gm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="gm-modal__panel gm-welcome"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="gm-modal__close" aria-label="Fechar" onClick={onClose}>
              <IconX size={18} strokeWidth={1.75} />
            </button>

            <div className="gm-welcome__hero">
              <div className="gm-welcome__icon"><Globe2 size={36} strokeWidth={1.5} /></div>
              <h2>Explorador de Viagens Globe Memories</h2>
              <p>Descubra experiências de viagem reais partilhadas pela comunidade global.</p>
            </div>

            <div className="gm-welcome__features">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="gm-welcome__feature">
                  <span className="gm-welcome__feature-icon"><Icon size={18} strokeWidth={1.75} /></span>
                  <div>
                    <strong>{title}</strong>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="gm-welcome__footer">
              <label className="gm-welcome__check">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => onToggleDontShow(e.target.checked)}
                />
                <span>Não mostrar novamente</span>
              </label>
              <button type="button" className="gm-welcome__cta" onClick={onClose}>
                Começar a explorar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MapWelcome;
