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
        Ao aceder e utilizar o Globe Memories, concorda em cumprir e estar vinculado a estes Termos e Condições de Uso. Se não concordar com qualquer parte destes termos, não deve utilizar o nosso serviço.
      </p>

      <h2>2. Descrição do Serviço</h2>
      <p>
        O Globe Memories é uma plataforma digital que permite aos viajantes documentar, organizar e partilhar as suas memórias de viagem através de fotografias, vídeos, textos e outras formas de conteúdo multimédia.
      </p>

      <h2>3. Conta do Viajante</h2>
      <h3>3.1 Registo</h3>
      <p>
        Para utilizar certas funcionalidades do serviço, deve criar uma conta fornecendo informações precisas, actuais e completas durante o processo de registo.
      </p>
      <h3>3.2 Segurança da Conta</h3>
      <p>
        É responsável por manter a confidencialidade da sua palavra-passe e por todas as atividades que ocorram na sua conta. Deve notificar-nos imediatamente sobre qualquer uso não autorizado da sua conta.
      </p>

      <h2>4. Conteúdo do Viajante</h2>
      <h3>4.1 Propriedade</h3>
      <p>
        Mantém a propriedade de todo o conteúdo que carrega, publica ou exibe no Globe Memories. No entanto, ao publicar conteúdo, concede-nos uma licença mundial, não exclusiva, livre de direitos de autor para usar, modificar, reproduzir e distribuir esse conteúdo.
      </p>
      <h3>4.2 Responsabilidade</h3>
      <p>
        É totalmente responsável pelo conteúdo que publica e deve garantir que possui todos os direitos necessários para o fazer.
      </p>

      <h2>5. Uso Aceitável</h2>
      <p>Concorda em não usar o serviço para:</p>
      <ul>
        <li>Publicar conteúdo ilegal, ofensivo, difamatório ou que viole direitos de terceiros</li>
        <li>Enviar spam ou conteúdo promocional não solicitado</li>
        <li>Interferir com a operação do serviço ou servidores</li>
        <li>Tentar aceder a contas de outros viajantes</li>
        <li>Usar o serviço para fins comerciais sem autorização prévia</li>
      </ul>

      <h2>6. Propriedade Intelectual</h2>
      <p>
        O Globe Memories e todo o seu conteúdo, funcionalidades e características são propriedade exclusiva nossa e dos nossos licenciadores, protegidos por leis de direitos de autor, marcas registadas e outras leis de propriedade intelectual.
      </p>

      <h2>7. Modificações do Serviço</h2>
      <p>
        Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento, com ou sem aviso prévio. Não seremos responsáveis perante si ou terceiros por qualquer modificação, suspensão ou descontinuação do serviço.
      </p>

      <h2>8. Limitação de Responsabilidade</h2>
      <p>
        O serviço é fornecido "como está" e "conforme disponível". Não garantimos que o serviço será ininterrupto, seguro ou livre de erros. Em nenhuma circunstância seremos responsáveis por danos diretos, indiretos, incidentais ou consequenciais.
      </p>

      <h2>9. Rescisão</h2>
      <p>
        Podemos rescindir ou suspender a sua conta e acesso ao serviço imediatamente, sem aviso prévio, por qualquer motivo, incluindo violação destes termos.
      </p>

      <h2>10. Alterações aos Termos</h2>
      <p>
        Reservamo-nos o direito de alterar estes termos a qualquer momento. As alterações entram em vigor imediatamente após a publicação. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
      </p>

      <h2>11. Lei Aplicável</h2>
      <p>
        Estes termos são regidos pelas leis de Portugal. Qualquer disputa será resolvida nos tribunais competentes de Portugal.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Se tiver questões sobre estes Termos e Condições, pode contactar-nos através do email: suporte@globememories.com
      </p>
    </div>
  );

  const privacyContent = (
    <div>
      <h2>1. Informações que Recolhemos</h2>
      <h3>1.1 Informações Fornecidas por Si</h3>
      <p>
        Recolhemos informações que nos fornece diretamente, incluindo:
      </p>
      <ul>
        <li>Nome, email, país e cidade durante o registo</li>
        <li>Fotografias, vídeos e textos que carrega</li>
        <li>Comentários e interações com outros utilizadores</li>
        <li>Informações de contacto quando nos contacta</li>
      </ul>

      <h3>1.2 Informações Recolhidas Automaticamente</h3>
      <p>
        Quando utiliza o nosso serviço, recolhemos automaticamente:
      </p>
      <ul>
        <li>Endereço IP e informações do dispositivo</li>
        <li>Tipo de navegador e sistema operativo</li>
        <li>Páginas visitadas e tempo gasto no site</li>
        <li>Dados de localização (se autorizado)</li>
        <li>Cookies e tecnologias similares</li>
      </ul>

      <h2>2. Como Utilizamos as suas Informações</h2>
      <p>Utilizamos as suas informações para:</p>
      <ul>
        <li>Fornecer, manter e melhorar os nossos serviços</li>
        <li>Processar transações e enviar notificações relacionadas</li>
        <li>Responder aos seus comentários e perguntas</li>
        <li>Enviar informações técnicas e de segurança</li>
        <li>Personalizar a sua experiência no serviço</li>
        <li>Monitorizar e analisar tendências de uso</li>
        <li>Detetar e prevenir fraudes e abusos</li>
      </ul>

      <h2>3. Partilha de Informações</h2>
      <h3>3.1 Partilha Pública</h3>
      <p>
        O conteúdo que escolhe tornar público (fotografias, comentários, perfil) será visível para outros utilizadores da plataforma.
      </p>

      <h3>3.2 Prestadores de Serviços</h3>
      <p>
        Podemos partilhar informações com prestadores de serviços terceiros que nos ajudam a operar o serviço, como:
      </p>
      <ul>
        <li>Fornecedores de alojamento na nuvem</li>
        <li>Serviços de análise</li>
        <li>Fornecedores de email</li>
        <li>Processadores de pagamento</li>
      </ul>

      <h3>3.3 Requisitos Legais</h3>
      <p>
        Podemos divulgar informações se exigido por lei ou se acreditarmos de boa fé que tal ação é necessária para:
      </p>
      <ul>
        <li>Cumprir obrigações legais</li>
        <li>Proteger os nossos direitos e propriedade</li>
        <li>Prevenir fraudes ou problemas de segurança</li>
        <li>Proteger a segurança pessoal dos utilizadores</li>
      </ul>

      <h2>4. Segurança dos Dados</h2>
      <p>
        Implementamos medidas de segurança técnicas e organizacionais adequadas para proteger as suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
      </p>
      <p>
        No entanto, nenhum método de transmissão pela internet ou armazenamento eletrónico é 100% seguro, pelo que não podemos garantir segurança absoluta.
      </p>

      <h2>5. Cookies e Tecnologias de Rastreamento</h2>
      <p>
        Utilizamos cookies e tecnologias similares para:
      </p>
      <ul>
        <li>Manter a sua sessão ativa</li>
        <li>Lembrar as suas preferências</li>
        <li>Analisar como utiliza o serviço</li>
        <li>Fornecer funcionalidades de redes sociais</li>
      </ul>
      <p>
        Pode controlar os cookies através das configurações do seu navegador.
      </p>

      <h2>6. Os Seus Direitos</h2>
      <p>Tem o direito de:</p>
      <ul>
        <li>Aceder às informações pessoais que possuímos sobre si</li>
        <li>Retificar informações imprecisas ou incompletas</li>
        <li>Eliminar as suas informações pessoais</li>
        <li>Restringir o processamento dos seus dados</li>
        <li>Portabilidade dos dados</li>
        <li>Opor-se ao processamento para fins de marketing</li>
      </ul>

      <h2>7. Retenção de Dados</h2>
      <p>
        Mantemos as suas informações pessoais apenas pelo tempo necessário para cumprir os fins descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
      </p>

      <h2>8. Transferências Internacionais</h2>
      <p>
        As suas informações podem ser transferidas e processadas em países fora do seu país de residência. Garantimos que tais transferências cumprem os requisitos legais aplicáveis.
      </p>

      <h2>9. Menores</h2>
      <p>
        O nosso serviço não se destina a menores de 16 anos. Não recolhemos intencionalmente informações pessoais de menores de 16 anos.
      </p>

      <h2>10. Alterações a esta Política</h2>
      <p>
        Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre alterações significativas publicando a nova política no nosso site.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Se tiver questões sobre esta Política de Privacidade, pode contactar-nos:
      </p>
      <ul>
        <li>Email: privacidade@globememories.com</li>
        <li>Telefone: +351 XXX XXX XXX</li>
        <li>Morada: [Endereço da empresa]</li>
      </ul>
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