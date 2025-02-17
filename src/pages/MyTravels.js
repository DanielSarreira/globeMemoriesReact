import React, { useState } from 'react';
import TravelsData from '../data/travelsData.js'; // Suponho que o seu ficheiro de dados seja TravelsData.js
import { Link } from 'react-router-dom';
import '../styles/MyTravels.css';

const MinhasViagens = () => {
  const [viagens, setViagens] = useState(TravelsData);
  const [newTravel, setNewTravel] = useState({
    name: '',
    user: 'Tiago',
    category: [],
    country: '',
    city: '',
    price: '',
    days: '',
    transport: '',
    startDate: '',
    endDate: '',
    highlightImage: '',
    views: 0,
    priceDetails: { hotel: '', flight: '', food: '' },
    images: [],
    description: '',
    longDescription: '',
    activities: [],
    accommodations: [],
    foodRecommendations: [],
    climate: { averageTemperature: '', bestTimeToVisit: '' },
    pointsOfInterest: [],
    safety: { tips: [], vaccinations: [] },
    itinerary: [],
    localTransport: [],
    languageAndCulture: { language: '', usefulPhrases: [] },
    reviews: [],
    negativePoints: ''
  });

  const [isModalOpen, setIsModalOpen] = useState(false); // Controla a visibilidade do modal

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: checked,
      }));
    } else if (type === 'file') {
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: [...prevState[name], value],
      }));
    } else {
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };


  const handleEdit = (id) => {
    // Aqui você pode implementar o que acontece quando o usuário clica em Editar
    console.log(`Editar viagem com ID: ${id}`);
    // Exemplo: redirecionar para uma página de edição
  };

  const handleDelete = (id) => {
    // Aqui você pode implementar o que acontece quando o usuário clica em Excluir
    console.log(`Deletar viagem com ID: ${id}`);
    // Exemplo: remover a viagem do estado
    setViagens(viagens.filter(viagem => viagem.id !== id));
  };


  const handleAddTravel = () => {
    const newId = viagens.length + 1;
    const addedTravel = { ...newTravel, id: newId };
    setViagens((prevViagens) => [...prevViagens, addedTravel]);
    setNewTravel({
      name: '',
      user: 'Tiago',
      category: [],
      country: '',
      city: '',
      price: '',
      days: '',
      transport: '',
      startDate: '',
      endDate: '',
      highlightImage: '',
      views: 0,
      priceDetails: { hotel: '', flight: '', food: '' },
      images: [],
      description: '',
      longDescription: '',
      activities: [],
      accommodations: [],
      foodRecommendations: [],
      climate: { averageTemperature: '', bestTimeToVisit: '' },
      pointsOfInterest: [],
      safety: { tips: [], vaccinations: [] },
      itinerary: [],
      localTransport: [],
      languageAndCulture: { language: '', usefulPhrases: [] },
      reviews: [],
      negativePoints: ''
    });
    setIsModalOpen(false); // Fecha o modal após adicionar a viagem
  };

  const openModal = () => {
    setIsModalOpen(true); // Abre o modal
  };

  const closeModal = () => {
    setIsModalOpen(false); // Fecha o modal
  };

  return (
    <div className="minhas-viagens-container">

      {/* Botão para abrir o modal */}
      <button onClick={openModal}>Adicionar Nova Viagem</button>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Adicionar Nova Viagem</h2>
            <form>
              {/* Nome da Viagem */}
              <div>
                <label>Nome da Viagem:</label>
                <input
                  type="text"
                  name="name"
                  value={newTravel.name}
                  onChange={handleChange}
                />
              </div>

              {/* País */}
              <div>
                <label>País:</label>
                <input
                  type="text"
                  name="country"
                  value={newTravel.country}
                  onChange={handleChange}
                />
              </div>

              {/* Cidade */}
              <div>
                <label>Cidade:</label>
                <input
                  type="text"
                  name="city"
                  value={newTravel.city}
                  onChange={handleChange}
                />
              </div>

              {/* Preço */}
              <div>
                <label>Preço (€):</label>
                <input
                  type="number"
                  name="price"
                  value={newTravel.price}
                  onChange={handleChange}
                />
              </div>

              

              {/* Dias */}
              <div>
                <label>Duração (em dias):</label>
                <input
                  type="number"
                  name="days"
                  value={newTravel.days}
                  onChange={handleChange}
                />
              </div>

              {/* Transporte */}
              <div>
                <label>Transporte:</label>
                <input
                  type="text"
                  name="transport"
                  value={newTravel.transport}
                  onChange={handleChange}
                />
              </div>

              {/* Data de Início */}
              <div>
                <label>Data de Início:</label>
                <input
                  type="date"
                  name="startDate"
                  value={newTravel.startDate}
                  onChange={handleChange}
                />
              </div>

              {/* Data de Fim */}
              <div>
                <label>Data de Fim:</label>
                <input
                  type="date"
                  name="endDate"
                  value={newTravel.endDate}
                  onChange={handleChange}
                />
              </div>

              {/* Imagem de Destaque */}
              <div>
                <label>Imagem de Destaque:</label>
                <input
                  type="file"
                  name="highlightImage"
                  onChange={handleChange}
                />
              </div>

              {/* Descrição */}
              <div>
                <label>Descrição:</label>
                <textarea
                  name="description"
                  value={newTravel.description}
                  onChange={handleChange}
                />
              </div>

              {/* Longa Descrição */}
              <div>
                <label>Descrição Longa:</label>
                <textarea
                  name="longDescription"
                  value={newTravel.longDescription}
                  onChange={handleChange}
                />
              </div>

              {/* Atividades */}
              <div>
                <label>Atividades:</label>
                <input
                  type="text"
                  name="activities"
                  value={newTravel.activities}
                  onChange={handleChange}
                />
              </div>

              {/* Alimentação */}
              <div>
                <label>Recomendações de Alimentação:</label>
                <input
                  type="text"
                  name="foodRecommendations"
                  value={newTravel.foodRecommendations}
                  onChange={handleChange}
                />
              </div>

              {/* Clima */}
              <div>
                <label>Temperatura Média:</label>
                <input
                  type="text"
                  name="climate.averageTemperature"
                  value={newTravel.climate.averageTemperature}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Melhor Época para Visitar:</label>
                <input
                  type="text"
                  name="climate.bestTimeToVisit"
                  value={newTravel.climate.bestTimeToVisit}
                  onChange={handleChange}
                />
              </div>

              {/* Pontos de Interesse */}
              <div>
                <label>Pontos de Interesse:</label>
                <input
                  type="text"
                  name="pointsOfInterest"
                  value={newTravel.pointsOfInterest}
                  onChange={handleChange}
                />
              </div>

              {/* Segurança */}
              <div>
                <label>Dicas de Segurança:</label>
                <input
                  type="text"
                  name="safety.tips"
                  value={newTravel.safety.tips}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Vacinas Necessárias:</label>
                <input
                  type="text"
                  name="safety.vaccinations"
                  value={newTravel.safety.vaccinations}
                  onChange={handleChange}
                />
              </div>

              {/* Botões de ação */}
              <div className="modal-actions">
                <button type="button" onClick={handleAddTravel}>
                  Adicionar Viagem
                </button>
                <button type="button" onClick={closeModal}>
                  Fechar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de Viagens */}
      <div className="minhas-viagens-container">
      {viagens.length > 0 ? (
        <div className="viagens-list">
          {viagens.map((viagem) => (
            <div key={viagem.id} className="viagem-item">
              <img
                src={viagem.highlightImage}
                alt={`Imagem de destaque da viagem ${viagem.name}`}
                className="viagem-image"
              />
              <h2>{viagem.name}</h2>
              {/* Verificação de categoria antes de aplicar join */}
              <p><strong>Categoria:</strong> {Array.isArray(viagem.category) ? viagem.category.join(', ') : 'Categoria não disponível'}</p>
              <p><strong>Local:</strong> {viagem.city}, {viagem.country}</p>
              <p><strong>Preço:</strong> €{viagem.price}</p>
              <p><strong>Datas:</strong> {viagem.startDate} a {viagem.endDate}</p>
              <div className="viagem-actions">
                <button onClick={() => handleEdit(viagem.id)}>Editar</button>
                <button onClick={() => handleDelete(viagem.id)}>Eliminar</button>
                <button><Link to={`/travel/${viagem.id}`}>Ver Detalhes</Link></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>Não há viagens para mostrar.</p>
      )}
    </div>
    </div>
  );
};

export default MinhasViagens;
