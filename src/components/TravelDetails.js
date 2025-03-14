import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData'; // Verifique se o caminho está correto
import '../components/TravelDetails.css'; // Certifique-se de que o caminho está correto
import { FaStar } from 'react-icons/fa';

const TravelDetails = () => {
  const { id } = useParams();
  const travel = travels.find((t) => t.id === parseInt(id, 10));
  const [activeTab, setActiveTab] = useState('generalInformation');
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState('');
  const [commentList, setCommentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPriceDetails, setShowPriceDetails] = useState(false);

  // Filtrar viagens recomendadas pela categoria da viagem atual
  const recommendedTravels = travels.filter(
    (t) => t.category.includes(travel.category[0]) && t.id !== travel.id
  );

  const handleFavoriteToggle = () => {
    setIsFavorite(!isFavorite);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (comments.trim()) {
      setCommentList([...commentList, comments]);
      setComments('');
    }
  };

  // Funções de navegação no slider
  const nextTravel = () => {
    if (currentIndex < recommendedTravels.length - 4) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevTravel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Função para rolar para o topo da página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!travel) {
    return <div>Viagem não encontrada.</div>;
  }

  const renderStars = (stars) =>
    [...Array(5)].map((_, index) => (
      <FaStar
        key={index}
        color={index < stars ? '#ffc107' : '#e4e5e9'}
        size={20}
      />
    ));

  return (
    <div className="travel-details-container">
     <div className="travel-info">
  {/* Imagem em destaque */}
  <div className="highlight-image">
    <img src={travel.highlightImage} alt="Imagem de destaque" />
  </div>
  
  {/* Informações gerais */}
  <div className="info">
    <div className="infoLeft">
      <h1>{travel.name}</h1>
      <p><strong>👤 Utilizador:</strong> {travel.user}</p>
      <p><strong>🌍 País:</strong> {travel.country}</p>
      <p><strong>🏙️ Cidade:</strong> {travel.city}</p>
      <p><strong>🗂️ Categoria:</strong> {travel.category.join(', ')}</p>
      <p><strong>💰 Preço Total Da Viagem:</strong> {travel.price}€</p>

      {showPriceDetails && (
  <div className="price-details">
    <p><strong>Preço da Estadia:</strong> {travel.priceDetails.hotel}€</p>
    <p><strong>Preço da Alimentação:</strong> {travel.priceDetails.food}€</p>
    <p><strong>Preço Métodos de Transporte:</strong> {travel.priceDetails.transport}€</p>
    <p><strong>Extras</strong> {travel.priceDetails.extras}€</p>
    
  </div>
)}


      <button onClick={() => setShowPriceDetails(!showPriceDetails)}>
  {showPriceDetails ? 'Ocultar Detalhes de Preço' : 'Ver Detalhes de Preço'}
</button>
      
      <p><strong>📅 Datas:</strong> {travel.startDate} a {travel.endDate}</p>
      <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
      
      
    </div>

    <div className="infoRight">
    <p><strong>📖 Descrição da Viagem:</strong> <br></br>{travel.description}</p>
      

      
    </div>
  </div>
</div>


<div className='moreDetails'>
    {/* Tabs */}
    <div className="tabs">
    
    <button 
          className={`tab-button ${activeTab === 'generalInformation' ? 'active' : ''}`}
          onClick={() => setActiveTab('generalInformation')}
        >
          Informações Gerais
        </button>

          
        <button 
          className={`tab-button ${activeTab === 'accommodations' ? 'active' : ''}`}
          onClick={() => setActiveTab('accommodations')}
        >
          Estadia
        </button>

        <button 
          className={`tab-button ${activeTab === 'foodRecommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('foodRecommendations')}
        >
          Alimentação
        </button>

        <button 
          className={`tab-button ${activeTab === 'transport' ? 'active' : ''}`}
          onClick={() => setActiveTab('transport')}
        >
          Métodos de Transporte
        </button>


        <button 
          className={`tab-button ${activeTab === 'referencePoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('referencePoints')}
        >
          Pontos de Referência
        </button>

        <button 
          className={`tab-button ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => setActiveTab('itinerary')}
        >
          Itinerário da Viagem
        </button>

        <button 
          className={`tab-button ${activeTab === 'negativePoints' ? 'active' : ''}`}
          onClick={() => setActiveTab('negativePoints')}
        >
          Pontos Negativos
        </button>


      </div>

      {/* Conteúdo das Tabs */}

      <div className="tab-content">
        
      {activeTab === 'generalInformation' && (
    <>
      {/* Div original (generalInfoLeft) */}
      <div className="generalInfoLeft">
        <h2><strong>{travel.name}</strong></h2>
       
          
            <p><strong>Clima:<br></br></strong> {travel.climate}</p>
            <p><strong>Línguas Utilizadas:<br></br></strong> {travel.language}<br></br></p>
            
        
      </div>

      {/* Nova div (generalInfoRight) */}
      <div className="generalInfoRight">
        <p><strong>📖 Descrição da Viagem:<br></br></strong> {travel.longDescription}</p>
        
        
        
      </div>
<br></br>
<br></br>
<br></br>

      <div className="">
          <div className="gallery">
        <h2>Galeria de Fotos</h2>
        <div className="gallery-images">
          {travel.images_generalInformation ? (
            travel.images_generalInformation.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da viagem ${index + 1}`}
              />
            ))
          ) : (
            <p>Sem imagens disponíveis.</p>
          )}
        </div>
      </div> 
      </div>
    </> 
          
        )}

        {activeTab === 'accommodations' && (
          <div>

{/* Div original (generalInfoLeft) */}
<div className="generalInfoLeft">
        <h2><strong>{travel.name} | Estadia</strong></h2>
       <br></br>
      
        {travel.accommodations.map((acc, index) => (
              <span key={index}>
               <strong>🏨 Nome: </strong> {acc.name}<br></br>
               <br></br><strong>🏨 Tipo de Estadia: </strong> <br></br>{acc.type}  <br></br>
               <br></br><strong>📖 Regime: </strong> <br></br>{acc.regime}  <br></br>
               <br></br><strong>📅 Check-in: </strong> <br></br>{acc.checkInDate}  <br></br>
               <br></br><strong>📅 Check-out: </strong> <br></br>{acc.checkInDate}  <br></br>
               
              </span>   
            ))}
            
            
        
      </div>

      {/* Nova div (generalInfoRight) */}
      <div className="generalInfoRight">
      {travel.accommodations.map((acc, index) => (
              <span key={index}>
               
               <br></br><strong>📖 Descrição da Estadia: </strong> <br></br>{acc.description}  <br></br>
             
              </span>
              
            ))}
        
        
        
      </div>





        <div className="gallery">
        <h2>Galeria de Fotos da Estadia</h2>
        <div className="gallery-images">
          {travel.images_accommodations ? (
            travel.images_accommodations.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da viagem ${index + 1}`}
              />
            ))
          ) : (
            <p>Sem imagens disponíveis.</p>
          )}
        </div>
      </div>
          </div>
        )}


        {activeTab === 'foodRecommendations' && (
          <div>
            <h2>Alimentação</h2>
            <p>
            <strong>🍽️ Recomendações de Comida:</strong><br></br>
            {travel.foodRecommendations.map((food, index) => (
              <span key={index}>
                {food.name} -{' '}
                {food.description} {' '}
              </span>
            ))}
          </p>
          <br></br>
          <br></br>
          <div className="gallery">
        <h2>Galeria de Fotos da Alimentação</h2>
        <div className="gallery-images">
          {travel.images_foodRecommendations ? (
            travel.images_foodRecommendations.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da viagem ${index + 1}`}
              />
            ))
          ) : (
            <p>Sem imagens disponíveis.</p>
          )}
        </div>
      </div>
          </div>
        )}





{activeTab === 'transport' && (
          <div>
            <h2>Métodos de Transporte</h2>
            <p><strong>✈️ Método de Transporte:<br></br></strong> {travel.transport}</p>       
          </div>
        )}






{activeTab === 'referencePoints' && (
           <div>
            <h2>Pontos de Referência</h2>
            <p>
            <strong>Pontos de Referência: </strong>
            {travel.pointsOfInterest.map((poi, index) => (
              <span key={index}>
                {poi.name} ({poi.type}) -{' '}
                <a href={poi.link} target="_blank" rel="noopener noreferrer">
                  Link
                </a>
              </span>
            ))}
          </p>
          <br></br>
          <br></br>
          <div className="gallery">
        <h2>Galeria de Fotos Pontos de Referência</h2>
        <div className="gallery-images">
          {travel.images_referencePoints ? (
            travel.images_referencePoints.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagem da viagem ${index + 1}`}
              />
            ))
          ) : (
            <p>Sem imagens disponíveis.</p>
          )}
        </div>
      </div>

         </div>
        )}

{activeTab === 'itinerary' && (
  <div>
    <h2>Itinerário da Viagem</h2>    
    {travel.itinerary.map((item, index) => (
      <div key={index}>
        <h4>Dia {item.day}:</h4>
          <p>
          {item.activities.map((activity, activityIndex) => (
            <li key={activityIndex}>{activity}</li>
          ))}
          </p>
      </div>
    ))}
  </div>
)}




{activeTab === 'negativePoints' && (
           <div>
           <h2>Pontos Negativos</h2>
           <p><strong>Pontos Negativos:</strong> {travel.negativePoints}</p>
         </div>
        )}
      </div>
  
</div>

    

      <div className="recommended-travels">
        <h2>Viagens Recomendadas</h2>
        <div className="carousel">
          {recommendedTravels.length > 4 && (
            <button
              className="carousel-button left"
              onClick={prevTravel}
              disabled={currentIndex === 0}
            >
              ❮
            </button>
          )}

          <div
            className="recommended-travel-list"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {recommendedTravels.map((travel, index) => (
              <Link
                key={index}
                to={`/travel/${travel.id}`}
                className="recommended-travel-item"
                onClick={scrollToTop}
              >
                <div className="card">
                  <img src={travel.highlightImage} alt="Viagem recomendada" />
                  <p><strong>{travel.name}</strong></p>
                  <p><strong>Preço:</strong> {travel.price}€</p>
                  <p>
                    <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {recommendedTravels.length > 4 && (
            <button
              className="carousel-button right"
              onClick={nextTravel}
              disabled={currentIndex >= recommendedTravels.length - 4}
            >
              ❯
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelDetails;
