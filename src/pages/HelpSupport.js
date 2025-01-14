import React from 'react';
import '../styles/HelpSupport.css';

const HelpSupport = () => {
  return (
    <div className="help-support-container">
      <h1>Ajuda e Suporte</h1>
      
      <section className="faq-section">
        <h2>Perguntas Frequentes (FAQ)</h2>
        <div className="faq-item">
          <h3>1. Como posso criar uma conta?</h3>
          <p>Podes criar uma conta clicando no botão "Registar" no menu principal e preenchendo os dados necessários.</p>
        </div>
        <div className="faq-item">
          <h3>2. Como editar o meu perfil?</h3>
          <p>Vai até à secção "O meu Perfil" no menu e seleciona "Editar Perfil". Faz as alterações necessárias e guarda.</p>
        </div>
        <div className="faq-item">
          <h3>3. Como posso criar uma nova viagem?</h3>
          <p>Na secção "As Minhas Viagens", clica no botão "Criar Viagem" e preenche os detalhes da tua viagem.</p>
        </div>
        <div className="faq-item">
          <h3>4. O que fazer se encontrar um erro na app?</h3>
          <p>Contacta-nos através do formulário abaixo ou envia um email para suporte@app.com.</p>
        </div>
      </section>

      <section className="contact-section">
        <h2>Fala Connosco</h2>
        <p>Se não encontraste a resposta à tua questão, preenche o formulário abaixo e entraremos em contacto contigo.</p>
        <form className="contact-form">
          <label htmlFor="name">Nome</label>
          <input type="text" id="name" name="name" placeholder="O teu nome..." required />

          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" placeholder="O teu email..." required />

          <label htmlFor="message">Mensagem</label>
          <textarea id="message" name="message" placeholder="Escreve a tua mensagem..." rows="5" required></textarea>

          <button type="submit">Enviar</button>
        </form>
      </section>
    </div>
  );
};

export default HelpSupport;
