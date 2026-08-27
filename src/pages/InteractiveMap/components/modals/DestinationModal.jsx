/**
 * DestinationModal.jsx — the popup shown when the magic arrow
 * lands on a destination. Two actions: "Agora não" closes the
 * modal; "Explorar viagens" routes to /travels with a country
 * pre-filter.
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plane, X as IconX, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DestinationModal = ({ open, destination, onClose }) => {
  const navigate = useNavigate();

  const explore = () => {
    if (!destination) return;
    onClose();
    navigate("/travels", {
      state: {
        filterByCountry: destination.country,
        message: `A descobrir viagens em ${destination.country}!`,
      },
    });
  };

  return (
    <AnimatePresence>
      {open && destination && (
        <motion.div
          className="gm-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="gm-modal__panel gm-destination"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="gm-modal__close" aria-label="Fechar" onClick={onClose}>
              <IconX size={18} strokeWidth={1.75} />
            </button>

            <div className="gm-destination__icon"><Plane size={32} strokeWidth={1.5} /></div>
            <h2>Destino encontrado</h2>
            <p>Caíste em <strong>{destination.city}, {destination.country}</strong>. Queres explorar viagens neste destino?</p>

            <div className="gm-destination__actions">
              <button type="button" className="gm-btn gm-btn--ghost" onClick={onClose}>
                Agora não
              </button>
              <button type="button" className="gm-btn gm-btn--primary" onClick={explore}>
                <Send size={14} strokeWidth={1.75} />
                Explorar viagens
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DestinationModal;
