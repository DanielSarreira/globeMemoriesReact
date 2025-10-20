import React, { useState } from 'react';
import Toast from '../components/Toast';
import { FaUser, FaEnvelope, FaCommentDots, FaPaperPlane, FaQuestionCircle, FaChevronDown } from 'react-icons/fa';
// ...existing code...

const HelpSupport = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const showToast = (message, type) => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => {
    setToast({ ...toast, show: false });
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'name':
        if (!value.trim()) {
          error = 'Nome é obrigatório';
        } else if (value.trim().length < 2) {
          error = 'Nome deve ter pelo menos 2 caracteres';
        } else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(value)) {
          error = 'Nome deve conter apenas letras';
        }
        break;
      case 'email':
        if (!value.trim()) {
          error = 'Email é obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Formato de email inválido';
        }
        break;
      case 'message':
        if (!value.trim()) {
          error = 'Mensagem é obrigatória';
        } else if (value.trim().length < 10) {
          error = 'Mensagem deve ter pelo menos 10 caracteres';
        } else if (value.trim().length > 1000) {
          error = 'Mensagem deve ter no máximo 1000 caracteres';
        }
        break;
      default:
        break;
    }
    return error;
  };

  const validateAllFields = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validação em tempo real
    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validar todos os campos
    if (!validateAllFields()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação de envio do formulário
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast('Mensagem enviada com sucesso! Responderemos em breve.', 'success');
      
      // Limpar formulário
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setErrors({});
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      showToast('Erro ao enviar mensagem. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="help-support-container">      
     <section className="faq-section">
  <h2><FaQuestionCircle style={{marginRight: '10px'}} />Perguntas Frequentes (FAQ)</h2>
  
  <div className={`faq-item ${expandedFAQ === 0 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(0)}>1. Como posso criar uma conta?</h3>
    {expandedFAQ === 0 && <p>Criar uma conta é muito simples! Clica no botão "Registar" no menu principal da aplicação. De seguida, preenche os campos solicitados com os teus dados pessoais, como o teu nome completo, endereço de correio eletrónico e uma palavra-passe segura. Após preencheres todos os campos obrigatórios, clica em "Registar" para finalizar o processo. Receberás um email de confirmação para validar a tua conta antes de poderes fazer login.</p>}
  </div>
  
  <div className={`faq-item ${expandedFAQ === 1 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(1)}>2. Como acedo à minha conta?</h3>
    {expandedFAQ === 1 && <p>Para fazer login, clica no botão "Entrar" ou "Login" no menu principal. Insere o teu endereço de correio eletrónico e a tua palavra-passe nos respetivos campos. Se esqueceste a tua palavra-passe, existe um link "Esqueci a minha palavra-passe" que te permitirá recuperá-la facilmente através do teu email. Após fazeres login com sucesso, serás redirecionado para o teu dashboard pessoal.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 2 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(2)}>3. Como editar e personalizar o meu perfil?</h3>
    {expandedFAQ === 2 && <p>Para editar o teu perfil, acede à secção "O Meu Perfil" através do menu principal. Aqui podes atualizar as tuas informações pessoais, como a fotografia de perfil, descrição pessoal, nacionalidade e outras preferências. Podes também escolher o teu nível de privacidade (privado ou público) e decidir quem pode ver as tuas viagens e atividades. Todas as alterações são guardadas automaticamente para garantir que os teus dados estão sempre atualizados.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 3 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(3)}>4. Como criar e registar uma nova viagem?</h3>
    {expandedFAQ === 3 && <p>Para criar uma viagem, vai a "As Minhas Viagens" no menu e clica no botão "Criar Viagem" ou "+". Preenche os detalhes da tua viagem, incluindo: o destino (país/cidade), as datas de início e fim, uma descrição da viagem, fotografias/vídeos dos teus momentos, e o tipo de transporte utilizado. Podes adicionar várias memórias durante a viagem. Após completares todos os detalhes, clica em "Guardar Viagem" para registá-la na tua plataforma pessoal.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 4 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(4)}>5. Como adicionar memórias e fotografias às minhas viagens?</h3>
    {expandedFAQ === 4 && <p>As memórias são o coração de Globe Memories! Para adicionar uma memória, abre a viagem desejada e clica em "Adicionar Memória" ou "+". Podes inserir uma descrição do momento, adicionar uma ou várias fotografias, vídeos, data e localização exata (GPS). Podes também associar um tipo de atividade (museu, praia, restaurante, etc.) para melhor organizar as tuas experiências. Cada memória fica registada com a data e localização, criando assim um mapa pessoal das tuas aventuras.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 5 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(5)}>6. O que é o Mapa Interativo e como funciona?</h3>
    {expandedFAQ === 5 && <p>O Mapa Interativo é uma funcionalidade especial que te mostra todas as tuas viagens e memórias num mapa-múndi visual. Podes ver cada localização onde registaste uma memória, visualizar as tuas rotas de viagem, e explorar as atividades que realizaste em cada destino. Clicando nas marcações no mapa, podes ver as fotografias, descrições e detalhes das tuas memórias. Esta ferramenta é perfeita para rever todas as tuas aventuras de uma forma geográfica e visual.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 6 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(6)}>7. Como visualizar e partilhar o meu perfil com outros viajantes?</h3>
    {expandedFAQ === 6 && <p>Se definires o teu perfil como público, outros utilizadores podem visitá-lo através da função "Explorar Viajantes" ou "Procurar Utilizadores". No teu perfil público, outros utilizadores conseguem ver as tuas viagens aprovadas para visualização, a tua descrição pessoal e as tuas memórias destacadas. Podes partilhar um link direto do teu perfil com amigos para que eles vejam facilmente o teu histórico de viagens. Todos os utilizadores privados têm a opção de enviar pedidos de amizade para aceder a mais conteúdo.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 7 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(7)}>8. O que são Conquistas e como as obtenho?</h3>
    {expandedFAQ === 7 && <p>As Conquistas são troféus digitais que ganhas à medida que utilizas a aplicação e exploras o mundo! Podes desbloquear conquistas ao atingires certos marcos, como visitar um número específico de países, registar um número determinado de memórias, ter uma sequência de dias ativos, ou completar desafios especiais. Visualiza todas as tuas conquistas na secção "Conquistas" do teu perfil. Estas são uma forma divertida de manter um registo do teu progresso como viajante global.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 8 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(8)}>9. O que é a funcionalidade de Clima (Weather)?</h3>
    {expandedFAQ === 8 && <p>A funcionalidade de Clima mostra-te informações meteorológicas em tempo real sobre os destinos que visitas. Podes ver a temperatura, humidade, velocidade do vento, e outras condições climáticas de qualquer localização no mundo. Isto é útil para planear as tuas viagens e preparar-te adequadamente para o clima do destino. A informação é atualizada regularmente e ajuda-te a aproveitar ao máximo a tua experiência de viagem.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 9 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(9)}>10. Como planejar viagens futuras?</h3>
    {expandedFAQ === 9 && <p>Na secção "Viagens Futuras", podes criar e planejar viagens que tens em mente para o futuro. Aqui podes adicionar os destinos que queres visitar, definirem as datas planeadas, criar uma lista de itens a levar, pesquisar informações sobre o local, e ver o clima previsto. Esta funcionalidade ajuda-te a organizar melhor as tuas viagens e a manter um registo de todos os destinos que gostarias de explorar. Quando completares a viagem, podes movê-la facilmente para "As Minhas Viagens" e adicionar as memórias reais.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 10 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(10)}>11. Como funciona o sistema de comentários e avaliações?</h3>
    {expandedFAQ === 10 && <p>Podes deixar comentários e avaliações sobre outras viagens e memórias (se o utilizador permitir). Isto cria uma comunidade ativa de viajantes onde podeis trocar experiências, dicas e recomendações. Se receberes comentários no teu perfil, podes respondê-los ou gerenciar a privacidade dos mesmos nas tuas configurações. Os comentários ajudam a criar uma rede social de viajantes com interesses comuns.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 11 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(11)}>12. Como ajustar as minhas definições de privacidade?</h3>
    {expandedFAQ === 11 && <p>Podes controlar completamente a tua privacidade na secção "Definições e Privacidade". Aqui podes escolher se o teu perfil é público ou privado, quem pode ver as tuas viagens, quem pode comentar nas tuas memórias, e se deseas receber notificações. Podes também bloquear utilizadores específicos se necessário. A tua privacidade e segurança são prioridade máxima, pelo que tens total controlo sobre quem consegue ver o teu conteúdo.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 12 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(12)}>13. Como desinstalar a aplicação no meu dispositivo móvel?</h3>
    {expandedFAQ === 12 && <p>A aplicação pode ser acedida tanto em versão web como numa progressiva web app (PWA) que funciona como uma aplicação móvel nativa. Se quiseres instalar a app no teu smartphone, um popup aparecerá sugerindo-te instalar a aplicação. Clica em "Instalar" para adicionar um atalho à tua home screen. Se desejas desinstalar a aplicação de um smartphone, podes simplesmente remover o atalho da home screen ou fazer long-press e escolher remover.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 13 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(13)}>14. Como contacto o suporte técnico se tiver problemas?</h3>
    {expandedFAQ === 13 && <p>Se encontrares qualquer problema técnico, erros na aplicação, ou tiveres sugestões de melhorias, podes contactar-nos através do formulário "Fala Connosco" abaixo. Preenche os teus dados, descreve detalhadamente o problema ou questão, e submete. O nosso suporte técnico responderá dentro de 24 a 48 horas. Também podes enviar emails diretos para <a href="mailto:suporte@globememories.com">suporte@globememories.com</a> para questões mais urgentes.</p>}
  </div>

  <div className={`faq-item ${expandedFAQ === 14 ? 'active' : ''}`}>
    <h3 onClick={() => toggleFAQ(14)}>15. Os meus dados estão seguros?</h3>
    {expandedFAQ === 14 && <p>Sim! Levamos a segurança dos teus dados muito a sério. Todas as informações são encriptadas, guardadas em servidores seguros, e apenas tu e o pessoal de suporte autorizado conseguem aceder. A tua palavra-passe é guardada de forma segura e nunca é partilhada. Se desejas conhecer mais detalhes sobre como proteges os teus dados, consulta a nossa Política de Privacidade completa. Também podes eliminar a tua conta completamente a qualquer momento nas tuas definições.</p>}
  </div>

</section>
<br></br>

      <section className="contact-section">
        <h2>📬 Fala Connosco</h2>
        <p>Se não encontraste resposta à tua questão nas Perguntas Frequentes acima, estamos aqui para ajudar! Preenche o formulário abaixo com os teus dados e uma descrição detalhada do teu problema, questão ou sugestão. O nosso suporte técnico dedicado responderá em breve com uma solução ou resposta. Agradecemos o teu feedback, pois nos ajuda a melhorar continuamente a experiência de todos os utilizadores de Globe Memories.</p>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">
              <FaUser style={{ marginRight: '8px' }} />
              Nome <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name}
              onChange={handleChange}
              placeholder="O seu nome completo..." 
              className={errors.name ? 'input-error' : ''}
              required 
            />
            {errors.name && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <FaEnvelope style={{ marginRight: '8px' }} />
              Email <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email}
              onChange={handleChange}
              placeholder="O seu email de contacto..." 
              style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
              required 
            />
            {errors.email && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="message">
              <FaCommentDots style={{ marginRight: '8px' }} />
              Mensagem <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea 
              id="message" 
              name="message" 
              value={formData.message}
              onChange={handleChange}
              placeholder="Descreva detalhadamente a sua questão ou problema..." 
              rows="6" 
              style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
              required
            />
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginTop: '5px',
              textAlign: 'right'
            }}>
              {formData.message.length}/1000
            </div>
            {errors.message && (
              <div className="field-error" style={{ color: '#e74c3c', fontSize: '14px', marginTop: '5px' }}>
                ⚠️ {errors.message}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
            style={{
              padding: '12px 24px',
              backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              marginTop: '20px'
            }}
          >
            <FaPaperPlane /> 
            {isSubmitting ? 'A enviar mensagem...' : 'Enviar Mensagem'}
          </button>
        </form>
      </section>

      {/* Toast para feedback */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default HelpSupport;
