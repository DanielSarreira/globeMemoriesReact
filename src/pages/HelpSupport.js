import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, User, Mail, MessageSquare, Send, ChevronDown, Sparkles, MailQuestion } from "lucide-react";
import { useToast } from "../components/ui";
import "../styles/pages/help-support.css";

const FAQ_ITEMS = [
  {
    q: "Como posso criar uma conta?",
    a: "Clica em \"Registar\" no menu principal. Preenche os campos solicitados — nome, email e palavra-passe — e clica em \"Registar\". Vais receber um email de confirmação para validar a tua conta antes de fazeres login.",
  },
  {
    q: "Como acedo à minha conta?",
    a: "Clica em \"Entrar\" no menu principal, insere o teu email e palavra-passe. Se esqueceste a palavra-passe, há um link \"Esqueci a minha palavra-passe\" que te guia na recuperação via email.",
  },
  {
    q: "Como editar e personalizar o meu perfil?",
    a: "Vai a \"O Meu Perfil\" no menu. Aqui podes atualizar a fotografia, descrição, nacionalidade e outras preferências. Podes também escolher o nível de privacidade (privado ou público) e quem vê as tuas viagens.",
  },
  {
    q: "Como criar e registar uma nova viagem?",
    a: "Vai a \"As Minhas Viagens\" e clica em \"Criar Viagem\" ou \"+\". Preenche destino, datas, descrição, fotos/vídeos e tipo de transporte. No fim, clica em \"Guardar Viagem\".",
  },
  {
    q: "Como adicionar memórias e fotografias às minhas viagens?",
    a: "Abre a viagem desejada e clica em \"Adicionar Memória\" ou \"+\". Podes adicionar descrição, fotos, vídeos, data e localização GPS. Cada memória fica georreferenciada, criando um mapa pessoal das tuas aventuras.",
  },
  {
    q: "O que é o Mapa Interativo e como funciona?",
    a: "O Mapa Interativo mostra todas as tuas viagens e memórias num mapa-múndi. Vês cada localização, rotas e atividades. Clicando nas marcações, acedes às fotos e descrições.",
  },
  {
    q: "Como partilhar o meu perfil com outros viajantes?",
    a: "Se o teu perfil for público, outros utilizadores visitam-no através de \"Explorar Viajantes\". No perfil público, veem as tuas viagens, descrição e memórias destacadas.",
  },
  {
    q: "O que são Conquistas e como as obtenho?",
    a: "São troféus digitais que desbloqueias ao atingir marcos — número de países, memórias, sequência de dias ativos, etc. Vê todas as tuas conquistas em \"Conquistas\" no teu perfil.",
  },
  {
    q: "O que é a funcionalidade de Clima (Weather)?",
    a: "Mostra informações meteorológicas em tempo real dos teus destinos — temperatura, humidade, vento, etc. Ajuda-te a planear a roupa e o que levar para cada viagem.",
  },
  {
    q: "Como planear viagens futuras?",
    a: "Na secção \"Viagens Futuras\", podes criar e organizar viagens que tens em mente — destinos, datas, lista de itens, informações do local, clima previsto. Quando completares, moves para \"As Minhas Viagens\".",
  },
  {
    q: "Como funciona o sistema de comentários e avaliações?",
    a: "Podes deixar comentários e avaliações nas viagens e memórias de outros utilizadores (se permitido). Cria-se uma comunidade onde trocam-se dicas e recomendações.",
  },
  {
    q: "Como ajustar as definições de privacidade?",
    a: "Vai a \"Definições e Privacidade\". Aqui defines se o perfil é público ou privado, quem vê as tuas viagens, quem comenta, notificações, e podes bloquear utilizadores específicos.",
  },
  {
    q: "Como desinstalar a aplicação no meu dispositivo móvel?",
    a: "A app é uma PWA. Para desinstalar, remove o atalho da home screen (long-press → remover) ou apaga pelos ajustes do sistema.",
  },
  {
    q: "Como contacto o suporte técnico?",
    a: "Usa o formulário \"Fala Connosco\" abaixo, ou envia email para suporte@globememories.com. Respondemos em 24 a 48 horas.",
  },
  {
    q: "Os meus dados estão seguros?",
    a: "Sim. Todas as informações são encriptadas, guardadas em servidores seguros, e a tua palavra-passe nunca é partilhada. Podes eliminar a tua conta a qualquer momento nas definições.",
  },
];

function validateField(name, value) {
  if (name === "name") {
    if (!value.trim()) return "Nome é obrigatório";
    if (value.trim().length < 2) return "Nome deve ter pelo menos 2 caracteres";
    if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) return "Nome deve conter apenas letras";
    return "";
  }
  if (name === "email") {
    if (!value.trim()) return "Email é obrigatório";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Formato de email inválido";
    return "";
  }
  if (name === "message") {
    if (!value.trim()) return "Mensagem é obrigatória";
    if (value.trim().length < 10) return "Mensagem deve ter pelo menos 10 caracteres";
    if (value.trim().length > 1000) return "Mensagem deve ter no máximo 1000 caracteres";
    return "";
  }
  return "";
}

const HelpSupport = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const newErrors = {};
    Object.keys(formData).forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.danger("Por favor, corrija os erros no formulário.");
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      toast.success("Mensagem enviada! Responderemos em breve.");
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch {
      toast.danger("Erro ao enviar mensagem.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gm-help">
      {/* Header (glass) */}
      <div className="gm-help__head">
        <div className="gm-help__head-inner">
          <div className="gm-help__head-icon">
            <HelpCircle size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="gm-help__head-title">Ajuda e Suporte</h1>
            <p className="gm-help__head-sub">
              Estamos aqui para o ajudar a tirar o máximo partido da Globe Memories.
            </p>
          </div>
        </div>
      </div>

      <div className="gm-help__body">
        {/* FAQ */}
        <section className="gm-help__faq">
          <header className="gm-help__section-head">
            <h2>
              <MailQuestion size={16} strokeWidth={1.75} /> Perguntas Frequentes
            </h2>
            <span className="gm-help__section-count">{FAQ_ITEMS.length} respostas</span>
          </header>
          <ul className="gm-help__faq-list">
            {FAQ_ITEMS.map((item, i) => {
              const open = expandedFAQ === i;
              return (
                <li
                  key={i}
                  className={`gm-help__faq-item ${open ? "gm-help__faq-item--open" : ""}`}
                >
                  <button
                    type="button"
                    className="gm-help__faq-q"
                    aria-expanded={open}
                    onClick={() => setExpandedFAQ(open ? null : i)}
                  >
                    <span className="gm-help__faq-num">{i + 1}</span>
                    <span className="gm-help__faq-text">{item.q}</span>
                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={`gm-help__faq-chevron ${open ? "gm-help__faq-chevron--open" : ""}`}
                    />
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        className="gm-help__faq-a"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contact form */}
        <section className="gm-help__contact">
          <header className="gm-help__section-head">
            <h2>
              <Sparkles size={16} strokeWidth={1.75} /> Fala Connosco
            </h2>
          </header>
          <p className="gm-help__contact-intro">
            Não encontraste resposta nas FAQ? Envia-nos uma mensagem detalhada e respondemos em 24 a 48 horas.
          </p>

          <form onSubmit={handleSubmit} className="gm-help__form" noValidate>
            <div className="gm-help__field">
              <label htmlFor="name">
                <User size={13} strokeWidth={1.75} /> Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="O seu nome completo..."
                className={errors.name ? "gm-help__input--error" : ""}
              />
              {errors.name && <span className="gm-help__field-err">⚠ {errors.name}</span>}
            </div>

            <div className="gm-help__field">
              <label htmlFor="email">
                <Mail size={13} strokeWidth={1.75} /> Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="O seu email de contacto..."
                className={errors.email ? "gm-help__input--error" : ""}
              />
              {errors.email && <span className="gm-help__field-err">⚠ {errors.email}</span>}
            </div>

            <div className="gm-help__field">
              <label htmlFor="message">
                <MessageSquare size={13} strokeWidth={1.75} /> Mensagem
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Descreva detalhadamente a sua questão..."
                rows={6}
                maxLength={1000}
                className={errors.message ? "gm-help__input--error" : ""}
              />
              <div className="gm-help__field-counter">{formData.message.length}/1000</div>
              {errors.message && <span className="gm-help__field-err">⚠ {errors.message}</span>}
            </div>

            <button type="submit" className="gm-help__submit" disabled={isSubmitting}>
              <Send size={14} strokeWidth={1.75} />
              {isSubmitting ? "A enviar..." : "Enviar Mensagem"}
            </button>
          </form>
        </section>
      </div>    </div>
  );
};

export default HelpSupport;
