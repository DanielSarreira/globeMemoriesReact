import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import travels from '../data/travelsData'; // Verifique se o caminho está correto
// ...existing code...
import { FaStar } from 'react-icons/fa';
import '../styles/components/TravelDetailsModern.css';

// Mock data para testes - REMOVER quando integrar com backend
// Estrutura completa baseada no MyTravels.js
const mockTravel = {
  id: 1,
  name: "Aventura Completa em Lisboa",
  user: "João Silva",
  category: ["Cultura", "História", "Gastronomia", "Natureza"],
  country: "Portugal",
  countryName: "Portugal",
  city: "Lisboa",
  price: "850",
  days: "7",
  transport: ["Metro", "Elétrico", "A Pé"],
  startDate: "2024-06-15",
  endDate: "2024-06-22",
  BookingTripPaymentDate: "2024-04-20",
  highlightImage: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop",
  
  // Vídeos da viagem
  travelVideos: [
    {
      url: "https://player.vimeo.com/video/76979871?autoplay=1&loop=1&muted=1",
      name: "Tour pela Baixa de Lisboa",
      description: "Passeio pelos principais pontos turísticos",
      duration: "2:45",
      size: "15.2 MB"
    },
    {
      url: "https://player.vimeo.com/video/31158841?autoplay=1&loop=1&muted=1",
      name: "Tramway 28 Experience",
      description: "Viagem no icónico elétrico 28",
      duration: "1:32",
      size: "8.7 MB"
    }
  ],
  
  views: 1847,
  
  // Detalhes de preços
  priceDetails: { 
    hotel: '320', 
    flight: '180', 
    food: '200', 
    extras: '150' 
  },
  cost: {
    total: 850,
    accommodation: 320,
    food: 200,
    transport: 180,
    extra: 150
  },
  
  images: [
    "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop"
  ],
  
  images_generalInformation: [
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1526566661780-1a67ea3c863e?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1562077981-4d7eafd44932?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1549544163-1d6cb4c66609?w=600&h=400&fit=crop"
  ],
  
  description: "Uma experiência única pela capital portuguesa, combinando história, cultura e gastronomia excepcional.",
  longDescription: "Esta viagem a Lisboa foi uma verdadeira aventura pelos encantos da capital portuguesa. Explorámos monumentos históricos fascinantes, saboreámos a autêntica gastronomia local e descobrimos recantos únicos da cidade. Desde as majestosas torres de Belém até aos miradouros com vistas deslumbrantes, cada momento foi inesquecível. A rica cultura, a hospitalidade do povo português e a arquitetura singular tornaram esta experiência verdadeiramente especial.",
  tripDescription: "Uma viagem incrível pela capital portuguesa, explorando monumentos históricos, saboreando a gastronomia local e descobrindo os encantos de Lisboa.",
  
  activities: [
    "Visita aos Mosteiros dos Jerónimos",
    "Passeio de elétrico pela cidade",
    "Degustação de pastéis de nata",
    "Exploração do Bairro Alto",
    "Caminhada pelo Cais do Sodré"
  ],
  
  // Acomodações
  accommodations: [
    {
      name: "Hotel Tivoli Oriente",
      type: "Hotel 4 Estrelas",
      accommodationTypeName: "Hotel 4 Estrelas",
      accommodationBoardName: "Pequeno-almoço incluído",
      description: "Hotel moderno localizado perto do Parque das Nações, com quartos confortáveis, piscina, spa e excelente localização para explorar Lisboa. Staff muito prestável e pequeno-almoço variado.",
      rating: 4.5,
      nights: "7",
      checkIn: "2024-06-15",
      checkOut: "2024-06-22",
      checkInDate: "2024-06-15",
      checkOutDate: "2024-06-22",
      regime: "Pequeno-almoço incluído",
      bookingDate: "2024-04-20",
      nrNights: 7,
      price: "320€",
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop"
      ]
    }
  ],
  
  images_accommodations: [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop"
  ],
  
  // Recomendações gastronómicas
  foodRecommendations: [
    {
      name: "Pastéis de Nata",
      description: "Deliciosos pastéis de nata dos famosos Pastéis de Belém, quentinhos e com canela."
    },
    {
      name: "Bacalhau à Brás",
      description: "Prato tradicional português com bacalhau desfiado, ovos batidos e batata palha fina."
    },
    {
      name: "Francesinha",
      description: "Sanduíche típica do Porto, mas encontrada também em Lisboa, com molho especial."
    },
    {
      name: "Bifana",
      description: "Sanduíche portuguesa simples mas deliciosa, perfeita para um lanche rápido."
    }
  ],
  
  recommendedFoods: [
    {
      name: "Pastéis de Nata",
      description: "Deliciosos pastéis de nata dos famosos Pastéis de Belém"
    },
    {
      name: "Bacalhau à Brás", 
      description: "Prato tradicional português com bacalhau desfiado, ovos e batata palha"
    }
  ],
  
  images_foodRecommendations: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop"
  ],
  
  climate: "Clima mediterrânico com temperaturas entre 18°C e 26°C. Ensolarado durante a maior parte do tempo, ideal para caminhadas e passeios ao ar livre. Algumas nuvens ocasionais mas sem chuva.",
  weather: "Ensolarado com temperaturas entre 18°C e 26°C. Ideal para caminhadas e passeios ao ar livre.",
  
  // Pontos de interesse
  pointsOfInterest: [
    {
      name: "Torre de Belém",
      description: "Monumento histórico classificado como Património Mundial da UNESCO, símbolo da Era dos Descobrimentos",
      type: "Monumento Histórico",
      link: "https://www.torrebelem.gov.pt/"
    },
    {
      name: "Mosteiro dos Jerónimos", 
      description: "Magnífico mosteiro manuelino em Belém, obra-prima da arquitetura portuguesa",
      type: "Monumento Religioso",
      link: "https://www.mosteirojeronimos.gov.pt/"
    },
    {
      name: "Castelo de São Jorge",
      description: "Castelo medieval com vistas panorâmicas sobre Lisboa e o Rio Tejo",
      type: "Castelo",
      link: "https://www.castelodesaojorge.pt/"
    },
    {
      name: "Miradouro da Senhora do Monte",
      description: "Um dos miradouros mais bonitos de Lisboa com vista de 360 graus",
      type: "Miradouro",
      link: ""
    }
  ],
  
  referencePoints: [
    {
      name: "Torre de Belém",
      description: "Monumento histórico classificado como Património Mundial da UNESCO",
      link: "https://www.torrebelem.gov.pt/"
    },
    {
      name: "Mosteiro dos Jerónimos",
      description: "Magnífico mosteiro manuelino em Belém", 
      link: "https://www.mosteirojeronimos.gov.pt/"
    }
  ],
  
  images_referencePoints: [
    "https://images.unsplash.com/photo-1549544163-1d6cb4c66609?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1526566661780-1a67ea3c863e?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1562077981-4d7eafd44932?w=600&h=400&fit=crop"
  ],
  
  // Segurança
  safety: { 
    tips: [
      "Lisboa é uma cidade muito segura, mas mantenha atenção aos pertences pessoais",
      "Cuidado com carteiristas em zonas muito turísticas",
      "Use sempre protetor solar devido ao sol forte"
    ], 
    vaccinations: [
      "Nenhuma vacinação específica necessária"
    ] 
  },
  
  // Itinerário completo
  itinerary: [
    {
      day: 1,
      activities: [
        "Chegada ao aeroporto e transfer para o hotel",
        "Check-in e descanso",
        "Passeio pela Baixa e Rossio",
        "Jantar no Bairro Alto"
      ]
    },
    {
      day: 2,
      activities: [
        "Visita ao Mosteiro dos Jerónimos",
        "Torre de Belém",
        "Degustação dos Pastéis de Belém",
        "Museu Nacional dos Coches"
      ]
    },
    {
      day: 3,
      activities: [
        "Excursão a Sintra",
        "Palácio da Pena",
        "Quinta da Regaleira",
        "Regresso a Lisboa"
      ]
    }
  ],
  
  tripItinerary: {
    itineraryDays: [
      {
        day: 1,
        topics: [
          {
            name: "Chegada e Check-in",
            description: "Chegada ao aeroporto, transfer para o hotel e check-in"
          },
          {
            name: "Passeio pela Baixa",
            description: "Caminhada pelo centro histórico e Rossio"
          }
        ]
      },
      {
        day: 2,
        topics: [
          {
            name: "Belém",
            description: "Visita à Torre de Belém e Mosteiro dos Jerónimos"
          },
          {
            name: "Pastéis de Belém",
            description: "Degustação dos famosos pastéis de nata"
          }
        ]
      },
      {
        day: 3,
        topics: [
          {
            name: "Sintra",
            description: "Excursão ao Palácio da Pena e Quinta da Regaleira"
          }
        ]
      }
    ]
  },
  
  // Transportes locais
  localTransport: [
    {
      name: "Metro de Lisboa",
      description: "Sistema eficiente de metro com 4 linhas que cobrem a cidade",
      cost: "50€ (passe semanal)"
    },
    {
      name: "Elétrico 28",
      description: "Icónico elétrico que percorre os principais pontos turísticos",
      cost: "3€ por viagem"
    },
    {
      name: "Autocarro Carris",
      description: "Rede de autocarros urbanos",
      cost: "2€ por viagem"
    }
  ],
  
  tripTransports: [
    {
      name: "Metro de Lisboa",
      description: "Sistema de transporte público eficiente para se deslocar pela cidade",
      cost: 50,
      images: [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&h=400&fit=crop"
      ]
    },
    {
      name: "Elétrico 28",
      description: "Icónico elétrico que percorre os principais pontos turísticos de Lisboa",
      cost: 25,
      images: [
        "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=600&h=400&fit=crop"
      ]
    }
  ],
  
  language: "Português",
  languages: ["Português", "Inglês", "Espanhol"],
  languagesSpoken: [
    { name: "Português" },
    { name: "Inglês" },
    { name: "Espanhol" }
  ],
  
  reviews: [
    {
      author: "Maria Santos",
      rating: 5,
      comment: "Viagem incrível! Lisboa é uma cidade fascinante.",
      date: "2024-07-01"
    },
    {
      author: "António Silva",
      rating: 4,
      comment: "Muito bem organizado, recomendo!",
      date: "2024-06-28"
    }
  ],
  
  negativePoints: [
    {
      name: "Multidões turísticas",
      description: "Alguns pontos turísticos muito movimentados, especialmente durante o fim de semana e época alta"
    },
    {
      name: "Subidas íngremes",
      description: "Lisboa tem muitas colinas, o que pode ser cansativo para caminhadas longas. Recomenda-se calçado confortável"
    },
    {
      name: "Preços turísticos",
      description: "Algumas zonas turísticas com preços mais elevados, especialmente restaurantes perto dos monumentos"
    }
  ],
  
  privacy: "public",
  isSpecial: true,
  tripRating: 5,
  bookingDate: "2024-04-20",
  categories: [
    { name: "Cultura" },
    { name: "História" },
    { name: "Gastronomia" },
    { name: "Natureza" }
  ]
};

// Mock de viagens recomendadas
const mockRecommendedTravels = [
  {
    id: 2,
    name: "Porto Encantador",
    highlightImage: "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop",
    price: 650,
    stars: 4
  },
  {
    id: 3,
    name: "Óbidos Medieval",
    highlightImage: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    price: 450,
    stars: 5
  },
  {
    id: 4,
    name: "Cascais e Estoril",
    highlightImage: "https://images.unsplash.com/photo-1615737824025-6d8eb12eed91?w=400&h=300&fit=crop",
    price: 380,
    stars: 4
  }
];

const TravelDetails = () => {
  const { user: authUser } = useAuth();
  const { id } = useParams();
  
  // TEMPORÁRIO: Usar dados mockados para testes
  // TODO: Remover quando integrar com backend
  const travel = mockTravel;
  
  // Mock user para testes
  const user = authUser || {
    firstName: "João",
    lastName: "Silva"
  };
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
  
  // Estados para o slideshow da hero section
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isShowingVideos, setIsShowingVideos] = useState(false);

  // TEMPORÁRIO: Usar viagens recomendadas mockadas
  // TODO: Substituir pela lógica original quando integrar com backend
  const recommendedTravels = mockRecommendedTravels;

  // Função para obter todas as imagens da viagem
  const getAllImages = () => {
    const images = [];
    
    // 1º - Imagem de Destaque
    if (travel.highlightImage) {
      images.push({
        url: travel.highlightImage,
        type: 'highlight',
        caption: 'Imagem de Destaque'
      });
    }
    
    // 2º - Fotografias das Informações Gerais
    if (travel.images_generalInformation && travel.images_generalInformation.length > 0) {
      travel.images_generalInformation.forEach((img, index) => {
        images.push({
          url: img,
          type: 'general',
          caption: `Informações Gerais ${index + 1}`
        });
      });
    }
    
    // 3º - Fotografias da Estadia
    if (travel.images_accommodations && travel.images_accommodations.length > 0) {
      travel.images_accommodations.forEach((img, index) => {
        images.push({
          url: img,
          type: 'accommodation',
          caption: `Estadia ${index + 1}`
        });
      });
    }
    
    // 4º - Fotografias das Recomendações Alimentares
    if (travel.images_foodRecommendations && travel.images_foodRecommendations.length > 0) {
      travel.images_foodRecommendations.forEach((img, index) => {
        images.push({
          url: img,
          type: 'food',
          caption: `Gastronomia ${index + 1}`
        });
      });
    }
    
    // 5º - Fotografias dos Métodos de Transporte
    if (travel.localTransport && travel.localTransport.length > 0) {
      travel.localTransport.forEach(transport => {
        if (transport.images && transport.images.length > 0) {
          transport.images.forEach((img, index) => {
            images.push({
              url: img,
              type: 'transport',
              caption: `Transporte: ${transport.name}`
            });
          });
        }
      });
    }
    
    // 6º - Fotografias dos Pontos de Referência
    if (travel.images_referencePoints && travel.images_referencePoints.length > 0) {
      travel.images_referencePoints.forEach((img, index) => {
        images.push({
          url: img,
          type: 'reference',
          caption: `Pontos de Interesse ${index + 1}`
        });
      });
    }
    
    return images;
  };

  // Obter vídeos da viagem (prioridade)
  const getVideos = () => {
    return travel.travelVideos && travel.travelVideos.length > 0 ? travel.travelVideos : [];
  };

  const allImages = getAllImages();
  const videos = getVideos();
  const hasVideos = videos.length > 0;

  // useEffect para gerenciar o slideshow
  useEffect(() => {
    let slideInterval;

    if (hasVideos && isShowingVideos) {
      // Se estamos mostrando vídeos, não usar intervalo automático
      // O vídeo controlará a progressão
      return;
    }

    if (!isShowingVideos && allImages.length > 1) {
      // Slideshow de imagens
      slideInterval = setInterval(() => {
        setCurrentHeroIndex(prevIndex => (prevIndex + 1) % allImages.length);
      }, 4000); // 4 segundos por imagem
    }

    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [isShowingVideos, allImages.length, hasVideos]);

  // Inicializar com vídeos se existirem
  useEffect(() => {
    if (hasVideos) {
      setIsShowingVideos(true);
      setCurrentVideoIndex(0);
    } else {
      setIsShowingVideos(false);
      setCurrentHeroIndex(0);
    }
  }, [hasVideos]);

  // Função para lidar com o fim do vídeo
  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      // Próximo vídeo
      setCurrentVideoIndex(prevIndex => prevIndex + 1);
    } else {
      // Acabaram os vídeos, começar slideshow de imagens
      setIsShowingVideos(false);
      setCurrentHeroIndex(0);
    }
  };

  // Obter mídia atual para exibir
  const getCurrentMedia = () => {
    if (isShowingVideos && hasVideos) {
      return {
        type: 'video',
        url: videos[currentVideoIndex],
        caption: `Vídeo ${currentVideoIndex + 1} de ${videos.length}`
      };
    } else if (allImages.length > 0) {
      return {
        type: 'image',
        ...allImages[currentHeroIndex]
      };
    }
    return null;
  };

  const currentMedia = getCurrentMedia();

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

  // TEMPORÁRIO: Como estamos usando dados mockados, sempre teremos uma viagem
  // TODO: Restaurar esta validação quando integrar com backend
  /*
  if (!travel) {
    return <div><br></br><br></br>Viagem não encontrada.</div>;
  }
  */

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
      {/* Back Navigation */}
      <div className="back-navigation">
        <button className="back-btn" onClick={() => window.history.back()}>
          <span className="back-icon">←</span>
          <span>Voltar</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="travel-hero">
        <div className="hero-image">
          {currentMedia && (
            <>
              {currentMedia.type === 'video' ? (
                <video
                  src={currentMedia.url}
                  autoPlay
                  muted
                  onEnded={handleVideoEnd}
                  className="hero-video"
                />
              ) : (
                <img 
                  src={currentMedia.url} 
                  alt={currentMedia.caption || `Imagem de destaque de ${travel.name}`} 
                  className="hero-background-image"
                />
              )}
              
              <div className="hero-overlay">
                <div className="hero-content">
                  <h1 className="travel-title">{travel.name}</h1>
                  <div className="travel-location">
                    <span className="location-icon">📍</span>
                    <span>{travel.city}, {travel.country}</span>
                  </div>
                  <div className="travel-meta">
                    <div className="meta-item">
                      <span className="meta-icon">👤</span>
                      <span>{user && user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Viajante'}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">📅</span>
                      <span>{travel.days} dias</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">👁️</span>
                      <span>{travel.views} visualizações</span>
                    </div>
                  </div>
                  
                  {/* Indicadores do slideshow */}
                  <div className="slideshow-indicators">
                    {hasVideos && isShowingVideos && (
                      <div className="video-indicators">
                        <span className="indicator-label">Vídeos:</span>
                        {videos.map((_, index) => (
                          <span 
                            key={`video-${index}`}
                            className={`indicator ${currentVideoIndex === index ? 'active' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                    
                    {!isShowingVideos && allImages.length > 1 && (
                      <div className="image-indicators">
                        <span className="indicator-label">Fotos:</span>
                        {allImages.map((_, index) => (
                          <span 
                            key={`image-${index}`}
                            className={`indicator ${currentHeroIndex === index ? 'active' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Caption */}
                  <div className="media-caption">
                    {currentMedia.caption}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Travel Summary Cards */}
      <div className="travel-summary">
        <div className="summary-cards">
          <div className="summary-card price-card">
            <div className="card-icon">💰</div>
            <div className="card-content">
              <h3>Preço Total</h3>
              <p className="price">{travel.price || 'N/A'}€</p>
              <button className="price-toggle" onClick={() => setShowPriceDetails(!showPriceDetails)}>
                {showPriceDetails ? 'Ocultar' : 'Ver Detalhes'}
              </button>
            </div>
          </div>

          <div className="summary-card category-card">
            <div className="card-icon">🏷️</div>
            <div className="card-content">
              <h3>Categorias</h3>
              <div className="categories-display">
                {travel.category && travel.category.length > 0 ? (
                  <div className="category-tags">
                    {travel.category.slice(0, 2).map((cat, index) => (
                      <span key={index} className="category-tag">{cat}</span>
                    ))}
                    {travel.category.length > 2 && (
                      <span className="more-categories">+{travel.category.length - 2}</span>
                    )}
                  </div>
                ) : (
                  <span className="no-categories">Não categorizada</span>
                )}
              </div>
            </div>
          </div>

          <div className="summary-card dates-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Datas da Viagem</h3>
              <div className="dates-info">
                {travel.startDate && travel.endDate ? (
                  <>
                    <div className="date-range">
                      <span className="start-date">
                        {new Date(travel.startDate).toLocaleDateString('pt-PT')}
                      </span>
                      <span className="date-separator">→</span>
                      <span className="end-date">
                        {new Date(travel.endDate).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    {travel.BookingTripPaymentDate && (
                      <div className="booking-date">
                        <small>Reserva: {new Date(travel.BookingTripPaymentDate).toLocaleDateString('pt-PT')}</small>
                      </div>
                    )}
                  </>
                ) : (
                  <span className="no-dates">Datas não definidas</span>
                )}
              </div>
            </div>
          </div>

          <div className="summary-card transport-card">
            <div className="card-icon">�</div>
            <div className="card-content">
              <h3>Transporte Principal</h3>
              <div className="transport-info">
                <span className="transport-method">{travel.transport || 'Não especificado'}</span>
              </div>
            </div>
        </div>
      </div>

        {/* Price Details Expandable */}
        {showPriceDetails && travel.priceDetails && (
          <div className="price-details-expanded">
            <h4>Detalhes dos Custos</h4>
            <div className="price-breakdown">
              <div className="breakdown-item">
                <span className="breakdown-icon">🏨</span>
                <span className="breakdown-label">Hotel</span>
                <span className="breakdown-value">{travel.priceDetails.hotel || '0'}€</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-icon">✈️</span>
                <span className="breakdown-label">Voo</span>
                <span className="breakdown-value">{travel.priceDetails.flight || '0'}€</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-icon">🍽️</span>
                <span className="breakdown-label">Comida</span>
                <span className="breakdown-value">{travel.priceDetails.food || '0'}€</span>
              </div>
              <div className="breakdown-item">
                <span className="breakdown-icon">🎁</span>
                <span className="breakdown-label">Extras</span>
                <span className="breakdown-value">{travel.priceDetails.extras || '0'}€</span>
              </div>
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="travel-description">
          <h3>Sobre esta Viagem</h3>
          <div className="description-content">
            {travel.longDescription && (
              <div className="long-description">
                <p>{travel.longDescription}</p>
              </div>
            )}
            {travel.description && travel.description !== travel.longDescription && (
              <div className="short-description">
                <p><strong>Resumo:</strong> {travel.description}</p>
              </div>
            )}
            {!travel.longDescription && !travel.description && (
              <p className="no-description">Descrição não disponível.</p>
            )}
          </div>
          
          {/* Climate and Language Info */}
          <div className="additional-info">
            {travel.climate && (
              <div className="climate-info">
                <span className="info-icon">🌤️</span>
                <span><strong>Clima:</strong> {travel.climate}</span>
              </div>
            )}
            {travel.language && (
              <div className="language-info">
                <span className="info-icon">🗣️</span>
                <span><strong>Idioma:</strong> {travel.language}</span>
              </div>
            )}
            {travel.languages && travel.languages.length > 0 && (
              <div className="languages-info">
                <span className="info-icon">🌍</span>
                <span><strong>Idiomas:</strong> {travel.languages.join(', ')}</span>
              </div>
            )}
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
            className={`tab-button ${activeTab === 'videos' ? 'active' : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            🎥 Vídeos
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
                <p><strong>Clima:<br /></strong> {travel.weather}</p>
                <p><strong>Línguas Utilizadas:<br /></strong> {travel.languagesSpoken && travel.languagesSpoken.length > 0 ? travel.languagesSpoken.map(lang => lang.name).join(', ') : 'Nenhuma língua especificada'}<br /></p>
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
            </div>
          )}

          {activeTab === 'videos' && (
            <div>
              <div className="generalInfoLeft">
                <h2>{travel.name} | Vídeos da Viagem</h2>
                <br />
                {travel.travelVideos && travel.travelVideos.length > 0 ? (
                  <div className="videos-section">
                    {travel.travelVideos.map((video, index) => (
                      <div key={index} className="video-container">
                        <div className="video-wrapper">
                          <iframe
                            src={video.url}
                            title={video.name}
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                        <div className="video-info">
                          <h3>{video.name}</h3>
                          <p>{video.description}</p>
                          <div className="video-details">
                            <span className="video-duration">⏱️ {video.duration}</span>
                            <span className="video-size">📁 {video.size}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-videos">
                    <p>Nenhum vídeo disponível para esta viagem.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'accommodations' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>🏨 Estadia</h2>
                <p>Informações sobre onde ficaste durante a viagem</p>
              </div>

              <div className="accommodations-grid">
                {travel.accommodations && travel.accommodations.length > 0 ? (
                  travel.accommodations.map((acc, index) => (
                    <div key={index} className="accommodation-card">
                      <div className="accommodation-header">
                        <h3 className="accommodation-name">{acc.name}</h3>
                        <div className="accommodation-rating">
                          {renderStars(acc.rating || 0)}
                          <span className="rating-value">({acc.rating || 0}/5)</span>
                        </div>
                      </div>

                      <div className="accommodation-details">
                        <div className="detail-row">
                          <span className="detail-icon">🏨</span>
                          <span className="detail-label">Tipo:</span>
                          <span className="detail-value">{acc.type || 'Não especificado'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">🍽️</span>
                          <span className="detail-label">Regime:</span>
                          <span className="detail-value">{acc.regime || 'Não especificado'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">🌙</span>
                          <span className="detail-label">Noites:</span>
                          <span className="detail-value">{acc.nights || 'N/A'}</span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span className="detail-label">Check-in:</span>
                          <span className="detail-value">
                            {acc.checkInDate ? new Date(acc.checkInDate).toLocaleDateString('pt-PT') : 'N/A'}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span className="detail-icon">📅</span>
                          <span className="detail-label">Check-out:</span>
                          <span className="detail-value">
                            {acc.checkOutDate ? new Date(acc.checkOutDate).toLocaleDateString('pt-PT') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {acc.description && (
                        <div className="accommodation-description">
                          <p>{acc.description}</p>
                        </div>
                      )}

                      {acc.images && acc.images.length > 0 && (
                        <div className="accommodation-images">
                          <h4>Fotos da Estadia</h4>
                          <div className="images-grid">
                            {acc.images.slice(0, 4).map((image, imgIndex) => (
                              <div key={imgIndex} className="image-item">
                                <img src={image} alt={`${acc.name} - Foto ${imgIndex + 1}`} />
                              </div>
                            ))}
                            {acc.images.length > 4 && (
                              <div className="more-images">+{acc.images.length - 4}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🏨</div>
                    <h3>Nenhuma estadia registada</h3>
                    <p>Não há informações sobre acomodações para esta viagem.</p>
                  </div>
                )}
              </div>

              <div className="generalInfoRight">
                {travel.accommodations && travel.accommodations.length > 0 ? travel.accommodations.map((acc, index) => (
                  <span key={index}>
                    <br />
                    <strong>📖 Descrição da Estadia: </strong> <br />
                    {acc.description} <br />
                  </span>
                )) : <p>Nenhuma descrição de estadia disponível.</p>}
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
            </div>
          )}

          {activeTab === 'foodRecommendations' && (
            <div className="tab-content">
              <div className="tab-header">
                <h2>🍽️ Gastronomia</h2>
                <p>Descobrir os sabores desta viagem</p>
              </div>

              <div className="food-recommendations">
                {travel.foodRecommendations && travel.foodRecommendations.length > 0 ? (
                  <div className="food-grid">
                    {travel.foodRecommendations.map((food, index) => (
                      <div key={index} className="food-card">
                        <div className="food-header">
                          <h3 className="food-name">{food.name}</h3>
                          <span className="food-icon">🍽️</span>
                        </div>
                        <div className="food-description">
                          <p>{food.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">🍽️</div>
                    <h3>Nenhuma recomendação gastronómica</h3>
                    <p>Não há recomendações alimentares registadas para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.images_foodRecommendations && travel.images_foodRecommendations.length > 0 && (
                <div className="food-gallery">
                  <h3>Galeria de Fotos da Gastronomia</h3>
                  <div className="images-grid">
                    {travel.images_foodRecommendations.map((image, index) => (
                      <div key={index} className="image-item" onClick={() => openModal(image)}>
                        <img
                          src={image instanceof File ? URL.createObjectURL(image) : image}
                          alt={`Gastronomia ${index + 1}`}
                          onError={(e) => (e.target.src = '/default-image.jpg')}
                        />
                        <div className="image-overlay">
                          <span className="image-icon">🔍</span>
                        </div>
                      </div>
                    ))}
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
                            <p><strong>Preço:</strong> {travel.price || 'N/A'}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars || 0)}
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
                {travel.referencePoints && travel.referencePoints.length > 0 ? travel.referencePoints.map((referencePoint, index) => (
                  <span key={index}>
                    {referencePoint.name} ({referencePoint.description}) -{' '}
                    <a href={referencePoint.link} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                    <br />
                  </span>
                )) : <span>Nenhum ponto de referência disponível.</span>}
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
                            <p><strong>Preço:</strong> {travel.price || 'N/A'}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars || 0)}
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
            <div className="tab-content">
              <div className="tab-header">
                <h2>📅 Itinerário da Viagem</h2>
                <p>Plano dia a dia da tua aventura</p>
              </div>

              <div className="itinerary-container">
                {travel.itinerary && travel.itinerary.length > 0 ? (
                  <div className="itinerary-timeline">
                    {travel.itinerary.map((day, index) => (
                      <div key={index} className="itinerary-day">
                        <div className="day-marker">
                          <div className="day-number">Dia {day.day}</div>
                          <div className="day-line"></div>
                        </div>
                        
                        <div className="day-content">
                          {day.activities && day.activities.length > 0 ? (
                            <div className="activities-list">
                              {day.activities.map((activity, actIndex) => (
                                <div key={actIndex} className="activity-item">
                                  <div className="activity-icon">📍</div>
                                  <div className="activity-content">
                                    <h4 className="activity-name">{activity}</h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="no-activities">
                              <span className="no-activities-text">Sem atividades planeadas</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">📅</div>
                    <h3>Nenhum itinerário disponível</h3>
                    <p>Não há plano dia a dia registado para esta viagem.</p>
                  </div>
                )}
              </div>

              {travel.activities && travel.activities.length > 0 && (
                <div className="activities-summary">
                  <h3>Resumo das Atividades</h3>
                  <div className="activities-grid">
                    {travel.activities.map((activity, index) => (
                      <div key={index} className="activity-tag">
                        <span className="activity-icon">🎯</span>
                        <span className="activity-text">{activity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
                            <p><strong>Preço:</strong> {travel.price || 'N/A'}€</p>
                            <p>
                              <strong>Avaliação Geral:</strong> {renderStars(travel.stars || 0)}
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
            <div className="tab-content">
              <div className="tab-header">
                <h2>⚠️ Pontos Negativos</h2>
                <p>Aspetos menos positivos desta experiência</p>
              </div>

              <div className="negative-points">
                {travel.negativePoints && travel.negativePoints.length > 0 ? (
                  <div className="negative-points-list">
                    {travel.negativePoints.map((point, index) => (
                      <div key={index} className="negative-point-card">
                        <div className="negative-point-header">
                          <span className="negative-icon">⚠️</span>
                          <h3 className="negative-point-name">{point.name}</h3>
                        </div>
                        <div className="negative-point-description">
                          <p>{point.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-content">
                    <div className="no-content-icon">✅</div>
                    <h3>Nenhum ponto negativo reportado</h3>
                    <p>Esta viagem não tem aspetos negativos registados!</p>
                  </div>
                )}
              </div>
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