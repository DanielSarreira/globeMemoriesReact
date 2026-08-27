import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bug,
  Lightbulb,
  Send,
  CheckCircle2,
  Loader2,
  MessageSquare,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import api from "../axios_helper";
import { useAuth } from "../context/AuthContext";
import { useToast, PageContainer, Section, SectionHeader, Grid, Stack } from "../components/ui";
import "../styles/pages/feedback.css";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Reportar Bug", icon: Bug, description: "Algo não está a funcionar corretamente" },
  { value: "suggestion", label: "Sugestão", icon: Lightbulb, description: "Tens uma ideia para melhorar a plataforma" },
  { value: "feedback", label: "Feedback Geral", icon: MessageSquare, description: "Queres partilhar a tua opinião geral" },
  { value: "other", label: "Outro", icon: AlertTriangle, description: "Outro assunto" },
];

const Feedback = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!type || !title.trim() || !description.trim()) {
      toast.danger("Preenche todos os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      // Round 59 — the backend's CreateFeedbackDto expects a
      // `feedbackType` field with values ERROR_REPORT or SUGGESTION
      // (enum). The form exposes 4 user-facing values (bug /
      // suggestion / feedback / other) that we map to the two
      // backend types here. Without this mapping, the backend
      // rejects the request with "Validation failed".
      const feedbackType = type === "bug" ? "ERROR_REPORT" : "SUGGESTION";
      const payload = {
        feedbackType,
        title: title.trim(),
        description: description.trim(),
      };
      await api.post("/feedback", payload);
      setSubmitted(true);
      toast.success("Obrigado pelo teu feedback!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Não foi possível enviar o feedback. Tenta novamente.";
      toast.danger(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageContainer size="lg">
        <Section>
          <motion.div
            className="gm-feedback__success"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gm-feedback__success-icon">
              <CheckCircle2 size={48} strokeWidth={1.5} color="#10A36B" />
            </div>
            <h2>Feedback enviado!</h2>
            <p>Obrigado por ajudares a melhorar a Globe Memories. A nossa equipa vai analisar o teu feedback.</p>
            <button
              type="button"
              className="gm-feedback__btn gm-feedback__btn--primary"
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </button>
          </motion.div>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg">
     <div className="gm-feedback-body">
      {/* Round 35 — botão "Voltar" removido. A sidebar já dá
          navegação para outras secções; o user entra no /feedback
          por acção directa (link do sidebar /notifications ou
          /settings) e o header glass estava só a duplicar a
          tabbar do browser. */}

      <Stack gap="lg">
        <Section tight>
          <SectionHeader
            icon={HelpCircle}
            title="Como podemos ajudar?"
            subtitle="Escolhe o tipo de feedback e descreve a tua questão com o máximo de detalhe possível."
          />
        </Section>

        <form onSubmit={handleSubmit} className="gm-feedback__form">
          {/* Tipo de feedback — mesmo card visual que /settings */}
          <Section tight>
            <SectionHeader
              icon={MessageSquare}
              title="Tipo de feedback"
              subtitle="Esta informação ajuda-nos a encaminhar melhor a tua mensagem."
            />
            <div className="gm-feedback__types">
              {FEEDBACK_TYPES.map((ft) => {
                const Icon = ft.icon;
                const selected = type === ft.value;
                return (
                  <button
                    key={ft.value}
                    type="button"
                    className={`gm-feedback__type ${selected ? "gm-feedback__type--active" : ""}`}
                    onClick={() => setType(ft.value)}
                    aria-pressed={selected}
                  >
                    <span className="gm-feedback__type-icon">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <div className="gm-feedback__type-body">
                      <strong>{ft.label}</strong>
                      <span>{ft.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Detalhes — título + descrição */}
          <Section tight>
            <SectionHeader
              icon={Send}
              title="Detalhes"
              subtitle="Sê o mais específico possível — passos, ecrã, comportamento esperado vs. atual."
            />
            <div className="gm-feedback__fields">
              <div className="gm-feedback__field">
                <label className="gm-feedback__label" htmlFor="feedback-title">Título *</label>
                <input
                  id="feedback-title"
                  type="text"
                  className="gm-feedback__input"
                  placeholder="Ex: Botão de guardar não funciona"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                />
                <span className="gm-feedback__count">{title.length}/100</span>
              </div>

              <div className="gm-feedback__field">
                <label className="gm-feedback__label" htmlFor="feedback-desc">Descrição *</label>
                <textarea
                  id="feedback-desc"
                  className="gm-feedback__textarea"
                  placeholder="Descreve o problema ou sugestão com o máximo de detalhe possível..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  required
                />
                <span className="gm-feedback__count">{description.length}/2000</span>
              </div>
            </div>
          </Section>

          <Section tight>
            <button
              type="submit"
              className="gm-feedback__btn gm-feedback__btn--primary"
              disabled={submitting || !type || !title.trim() || !description.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} strokeWidth={2} className="gm-spin" />
                  A enviar...
                </>
              ) : (
                <>
                  <Send size={16} strokeWidth={1.75} />
                  Enviar feedback
                </>
              )}
            </button>
          </Section>
        </form>
      </Stack>
     </div>
    </PageContainer>
  );
};

export default Feedback;
