import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const TermsModal = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const termsContent = (
    <div>
      <h2>1. Aceitação dos Termos</h2>
      <p>
        Ao aceder e utilizar o Globe Memories, concorda em cumprir e estar vinculado a estes Termos e Condições de Uso. Se não concordar com qualquer parte destes termos, não deve utilizar o nosso serviço. Estes termos aplicam-se a todos os utilizadores, independentemente da sua localização geográfica.
      </p>

      <h2>2. Descrição do Serviço</h2>
      <p>
        O Globe Memories é uma <strong>comunidade digital de viajantes</strong> que permite aos membros documentar, organizar e partilhar as suas autênticas memórias de viagem através de fotografias, vídeos, textos e outras formas de conteúdo multimédia. Esta é uma plataforma <strong>exclusivamente para partilha de experiências de viagem pessoais</strong>, não para fins comerciais ou de divulgação de serviços.
      </p>

      <h2>3. Conta do Viajante</h2>
      <h3>3.1 Registo e Dados Precisos</h3>
      <p>
        Para utilizar o serviço, deve criar uma conta fornecendo informações precisas, atualizadas e completas durante o processo de registo. Deve usar o seu nome verdadeiro ou um pseudónimo consistente, e não pode criar contas falsas, múltiplas ou em nome de terceiros. Assume total responsabilidade pela precisão das informações fornecidas.
      </p>
      <h3>3.2 Segurança da Conta</h3>
      <p>
        É responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades que ocorram na sua conta. Deve notificar-nos imediatamente sobre qualquer uso não autorizado, comportamento suspeito ou violação de segurança da sua conta.
      </p>
      <h3>3.3 Idade Mínima</h3>
      <p>
        Deve ter pelo menos 16 anos para utilizar este serviço. Utilizadores menores de 18 anos devem ter consentimento dos seus pais ou tutores legais.
      </p>

      <h2>4. Filosofia da Comunidade de Viajantes</h2>
      <p>
        Globe Memories é um espaço dedicado à <strong>comunidade genuína de viajantes</strong>. A nossa missão é permitir que viajantes reais partilhem as suas experiências autênticas, memórias, dicas e recomendações. Valorizamos:
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
        Mantém a propriedade de todo o conteúdo que carrega, publica ou exibe no Globe Memories. Ao publicar conteúdo, concede-nos uma licença mundial, não exclusiva, para usar, modificar, reproduzir e distribuir esse conteúdo para fins de operação da plataforma.
      </p>
      <h3>5.2 Tipos de Conteúdo Permitido</h3>
      <p>
        O conteúdo permitido inclui:
      </p>
      <ul>
        <li>Fotografias e vídeos de viagens pessoais</li>
        <li>Descrições de experiências e memórias de viagem</li>
        <li>Dicas e recomendações baseadas em experiências reais</li>
        <li>Avaliações honestas de locais visitados</li>
        <li>Roteiros e itinerários pessoais de viagem</li>
        <li>Comentários e feedback em viagens de outros utilizadores</li>
      </ul>
      <h3>5.3 Conteúdo Proibido</h3>
      <p>
        <strong>Strictamente proibido:</strong>
      </p>
      <ul>
        <li><strong>Autopromoção:</strong> Qualquer conteúdo para divulgar negócios próprios, serviços, produtos ou que tenha fins comerciais diretos (hotéis próprios, agências de viagem, restaurantes pessoais, cursos, etc.)</li>
        <li><strong>Marketing comercial:</strong> Publicidade, promoções, links de afiliação ou convites para compras</li>
        <li><strong>Spam:</strong> Mensagens repetitivas, convites não solicitados ou conteúdo duplicado</li>
        <li><strong>Conteúdo ofensivo:</strong> Material discriminatório, racista, sexista, homofóbico, xenófobo ou que viole direitos humanos</li>
        <li><strong>Violência ou perigo:</strong> Conteúdo que promova violência, automutilação, uso de drogas ou comportamentos perigosos</li>
        <li><strong>Exploração:</strong> Conteúdo que explore ou abuse de menores ou animais</li>
        <li><strong>Fraude:</strong> Falsificação de identidade, phishing, fraude ou roubo</li>
        <li><strong>Assédio:</strong> Bullying, ameaças, intimidação ou assédio sexual</li>
        <li><strong>Privacidade de terceiros:</strong> Conteúdo que viole a privacidade de outras pessoas sem consentimento</li>
        <li><strong>Falsificação:</strong> Afirmar ter visitado locais que não visitou ou descrever experiências fictícias</li>
      </ul>
      <h3>5.4 Responsabilidade do Conteúdo</h3>
      <p>
        É totalmente responsável pelo conteúdo que publica. Deve garantir que possui todos os direitos necessários para publicar fotografias, vídeos e dados de terceiros. Qualquer violação de direitos de autor, patentes ou direitos de propriedade intelectual é responsabilidade sua.
      </p>

      <h2>6. Denúncias e Moderação</h2>
      <h3>6.1 Sistema de Denúncia de Conteúdo</h3>
      <p>
        Se encontrar conteúdo que viola estes termos, pode denunciá-lo através da função "Denunciar" disponível em cada publicação. A denúncia deve ser específica e descrever exatamente qual é a violação (ex: "Esta publicação é autopromoção de serviços comerciais" ou "Este utilizador está a fazer assédio").
      </p>
      <h3>6.2 Denúncia de Utilizador</h3>
      <p>
        Se um utilizador está em violação reiterada destes termos, pode denunciá-lo através da opção "Denunciar Utilizador" no seu perfil. Motivos válidos incluem:
      </p>
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
        A nossa equipa de moderação revê todas as denúncias dentro de 24-48 horas. Podemos remover conteúdo, suspendar contas ou tomar ação disciplinar conforme apropriado. Utilizadores com comportamento repetidamente inadequado serão permanentemente banidos.
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
        <li>Publicar "conteúdo astroturf" (falsas recomendações ou críticas)</li>
        <li>Envolver-se em comportamentos abusivos, ameaçadores ou de assédio</li>
      </ul>

      <h2>8. Propriedade Intelectual</h2>
      <p>
        O Globe Memories e todo o seu código, design, funcionalidades, características, conteúdo original e interface são propriedade exclusiva nossa e dos nossos licenciadores, protegidos por leis de direitos de autor, marcas registadas e outras leis de propriedade intelectual. Qualquer reprodução não autorizada é proibida.
      </p>

      <h2>9. Modificações do Serviço</h2>
      <p>
        Reservamo-nos o direito de modificar, melhorar ou descontinuar o serviço a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante si ou terceiros por qualquer modificação, suspensão ou descontinuação do serviço.
      </p>

      <h2>10. Limitação de Responsabilidade</h2>
      <p>
        O serviço é fornecido "como está" e "conforme disponível". Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o serviço.
      </p>

      <h2>11. Rescisão</h2>
      <p>
        Podemos rescindir ou suspender a sua conta e acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, incluindo:
      </p>
      <ul>
        <li>Violação destes termos ou políticas da comunidade</li>
        <li>Comportamento abusivo ou assédio de outros utilizadores</li>
        <li>Autopromoção ou atividade comercial persistente</li>
        <li>Múltiplas denúncias comprovadas da comunidade</li>
        <li>Atividades fraudulentas ou ilegais</li>
      </ul>

      <h2>12. Alterações aos Termos</h2>
      <p>
        Reservamo-nos o direito de alterar estes termos a qualquer momento. Notificaremos sobre alterações significativas através da plataforma ou por email. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
      </p>

      <h2>13. Lei Aplicável e Jurisdição</h2>
      <p>
        Estes termos são regidos pelas leis de Portugal, sem consideração aos seus conflitos de leis. Qualquer disputa será resolvida nos tribunais competentes em Portugal. Para utilizadores fora de Portugal, aplicam-se as leis locais relevantes em conformidade com a RGPD e regulamentações internacionais de proteção de dados.
      </p>

      <h2>14. Contacto</h2>
      <p>
        Se tiver questões, preocupações ou desejar reportar violações destes Termos e Condições, pode contactar-nos:
      </p>
      <ul>
        <li>Email: suporte@globememories.com</li>
        <li>Email de Denúncias: moderation@globememories.com</li>
        <li>Através do formulário "Fala Connosco" na plataforma</li>
      </ul>
      <p style={{ marginTop: '15px', fontStyle: 'italic', fontWeight: 'bold' }}>
        ⚠️ Ao criar uma conta e utilizar Globe Memories, confirma que leu, compreendeu e aceita integralmente estes Termos e Condições e a Política de Privacidade.
      </p>
    </div>
  );

  const privacyContent = (
    <div>
      <h2>1. Informações que Recolhemos</h2>
      <h3>1.1 Informações Fornecidas por Si</h3>
      <p>
        Recolhemos informações que nos fornece diretamente durante o registo e utilização da plataforma:
      </p>
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
      <p>
        Quando utiliza o nosso serviço, recolhemos automaticamente:
      </p>
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
      <h3>3.1 Partilha Pública (Baseada em Configurações de Privacidade)</h3>
      <p>
        O conteúdo que escolhe tornar público será visível para outros utilizadores. Se o seu perfil for público, outros utilizadores podem ver o seu nome de utilizador, fotografia, descrição, viagens públicas e memórias.
      </p>
      <p>
        <strong>Importante:</strong> Pode controlar completamente a privacidade do seu conteúdo nas suas definições.
      </p>

      <h3>3.2 Não Partilha com Terceiros para Fins Comerciais</h3>
      <p>
        <strong>Não vendemos, não alugamos e não partilhamos as suas informações pessoais com terceiros para fins de marketing comercial.</strong> Isto é fundamental para a confiança na comunidade.
      </p>

      <h3>3.3 Prestadores de Serviços Técnicos</h3>
      <p>
        Podemos partilhar informações com prestadores de serviços terceiros sob rigorosos acordos de confidencialidade:
      </p>
      <ul>
        <li>Fornecedores de alojamento na nuvem</li>
        <li>Serviços de análise web</li>
        <li>Fornecedores de email</li>
        <li>Fornecedores de segurança cibernética</li>
      </ul>

      <h3>3.4 Requisitos Legais</h3>
      <p>
        Podemos divulgar informações se exigido por lei ou ordem judicial:
      </p>
      <ul>
        <li>Cumprir obrigações legais</li>
        <li>Proteger direitos legais da Globe Memories</li>
        <li>Prevenir fraudes ou problemas de segurança</li>
        <li>Proteger a segurança pessoal de utilizadores</li>
      </ul>

      <h2>4. Segurança dos Dados</h2>
      <p>
        Implementamos medidas de segurança técnicas e organizacionais adequadas:
      </p>
      <ul>
        <li>Encriptação SSL/TLS para todas as transmissões</li>
        <li>Encriptação de senhas em bases de dados</li>
        <li>Firewalls e proteção contra intrusions</li>
        <li>Controlo de acesso baseado em privilégios</li>
        <li>Monitorização contínua de segurança</li>
      </ul>
      <p>
        <strong>Responsabilidade partilhada:</strong> Nenhum método é 100% seguro. Você é responsável pela sua palavra-passe. Comprometemo-nos a implementar as melhores práticas.
      </p>

      <h2>5. Cookies e Tecnologias de Rastreamento</h2>
      <p>
        Utilizamos cookies e tecnologias similares para:
      </p>
      <ul>
        <li>Funcionalidade: Manter a sua sessão ativa e preferências</li>
        <li>Segurança: Detectar e prevenir fraudes</li>
        <li>Análise: Compreender como utiliza o serviço</li>
        <li>Melhorias: Otimizar a experiência de utilizador</li>
      </ul>
      <p>
        <strong>Cookies essenciais:</strong> Alguns cookies são essenciais para a operação do serviço e não podem ser desativados.
      </p>
      <p>
        <strong>Cookies opcionais:</strong> Pode controlar cookies opcionais através das configurações do seu navegador ou através das nossas definições de privacidade.
      </p>

      <h2>6. Os Seus Direitos de Dados (RGPD)</h2>
      <p>
        De acordo com a Lei de Proteção de Dados (RGPD), tem os seguintes direitos:
      </p>
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
        Mantemos as suas informações pessoais apenas pelo tempo necessário para cumprir os fins descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
      </p>

      <h2>8. Transferências Internacionais</h2>
      <p>
        As suas informações podem ser transferidas e processadas em servidores localizados em Portugal ou países parceiros. Garantimos que tais transferências cumprem os requisitos do RGPD.
      </p>

      <h2>9. Protecção de Menores</h2>
      <p>
        <strong>O nosso serviço não se destina a menores de 16 anos.</strong> Não recolhemos intencionalmente informações pessoais de menores de 16 anos. Utilizadores entre 16 e 18 anos podem usar o serviço apenas com consentimento dos pais ou tutores legais.
      </p>

      <h2>10. Segurança dos Dados</h2>
      <p>
        Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger as suas informações pessoais:
      </p>
      <ul>
        <li>Encriptação SSL/TLS para todas as transmissões de dados</li>
        <li>Encriptação de senhas em bases de dados</li>
        <li>Firewalls e proteção contra intrusions</li>
        <li>Controlo de acesso baseado em privilégios</li>
        <li>Monitorização contínua de segurança</li>
      </ul>

      <h2>11. Alterações a esta Política</h2>
      <p>
        Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas publicando a nova política no nosso site e por email aos utilizadores ativos.
      </p>

      <h2>12. Contacto e Direitos</h2>
      <p>
        Se tiver questões sobre esta Política de Privacidade, pode contactar-nos:
      </p>
      <ul>
        <li>Email de Privacidade: privacidade@globememories.com</li>
        <li>Email de Suporte: suporte@globememories.com</li>
        <li>Formulário: Através da opção "Fala Connosco" na plataforma</li>
      </ul>
      <p>
        <strong>Direito a reclamação:</strong> Tem o direito de apresentar uma reclamação à autoridade de proteção de dados competente (CNPD em Portugal).
      </p>

      <h2>13. Compromisso com Privacidade</h2>
      <p>
        <strong>Privacidade é um valor fundamental de Globe Memories.</strong> Comprometemo-nos a:
      </p>
      <ul>
        <li>Nunca vender dados de utilizadores a terceiros</li>
        <li>Ser transparentes sobre como recolhemos e usamos dados</li>
        <li>Respeitar as escolhas de privacidade dos utilizadores</li>
        <li>Cumprir com todas as regulamentações de proteção de dados aplicáveis</li>
        <li>Manter dados seguros e protegidos</li>
      </ul>

      <p style={{ marginTop: '15px', fontStyle: 'italic', fontWeight: 'bold' }}>
        ⚠️ <strong>Compromisso Fundamental:</strong> Privacidade é um valor fundamental. Nunca vendemos dados a terceiros. Somos transparentes e respeitamos as suas escolhas de privacidade. Confiança é a base da nossa comunidade de viajantes.
      </p>
    </div>
  );

  return (
    <div className="terms-modal-overlay" onClick={handleOverlayClick}>
      <div className="terms-modal">
        <div className="terms-modal-header">
          <h1 className="terms-modal-title">
            {activeTab === 'terms' ? 'Termos e Condições' : 'Política de Privacidade'}
          </h1>
          <button className="terms-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="terms-modal-tabs">
          <button 
            className={`terms-modal-tab ${activeTab === 'terms' ? 'active' : ''}`}
            onClick={() => setActiveTab('terms')}
          >
            Termos e Condições
          </button>
          <button 
            className={`terms-modal-tab ${activeTab === 'privacy' ? 'active' : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            Política de Privacidade
          </button>
        </div>
        
        <div className="terms-modal-content">
          {activeTab === 'terms' ? termsContent : privacyContent}
        </div>
      </div>
    </div>
  );
};

export default TermsModal;