import React from "react";
import { Link } from "react-router-dom";
import { Rocket, Calendar, MapPin, Users, Heart, Sparkles, Smartphone, Map as MapIcon, Wallet, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
/* Footer import removed */
import "../styles/components/FutureTravels1.css";

const FEATURES = [
  { icon: Calendar, title: "Planeamento Inteligente", text: "Crie itinerários detalhados com sugestões personalizadas." },
  { icon: MapPin, title: "Pontos de Interesse", text: "Descubra locais únicos e experiências imperdíveis." },
  { icon: Users, title: "Viagens em Grupo", text: "Organize viagens colaborativas com amigos e família." },
];

const ROADMAP = [
  { icon: Sparkles, title: "Assistente de Viagem com IA", text: "Sugestões inteligentes baseadas no seu perfil e preferências." },
  { icon: Smartphone, title: "Planeamento Colaborativo", text: "Convide amigos e familiares para planear juntos em tempo real." },
  { icon: MapIcon, title: "Mapas Interativos Avançados", text: "Visualize todo o seu itinerário num mapa dinâmico." },
  { icon: Wallet, title: "Gestão de Orçamento", text: "Controle todos os custos da sua viagem em tempo real." },
];

const FutureTravelsComingSoon = () => {
  return (
    <div className="gm-future">
      <div className="gm-future__inner">
        <motion.div
          className="gm-future__hero"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="gm-future__hero-icon">
            <Rocket size={32} strokeWidth={1.5} />
          </div>
          <h1>Em Breve</h1>
          <p className="gm-future__hero-sub">
            A ferramenta de planeamento de viagens mais completa está a chegar à Globe Memories.
          </p>
        </motion.div>

        <section className="gm-future__features">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="gm-future__card"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.08 * (i + 1) }}
              >
                <div className="gm-future__card-icon">
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </motion.div>
            );
          })}
        </section>

        <section className="gm-future__roadmap">
          <header className="gm-future__roadmap-head">
            <h2>O que está a chegar na Fase 2</h2>
            <span className="gm-future__roadmap-line" />
          </header>
          <div className="gm-future__roadmap-list">
            {ROADMAP.map((r, i) => {
              const Icon = r.icon;
              return (
                <motion.div
                  key={r.title}
                  className="gm-future__roadmap-item"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.05 * i }}
                >
                  <div className="gm-future__roadmap-icon">
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4>{r.title}</h4>
                    <p>{r.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="gm-future__cta">
          <h3>Enquanto isso, explore as nossas outras funcionalidades</h3>
          <div className="gm-future__cta-row">
            <Link to="/travels" className="gm-profile__btn gm-profile__btn--primary">
              Descobrir Viagens <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
            <Link to="/my-travels" className="gm-profile__btn gm-profile__btn--ghost">
              As Minhas Viagens <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
            <Link to="/interactive-map" className="gm-profile__btn gm-profile__btn--ghost">
              Mapa Mundial <ArrowRight size={14} strokeWidth={1.75} />
            </Link>
          </div>
        </section>

        <footer className="gm-future__foot">
          <Heart size={14} strokeWidth={1.75} fill="currentColor" className="gm-future__foot-icon" />
          <p>Fique atento às próximas atualizações da Globe Memories!</p>
          <small>Esta funcionalidade será lançada em breve com muitas surpresas.</small>
        </footer>
      </div>    </div>
  );
};

export default FutureTravelsComingSoon;
