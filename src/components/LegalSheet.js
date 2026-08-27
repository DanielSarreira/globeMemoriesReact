// src/components/LegalSheet.js — v3.5
// Premium responsive modal for Terms & Conditions + Privacy Policy.
// Used by Register.js (and could be used anywhere else later).
import React, { useState, useEffect, useRef } from 'react';
import { X as IconX, ScrollText, Shield, FileText } from 'lucide-react';
import '../styles/pages/auth5.css';

const TermsContent = () => (
  <div className="gm-auth5__legal">
    <h2>1. Aceitação dos Termos</h2>
    <p>
      Ao aceder e utilizar o Globe Memories, concorda em cumprir e estar vinculado a estes Termos e Condições
      de Uso. Se não concordar com qualquer parte destes termos, não deve utilizar o nosso serviço. Estes
      termos aplicam-se a todos os utilizadores, independentemente da sua localização geográfica.
    </p>

    <h2>2. Descrição do Serviço</h2>
    <p>
      O Globe Memories é uma <strong>comunidade digital de viajantes</strong> que permite aos membros
      documentar, organizar e partilhar as suas autênticas memórias de viagem através de fotografias,
      vídeos, textos e outras formas de conteúdo multimédia. Esta é uma plataforma{' '}
      <strong>exclusivamente para partilha de experiências de viagem pessoais</strong>, não para fins
      comerciais ou de divulgação de serviços.
    </p>

    <h2>3. Conta do Viajante</h2>
    <h3>3.1 Registo e Dados Precisos</h3>
    <p>
      Para utilizar o serviço, deve criar uma conta fornecendo informações precisas, atualizadas e completas
      durante o processo de registo. Deve usar o seu nome verdadeiro ou um pseudónimo consistente, e não pode
      criar contas falsas, múltiplas ou em nome de terceiros. Assume total responsabilidade pela precisão
      das informações fornecidas.
    </p>
    <h3>3.2 Segurança da Conta</h3>
    <p>
      É responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades que ocorram
      na sua conta. Deve notificar-nos imediatamente sobre qualquer uso não autorizado, comportamento
      suspeito ou violação de segurança da sua conta.
    </p>
    <h3>3.3 Idade Mínima</h3>
    <p>
      Deve ter pelo menos 16 anos para utilizar este serviço. Utilizadores menores de 18 anos devem ter
      consentimento dos seus pais ou tutores legais.
    </p>

    <h2>4. Filosofia da Comunidade de Viajantes</h2>
    <p>
      Globe Memories é um espaço dedicado à <strong>comunidade genuína de viajantes</strong>. A nossa
      missão é permitir que viajantes reais partilhem as suas experiências autênticas, memórias, dicas e
      recomendações. Valorizamos:
    </p>
    <ul>
      <li><strong>Autenticidade:</strong> Histórias reais e experiências genuínas de viagem</li>
      <li><strong>Comunidade:</strong> Troca mútua de experiências entre viajantes</li>
      <li><strong>Inspiração:</strong> Inspirar outros a viajar e explorar o mundo</li>
      <li><strong>Integridade:</strong> Relações honestas entre membros da comunidade</li>
    </ul>

    <h2>5. Conteúdo do Viajante</h2>
    <h3>5.1 Propriedade</h3>
    <p>
      Mantém a propriedade de todo o conteúdo que carrega, publica ou exibe no Globe Memories. Ao publicar
      conteúdo, concede-nos uma licença mundial, não exclusiva, para usar, modificar, reproduzir e
      distribuir esse conteúdo para fins de operação da plataforma.
    </p>
    <h3>5.2 Tipos de Conteúdo Permitido</h3>
    <ul>
      <li>Fotografias e vídeos de viagens pessoais</li>
      <li>Descrições de experiências e memórias de viagem</li>
      <li>Dicas e recomendações baseadas em experiências reais</li>
      <li>Avaliações honestas de locais visitados</li>
      <li>Roteiros e itinerários pessoais de viagem</li>
      <li>Comentários e feedback em viagens de outros utilizadores</li>
    </ul>
    <h3>5.3 Conteúdo Proibido</h3>
    <p><strong>Strictamente proibido:</strong></p>
    <ul>
      <li>
        <strong>Autopromoção:</strong> Qualquer conteúdo para divulgar negócios próprios, serviços,
        produtos ou que tenha fins comerciais diretos.
      </li>
      <li><strong>Marketing comercial:</strong> Publicidade, promoções, links de afiliação ou convites para compras.</li>
      <li><strong>Spam:</strong> Mensagens repetitivas, convites não solicitados ou conteúdo duplicado.</li>
      <li><strong>Conteúdo ofensivo:</strong> Material discriminatório, racista, sexista ou que viole direitos humanos.</li>
      <li><strong>Violência ou perigo:</strong> Conteúdo que promova violência ou comportamentos perigosos.</li>
      <li><strong>Exploração:</strong> Conteúdo que explore ou abuse de menores ou animais.</li>
      <li><strong>Fraude:</strong> Falsificação de identidade, phishing, fraude ou roubo.</li>
      <li><strong>Assédio:</strong> Bullying, ameaças, intimidação ou assédio sexual.</li>
      <li><strong>Privacidade de terceiros:</strong> Conteúdo que viole a privacidade de outras pessoas sem consentimento.</li>
      <li><strong>Falsificação:</strong> Afirmar ter visitado locais que não visitou ou descrever experiências fictícias.</li>
    </ul>

    <h2>6. Denúncias e Moderação</h2>
    <h3>6.1 Sistema de Denúncia de Conteúdo</h3>
    <p>
      Se encontrar conteúdo que viola estes termos, pode denunciá-lo através da função "Denunciar"
      disponível em cada publicação. A denúncia deve ser específica e descrever exatamente qual é a
      violação.
    </p>
    <h3>6.2 Denúncia de Utilizador</h3>
    <p>Se um utilizador está em violação reiterada destes termos, pode denunciá-lo através da opção "Denunciar Utilizador" no seu perfil. Motivos válidos incluem:</p>
    <ul>
      <li>Múltiplas publicações de conteúdo comercial</li>
      <li>Assédio persistente a outros utilizadores</li>
      <li>Spamming contínuo</li>
      <li>Falsificação de identidade comprovada</li>
      <li>Conteúdo que viole leis aplicáveis</li>
      <li>Violação repetida das regras da comunidade</li>
    </ul>
    <h3>6.3 Processo de Moderação</h3>
    <p>
      A nossa equipa de moderação revê todas as denúncias dentro de 24–48 horas. Podemos remover
      conteúdo, suspender contas ou tomar ação disciplinar conforme apropriado. Utilizadores com
      comportamento repetidamente inadequado serão permanentemente banidos.
    </p>

    <h2>7. Uso Aceitável</h2>
    <p>Concorda em não usar o serviço para:</p>
    <ul>
      <li>Publicar conteúdo ilegal, ofensivo ou que viole direitos de terceiros</li>
      <li>Enviar spam, conteúdo promocional ou fazer autopromoção</li>
      <li>Interferir com a operação do serviço, segurança ou servidores</li>
      <li>Tentar aceder a contas de outros viajantes sem autorização</li>
      <li>Usar o serviço para fins comerciais ou profissionais diretos</li>
      <li>Recolher dados de outros utilizadores para fins comerciais</li>
      <li>Criar múltiplas contas para contornar as regras da comunidade</li>
    </ul>

    <h2>8. Propriedade Intelectual</h2>
    <p>
      O Globe Memories e todo o seu código, design, funcionalidades, conteúdo original e interface são
      propriedade exclusiva nossa e dos nossos licenciadores, protegidos por leis de direitos de autor.
    </p>

    <h2>9. Modificações do Serviço</h2>
    <p>
      Reservamo-nos o direito de modificar, melhorar ou descontinuar o serviço a qualquer momento, com
      ou sem aviso prévio.
    </p>

    <h2>10. Limitação de Responsabilidade</h2>
    <p>
      O serviço é fornecido "como está" e "conforme disponível". Não garantimos que o serviço será
      ininterrupto, seguro ou livre de erros.
    </p>

    <h2>11. Rescisão</h2>
    <p>
      Podemos rescindir ou suspender a sua conta e acesso ao serviço imediatamente, sem aviso prévio, por
      qualquer motivo, incluindo violação destes termos, comportamento abusivo, autopromoção persistente,
      múltiplas denúncias comprovadas ou atividades fraudulentas ou ilegais.
    </p>

    <h2>12. Alterações aos Termos</h2>
    <p>
      Reservamo-nos o direito de alterar estes termos a qualquer momento. Notificaremos sobre alterações
      significativas através da plataforma ou por email.
    </p>

    <h2>13. Lei Aplicável e Jurisdição</h2>
    <p>
      Estes termos são regidos pelas leis de Portugal, sem consideração aos seus conflitos de leis.
      Qualquer disputa será resolvida nos tribunais competentes em Portugal.
    </p>

    <h2>14. Contacto</h2>
    <p>Se tiver questões, preocupações ou desejar reportar violações, pode contactar-nos:</p>
    <ul>
      <li>Email: suporte@globememories.com</li>
      <li>Email de Denúncias: moderation@globememories.com</li>
      <li>Através do formulário "Fala Connosco" na plataforma</li>
    </ul>

    <div className="gm-auth5__legal-callout">
      ⚠️ Ao criar uma conta e utilizar Globe Memories, confirma que leu, compreendeu e aceita
      integralmente estes Termos e Condições e a Política de Privacidade.
    </div>
  </div>
);

const PrivacyContent = () => (
  <div className="gm-auth5__legal">
    <h2>1. Informações que Recolhemos</h2>
    <h3>1.1 Informações Fornecidas por Si</h3>
    <p>Recolhemos informações que nos fornece diretamente durante o registo e utilização da plataforma:</p>
    <ul>
      <li>Nome, apelido, endereço de correio eletrónico, país e cidade durante o registo</li>
      <li>Nome de utilizador único para identificar na comunidade</li>
      <li>Fotografia de perfil e descrição pessoal (opcional)</li>
      <li>Fotografias, vídeos e textos sobre as suas viagens</li>
      <li>Comentários, avaliações e interações com outros utilizadores</li>
      <li>Informações de contacto quando nos contacta</li>
      <li>Dados de localização das suas viagens (se fornecidos)</li>
    </ul>

    <h3>1.2 Informações Recolhidas Automaticamente</h3>
    <p>Quando utiliza o nosso serviço, recolhemos automaticamente:</p>
    <ul>
      <li>Endereço IP do seu dispositivo</li>
      <li>Tipo de navegador, sistema operativo e informações do dispositivo</li>
      <li>Páginas visitadas e tempo gasto no site</li>
      <li>Localização aproximada (baseada em IP)</li>
      <li>Cookies e tecnologias similares de rastreamento</li>
      <li>Dados de utilização e desempenho do serviço</li>
    </ul>

    <h2>2. Como Utilizamos as suas Informações</h2>
    <p>Utilizamos as suas informações para:</p>
    <ul>
      <li><strong>Fornecer o serviço:</strong> Criar e manter a sua conta, processar o seu conteúdo</li>
      <li><strong>Melhorar a experiência:</strong> Personalizar o serviço baseado nas suas preferências</li>
      <li><strong>Comunicação:</strong> Enviar notificações, confirmações de email e atualizações</li>
      <li><strong>Segurança:</strong> Detetar e prevenir fraudes, abuso e comportamento ilegal</li>
      <li><strong>Moderação:</strong> Processar denúncias e garantir cumprimento dos Termos</li>
      <li><strong>Análise:</strong> Compreender como os utilizadores usam a plataforma</li>
      <li><strong>Conformidade legal:</strong> Cumprir obrigações legais e regulamentares</li>
    </ul>

    <h2>3. Partilha de Informações</h2>
    <h3>3.1 Partilha Pública</h3>
    <p>
      O conteúdo que escolhe tornar público será visível para outros utilizadores. Pode controlar
      completamente a privacidade do seu conteúdo nas suas definições.
    </p>
    <h3>3.2 Não Partilha com Terceiros para Fins Comerciais</h3>
    <p>
      <strong>Não vendemos, não alugamos e não partilhamos as suas informações pessoais com terceiros
      para fins de marketing comercial.</strong> Isto é fundamental para a confiança na comunidade.
    </p>
    <h3>3.3 Prestadores de Serviços Técnicos</h3>
    <p>Podemos partilhar informações com prestadores de serviços terceiros sob rigorosos acordos de confidencialidade:</p>
    <ul>
      <li>Fornecedores de alojamento na nuvem</li>
      <li>Serviços de análise web</li>
      <li>Fornecedores de email</li>
      <li>Fornecedores de segurança cibernética</li>
    </ul>
    <h3>3.4 Requisitos Legais</h3>
    <p>Podemos divulgar informações se exigido por lei ou ordem judicial para proteger direitos, prevenir fraudes ou proteger a segurança de utilizadores.</p>

    <h2>4. Segurança dos Dados</h2>
    <p>Implementamos medidas de segurança técnicas e organizacionais adequadas:</p>
    <ul>
      <li>Encriptação SSL/TLS para todas as transmissões</li>
      <li>Encriptação de senhas em bases de dados</li>
      <li>Firewalls e proteção contra intrusions</li>
      <li>Controlo de acesso baseado em privilégios</li>
      <li>Monitorização contínua de segurança</li>
    </ul>
    <p>
      <strong>Responsabilidade partilhada:</strong> Nenhum método é 100% seguro. Você é responsável pela
      sua palavra-passe.
    </p>

    <h2>5. Cookies e Tecnologias de Rastreamento</h2>
    <p>Utilizamos cookies e tecnologias similares para:</p>
    <ul>
      <li>Funcionalidade: Manter a sua sessão ativa e preferências</li>
      <li>Segurança: Detectar e prevenir fraudes</li>
      <li>Análise: Compreender como utiliza o serviço</li>
      <li>Melhorias: Otimizar a experiência de utilizador</li>
    </ul>

    <h2>6. Os Seus Direitos de Dados (RGPD)</h2>
    <p>De acordo com a Lei de Proteção de Dados (RGPD), tem os seguintes direitos:</p>
    <ul>
      <li><strong>Direito de acesso:</strong> Aceder às informações pessoais que possuímos sobre si</li>
      <li><strong>Direito de retificação:</strong> Corrigir informações imprecisas ou incompletas</li>
      <li><strong>Direito ao esquecimento:</strong> Solicitar a eliminação dos seus dados pessoais</li>
      <li><strong>Direito de restrição:</strong> Restringir o processamento dos seus dados</li>
      <li><strong>Direito de portabilidade:</strong> Receber os seus dados num formato estruturado</li>
      <li><strong>Direito de oposição:</strong> Opor-se ao processamento para fins de marketing</li>
    </ul>

    <h2>7. Retenção de Dados</h2>
    <p>
      Mantemos as suas informações pessoais apenas pelo tempo necessário para cumprir os fins descritos
      nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
    </p>

    <h2>8. Transferências Internacionais</h2>
    <p>
      As suas informações podem ser transferidas e processadas em servidores localizados em Portugal ou
      países parceiros. Garantimos que tais transferências cumprem os requisitos do RGPD.
    </p>

    <h2>9. Protecção de Menores</h2>
    <p>
      <strong>O nosso serviço não se destina a menores de 16 anos.</strong> Não recolhemos
      intencionalmente informações pessoais de menores de 16 anos. Utilizadores entre 16 e 18 anos
      podem usar o serviço apenas com consentimento dos pais ou tutores legais.
    </p>

    <h2>10. Alterações a esta Política</h2>
    <p>
      Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações
      significativas publicando a nova política no nosso site e por email aos utilizadores ativos.
    </p>

    <h2>11. Contacto e Direitos</h2>
    <p>Se tiver questões sobre esta Política de Privacidade, pode contactar-nos:</p>
    <ul>
      <li>Email de Privacidade: privacidade@globememories.com</li>
      <li>Email de Suporte: suporte@globememories.com</li>
      <li>Formulário: Através da opção "Fala Connosco" na plataforma</li>
    </ul>
    <p>
      <strong>Direito a reclamação:</strong> Tem o direito de apresentar uma reclamação à autoridade
      de proteção de dados competente (CNPD em Portugal).
    </p>

    <h2>12. Compromisso com Privacidade</h2>
    <p><strong>Privacidade é um valor fundamental de Globe Memories.</strong> Comprometemo-nos a:</p>
    <ul>
      <li>Nunca vender dados de utilizadores a terceiros</li>
      <li>Ser transparentes sobre como recolhemos e usamos dados</li>
      <li>Respeitar as escolhas de privacidade dos utilizadores</li>
      <li>Cumprir com todas as regulamentações de proteção de dados aplicáveis</li>
      <li>Manter dados seguros e protegidos</li>
    </ul>

    <div className="gm-auth5__legal-callout">
      🔒 <strong>Compromisso Fundamental:</strong> Privacidade é um valor fundamental. Nunca vendemos
      dados a terceiros. Somos transparentes e respeitamos as suas escolhas de privacidade.
    </div>
  </div>
);

const LegalSheet = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const bodyRef = useRef(null);

  // Sync external initialTab
  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  // Body scroll lock + ESC to close
  useEffect(() => {
    if (!isOpen) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  // Reset scroll to top when opening
  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="gm-auth5__modal-overlay"
      onClick={handleOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-title"
    >
      <div className="gm-auth5__modal-panel gm-auth5__modal-panel--wide" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="gm-auth5__modal-close"
          onClick={onClose}
          aria-label="Fechar"
        >
          <IconX size={18} strokeWidth={2} />
        </button>

        <div className="gm-auth5__modal-header">
          <div className="gm-auth5__modal-icon">
            {activeTab === 'terms' ? <ScrollText size={22} strokeWidth={1.75} /> : <Shield size={22} strokeWidth={1.75} />}
          </div>
          <h2 id="legal-title" className="gm-auth5__modal-title">
            {activeTab === 'terms' ? 'Termos e Condições' : 'Política de Privacidade'}
          </h2>
          <p className="gm-auth5__modal-sub">
            {activeTab === 'terms'
              ? 'As regras da nossa comunidade. Leia com atenção.'
              : 'Como tratamos os seus dados pessoais. Transparência total.'}
          </p>
        </div>

        <div className="gm-auth5__modal-body" ref={bodyRef}>
          <div className="gm-auth5__legal-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'terms'}
              className={`gm-auth5__legal-tab${activeTab === 'terms' ? ' gm-auth5__legal-tab--active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              <FileText size={13} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Termos e Condições
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'privacy'}
              className={`gm-auth5__legal-tab${activeTab === 'privacy' ? ' gm-auth5__legal-tab--active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              <Shield size={13} strokeWidth={2} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Política de Privacidade
            </button>
          </div>

          {activeTab === 'terms' ? <TermsContent /> : <PrivacyContent />}
        </div>

        <div className="gm-auth5__modal-actions">
          <button
            type="button"
            className="gm-auth5__btn gm-auth5__btn--primary"
            onClick={onClose}
          >
            Compreendi
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegalSheet;
export { LegalSheet };
