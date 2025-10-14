// Exemplos de como implementar tooltips informativos no modal MyTravels

// Componente Tooltip reutilizável
const Tooltip = ({ text, children, className = "" }) => {
  return (
    <div className={`tooltip-container ${className}`}>
      {children}
      <div className="tooltip-icon">
        <div className="tooltip-text">{text}</div>
      </div>
    </div>
  );
};

// Exemplos de uso nos formulários:

// 1. Seção de Privacidade
const PrivacySection = () => (
  <div className="form-section">
    <div className="privacy-section">
      <Tooltip text="Defina quem pode ver a sua viagem: Público (todos podem ver), Amigos (apenas amigos podem ver) ou Privado (apenas tu podes ver)">
        <label>Privacidade da Viagem</label>
      </Tooltip>
      <select name="privacy">
        <option value="public">🌍 Público</option>
        <option value="friends">👥 Apenas Amigos</option>
        <option value="private">🔒 Privado</option>
      </select>
    </div>
  </div>
);

// 2. Seção de Destinos
const DestinationSection = () => (
  <div className="form-section">
    <div className="section-header destinations">
      <Tooltip text="Adicione todos os lugares que visitou durante a sua viagem. Pode incluir cidades, pontos turísticos ou qualquer local relevante.">
        <h3>Destinos Visitados</h3>
      </Tooltip>
    </div>
    
    <div className="multi-destination-section">
      <div className="destination-controls">
        <div className="form-group">
          <Tooltip text="Selecione o país onde viajou">
            <label>País <span className="required">*</span></label>
          </Tooltip>
          <select name="country" required>
            <option value="">Selecione um país</option>
            {/* opções */}
          </select>
        </div>

        <div className="form-group">
          <Tooltip text="Digite o nome da cidade ou local específico que visitou">
            <label>Cidade/Local <span className="required">*</span></label>
          </Tooltip>
          <input type="text" placeholder="Ex: Lisboa, Torre Eiffel..." required />
        </div>

        <button type="button" className="btn-add-destination">
          Adicionar Destino
        </button>
      </div>
    </div>
  </div>
);

// 3. Seção de Acomodação
const AccommodationSection = () => (
  <div className="form-section">
    <div className="section-header accommodation">
      <Tooltip text="Registe onde se hospedou durante a viagem, incluindo hotéis, pensões, casas de amigos ou qualquer tipo de alojamento.">
        <h3>Alojamentos</h3>
      </Tooltip>
    </div>

    <div className="form-group">
      <Tooltip text="Nome do hotel, pensão, Airbnb ou tipo de alojamento onde ficou">
        <label>Nome do Alojamento</label>
      </Tooltip>
      <input type="text" placeholder="Ex: Hotel Central, Casa da Vó..." />
    </div>

    <div className="form-group">
      <Tooltip text="Avalie a sua experiência de 1 a 5 estrelas para ajudar outros viajantes">
        <label>Avaliação</label>
      </Tooltip>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className="star">⭐</span>
        ))}
        <span className="rating-label">Clique nas estrelas para avaliar</span>
      </div>
    </div>
  </div>
);

// 4. Seção de Preços
const PricesSection = () => (
  <div className="form-section">
    <div className="prices-section">
      <Tooltip text="Registe todos os gastos da sua viagem para ter um controlo financeiro e ajudar outros viajantes a planear o orçamento.">
        <h3>Custos da Viagem</h3>
      </Tooltip>

      <div className="form-grid">
        <div className="form-group">
          <Tooltip text="Quanto gastou com passagens aéreas, rodoviárias, comboios, etc.">
            <label>Transporte</label>
          </Tooltip>
          <input type="number" placeholder="0.00" step="0.01" />
        </div>

        <div className="form-group">
          <Tooltip text="Valor total gasto com hotéis, pensões, Airbnb ou outros alojamentos">
            <label>Alojamento</label>
          </Tooltip>
          <input type="number" placeholder="0.00" step="0.01" />
        </div>

        <div className="form-group">
          <Tooltip text="Gastos com refeições, lanches, bebidas e experiências gastronómicas">
            <label>Alimentação</label>
          </Tooltip>
          <input type="number" placeholder="0.00" step="0.01" />
        </div>

        <div className="form-group">
          <Tooltip text="Ingressos para museus, shows, passeios, atividades turísticas, etc.">
            <label>Atividades/Entretenimento</label>
          </Tooltip>
          <input type="number" placeholder="0.00" step="0.01" />
        </div>
      </div>

      <div className="price-total-section">
        <div className="form-group">
          <Tooltip text="Valor total de todos os gastos da viagem. Este campo é calculado automaticamente ou pode ser inserido manualmente.">
            <label>Total Gasto na Viagem</label>
          </Tooltip>
          <input type="number" placeholder="0.00" step="0.01" className="calculated-total" />
        </div>
      </div>
    </div>
  </div>
);

// 5. Seção de Itinerário
const ItinerarySection = () => (
  <div className="form-section">
    <div className="section-header itinerary">
      <Tooltip text="Crie um roteiro detalhado da sua viagem, organizando as actividades por dia para ajudar outros viajantes a planearem-se.">
        <h3>Itinerário Detalhado</h3>
      </Tooltip>
    </div>

    <div className="itinerary-controls">
      <div className="form-group">
        <Tooltip text="Selecione o dia da viagem para adicionar atividades (ex: Dia 1, Dia 2...)">
          <label>Dia da Viagem</label>
        </Tooltip>
        <select>
          <option value="">Selecione o dia</option>
          <option value="1">Dia 1</option>
          <option value="2">Dia 2</option>
        </select>
      </div>

      <div className="form-group">
        <Tooltip text="Descreva as atividades realizadas neste dia (ex: 'Visita ao museu', 'Almoço no restaurante X')">
          <label>Atividades do Dia</label>
        </Tooltip>
        <textarea placeholder="Descreva as atividades do dia..." rows="3"></textarea>
      </div>
    </div>
  </div>
);

// 6. Seção de Grupo
const GroupSection = () => (
  <div className="form-section">
    <div className="section-header group">
      <Tooltip text="Adicione os companheiros de viagem para partilhar memórias e permitir que eles também contribuam para a viagem.">
        <h3>Companheiros de Viagem</h3>
      </Tooltip>
    </div>

    <div className="add-member-controls">
      <div className="form-group">
        <Tooltip text="Escreva o email do amigo que viajou consigo. Ele receberá uma notificação para confirmar a participação.">
          <label>Email do Companheiro</label>
        </Tooltip>
        <input type="email" placeholder="amigo@email.com" />
      </div>
      
      <button type="button" className="button-primary">
        Adicionar Companheiro
      </button>
    </div>
  </div>
);

// 7. Seção de Fotos
const PhotosSection = () => (
  <div className="form-section">
    <div className="section-header photos">
      <Tooltip text="Adicione fotografias da sua viagem para criar um álbum visual. As fotografias ajudam a contar a história da sua viagem.">
        <h3>Fotografias da Viagem</h3>
      </Tooltip>
    </div>

    <div className="image-upload-section">
      <Tooltip text="Clique para selecionar fotografias do seu dispositivo. Formatos aceites: JPG, PNG, GIF. Tamanho máximo: 5MB por fotografia.">
        <div className="image-upload-area">
          <div className="upload-text">Adicionar Fotografias</div>
          <div className="upload-hint">Arraste e largue ou clique para selecionar</div>
        </div>
      </Tooltip>
    </div>
  </div>
);

// Exemplo de integração no componente principal
const MyTravelsModal = () => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header-actions">
          <button className="modal-close-button" type="button">×</button>
          
          <Tooltip text="Crie uma nova viagem ou edite uma existente. Preencha todas as informações para criar uma memória completa da sua experiência.">
            <h2>Nova Viagem</h2>
          </Tooltip>

          <div className="modal-header-buttons">
            <Tooltip text="Guardar todas as informações da viagem">
              <button className="button-success">Guardar Viagem</button>
            </Tooltip>
            <Tooltip text="Cancelar e fechar sem guardar alterações">
              <button className="button-danger">Cancelar</button>
            </Tooltip>
          </div>
        </div>

        <div className="modal-body">
          <PrivacySection />
          <DestinationSection />
          <AccommodationSection />
          <PricesSection />
          <ItinerarySection />
          <GroupSection />
          <PhotosSection />
          
          <div className="action-buttons">
            <button type="submit" className="button-primary">
              Guardar Viagem
            </button>
            <button type="button" className="button-secondary">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTravelsModal;
