import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData'; // Verifique se o caminho está correto
import '../styles/styles.css'; // Certifique-se de que o caminho está correto
import { FaStar } from 'react-icons/fa';

const TravelDetails = () => {
  const { user, userTravels } = useAuth();
  const { id } = useParams();
  const travel = userTravels.find((t) => t.id === parseInt(id, 10));
  const [activeTab, setActiveTab] = useState('generalInformation');
  const [isFavorite, setIsFavorite] = useState(false);
  const [comments, setComments] = useState('');
  const [commentList, setCommentList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPriceDetails, setShowPriceDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [itemWidth, setItemWidth] = useState(0);
  const carouselRef = useRef(null);

  // Filtrar viagens recomendadas que tenham EXATAMENTE as mesmas categorias da viagem atual
  // e limitar a 5 viagens
  const recommendedTravels = userTravels
    .filter((t) => {
      // Excluir a viagem atual
      if (t.id === travel.id) return false;
      // Verificar se a viagem tem TODAS as categorias da viagem atual
      return travel.categoryNames.every((category) => t.categoryNames.includes(category));
    })
    .slice(0, 5); // Limitar a 5 viagens

  const updateItemsPerView = () => {
    if (window.innerWidth <= 480) {
      setItemsPerView(1);
    } else if (window.innerWidth <= 768) {
      setItemsPerView(2);
    } else if (window.innerWidth <= 1024) {
      setItemsPerView(3);
    } else {
      setItemsPerView(4);
    }

    if (carouselRef.current) {
      const firstItem = carouselRef.current.querySelector('.recommended-travel-item');
      if (firstItem) {
        const itemStyle = window.getComputedStyle(firstItem);
        const width = firstItem.offsetWidth + parseFloat(itemStyle.marginRight);
        setItemWidth(width);
      }
    }
  };

  useEffect(() => {
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, [recommendedTravels]);

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

  const nextTravel = () => {
    if (currentIndex < recommendedTravels.length - itemsPerView) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevTravel = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const openModal = (image) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const translateX = `-${currentIndex * itemWidth}px`;

  return (
    <div className="travel-details-container">
      <div className="travel-info">
        <div className="highlight-image">
          <img src={travel.highlightImage} alt={`Imagem de destaque de ${travel.name}`} />
        </div>

        <div className="info">
          <div className="infoLeft">
            <h1>{travel.name}</h1>
            <p><strong>👤 Utilizador:</strong> {user.firstName} {user.lastName}</p>
            <p>
              <strong>🌍 País:</strong> {travel.countryName}
              <strong> 🏙️ Cidade:</strong> {travel.city}
            </p>
            <p><strong>🗂️ Categoria:</strong> {travel.categoryNames.join(', ')}</p>
            <p><strong>💰 Preço Total Da Viagem:</strong> {travel.cost.total}€</p>

            {showPriceDetails && (
              <div className="price-details">
                <p><strong>Preço da Estadia:</strong> {travel.cost.accommodation}€</p>
                <p><strong>Preço da Alimentação:</strong> {travel.cost.food}€</p>
                <p><strong>Preço Métodos de Transporte:</strong> {travel.cost.transport}€</p>
                <p><strong>Extras:</strong> {travel.cost.extra}€</p>
              </div>
            )}

            <button onClick={() => setShowPriceDetails(!showPriceDetails)}>
              {showPriceDetails ? 'Ocultar Detalhes de Preço' : 'Ver Detalhes de Preço'}
            </button>
            <br />
            <br />
            <p><strong>📅 Datas:</strong> {travel.startDate} a {travel.endDate}</p>
            <p><strong>📅 Data de Marcação:</strong> {travel.bookingDate}</p>
            <p><strong>Avaliação Geral:</strong> {renderStars(travel.tripRating)}</p>
          </div>

          <div className="infoRight">
            <p><strong>📖 Descrição da Viagem:</strong> <br />{travel.tripDescription}</p>
          </div>
        </div>
      </div>

      <div className="moreDetails">
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

        <div className="tab-content">
          {activeTab === 'generalInformation' && (
            <>
              <div className="generalInfoLeft">
                <h2>{travel.name}</h2>
                <p><strong>Clima:<br /></strong> {travel.climateDescription}</p>
                <p><strong>Línguas Utilizadas:<br /></strong> {travel.languageSpokenNames}<br /></p>
              </div>

              <div className="generalInfoRight">
                <p><strong>📖 Descrição da Viagem:<br /></strong> {travel.tripDescription}</p>
              </div>
              <br />
              <br />
              <br />

              <div className="masonry-gallery">
                <h2>Galeria de Fotos</h2>
                <div className="masonry-grid">
                  {travel.images_generalInformation ? (
                    travel.images_generalInformation.map((image, index) => (
                      <div className="masonry-item" key={index} onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Imagem da viagem ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                      </div>
                    ))
                  ) : (
                    <p>Sem imagens disponíveis.</p>
                  )}
                </div>
              </div>

              {recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>
                    
                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'accommodations' && (
            <div>
              <div className="generalInfoLeft">
                <h2>{travel.name} | Estadia</h2>
                <br />
                {travel.accommodations.map((acc, index) => (
                  <span key={index}>
                    <strong>🏨 Nome: </strong> {acc.name}<br />
                    <br />
                    <strong>🏨 Tipo de Estadia: </strong> <br />
                    {acc.accommodationTypeName} <br />
                    <br />
                    <strong>📖 Regime: </strong> <br />
                    {acc.accommodationBoardName} <br />
                    <br />
                    <strong>📅 Check-in: </strong> <br />
                    {acc.checkIn} <br />
                    <br />
                    <strong>📅 Check-out: </strong> <br />
                    {acc.checkOut} <br />
                  </span>
                ))}
              </div>

              <div className="generalInfoRight">
                {travel.accommodations.map((acc, index) => (
                  <span key={index}>
                    <br />
                    <strong>📖 Descrição da Estadia: </strong> <br />
                    {acc.description} <br />
                  </span>
                ))}
              </div>

              <div className="masonry-gallery">
                <h2>Galeria de Fotos da Alimentação</h2>
                <div className="masonry-grid">
                  {travel.images_accommodations ? (
                    travel.images_accommodations.map((image, index) => (
                      <div className="masonry-item" key={index} onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Imagem da alimentação ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                      </div>
                    ))
                  ) : (
                    <p>Sem imagens disponíveis.</p>
                  )}
                </div>
              </div>

              {recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'foodRecommendations' && (
            <div>
              <h2>Alimentação</h2>
              <p>
                <strong>🍽️ Recomendações de Comida:</strong><br />
                {travel.recommendedFoods.map((food, index) => (
                  <span key={index}>
                    {food.name} - {food.description} <br />
                  </span>
                ))}
              </p>
              <br />
              <br />
              <div className="masonry-gallery">
                <h2>Galeria de Fotos da Alimentação</h2>
                <div className="masonry-grid">
                  {travel.images_foodRecommendations ? (
                    travel.images_foodRecommendations.map((image, index) => (
                      <div className="masonry-item" key={index} onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Imagem da alimentação ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                      </div>
                    ))
                  ) : (
                    <p>Sem imagens disponíveis.</p>
                  )}
                </div>
              </div>

              {recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <div>
              <h2>Métodos de Transporte</h2>
              {travel.tripTransports && travel.tripTransports.length > 0 ? (
                travel.tripTransports.map((transport, index) => (
                  <div key={index} className="transport-details">
                    <p><strong>✈️ Nome do Transporte:</strong> {transport.name}</p>
                    <p><strong>Descrição:</strong> {transport.description}</p>
                    <p><strong>Custo:</strong> {transport.cost}€</p>

                    <div className="masonry-gallery">
                      <h3>Galeria de Fotos do Transporte</h3>
                      <div className="masonry-grid">
                        {transport.images && transport.images.length > 0 ? (
                          transport.images.map((image, imgIndex) => (
                            <div className="masonry-item" key={imgIndex} onClick={() => openModal(image)}>
                              <img
                                src={image instanceof File ? URL.createObjectURL(image) : image}
                                alt={`Imagem do transporte ${imgIndex + 1}`}
                                onError={(e) => (e.target.src = '/default-image.jpg')}
                              />
                            </div>
                          ))
                        ) : (
                          <p>Sem imagens disponíveis.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>Nenhum método de transporte disponível.</p>
              )}

                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                  </div>
                </div>  
          </div>

          )}

          {activeTab === 'referencePoints' && (
            <div>
              <h2>Pontos de Referência</h2>
              <p>
                <strong>Pontos de Referência: </strong>
                {travel.referencePoints.map((referencePoint, index) => (
                  <span key={index}>
                    {referencePoint.name} ({referencePoint.description}) -{' '}
                    <a href={referencePoint.link} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                    <br />
                  </span>
                ))}
              </p>
              <br />
              <br />
              <div className="masonry-gallery">
                <h2>Galeria de Fotos Pontos de Referência</h2>
                <div className="masonry-grid">
                  {travel.images_referencePoints ? (
                    travel.images_referencePoints.map((image, index) => (
                      <div className="masonry-item" key={index} onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Imagem do ponto de referência ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                      </div>
                    ))
                  ) : (
                    <p>Sem imagens disponíveis.</p>
                  )}
                </div>
              </div>

              {recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>
                    

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    
                  </div>
                </div>
              )}
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

<br></br><br></br>
{recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>
                   

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    
                  </div>
                </div>
              )}

            </div>


          )}

          {activeTab === 'negativePoints' && (
            <div>
              <h2>Pontos Negativos</h2>
              <p><strong>Pontos Negativos:</strong> {travel.negativePoints}</p>
<br></br><br></br>
              {recommendedTravels.length > 0 && (
                <div className="recommended-travels">
                  <h2>Viagens Recomendadas</h2>
                  <div className="carousel" ref={carouselRef}>
                   

                    <div
                      className="recommended-travel-list"
                      style={{ transform: `translateX(${translateX})` }}
                    >
                      {recommendedTravels.map((travel, index) => (
                        <Link
                          key={index}
                          to={`/travel/${travel.id}`}
                          className="recommended-travel-item"
                          onClick={scrollToTop}
                        >
                          <div className="card">
                            <img src={travel.highlightImage} alt={`Viagem para ${travel.name}`} />
                            <p><strong>{travel.name}</strong></p>
                            <p><strong>Preço:</strong> {travel.price}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars)}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>

                    
                  </div>
                </div>
              )}


            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content-travel-details" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close-travel-details" onClick={closeModal}>
              ×
            </span>
            <img
              src={selectedImage instanceof File ? URL.createObjectURL(selectedImage) : selectedImage}
              alt="Imagem ampliada"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TravelDetails;