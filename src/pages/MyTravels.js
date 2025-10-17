import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import { request, setAuthHeader } from '../axios_helper';
import Toast from '../components/Toast';
import "../styles/components/modal.css";
import "../styles/pages/future-travels.css";
import "../styles/pages/future-travels-modal.css";
import "../styles/pages/my-travels.css";
import "../styles/pages/my-travels-modal.css";

// ...existing code...

// Componente de avaliação por estrelas
const StarRating = ({ rating, onRatingChange, maxStars = 5 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starValue) => {
    onRatingChange(starValue);
  };

  const handleMouseEnter = (starValue) => {
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="star-rating">
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        return (
          <FaStar
            key={index}
            className={`star ${starValue <= (hoverRating || rating) ? 'filled' : 'empty'}`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            style={{
              cursor: 'pointer',
              fontSize: '24px',
              color: starValue <= (hoverRating || rating) ? '#ffc107' : '#e4e5e9',
              marginRight: '5px'
            }}
          />
        );
      })}
      
    </div>
  );
};

const MyTravels = () => {
  const [travels, setTravels] = useState([]);
  const [filterType, setFilterType] = useState('all'); // Novo estado para filtro
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
    BookingTripPaymentDate: '',
    highlightImage: '',
    travelVideos: [], // Array para múltiplos vídeos
    views: 0,
    priceDetails: { hotel: '', flight: '', food: '', extras: '' },
    images: [],
    images_generalInformation: [],
    description: '',
    longDescription: '',
    activities: [],
    accommodations: [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ],
    foodRecommendations: [],
    images_foodRecommendations: [],
    climate: '',
    pointsOfInterest: [],
    images_referencePoints: [],
    safety: { tips: [], vaccinations: [] },
    itinerary: [],
    localTransport: [],
    language: '',
    languages: [], // Array para suportar múltiplas línguas
    reviews: [],
    negativePoints: [],
    privacy: 'public',
    travelType: 'single',
    isSpecial: false
  });
  const { user } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);
  const [isTravelTypeModalOpen, setIsTravelTypeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generalInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videosPreviews, setVideosPreviews] = useState([]); // Array de previews dos vídeos
  const [videosInfo, setVideosInfo] = useState([]); // Array de informações dos vídeos
  const [generalInfoImagePreviews, setGeneralInfoImagePreviews] = useState([]);
  const [accommodationImagePreviews, setAccommodationImagePreviews] = useState([]);
  const [foodRecommendationImagePreviews, setFoodRecommendationImagePreviews] = useState([]);
  const [transportImagePreviews, setTransportImagePreviews] = useState([]);
  const [referencePointImagePreviews, setReferencePointImagePreviews] = useState([]);
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [newFoodRecommendation, setNewFoodRecommendation] = useState({ name: '', description: '' });
  const [editingPointIndex, setEditingPointIndex] = useState(null);
  const [newPointOfInterest, setNewPointOfInterest] = useState({ name: '', description: '', type: '', link: '' });
  const [editingNegativeIndex, setEditingNegativeIndex] = useState(null);
  const [newNegativePoint, setNewNegativePoint] = useState({ name: '', description: '' });
  const [editingItineraryDay, setEditingItineraryDay] = useState(null);
  const [newItineraryDay, setNewItineraryDay] = useState({ day: '', activities: [''] });
  const [itineraryError, setItineraryError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  // Novos estados para tipos de viagem
  const [selectedTravelType, setSelectedTravelType] = useState({ main: '', isGroup: false }); // main: 'single' | 'multi'
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [multiDestinations, setMultiDestinations] = useState([]); // {id,country,city}
  const [newDestination, setNewDestination] = useState({ country: '', city: '' });
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  // Estados para armazenar dados por destino
  const [accommodationsByDestination, setAccommodationsByDestination] = useState({});
  const [pointsOfInterestByDestination, setPointsOfInterestByDestination] = useState({});
  // Lista de idiomas comuns
  const languages = [
    'Português', 'Inglês', 'Espanhol', 'Francês', 'Alemão', 
    'Italiano', 'Holandês', 'Russo', 'Chinês', 'Japonês',
    'Árabe', 'Hindi', 'Coreano', 'Sueco', 'Norueguês'
  ];

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const location = useLocation();

  // Toast functions
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 2600);
  };

  const closeToast = () => {
    setToast({ show: false, message: '', type: '' });
  };

  const transportOptions = [
    'Carro', 'Comboio', 'Autocarro', 'Avião', 'Bicicleta', 'A Pé', 'Barco', 'Táxi'
  ];

  const countryToCities = {
    'Portugal': ['Lisboa', 'Porto', 'Coimbra', 'Braga', 'Aveiro', 'Évora', 'Faro', 'Viseu', 'Setúbal', 'Leiria'],
    'Brasil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre'],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Philadelphia', 'Phoenix', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    'Espanha': ['Madrid', 'Barcelona', 'Valencia', 'Sevilha', 'Saragoça', 'Málaga', 'Múrcia', 'Palma de Maiorca', 'Las Palmas', 'Bilbao'],
    'França': ['Paris', 'Marselha', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Montpellier', 'Estrasburgo', 'Bordeaux', 'Lille'],
    'Itália': ['Roma', 'Milão', 'Nápoles', 'Turim', 'Palermo', 'Génova', 'Bolonha', 'Florença', 'Bari', 'Catânia']
  };

  const getCitiesForCountry = (country) => {
    return countryToCities[country] || [];
  };

  // Função para formatar tamanho de arquivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para formatar duração de vídeo
  const formatVideoDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para calcular totais dos vídeos
  const calculateVideoTotals = (videos, videosInfoArray) => {
    let totalSize = 0;
    let totalDuration = 0;
    
    videos.forEach((video, index) => {
      if (video instanceof File) {
        totalSize += video.size;
      }
      if (videosInfoArray[index] && videosInfoArray[index].durationSeconds) {
        totalDuration += videosInfoArray[index].durationSeconds;
      }
    });

    return {
      totalSize,
      totalDuration,
      formattedSize: formatFileSize(totalSize),
      formattedDuration: formatVideoDuration(totalDuration)
    };
  };

  const categories = [
    'Natureza', 'Cidade', 'Cultural', 'Nature', 'Foodie', 'History',
    'Beach', 'Mountains', 'City Break', 'Wildlife', 'Luxury', 'Budget',
    'Solo Travel', 'Family', 'Romantic'
  ];

  // Abrir modal automaticamente ao redirecionar com estado
  useEffect(() => {
    const cachedTravels = localStorage.getItem("user-travels");
    if (cachedTravels) {
      setTravels(JSON.parse(cachedTravels));
    } else {
      // Make the GET request using .then()
      request("GET", "/trips/user/" + user.id)
        .then((response) => {
          // Save the fetched data to localStorage
          localStorage.setItem("user-travels", JSON.stringify(response.data));
  
          // Update the state with the fetched data
          setTravels(response.data);
          console.log("Fetched travels:", response.data);
        })
        .catch((error) => {
          console.error("Error fetching travels:", error);
        });
    }
  }, [location.state]);

  // Abrir modal automaticamente ao redirecionar com estado
  useEffect(() => {
    if (location.state?.openModal) {
      setIsTravelTypeModalOpen(true);
      // Limpar o state para evitar reabertura ao voltar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location.state]);

  // Reset quando muda o destino selecionado em viagens multidestino
  useEffect(() => {
    if (selectedTravelType.main === 'multi' && selectedDestinationIndex !== "" && selectedDestinationIndex !== undefined) {
      // Limpar estados de edição quando muda destino
      setEditingPointIndex(null);
      setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
      setReferencePointImagePreviews([]);
      setAccommodationImagePreviews([]);
    }
  }, [selectedDestinationIndex, selectedTravelType.main]);

  // Controlar a abertura do header em mobile quando o modal abre
  useEffect(() => {
    const handleResize = () => {
      if (isModalOpen && window.innerWidth <= 768) {
        // Em mobile, o header começa FECHADO - viajante deve clicar no toggle
        setIsHeaderOpen(false);
      } else if (isModalOpen && window.innerWidth > 768) {
        setIsHeaderOpen(true); // Em desktop, header sempre aberto
      } else if (!isModalOpen) {
        setIsHeaderOpen(false);
      }
    };

    // Verificar quando o modal abre
    handleResize();
    
    // Adicionar listener para resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isModalOpen]);

  // Função para validar campos obrigatórios
  const validateForm = () => {
    // ========== ORDEM CORRETA DE VALIDAÇÕES (CONFORME SOLICITADO) ==========
    // 1. Nome da Viagem
    // 2. País
    // 3. Cidade
    // 4. Datas (início e fim)
    // 5. Avaliação geral
    // 6. Categorias
    // 7. Idiomas
    // 8. Descrição Curta
    // 9. Descrição Longa
    // 10. Imagem de Destaque
    // 11. Resto (opcionais)

    // ====== 1. VALIDAÇÃO NOME DA VIAGEM (OBRIGATÓRIO) ======
    if (!newTravel.name.trim()) {
      setToast({ message: '❌ O nome da viagem é obrigatório (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length < 3) {
      setToast({ message: '❌ O nome da viagem deve ter pelo menos 3 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.name.length > 100) {
      setToast({ message: '❌ O nome da viagem não pode ter mais de 100 caracteres! (Atual: ' + newTravel.name.length + '/100)', type: 'error', show: true });
      return false;
    }
    
    // Validação contra caracteres perigosos no nome
    if (/<script|javascript:|onload=|onerror=/i.test(newTravel.name)) {
      setToast({ message: '❌ O nome contém caracteres não permitidos!', type: 'error', show: true });
      return false;
    }

    // ====== 2. VALIDAÇÃO PAÍS (OBRIGATÓRIO) ======
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ message: '❌ Adicione pelo menos um destino (*)!', type: 'error', show: true });
        return false;
      }
    } else {
      if (!newTravel.country) {
        setToast({ message: '❌ Selecione um país (*)!', type: 'error', show: true });
        return false;
      }

      // ====== 3. VALIDAÇÃO CIDADE (OBRIGATÓRIO) ======
      if (!newTravel.city.trim()) {
        setToast({ message: '❌ A cidade é obrigatória (*)!', type: 'error', show: true });
        return false;
      }
      if (newTravel.city.length < 2) {
        setToast({ message: '❌ O nome da cidade deve ter pelo menos 2 caracteres!', type: 'error', show: true });
        return false;
      }
    }

    // ====== 4. VALIDAÇÃO DATAS (OBRIGATÓRIO) ======
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ message: '❌ As datas de início e fim são obrigatórias (*)!', type: 'error', show: true });
      return false;
    }
    
    const startDate = new Date(newTravel.startDate);
    const endDate = new Date(newTravel.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate > today) {
      setToast({ message: '❌ A data de início não pode ser no futuro!', type: 'error', show: true });
      return false;
    }
    
    if (endDate > today) {
      setToast({ message: '❌ A data de fim não pode ser no futuro!', type: 'error', show: true });
      return false;
    }
    
    if (startDate > endDate) {
      setToast({ message: '❌ A data de início não pode ser posterior à data de fim!', type: 'error', show: true });
      return false;
    }
    
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setToast({ message: '❌ A duração da viagem não pode exceder 365 dias!', type: 'error', show: true });
      return false;
    }
    
    if (startDate.getTime() === endDate.getTime()) {
      setToast({ message: '⚠️ Aviso: A viagem tem apenas 1 dia. Confirme se está correto!', type: 'warning', show: true });
    }

    // ====== 5. VALIDAÇÃO AVALIAÇÃO GERAL (OBRIGATÓRIO) ======
    if (!newTravel.stars || newTravel.stars === 0 || newTravel.stars === '0') {
      setToast({ message: '❌ A avaliação geral da viagem é obrigatória (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 6. VALIDAÇÃO CATEGORIAS (OBRIGATÓRIO) ======
    if (!newTravel.category || newTravel.category.length === 0) {
      setToast({ message: '❌ Selecione pelo menos uma categoria (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 7. VALIDAÇÃO IDIOMAS (OBRIGATÓRIO) ======
    if (!newTravel.languages || newTravel.languages.length === 0) {
      setToast({ message: '❌ Selecione pelo menos uma língua utilizada (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 8. VALIDAÇÃO DESCRIÇÃO CURTA (OBRIGATÓRIO) ======
    if (!newTravel.description || !newTravel.description.trim()) {
      setToast({ message: '❌ A descrição curta é obrigatória (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.description.length < 10) {
      setToast({ message: '❌ A descrição curta deve ter pelo menos 10 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.description.length > 350) {
      setToast({ message: '❌ A descrição curta não pode ter mais de 350 caracteres! (Atual: ' + newTravel.description.length + '/350)', type: 'error', show: true });
      return false;
    }

    // ====== 9. VALIDAÇÃO DESCRIÇÃO LONGA (OBRIGATÓRIO) ======
    if (!newTravel.longDescription || !newTravel.longDescription.trim()) {
      setToast({ message: '❌ A descrição longa é obrigatória (*)!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.longDescription.length < 20) {
      setToast({ message: '❌ A descrição longa deve ter pelo menos 20 caracteres!', type: 'error', show: true });
      return false;
    }
    
    if (newTravel.longDescription.length > 6000) {
      setToast({ message: '❌ A descrição longa não pode ter mais de 6000 caracteres! (Atual: ' + newTravel.longDescription.length + '/6000)', type: 'error', show: true });
      return false;
    }
    
    if (/<script|javascript:|onload=|onerror=/i.test(newTravel.description || '') || 
        /<script|javascript:|onload=|onerror=/i.test(newTravel.longDescription || '')) {
      setToast({ message: '❌ A descrição contém caracteres não permitidos!', type: 'error', show: true });
      return false;
    }

    // ====== 10. VALIDAÇÃO IMAGEM DE DESTAQUE (OBRIGATÓRIO) ======
    if (!newTravel.highlightImage) {
      setToast({ message: '❌ A imagem de destaque é obrigatória (*)!', type: 'error', show: true });
      return false;
    }

    // ====== 11. VALIDAÇÕES OPCIONAIS (Temperatura, Preços, etc) ======
    
    if (newTravel.climate && newTravel.climate.length > 350) {
      setToast({ message: '❌ A descrição da temperatura não pode ter mais de 350 caracteres! (Atual: ' + newTravel.climate.length + '/350)', type: 'error', show: true });
      return false;
    }
    
    const priceDetails = newTravel.priceDetails;
    const priceFields = ['hotel', 'flight', 'food', 'extras'];
    
    for (let field of priceFields) {
      if (priceDetails[field]) {
        const price = parseFloat(priceDetails[field]);
        if (isNaN(price) || price < 0) {
          setToast({ message: '❌ O preço de ' + field + ' deve ser um número positivo!', type: 'error', show: true });
          return false;
        }
        if (price > 999999.99) {
          setToast({ message: '❌ O preço de ' + field + ' é muito elevado (máximo: 999999.99€)!', type: 'error', show: true });
          return false;
        }
      }
    }

    // ====== VALIDAÇÕES DE ACOMODAÇÕES ======
    if (selectedTravelType.main === 'single') {
      const accommodations = newTravel.accommodations || [];
      for (let i = 0; i < accommodations.length; i++) {
        const acc = accommodations[i];
        
        if (acc.name && acc.name.length > 150) {
          setToast({ message: '❌ Nome da acomodação #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + acc.name.length + '/150)', type: 'error', show: true });
          return false;
        }
        
        if (acc.description && acc.description.length > 500) {
          setToast({ message: '❌ Descrição da acomodação #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + acc.description.length + '/500)', type: 'error', show: true });
          return false;
        }
        
        if (acc.checkInDate && acc.checkOutDate) {
          const checkIn = new Date(acc.checkInDate);
          const checkOut = new Date(acc.checkOutDate);
          
          if (checkIn > checkOut) {
            setToast({ message: '❌ Data de check-in não pode ser posterior a check-out na acomodação #' + (i+1) + '!', type: 'error', show: true });
            return false;
          }
        }
        
        if (acc.nights) {
          const nights = parseInt(acc.nights);
          if (isNaN(nights) || nights < 0 || nights > 365) {
            setToast({ message: '❌ Número de noites da acomodação #' + (i+1) + ' deve estar entre 0 e 365!', type: 'error', show: true });
            return false;
          }
        }
        
        if (acc.rating) {
          const rating = parseInt(acc.rating);
          if (isNaN(rating) || rating < 0 || rating > 5) {
            setToast({ message: '❌ Rating da acomodação #' + (i+1) + ' deve estar entre 0 e 5!', type: 'error', show: true });
            return false;
          }
        }
      }
    }

    // ====== VALIDAÇÕES DE ALIMENTAÇÃO ======
    const foodRecs = newTravel.foodRecommendations || [];
    for (let i = 0; i < foodRecs.length; i++) {
      const food = foodRecs[i];
      
      if (food.name && food.name.length > 150) {
        setToast({ message: '❌ Nome do prato #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + food.name.length + '/150)', type: 'error', show: true });
        return false;
      }
      
      if (food.description && food.description.length > 500) {
        setToast({ message: '❌ Descrição do prato #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + food.description.length + '/500)', type: 'error', show: true });
        return false;
      }
    }

    // ====== VALIDAÇÕES DE TRANSPORTES ======
    const transports = newTravel.localTransport || [];
    if (transports.length === 0) {
      setToast({ message: '⚠️ Aviso: Nenhum transporte local foi adicionado. Considere adicionar informações sobre os transportes utilizados.', type: 'warning', show: true });
    }

    // ====== VALIDAÇÕES DE PONTOS DE REFERÊNCIA ======
    const points = newTravel.pointsOfInterest || [];
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      if (point.name && point.name.length > 150) {
        setToast({ message: '❌ Nome do ponto de referência #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + point.name.length + '/150)', type: 'error', show: true });
        return false;
      }
      
      if (point.description && point.description.length > 1000) {
        setToast({ message: '❌ Descrição do ponto de referência #' + (i+1) + ' não pode ter mais de 1000 caracteres! (Atual: ' + point.description.length + '/1000)', type: 'error', show: true });
        return false;
      }
      
      if (point.type && point.type.length > 100) {
        setToast({ message: '❌ Tipo do ponto de referência #' + (i+1) + ' não pode ter mais de 100 caracteres! (Atual: ' + point.type.length + '/100)', type: 'error', show: true });
        return false;
      }
    }

    // ====== VALIDAÇÕES DE ITINERÁRIO ======
    const itinerary = newTravel.itinerary || [];
    for (let i = 0; i < itinerary.length; i++) {
      const item = itinerary[i];
      
      if (item.day && item.day.length > 100) {
        setToast({ message: '❌ Título do dia #' + (i+1) + ' não pode ter mais de 100 caracteres! (Atual: ' + item.day.length + '/100)', type: 'error', show: true });
        return false;
      }
      
      if (item.activities && Array.isArray(item.activities)) {
        const combinedActivities = item.activities.join('\n');
        if (combinedActivities.length > 1500) {
          setToast({ message: '❌ O itinerário do dia #' + (i+1) + ' não pode ter mais de 1500 caracteres no total! (Atual: ' + combinedActivities.length + '/1500)', type: 'error', show: true });
          return false;
        }
      }
    }

    // ====== VALIDAÇÕES DE PONTOS NEGATIVOS ======
    const negativePoints = newTravel.negativePoints || [];
    if (Array.isArray(negativePoints)) {
      for (let i = 0; i < negativePoints.length; i++) {
        const point = negativePoints[i];
        
        if (point.name && point.name.length > 150) {
          setToast({ message: '❌ Nome do ponto negativo #' + (i+1) + ' não pode ter mais de 150 caracteres! (Atual: ' + point.name.length + '/150)', type: 'error', show: true });
          return false;
        }
        
        if (point.description && point.description.length > 500) {
          setToast({ message: '❌ Descrição do ponto negativo #' + (i+1) + ' não pode ter mais de 500 caracteres! (Atual: ' + point.description.length + '/500)', type: 'error', show: true });
          return false;
        }
      }
    }
    
    return true;
  };

  // Funções de manipulação de estado
  const calculateTotalPrice = () => {
    const hotel = parseFloat(newTravel.priceDetails.hotel) || 0;
    const food = parseFloat(newTravel.priceDetails.food) || 0;
    const transport = parseFloat(newTravel.priceDetails.transport) || 0;
    const extras = parseFloat(newTravel.priceDetails.extras) || 0;
    return hotel + food + transport + extras;
  };

  const addAccommodation = () => {
    // Validação para viagens de destino único
    if (selectedTravelType.main === 'single') {
      if (!newTravel.country || !newTravel.city) {
        setToast({ 
          message: 'Por favor, selecione primeiro o país e a cidade na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      
      // Para destino único, adicionar diretamente ao newTravel
      setNewTravel(prev => ({
        ...prev,
        accommodations: [
          ...prev.accommodations,
          {
            name: '',
            type: '',
            description: '',
            rating: 0,
            nights: '',
            checkInDate: '',
            checkOutDate: '',
            regime: '',
            images: []
          }
        ]
      }));
    }
    
    // Validação para viagens multidestino
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ 
          message: 'Por favor, adicione pelo menos um destino (país e cidade) na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      if (selectedDestinationIndex === "" || selectedDestinationIndex === undefined) {
        setToast({ 
          message: 'Por favor, selecione um destino válido para adicionar a estadia!', 
          type: 'error', 
          show: true 
        });
        return;
      }

      // Para multidestino, trabalhar com o estado específico do destino
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentAccommodations = accommodationsByDestination[destinationKey] || [
          {
            name: '',
            type: '',
            description: '',
            rating: 0,
            nights: '',
            checkInDate: '',
            checkOutDate: '',
            regime: '',
            images: []
          }
        ];
        
        setAccommodationsByDestination(prev => ({
          ...prev,
          [destinationKey]: [
            ...currentAccommodations,
            {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            }
          ]
        }));
      }
    }
  };

  const removeAccommodation = (index) => {
    if (selectedTravelType.main === 'single') {
      setNewTravel(prev => ({
        ...prev,
        accommodations: prev.accommodations.filter((_, i) => i !== index)
      }));
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentAccommodations = accommodationsByDestination[destinationKey] || [];
        setAccommodationsByDestination(prev => ({
          ...prev,
          [destinationKey]: currentAccommodations.filter((_, i) => i !== index)
        }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      if (name === 'category') {
        setNewTravel((prevState) => {
          let updatedCategories = [...prevState.category];
          if (checked) {
            updatedCategories.push(value);
          } else {
            updatedCategories = updatedCategories.filter((category) => category !== value);
          }
          return { ...prevState, category: updatedCategories };
        });
      } else if (name === 'languages') {
        setNewTravel((prevState) => {
          let updatedLanguages = [...(prevState.languages || [])];
          if (checked) {
            updatedLanguages.push(value);
          } else {
            updatedLanguages = updatedLanguages.filter((language) => language !== value);
          }
          return { ...prevState, languages: updatedLanguages };
        });
      } else if (name === 'localTransport') {
        setNewTravel((prevState) => {
          let updatedTransport = [...prevState.localTransport];
          if (checked) {
            updatedTransport.push(value);
          } else {
            updatedTransport = updatedTransport.filter((transport) => transport !== value);
          }
          return { ...prevState, localTransport: updatedTransport };
        });
      }
    } else if (type === 'file') {
      if (name === 'highlightImage') {
        const file = files[0];
        if (file) {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: file,
          }));
          setImagePreview(URL.createObjectURL(file));
        } else {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: '',
          }));
          setImagePreview(null);
        }
      } else if (name === 'travelVideos') {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const maxTotalSize = 100 * 1024 * 1024; // 100MB
        const maxTotalDuration = 180; // 3 minutos em segundos

        // Calcular tamanho total dos vídeos existentes
        const currentTotals = calculateVideoTotals(newTravel.travelVideos, videosInfo);
        
        // Calcular tamanho total dos novos arquivos
        let newFilesSize = 0;
        files.forEach(file => {
          newFilesSize += file.size;
        });

        // Verificar se o tamanho total excede o limite
        if (currentTotals.totalSize + newFilesSize > maxTotalSize) {
          const remainingSize = formatFileSize(maxTotalSize - currentTotals.totalSize);
          setToast({ 
            message: `O tamanho total dos vídeos não pode exceder 100MB. Espaço restante: ${remainingSize}. Por favor, selecione arquivos menores.`, 
            type: 'error', 
            show: true 
          });
          // Limpar o input
          e.target.value = '';
          return;
        }

        // Processar cada arquivo para validar duração
        let processedCount = 0;
        const newVideos = [...newTravel.travelVideos];
        const newPreviews = [...videosPreviews];
        const newInfos = [...videosInfo];

        files.forEach((file, fileIndex) => {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          video.onloadedmetadata = function() {
            window.URL.revokeObjectURL(video.src);
            
            // Calcular duração total incluindo este vídeo
            const currentDuration = currentTotals.totalDuration;
            let newVideosDuration = 0;
            for (let i = 0; i < fileIndex; i++) {
              const prevVideoInfo = newInfos.find((info, idx) => idx === newVideos.length + i);
              if (prevVideoInfo) newVideosDuration += prevVideoInfo.durationSeconds || 0;
            }
            
            const totalDurationWithNew = currentDuration + newVideosDuration + video.duration;
            
            if (totalDurationWithNew > maxTotalDuration) {
              const remainingTime = formatVideoDuration(maxTotalDuration - currentDuration - newVideosDuration);
              setToast({ 
                message: `A duração total dos vídeos não pode exceder 3 minutos. Tempo restante: ${remainingTime}. Por favor, selecione vídeos mais curtos.`, 
                type: 'error', 
                show: true 
              });
              processedCount++;
              // Limpar o input se todos os arquivos foram processados
              if (processedCount === files.length) {
                e.target.value = '';
              }
              return;
            }

            // Adicionar o vídeo se passou nas validações
            newVideos.push(file);
            newPreviews.push(URL.createObjectURL(file));
            newInfos.push({
              name: file.name,
              size: formatFileSize(file.size),
              duration: formatVideoDuration(video.duration),
              durationSeconds: video.duration,
              sizeBytes: file.size
            });

            processedCount++;
            
            // Se todos os arquivos foram processados, atualizar o estado
            if (processedCount === files.length) {
              setNewTravel((prevState) => ({
                ...prevState,
                travelVideos: newVideos,
              }));
              setVideosPreviews(newPreviews);
              setVideosInfo(newInfos);
              
              // Limpar o input para permitir selecionar os mesmos arquivos novamente
              e.target.value = '';
            }
          };

          video.onerror = function() {
            processedCount++;
            setToast({ 
              message: `Erro ao carregar o vídeo "${file.name}". Verifique se o formato é válido.`, 
              type: 'error', 
              show: true 
            });
            
            // Limpar o input se todos os arquivos foram processados
            if (processedCount === files.length) {
              e.target.value = '';
            }
          };

          video.src = URL.createObjectURL(file);
        });
      } else if (name === 'images_generalInformation') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setGeneralInfoImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'accommodationImages') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => {
          const updatedAccommodations = [...prevState.accommodations];
          updatedAccommodations[0] = {
            ...updatedAccommodations[0],
            images: [...(updatedAccommodations[0].images || []), ...newFiles]
          };
          return { ...prevState, accommodations: updatedAccommodations };
        });
        setAccommodationImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_foodRecommendations') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setFoodRecommendationImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_localTransport') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setTransportImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_referencePoints') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setReferencePointImagePreviews((prev) => [...prev, ...previews]);
      }
    } else if (name.startsWith('accommodations')) {
      const parts = name.split('.');
      const indexStr = parts[0].replace('accommodations', '');
      const field = parts[1];
      const index = parseInt(indexStr, 10);
      
      if (selectedTravelType.main === 'single') {
        setNewTravel((prevState) => {
          const updatedAccommodations = [...prevState.accommodations];
          if (!updatedAccommodations[index]) {
            updatedAccommodations[index] = {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            };
          }
          updatedAccommodations[index] = {
            ...updatedAccommodations[index],
            [field]: value
          };
          return { ...prevState, accommodations: updatedAccommodations };
        });
      } else if (selectedTravelType.main === 'multi') {
        const destinationKey = getCurrentDestinationKey();
        if (destinationKey) {
          const currentAccommodations = accommodationsByDestination[destinationKey] || [
            {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            }
          ];
          
          const updatedAccommodations = [...currentAccommodations];
          if (!updatedAccommodations[index]) {
            updatedAccommodations[index] = {
              name: '',
              type: '',
              description: '',
              rating: 0,
              nights: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            };
          }
          updatedAccommodations[index] = {
            ...updatedAccommodations[index],
            [field]: value
          };
          
          setAccommodationsByDestination(prev => ({
            ...prev,
            [destinationKey]: updatedAccommodations
          }));
        }
      }
    } else if (name.includes('priceDetails.')) {
      const field = name.split('.')[1];
      setNewTravel((prevState) => {
        const updatedPriceDetails = { ...prevState.priceDetails, [field]: value };
        const hotel = parseFloat(updatedPriceDetails.hotel) || 0;
        const food = parseFloat(updatedPriceDetails.food) || 0;
        const transport = parseFloat(updatedPriceDetails.transport) || 0;
        const extras = parseFloat(updatedPriceDetails.extras) || 0;
        const totalPrice = hotel + food + transport + extras;
        
        return {
          ...prevState,
          priceDetails: updatedPriceDetails,
          price: totalPrice.toString()
        };
      });
    } else {
      // Para destino único, verificar se está mudando país ou cidade
      if (selectedTravelType.main === 'single') {
        handleCountryCityReset(name, value);
      }
      
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setNewFoodRecommendation((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditFoodRecommendation = (e) => {
    e.stopPropagation();
    if (!newFoodRecommendation.name.trim()) {
      setToast({ message: 'O nome da recomendação alimentar é obrigatório!', type: 'error', show: true });
      return;
    }
    setNewTravel((prev) => {
      const updatedRecommendations = [...prev.foodRecommendations];
      if (editingFoodIndex !== null) {
        updatedRecommendations[editingFoodIndex] = {
          name: newFoodRecommendation.name,
          description: newFoodRecommendation.description
        };
      } else {
        updatedRecommendations.push({
          name: newFoodRecommendation.name,
          description: newFoodRecommendation.description
        });
      }
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
    setToast({ message: 'Recomendação alimentar adicionada/editada com sucesso!', type: 'success', show: true });
  };

  const handleDeleteFoodRecommendation = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => {
      const updatedRecommendations = prev.foodRecommendations.filter((_, i) => i !== index);
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '' });
    showToast('Recomendação alimentar removida com sucesso!', 'success');
    setToast({ message: 'Recomendação alimentar removida com sucesso!', type: 'success', show: true });
  };

  const handleEditFoodRecommendation = (e, index) => {
    e.stopPropagation();
    const recommendation = newTravel.foodRecommendations[index];
    if (recommendation) {
      setNewFoodRecommendation({
        name: recommendation.name || '',
        description: recommendation.description || ''
      });
      setEditingFoodIndex(index);
    }
  };

  const handleCancelEditFood = (e) => {
    e.stopPropagation();
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
  };

  const handlePointChange = (e) => {
    const { name, value } = e.target;
    setNewPointOfInterest((prev) => ({ ...prev, [name]: value }));
  };

  const handleNegativeChange = (e) => {
    const { name, value } = e.target;
    setNewNegativePoint((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditNegativePoint = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newNegativePoint.name.trim()) return;

    if (editingNegativeIndex !== null) {
      setNewTravel((prev) => {
        const updatedNegativePoints = [...prev.negativePoints];
        updatedNegativePoints[editingNegativeIndex] = { ...newNegativePoint };
        return { ...prev, negativePoints: updatedNegativePoints };
      });
      setEditingNegativeIndex(null);
    } else {
      setNewTravel((prev) => ({
        ...prev,
        negativePoints: [...prev.negativePoints, { ...newNegativePoint }]
      }));
    }

    setNewNegativePoint({ name: '', description: '' });
  };

  const handleEditNegativePoint = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    const pointToEdit = newTravel.negativePoints[index];
    setNewNegativePoint({ ...pointToEdit });
    setEditingNegativeIndex(index);
  };

  const handleDeleteNegativePoint = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setNewTravel((prev) => ({
      ...prev,
      negativePoints: prev.negativePoints.filter((_, i) => i !== index)
    }));
    showToast('Ponto negativo removido com sucesso!', 'success');
  };

  const handleCancelEditNegative = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setNewNegativePoint({ name: '', description: '' });
    setEditingNegativeIndex(null);
  };

  const handleAddOrEditPointOfInterest = (e) => {
    e.stopPropagation();
    if (!newPointOfInterest.name.trim()) {
      setToast({ message: 'O nome do ponto de referência é obrigatório!', type: 'error', show: true });
      return;
    }

    // Validação para viagens de destino único
    if (selectedTravelType.main === 'single') {
      if (!newTravel.country || !newTravel.city) {
        setToast({ 
          message: 'Por favor, selecione primeiro o país e a cidade na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      
      // Para destino único, trabalhar diretamente com newTravel
      setNewTravel((prev) => {
        const updatedPoints = [...prev.pointsOfInterest];
        if (editingPointIndex !== null) {
          updatedPoints[editingPointIndex] = {
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link
          };
        } else {
          updatedPoints.push({
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link
          });
        }
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    }
    
    // Validação para viagens multidestino
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ 
          message: 'Por favor, adicione pelo menos um destino (país e cidade) na aba "Informações Gerais"!', 
          type: 'error', 
          show: true 
        });
        return;
      }
      if (selectedDestinationIndex === "" || selectedDestinationIndex === undefined) {
        setToast({ 
          message: 'Por favor, selecione um destino válido para adicionar o ponto de referência!', 
          type: 'error', 
          show: true 
        });
        return;
      }

      // Para multidestino, trabalhar com o estado específico do destino
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
        const updatedPoints = [...currentPoints];
        
        if (editingPointIndex !== null) {
          updatedPoints[editingPointIndex] = {
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link
          };
        } else {
          updatedPoints.push({
            name: newPointOfInterest.name,
            description: newPointOfInterest.description || '',
            type: newPointOfInterest.type,
            link: newPointOfInterest.link
          });
        }
        
        setPointsOfInterestByDestination(prev => ({
          ...prev,
          [destinationKey]: updatedPoints
        }));
      }
    }

    setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
    setEditingPointIndex(null);
    setToast({ message: 'Ponto de referência adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleDeletePointOfInterest = (e, index) => {
    e.stopPropagation();
    
    if (selectedTravelType.main === 'single') {
      setNewTravel((prev) => {
        const updatedPoints = prev.pointsOfInterest.filter((_, i) => i !== index);
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      if (destinationKey) {
        const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
        setPointsOfInterestByDestination(prev => ({
          ...prev,
          [destinationKey]: currentPoints.filter((_, i) => i !== index)
        }));
      }
    }
    
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
    setToast({ message: 'Ponto de referência removido com sucesso!', type: 'success', show: true });
  };

  const handleEditPointOfInterest = (e, index) => {
    e.stopPropagation();
    
    let point;
    if (selectedTravelType.main === 'single') {
      point = newTravel.pointsOfInterest[index];
    } else if (selectedTravelType.main === 'multi') {
      const destinationKey = getCurrentDestinationKey();
      const currentPoints = pointsOfInterestByDestination[destinationKey] || [];
      point = currentPoints[index];
    }
    
    if (point) {
      setNewPointOfInterest({
        name: point.name || '',
        description: point.description || '',
        type: point.type || '',
        link: point.link || ''
      });
      setEditingPointIndex(index);
    }
  };

  const handleCancelEditPoint = (e) => {
    e.stopPropagation();
    setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
    setEditingPointIndex(null);
  };

  const calculateTripDays = () => {
    if (!newTravel.startDate || !newTravel.endDate) return 0;
    const start = new Date(newTravel.startDate);
    const end = new Date(newTravel.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleItineraryChange = (e, index) => {
    const { name, value } = e.target;
    if (name === 'day') {
      setNewItineraryDay((prev) => ({ ...prev, day: value }));
      setItineraryError('');
    } else if (name.startsWith('activity')) {
      const activityIndex = parseInt(name.split('-')[1], 10);
      const updatedActivities = [...newItineraryDay.activities];
      updatedActivities[activityIndex] = value;
      setNewItineraryDay((prev) => ({ ...prev, activities: updatedActivities }));
    }
  };

  const handleAddActivityField = (e) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: [...prev.activities, '']
    }));
  };

  const handleRemoveActivityField = (e, index) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const handleAddOrEditItineraryDay = (e) => {
    e.stopPropagation();
    const totalDays = calculateTripDays();
    const dayToAdd = parseInt(newItineraryDay.day, 10);

    if (isNaN(dayToAdd) || dayToAdd < 1 || dayToAdd > totalDays) {
      setItineraryError(`Por favor, insira um dia entre 1 e ${totalDays}.`);
      return;
    }

    const dayExists = newTravel.itinerary.some(
      (item) => item.day === dayToAdd && editingItineraryDay === null
    );
    if (dayExists) {
      setItineraryError(
        'Este dia já foi adicionado ao itinerário. Edite o dia existente ou escolha outro número.'
      );
      return;
    }

    setNewTravel((prev) => {
      const updatedItinerary = [...prev.itinerary];
      const filteredActivities = newItineraryDay.activities.filter(
        (act) => act.trim() !== ''
      );
      if (editingItineraryDay !== null) {
        updatedItinerary[editingItineraryDay] = {
          day: dayToAdd,
          activities: filteredActivities
        };
      } else {
        updatedItinerary.push({
          day: dayToAdd,
          activities: filteredActivities
        });
      }
      return { ...prev, itinerary: updatedItinerary.sort((a, b) => a.day - b.day) };
    });
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
    setToast({ message: 'Dia do itinerário adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleEditItineraryDay = (e, index) => {
    e.stopPropagation();
    const day = newTravel.itinerary[index];
    setNewItineraryDay({
      day: day.day.toString(),
      activities: day.activities.length > 0 ? [...day.activities] : ['']
    });
    setEditingItineraryDay(index);
    setItineraryError('');
  };

  const handleDeleteItineraryDay = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    showToast('Dia do itinerário removido com sucesso!', 'success');
    setItineraryError('');
    setToast({ message: 'Dia do itinerário removido com sucesso!', type: 'success', show: true });
  };

  const handleCancelEditItinerary = (e) => {
    e.stopPropagation();
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
  };

  const handleEdit = (id) => {
    const travelToEdit = travels.find((travel) => travel.id === id);
    if (!travelToEdit) {
      setToast({ message: `Viagem com ID ${id} não encontrada!`, type: 'error', show: true });
      return;
    }

    setNewTravel({
      ...travelToEdit,
      highlightImage: travelToEdit.highlightImage || '',
      travelVideos: travelToEdit.travelVideos || [], // Incluir o array de vídeos
      category: travelToEdit.category || [],
      priceDetails: travelToEdit.priceDetails || { hotel: '', flight: '', food: '', extras: '' },
      accommodations: Array.isArray(travelToEdit.accommodations) && travelToEdit.accommodations.length > 0
        ? travelToEdit.accommodations.map(acc => ({
            ...acc,
            images: acc.images || []
          }))
        : [
            {
              name: '',
              type: '',
              description: '',
              rating: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            }
          ],
      foodRecommendations: Array.isArray(travelToEdit.foodRecommendations)
        ? travelToEdit.foodRecommendations.map(food => ({
            name: food.name || '',
            description: food.description || ''
          }))
        : [],
      images_foodRecommendations: travelToEdit.images_foodRecommendations || [],
      pointsOfInterest: Array.isArray(travelToEdit.pointsOfInterest)
        ? travelToEdit.pointsOfInterest.map(point => ({
            name: point.name || '',
            type: point.type || '',
            link: point.link || ''
          }))
        : [],
      images_referencePoints: travelToEdit.images_referencePoints || [],
      itinerary: Array.isArray(travelToEdit.itinerary) ? travelToEdit.itinerary : [],
      localTransport: Array.isArray(travelToEdit.localTransport) ? travelToEdit.localTransport : [],
      privacy: travelToEdit.privacy || 'public'
    });

    setEditTravelId(id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveTab('generalInfo');
    
    // Restaurar tipo de viagem (single ou multi)
    if (travelToEdit.travelType) {
      setSelectedTravelType(travelToEdit.travelType);
    } else {
      // Fallback: detectar pelo numero de destinos
      setSelectedTravelType({ 
        main: 'single',  // Default para compatibilidade com viagens antigas
        isGroup: false 
      });
    }
    
    // Restaurar dados de multidestino se aplicável
    if (travelToEdit.travelType?.main === 'multi' && travelToEdit.multiDestinations) {
      setMultiDestinations(travelToEdit.multiDestinations);
      setSelectedDestinationIndex(0);
      
      // Restaurar dados por destino se existirem
      if (travelToEdit.accommodationsByDestination) {
        setAccommodationsByDestination(travelToEdit.accommodationsByDestination);
      }
      if (travelToEdit.pointsOfInterestByDestination) {
        setPointsOfInterestByDestination(travelToEdit.pointsOfInterestByDestination);
      }
    }
    
    // Restaurar membros do grupo se aplicável
    if (travelToEdit.groupData?.members) {
      setGroupMembers(travelToEdit.groupData.members);
    }
    
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');

    // Corrigir a pré-visualização da imagem de destaque
    if (travelToEdit.highlightImage) {
      if (travelToEdit.highlightImage instanceof File) {
        setImagePreview(URL.createObjectURL(travelToEdit.highlightImage));
      } else if (typeof travelToEdit.highlightImage === 'string') {
        setImagePreview(travelToEdit.highlightImage);
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }

    // Corrigir a pré-visualização dos vídeos
    if (travelToEdit.travelVideos && Array.isArray(travelToEdit.travelVideos)) {
      const previews = [];
      const infos = [];
      
      travelToEdit.travelVideos.forEach((video, index) => {
        if (video instanceof File) {
          previews.push(URL.createObjectURL(video));
        } else if (typeof video === 'string') {
          previews.push(video);
        }
        // Para vídeos existentes, não temos informações detalhadas, então adicionamos informações básicas
        infos.push({
          name: `video-${index + 1}`,
          size: 'Carregado',
          duration: '--:--',
          durationSeconds: 0,
          sizeBytes: 0
        });
      });
      
      setVideosPreviews(previews);
      setVideosInfo(infos);
    } else {
      setVideosPreviews([]);
      setVideosInfo([]);
    }

    if (travelToEdit.images_generalInformation && Array.isArray(travelToEdit.images_generalInformation)) {
      const previews = travelToEdit.images_generalInformation.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setGeneralInfoImagePreviews(previews);
    } else {
      setGeneralInfoImagePreviews([]);
    }

    if (travelToEdit.accommodations && Array.isArray(travelToEdit.accommodations)) {
      const accommodationImages = travelToEdit.accommodations[0]?.images || [];
      const previews = accommodationImages.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setAccommodationImagePreviews(previews);
    } else {
      setAccommodationImagePreviews([]);
    }

    if (travelToEdit.images_foodRecommendations && Array.isArray(travelToEdit.images_foodRecommendations)) {
      const previews = travelToEdit.images_foodRecommendations.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setFoodRecommendationImagePreviews(previews);
    } else {
      setFoodRecommendationImagePreviews([]);
    }

    if (travelToEdit.images_localTransport && Array.isArray(travelToEdit.images_localTransport)) {
      const previews = travelToEdit.images_localTransport.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setTransportImagePreviews(previews);
    } else {
      setTransportImagePreviews([]);
    }

    if (travelToEdit.images_referencePoints && Array.isArray(travelToEdit.images_referencePoints)) {
      const previews = travelToEdit.images_referencePoints.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setReferencePointImagePreviews(previews);
    } else {
      setReferencePointImagePreviews([]);
    }
  };

  const handleDelete = (id) => {
    setTravels(travels.filter((travel) => travel.id !== id));
    setToast({ message: 'Viagem eliminada com sucesso!', type: 'success', show: true });
  };

  const handleAddTravel = () => {
    if (!validateForm()) return;

    // Se multidestino: por enquanto apenas armazenar localmente; backend será integrado depois
    if (selectedTravelType.main === 'multi') {
      const multiTravel = {
        ...newTravel,
        id: isEditing ? editTravelId : Date.now(),
        travelType: selectedTravelType,
        multiDestinations: multiDestinations,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null
      };
      if (isEditing) {
        setTravels(prev => prev.map(t => t.id === editTravelId ? multiTravel : t));
        showToast('Viagem multidestino editada (armazenada local).', 'success');
      } else {
        setTravels(prev => [...prev, multiTravel]);
        showToast('Viagem multidestino adicionada (armazenada local).', 'success');
      }
      // ✅ OTIMIZADO: resetForm IMEDIATAMENTE sem delay
      resetForm();
      return;
    }

  // Map newTravel to TripDto structure
  const tripData = {
    userId: 1, // Hardcoded for now; replace with actual user ID from auth state
    countryId: newTravel.country === 'Portugal' ? 1 : newTravel.country === 'Brazil' ? 2 : 3, // Map country to an ID
    title: newTravel.name,
    startDate: newTravel.startDate, // Assumes "yyyy-MM-dd"
    endDate: newTravel.endDate, // Assumes "yyyy-MM-dd"
    bookingDate: newTravel.BookingTripPaymentDate, // Assumes "yyyy-MM-dd"
    tripDurationDays: parseInt(newTravel.days) || calculateTripDays(),
    tripSummary: newTravel.description,
    tripDescription: newTravel.longDescription,
    tripRating: parseInt(newTravel.stars) || 0, // Add stars to newTravel if not present
    cost: {
      total: parseFloat(newTravel.price) || 0,
      accommodation: parseFloat(newTravel.priceDetails.hotel) || 0,
      transport: parseFloat(newTravel.priceDetails.transport) || 0,
      food: parseFloat(newTravel.priceDetails.food) || 0,
      extra: parseFloat(newTravel.priceDetails.extras) || 0,
    },
    categoryIds: newTravel.category.map(cat => {
      const categoryMap = {
        'Natureza': 1, 'Cidade': 2, 'Cultural': 3, 'Nature': 4, 'Foodie': 5, // Example mapping
      };
      return categoryMap[cat] || 0;
    }).filter(id => id !== 0),
    languageSpokenIds: (newTravel.languages || []).map(lang => {
      const languageMap = { 'Português': 1, 'Inglês': 2, 'Espanhol': 3 };
      return languageMap[lang.trim()] || 0;
    }).filter(id => id !== 0),
    referencePoints: newTravel.pointsOfInterest.map(point => ({
      name: point.name,
      description: point.type,
      photos: point.link || null,
    })),
    tripTransports: newTravel.localTransport.map(transport => ({
      transportId: 1,
      cost: 30,
      photos: ["foto1", "foto2"]
    })),
    accommodations: newTravel.accommodations.map(acc => ({
      name: acc.name,
      accommodationTypeId: 1,
      description: acc.description,
      price: 150,
      nrNights: 10,
      rating: parseInt(acc.rating) || 0,
      accommodationBoardId: 1,
    })),
  };

  if (isEditing) {
      setTravels((prevTravels) =>
        prevTravels.map((travel) =>
          travel.id === editTravelId
            ? {
                ...newTravel,
                id: editTravelId,
        travelType: selectedTravelType,
        multiDestinations: selectedTravelType.main === 'multi' ? multiDestinations : null,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null,
                highlightImage: newTravel.highlightImage,
                images_generalInformation: newTravel.images_generalInformation || [],
                accommodations: Array.isArray(newTravel.accommodations)
                  ? newTravel.accommodations.map(acc => ({
                      ...acc,
                      images: acc.images || []
                    }))
                  : [
                      {
                        name: '',
                        type: '',
                        description: '',
                        rating: '',
                        checkInDate: '',
                        checkOutDate: '',
                        regime: '',
                        images: []
                      }
                    ],
                foodRecommendations: newTravel.foodRecommendations.filter(
                  (rec) => rec.name.trim() !== '' || rec.description.trim() !== ''
                ),
                images_foodRecommendations: newTravel.images_foodRecommendations || [],
                pointsOfInterest: newTravel.pointsOfInterest.filter(
                  (point) => point.name.trim() !== '' || point.type.trim() !== '' || point.link.trim() !== ''
                ),
                images_referencePoints: newTravel.images_referencePoints || [],
                itinerary: newTravel.itinerary.filter(
                  (item) => item.day && item.activities.length > 0
                ),
                localTransport: newTravel.localTransport || [],
                images_localTransport: newTravel.images_localTransport || [],
                privacy: newTravel.privacy
              }
            : travel
        )
      );
      showToast('Viagem editada com sucesso!', 'success');
      // ✅ OTIMIZADO: resetForm IMEDIATAMENTE sem delay
      resetForm();
    } else {
      // Para single destination, armazenar localmente também por enquanto
      const singleTravel = {
        ...newTravel,
        id: isEditing ? editTravelId : Date.now(),
        travelType: selectedTravelType,
        multiDestinations: null,
        groupData: selectedTravelType.isGroup ? { members: groupMembers, admin: user.firstName } : null
      };
      
      setTravels(prev => [...prev, singleTravel]);
      showToast('Viagem adicionada com sucesso!', 'success');
      // ✅ OTIMIZADO: resetForm IMEDIATAMENTE sem delay
      resetForm();
      
      // ✅ OTIMIZADO: Enviar ao backend em background (async, não bloqueia)
      request(
              "POST",
              "/trips",
              tripData
            ).then(
              (response) => {
                console.log('✅ Viagem sincronizada com backend:', response);
              }).catch(
              (error) => {
                console.error('⚠️ Erro ao sincronizar com backend (armazenada localmente):', error);
              }
            );
    }
  };

  // Nova função para adicionar ou editar apenas os pontos negativos
  const handleAddOrEditNegativePoints = (e) => {
    e.stopPropagation();
    setToast({ message: 'Pontos negativos atualizados com sucesso!', type: 'success', show: true });
  };

  const resetForm = () => {
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
      BookingTripPaymentDate: '',
      highlightImage: '',
      travelVideos: [], // Reset do array de vídeos
      views: 0,
      priceDetails: { hotel: '', flight: '', food: '', extras: '' },
      images: [],
      images_generalInformation: [],
      description: '',
      longDescription: '',
      activities: [],
      accommodations: [
        {
          name: '',
          type: '',
          description: '',
          rating: '',
          checkInDate: '',
          checkOutDate: '',
          regime: '',
          images: []
        }
      ],
      foodRecommendations: [],
      images_foodRecommendations: [],
      climate: '',
      pointsOfInterest: [],
      images_referencePoints: [],
      safety: { tips: [], vaccinations: [] },
      itinerary: [],
      localTransport: [],
      language: '',
      reviews: [],
      negativePoints: '',
      privacy: 'public'
    });
    setIsModalOpen(false);
    setIsTravelTypeModalOpen(false);
    setIsEditing(false);
    setEditTravelId(null);
    setIsCategoryModalOpen(false);
    setIsTransportModalOpen(false);
    setImagePreview(null);
    setVideosPreviews([]); // Reset dos previews dos vídeos
    setVideosInfo([]); // Reset das informações dos vídeos
    setGeneralInfoImagePreviews([]);
    setAccommodationImagePreviews([]);
    setFoodRecommendationImagePreviews([]);
    setTransportImagePreviews([]);
    setReferencePointImagePreviews([]);
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setItineraryError('');
    setSelectedTravelType({ main: '', isGroup: false });
    setGroupMembers([]);
    setNewMemberEmail('');
    setAvailableUsers([]);
    setMultiDestinations([]);
    setNewDestination({ country: '', city: '' });
    setSelectedDestinationIndex(0);
    setAccommodationsByDestination({});
    setPointsOfInterestByDestination({});
  };

  const openModal = () => {
    // abrir primeiro modal de tipo de viagem
    setSelectedTravelType({ main: '', isGroup: false });
    setIsTravelTypeModalOpen(true);
  };

  const handleTravelTypeSelection = (type) => {
    setSelectedTravelType(prev => ({ 
      ...prev, 
      main: type 
    }));
  };

  const confirmTravelType = () => {
    if (!selectedTravelType.main) {
      setToast({ message: 'Selecione Destino Único ou Multidestino.', type: 'error', show: true });
      return;
    }
    // Preparar dados iniciais com datas vazias
    setNewTravel(prev => ({
      ...prev,
      startDate: '',
      endDate: '',
      travelType: selectedTravelType
    }));
    setIsTravelTypeModalOpen(false);
    setIsModalOpen(true);
    setActiveTab('generalInfo');
  };

  // ------ Funções Grupo (simples) ------
  const addGroupMemberByEmail = (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    if (groupMembers.some(m => m.email === newMemberEmail.trim())) {
      setToast({ message: 'Membro já adicionado.', type: 'error', show: true });
      return;
    }
    const member = { id: Date.now(), email: newMemberEmail.trim(), status: 'added' };
    setGroupMembers(prev => [...prev, member]);
    setNewMemberEmail('');
  };
  const removeGroupMember = (id) => {
    setGroupMembers(prev => prev.filter(m => m.id !== id));
  };

  // ------ Funções Multidestino (básico) ------
  const addDestination = (e) => {
    e.preventDefault();
    if (!newDestination.country || !newDestination.city.trim()) {
      setToast({ message: 'Informe país e cidade.', type: 'error', show: true });
      return;
    }
    if (multiDestinations.some(d => d.country === newDestination.country && d.city.toLowerCase() === newDestination.city.toLowerCase())) {
      setToast({ message: 'Destino já existente.', type: 'error', show: true });
      return;
    }
    setMultiDestinations(prev => [...prev, { id: Date.now(), ...newDestination }]);
    setNewDestination({ country: '', city: '' });
  };
  const removeDestination = (id) => {
    setMultiDestinations(prev => prev.filter(d => d.id !== id));
    // Remover dados associados a este destino
    const destinationKey = `${multiDestinations.find(d => d.id === id)?.country}_${multiDestinations.find(d => d.id === id)?.city}`;
    setAccommodationsByDestination(prev => {
      const updated = { ...prev };
      delete updated[destinationKey];
      return updated;
    });
    setPointsOfInterestByDestination(prev => {
      const updated = { ...prev };
      delete updated[destinationKey];
      return updated;
    });
  };

  // Função para obter a chave do destino atual
  const getCurrentDestinationKey = () => {
    if (selectedTravelType.main === 'single') {
      return `${newTravel.country}_${newTravel.city}`;
    } else if (selectedTravelType.main === 'multi' && selectedDestinationIndex !== "" && multiDestinations[selectedDestinationIndex]) {
      const dest = multiDestinations[selectedDestinationIndex];
      return `${dest.country}_${dest.city}`;
    }
    return null;
  };

  // Função para resetar dados quando muda país/cidade para destino único
  const handleCountryCityReset = (name, value) => {
    if (name === 'country' || name === 'city') {
      // Reset dos pontos de referência e acomodações quando muda país/cidade
      setNewTravel(prev => ({
        ...prev,
        pointsOfInterest: [],
        accommodations: [
          {
            name: '',
            type: '',
            description: '',
            rating: 0,
            nights: '',
            checkInDate: '',
            checkOutDate: '',
            regime: '',
            images: []
          }
        ]
      }));
      
      // Limpar previews de imagens
      setReferencePointImagePreviews([]);
      setAccommodationImagePreviews([]);
      
      // Reset dos estados de edição
      setEditingPointIndex(null);
      setNewPointOfInterest({ name: '', description: '', type: '', link: '' });
      
      setToast({ 
        message: 'Dados de pontos de referência e estadia foram limpos devido à mudança de localização!', 
        type: 'info', 
        show: true 
      });
    }
  };

  // Função para obter acomodações do destino atual
  const getCurrentAccommodations = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey) return newTravel.accommodations || [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ];
    
    if (selectedTravelType.main === 'multi') {
      return accommodationsByDestination[destinationKey] || [
        {
          name: '',
          type: '',
          description: '',
          rating: 0,
          nights: '',
          checkInDate: '',
          checkOutDate: '',
          regime: '',
          images: []
        }
      ];
    }
    return newTravel.accommodations || [
      {
        name: '',
        type: '',
        description: '',
        rating: 0,
        nights: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ];
  };

  // Função para obter pontos de interesse do destino atual
  const getCurrentPointsOfInterest = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey) return newTravel.pointsOfInterest || [];
    
    if (selectedTravelType.main === 'multi') {
      return pointsOfInterestByDestination[destinationKey] || [];
    }
    return newTravel.pointsOfInterest || [];
  };

  // Função para guardar dados do destino actual
  const saveCurrentDestinationData = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey || selectedTravelType.main !== 'multi') return;
    
    setAccommodationsByDestination(prev => ({
      ...prev,
      [destinationKey]: getCurrentAccommodations()
    }));
    
    setPointsOfInterestByDestination(prev => ({
      ...prev,
      [destinationKey]: getCurrentPointsOfInterest()
    }));
  };

  // Função para remover vídeo individual
  const removeVideo = (index) => {
    const newVideos = newTravel.travelVideos.filter((_, i) => i !== index);
    const newPreviews = videosPreviews.filter((_, i) => i !== index);
    const newInfos = videosInfo.filter((_, i) => i !== index);

    setNewTravel((prevState) => ({
      ...prevState,
      travelVideos: newVideos,
    }));
    setVideosPreviews(newPreviews);
    setVideosInfo(newInfos);
  };

  const closeModal = () => {
    resetForm();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setItineraryError('');

    // Função auxiliar: rola para o topo do container relevante
    const scrollToTop = () => {
      // Se o modal de planejamento estiver aberto, rolar o conteúdo do modal
      const modalContent = document.querySelector('.travel-planner-content');
      const modalForm = document.querySelector('.modal-form-content');
      if (modalContent) {
        const target = modalForm || modalContent;
        if (target && typeof target.scrollTo === 'function') {
          target.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        if (target) {
          target.scrollTop = 0;
          return;
        }
      }

      // Caso não haja modal, rolar a janela principal
      if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    };

    // Executar o centramento da nav em mobile e, em seguida, rolar para topo
    setTimeout(() => {
      const tabNav = document.querySelector('.tab-nav');
      const activeButton = document.querySelector(`.tab-nav button.active`);
      if (tabNav && activeButton && window.innerWidth <= 768) {
        const buttonLeft = activeButton.offsetLeft;
        const buttonWidth = activeButton.offsetWidth;
        const navWidth = tabNav.offsetWidth;
        const scrollLeft = buttonLeft - (navWidth / 2) + (buttonWidth / 2);
        tabNav.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }

      // finalmente, rolar para o topo do conteúdo da aba selecionada
      scrollToTop();
    }, 100);
  };

  // Função para filtrar viagens
  const getFilteredTravels = () => {
    if (filterType === 'all') return travels;
    
    return travels.filter(travel => {
      switch (filterType) {
        case 'single':
          return !travel.travelType?.main || travel.travelType?.main === 'single';
        case 'multi':
          return travel.travelType?.main === 'multi' || travel.multiDestinations;
        case 'group':
          return travel.travelType?.isGroup || travel.groupData;
        case 'public':
          return !travel.privacy || travel.privacy === 'public';
        case 'private':
          return travel.privacy === 'private';
        case 'followers':
          return travel.privacy === 'followers';
        default:
          return true;
      }
    });
  };

  // Funções de navegação entre tabs
  const tabs = [
    'generalInfo', 'prices', 'accommodation', 'food', 
    'transport', 'pointsOfInterest', 'itinerary', 'negativePoints', 'group'
  ];

  const handlePrevTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      const newTab = tabs[currentIndex - 1];
      setActiveTab(newTab);
      handleTabChange(newTab);
    }
  };

  const handleNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      const newTab = tabs[currentIndex + 1];
      setActiveTab(newTab);
      handleTabChange(newTab);
    }
  };

  return (
    <div className="my-travels-container">
      {/* Exibir Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
<br></br>
      {isTravelTypeModalOpen && (
        <div className="travel-planner-modal travel-type-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            <div 
              className="modal-header-actions"
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                padding: '20px 25px'
              }}
            >
              <h1 style={{ margin: '0', fontSize: '1.5em', fontWeight: '700' }}>
                Que tipo de viagem realizou?
              </h1>
              
              <div 
                className="modal-header-buttons"
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center',
                  margin: '0',
                  justifyContent: 'flex-end'
                }}
              >
                
                <button 
                  type="button" 
                  className="button-danger" 
                  onClick={resetForm}
                  style={{
                    background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                    color: 'white',
                    border: 'none',
                    padding: window.innerWidth <= 768 ? '12px 20px' : '15px 25px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(244, 67, 54, 0.4)',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Fechar
                </button>

<button 
                  type="button" 
                  className="button-success" 
                  onClick={confirmTravelType}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    color: 'white',
                    border: 'none',
                    padding: window.innerWidth <= 768 ? '12px 20px' : '15px 25px',
                    borderRadius: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 3px 12px rgba(76, 175, 80, 0.4)',
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Continuar
                </button>

              </div>
            </div>
            <div className="modal-form-content">
              <h3 style={{ textAlign: 'center', marginBottom: '30px', color: '#2c3e50' }}>Tipo de Destino:</h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '20px', 
                marginBottom: '30px' 
              }}>
                {/* Card Destino Único */}
                <div 
                  className={`destination-type-card ${selectedTravelType.main === 'single' ? 'selected' : ''}`}
                  onClick={() => handleTravelTypeSelection('single')}
                  style={{
                    border: `3px solid ${selectedTravelType.main === 'single' ? '#007bff' : '#e9ecef'}`,
                    borderRadius: '15px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedTravelType.main === 'single' ? '#f0f8ff' : 'white',
                    boxShadow: selectedTravelType.main === 'single' ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🎯</div>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: selectedTravelType.main === 'single' ? '#007bff' : '#2c3e50'
                  }}>
                    Viagem a Destino Único {selectedTravelType.main === 'single' && <span style={{ color: '#007bff' }}>✓</span>}
                  </h4>
                  <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                    Uma viagem focada num único país e uma única cidade.
                  </p>
                  <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Exemplo: Portugal - Lisboa
                  </small>
                </div>

                {/* Card Multidestino */}
                <div 
                  className={`destination-type-card ${selectedTravelType.main === 'multi' ? 'selected' : ''}`}
                  onClick={() => handleTravelTypeSelection('multi')}
                  style={{
                    border: `3px solid ${selectedTravelType.main === 'multi' ? '#007bff' : '#e9ecef'}`,
                    borderRadius: '15px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backgroundColor: selectedTravelType.main === 'multi' ? '#f0f8ff' : 'white',
                    boxShadow: selectedTravelType.main === 'multi' ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '15px' }}>🗺️</div>
                  <h4 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: selectedTravelType.main === 'multi' ? '#007bff' : '#2c3e50'
                  }}>
                    Viagem Multidestino {selectedTravelType.main === 'multi' && <span style={{ color: '#007bff' }}>✓</span>}
                  </h4>
                  <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                    Uma viagem que inclui vários países e/ou várias cidades.
                  </p>
                  <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Exemplo: Portugal - Lisboa, Coimbra / Espanha - Madrid
                  </small>
                </div>
              </div>

              {/* Checkbox Viagem em Grupo - REMOVIDO */}
              {/* 
              <div 
                className={`destination-type-card ${selectedTravelType.isGroup ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedTravelType(prev => ({
                    ...prev,
                    isGroup: !prev.isGroup
                  }));
                }}
                style={{
                  border: `3px solid ${selectedTravelType.isGroup ? '#007bff' : '#e9ecef'}`,
                  borderRadius: '15px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: selectedTravelType.isGroup ? '#f0f8ff' : 'white',
                  boxShadow: selectedTravelType.isGroup ? '0 8px 25px rgba(0, 123, 255, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  marginTop: '20px'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>👥</div>
                <h4 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: selectedTravelType.isGroup ? '#007bff' : '#2c3e50'
                }}>
                  Viagem em Grupo {selectedTravelType.isGroup && <span style={{ color: '#007bff' }}>✓</span>}
                </h4>
                <p style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '14px', lineHeight: '1.4' }}>
                  Marque esta opção se a viagem foi realizada em grupo para adicionar informações dos membros.
                </p>
                <small style={{ color: '#6c757d', fontStyle: 'italic' }}>
                  Poderá adicionar e gerir membros do grupo na aba dedicada
                </small>
              </div>
              */}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="travel-planner-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Header: Toggle Button + Action Buttons - Only visible on tablet/mobile */}
            {window.innerWidth <= 768 && (
              <div 
                style={{
                  position: 'fixed',
                  top: '15px',
                  left: '15px',
                  right: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  zIndex: 1002,
                  justifyContent: 'space-between',
                  background: 'none',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '8px',
                }}
              >
                {/* Toggle Button - Esquerda */}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsHeaderOpen(!isHeaderOpen)}
                    className={`modal-header-toggle-button ${isHeaderOpen ? 'open' : ''}`}
                    style={{
                      background: isHeaderOpen 
                        ? 'linear-gradient(135deg, #dc3545, #bb2d3b)' 
                        : 'linear-gradient(135deg, #007bff, #0056b3)',
                      border: 'none',
                      borderRadius: '8px',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '18px',
                      transition: 'all 0.3s ease',
                      color: 'white',
                      transform: isHeaderOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                    title={isHeaderOpen ? 'Fechar configurações' : 'Abrir configurações'}
                  >
                    {isHeaderOpen ? '✕' : '⚙️'}
                  </button>
                </div>

                {/* Action Buttons - Direita - Ocultos quando toggle aberto */}
                <div 
                  style={{ 
                    display: isHeaderOpen ? 'none' : 'flex', 
                    gap: '8px', 
                    alignItems: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleAddTravel}
                    style={{
                      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isEditing ? "💾 Guardar" : "✅ Adicionar Viagem"}
                  </button>
                  <button 
                    type="button" 
                    onClick={closeModal}
                    style={{
                      background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '12px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    ✕ Fechar
                  </button>
                </div>
              </div>
            )}
            
            <div 
              className={`modal-header-actions ${isHeaderOpen && window.innerWidth <= 768 ? 'show' : ''}`}
              style={{
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '20px',
                padding: window.innerWidth <= 768 ? '80px 15px 30px 15px' : '20px 25px'
              }}
            >
              {/* Desktop Layout */}
              {window.innerWidth > 768 && (
                <>
                  <span style={{
                    margin: '0',
                    fontSize: '1.6em',
                    fontWeight: '700',
                    color: '#2c3e50',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    flex: '1'
                  }}>
                     {isEditing ? '✏️' : ''} {newTravel.name && newTravel.name.trim() ? newTravel.name : (isEditing ? 'Editar Viagem' : 'Adicionar Viagem')}
                  </span>
           
                  <div 
                    className="modal-header-buttons" 
                    style={{ 
                      display: 'flex', 
                      gap: '12px', 
                      alignItems: 'center',
                      margin: '0',
                      justifyContent: 'flex-end',
                      flex: '0 0 auto'
                    }}
                  >
                    <button 
                      type="button" 
                      onClick={() => setIsSettingsModalOpen(true)} 
                      className="button-secondary"
                      style={{
                        background: 'linear-gradient(135deg, #6c757d, #5a6268)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(108, 117, 125, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                    >
                      ⚙️ Configurações
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTravel}
                      className="button-success"
                      style={{
                        background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(76, 175, 80, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                    >
                      {isEditing ? "💾 Guardar" : "✅ Adicionar"}
                    </button>
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="button-danger"
                      style={{
                        background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 3px 12px rgba(244, 67, 54, 0.3)',
                        minWidth: 'auto',
                        whiteSpace: 'nowrap',
                        flex: '0 0 auto'
                      }}
                    >
                      ✕ Fechar
                    </button>
                  </div>
                </>
              )}

              {/* Configurações Mobile que aparecem quando o toggle está aberto */}
              {isHeaderOpen && window.innerWidth <= 768 && (
                <div
                  style={{
                    position: 'fixed',
                    height: '346px',
                    top: '70px',
                    left: '15px',
                    right: '15px',
                    bottom: '20px', // Limita a altura para não cortar conteúdo
                    borderRadius: '15px',
                    padding: '20px',
                    zIndex: 1001,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    animation: 'slideDown 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  }}
                >
                  <h3 style={{ 
                    margin: '0 0 20px 0', 
                    color: '#333', 
                    fontSize: '18px',
                    fontWeight: '600',
                    textAlign: 'center',
                    borderBottom: '2px solid #f0f0f0',
                    paddingBottom: '10px'
                  }}>
                    ⚙️ Configurações da Viagem
                  </h3>

                  {/* Privacidade da Viagem */}
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🔒 Privacidade da Viagem
                    </h4>
                    
                    <select
                      name="privacy"
                      value={newTravel.privacy}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        background: 'white',
                        fontSize: '14px',
                        color: '#333',
                        marginLeft: '15px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="public">🌍 Pública (Todos podem ver)</option>
                      <option value="followers">👥 Somente Seguidores</option>
                      <option value="private">🔒 Privada (Só eu)</option>
                    </select>
                  </div>

                  {/* Tipo de Viagem */}
                  <div style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      🗺️ Tipo de Viagem
                    </h4>
                    
                    <select
                      value={selectedTravelType.main}
                      onChange={(e) => {
                        setSelectedTravelType(prev => ({
                          ...prev,
                          main: e.target.value
                        }));
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '2px solid #e0e0e0',
                        background: 'white',
                        fontSize: '14px',
                        color: '#333',
                        marginLeft: '15px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="single">🎯 Destino Único</option>
                      <option value="multi">🗺️ Multidestino</option>
                    </select>
                  </div>

                  {/* Viagem em Grupo */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ 
                      margin: '0 0 15px 0', 
                      color: '#555', 
                      fontSize: '16px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      👥 Viagem em Grupo
                    </h4>
                    
                    <div style={{ 
                      marginLeft: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
                    }}>
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#333'
                      }}>
                        <input
                          type="checkbox"
                          checked={selectedTravelType.isGroup}
                          onChange={(e) => {
                            setSelectedTravelType(prev => ({
                              ...prev,
                              isGroup: e.target.checked
                            }));
                          }}
                          style={{
                            transform: 'scale(1.3)',
                            accentColor: '#007bff'
                          }}
                        />
                        <span>Ativar viagem em grupo</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal de Configurações */}
            {isSettingsModalOpen && (
              <div className="modal-overlay" onClick={() => setIsSettingsModalOpen(false)}>
                <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header-actions">
                    <h2>⚙️ Configurações da Viagem</h2>
                    <div className="modal-header-buttons">
                      <button 
                        type="button" 
                        onClick={() => setIsSettingsModalOpen(false)} 
                        className="button-danger"
                      >
                        ✕ Fechar
                      </button>
                    </div>
                  </div>
                  
                  <div className="settings-content">
                    {/* Privacidade da Viagem */}
                    <div className="setting-item">
                      <label className="setting-label">
                        🔒 Privacidade da Viagem
                      </label>
                      <select
                        name="privacy"
                        value={newTravel.privacy}
                        onChange={handleChange}
                        className="setting-select"
                      >
                        <option value="public">🌍 Pública (Todos podem ver)</option>
                        <option value="followers">👥 Somente Seguidores</option>
                        <option value="private">🔒 Privada (Só eu)</option>
                      </select>
                    </div>

                    {/* Tipo de Viagem */}
                    <div className="setting-item">
                      <label className="setting-label">
                        🗺️ Tipo de Viagem
                      </label>
                      <select
                        value={selectedTravelType.main}
                        onChange={(e) => {
                          setSelectedTravelType(prev => ({
                            ...prev,
                            main: e.target.value
                          }));
                        }}
                        className="setting-select"
                      >
                        <option value="single">🎯 Destino Único</option>
                        <option value="multi">🗺️ Multidestino</option>
                      </select>
                    </div>

                    {/* Viagem em Grupo */}
                    <div className="setting-item">
                      <label className="setting-label">
                        👥 Viagem em Grupo
                      </label>
                      <div className="setting-toggle">
                        <input
                          type="checkbox"
                          id="groupTravelCheckbox"
                          checked={selectedTravelType.isGroup}
                          onChange={(e) => {
                            setSelectedTravelType(prev => ({
                              ...prev,
                              isGroup: e.target.checked
                            }));
                          }}
                          className="toggle-checkbox"
                        />
                        <label htmlFor="groupTravelCheckbox" className="toggle-label">
                          
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="tab-nav">
              <button onClick={() => handleTabChange('generalInfo')} className={activeTab === 'generalInfo' ? 'active' : ''}>
                1 - Informações Gerais
              </button>
              <button onClick={() => handleTabChange('prices')} className={activeTab === 'prices' ? 'active' : ''}>
                2 - Preços da Viagem
              </button>
              <button onClick={() => handleTabChange('accommodation')} className={activeTab === 'accommodation' ? 'active' : ''}>
                3 - Estadia
              </button>
              <button onClick={() => handleTabChange('food')} className={activeTab === 'food' ? 'active' : ''}>
                4 - Alimentação
              </button>
              <button onClick={() => handleTabChange('transport')} className={activeTab === 'transport' ? 'active' : ''}>
                5 - Transportes
              </button>
              <button onClick={() => handleTabChange('pointsOfInterest')} className={activeTab === 'pointsOfInterest' ? 'active' : ''}>
                6 - Pontos de Referência
              </button>
              <button onClick={() => handleTabChange('itinerary')} className={activeTab === 'itinerary' ? 'active' : ''}>
                7 - Itinerário da Viagem
              </button>
              <button onClick={() => handleTabChange('negativePoints')} className={activeTab === 'negativePoints' ? 'active' : ''}>
                8 - Pontos Negativos
              </button>
              {selectedTravelType.isGroup && (
                <button onClick={() => handleTabChange('group')} className={activeTab === 'group' ? 'active' : ''}>
                  {selectedTravelType.main === 'multi' ? '9' : '9'} - Viagem em Grupo
                </button>
              )}
            </div>
            <div className="modal-form-content">
            <form onSubmit={(e) => e.preventDefault()}>
              {activeTab === 'generalInfo' && (

                <>
<br></br>
<div className="LeftPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>📝 Nome da Viagem: <span style={{color: 'red'}}>*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={newTravel.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex.: Viagem à cidade de Coimbra"
                      title="Digite um nome descritivo para a sua viagem"
                    />
                    <div style={{
                      fontSize: '12px',
                      color: newTravel.name.length > 100 ? '#d32f2f' : '#4caf50',
                      marginTop: '5px',
                      fontWeight: 'bold'
                    }}>
                      {newTravel.name.length}/100 caracteres
                    </div>

                    <br /><br />

                    {selectedTravelType.main !== 'multi' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label style={{textAlign: 'center', width: '100%'}}>🌍 País: <span style={{color: 'red'}}>*</span></label>
                          <select 
                            name="country" 
                            value={newTravel.country} 
                            onChange={handleChange} 
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                            title="Selecione o país da sua viagem"
                          >
                            <option value="">Selecione um país</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Brasil">Brasil</option>
                            <option value="United States">Estados Unidos</option>
                            <option value="Espanha">Espanha</option>
                            <option value="França">França</option>
                            <option value="Itália">Itália</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label style={{textAlign: 'center', width: '100%'}}>🏙️ Cidade: <span style={{color: 'red'}}>*</span></label>
                          <select
                            name="city"
                            value={newTravel.city}
                            onChange={handleChange}
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                            disabled={!newTravel.country}
                            title={newTravel.country ? "Selecione a cidade da sua viagem" : "Primeiro selecione um país"}
                          >
                            <option value="">
                              {newTravel.country ? "Selecione uma cidade" : "Primeiro selecione um país"}
                            </option>
                            {getCitiesForCountry(newTravel.country).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {selectedTravelType.main === 'multi' && (
                      <div className="multi-destination-section">
                        
                        <label style={{textAlign: 'center', width: '100%'}}>🌐 Destinos: <span style={{color: 'red'}}>*</span></label>
                        <div className="destination-controls">
                          <select 
                            name="multiCountry" 
                            value={newDestination.country} 
                            onChange={(e)=>setNewDestination(prev=>({...prev,country:e.target.value, city:''}))}
                            title="Selecione o país do destino"
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                          >
                            <option value="">País</option>
                            <option value="Portugal">Portugal</option>
                            <option value="Brasil">Brasil</option>
                            <option value="United States">United States</option>
                            <option value="Espanha">Espanha</option>
                            <option value="França">França</option>
                            <option value="Itália">Itália</option>
                          </select>
                          <select 
                            name="multiCity" 
                            value={newDestination.city} 
                            onChange={(e)=>setNewDestination(prev=>({...prev,city:e.target.value}))}
                            disabled={!newDestination.country}
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                            title={newDestination.country ? "Selecione a cidade do destino" : "Primeiro selecione um país"}
                          >
                            <option value="">
                              {newDestination.country ? "Selecione uma cidade" : "Primeiro selecione um país"}
                            </option>
                            {newDestination.country && getCitiesForCountry(newDestination.country).map(city => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                          <button onClick={addDestination} type="button" className="button-success" title="Adicionar destino à lista">
                            ➕ Adicionar
                          </button>
                        </div>
                        {multiDestinations.length>0 ? (
                          <ul className="destinations-list">
                            {multiDestinations.map(d=> (
                              <li key={d.id} className="destination-item">
                                <span>📍 {d.city}, {d.country}</span>
                                <button 
                                  type="button" 
                                  onClick={()=>removeDestination(d.id)} 
                                  className="remove-button"
                                  title="Remover este destino"
                                >
                                  ✕
                                </button>
                              </li>
                            ))}
                          </ul>
                        ): <p className="no-destinations">Nenhum destino adicionado.</p>}
                      </div>
                    )}

                    

                    <div className="form-row">
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Início: <span style={{color: 'red'}}>*</span></label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Fim: <span style={{color: 'red'}}>*</span></label>
                        <input
                          type="date"
                          name="endDate"
                          value={newTravel.endDate}
                          onChange={handleChange}
                            required
                            style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                          title="Selecione a data de fim da viagem"
                        />
                      </div>


                      
                    </div>





                    <div className="form-row">
                      <div className="form-group">
                       
                     <label style={{textAlign: 'center', width: '100%'}}>📅 Pagamento da Viagem:</label>
                        <input
                          type="date"
                          name="BookingTripPaymentDate"
                          value={newTravel.BookingTripPaymentDate}
                          onChange={handleChange}
                          required
                          style={{ borderColor: '#e9ecef', boxShadow: 'none' }}
                        />
                      </div>
                      <div className="form-group">
                          <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>⭐ Avaliação Geral da Viagem (1 a 5): <span style={{color: 'red'}}>*</span></label>
                        <StarRating
                          rating={parseInt(newTravel.stars) || 0}
                          onRatingChange={(rating) => 
                            setNewTravel(prev => ({ ...prev, stars: rating.toString() }))
                          }
                        />
                      </div>
                      </div>


                      
                    </div>

<br></br>


                     <div className="form-row">
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>🗂️ Categorias Selecionadas: <span style={{color: 'red'}}>*</span></label>
                     <p>{newTravel.category.length > 0 ? newTravel.category.join(', ') : 'Nenhuma categoria selecionada'}</p> 
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)} title="Abrir seletor de categorias">
                      📋 Selecionar Categorias
                    </button>

                    {isCategoryModalOpen && (
                      <div className="modal-overlay">
                        <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                          <h3>🗂️ Selecionar Categorias</h3>
                          <div className="category-list">
                            {categories.map((cat) => (
                              <div 
                                key={cat} 
                                className={`category-item ${newTravel.category.includes(cat) ? 'selected' : ''}`}
                                onClick={() => {
                                  const event = {
                                    target: {
                                      name: 'category',
                                      value: cat,
                                      type: 'checkbox',
                                      checked: !newTravel.category.includes(cat)
                                    }
                                  };
                                  handleChange(event);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  border: `2px solid ${newTravel.category.includes(cat) ? '#007bff' : '#e9ecef'}`,
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: newTravel.category.includes(cat) ? '#f0f8ff' : 'white',
                                  marginBottom: '8px'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  name="category"
                                  value={cat}
                                  checked={newTravel.category.includes(cat)}
                                  onChange={() => {}} // Controle pelo onClick do div
                                  style={{ marginRight: '8px', pointerEvents: 'none' }}
                                />
                                <label style={{ cursor: 'pointer', pointerEvents: 'none' }}>{cat}</label>
                              </div>
                            ))}
                          </div>
                          <div className="modal-actions">
                            <button type="button-danger" onClick={() => setIsCategoryModalOpen(false)}>
                              Fechar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                     
                      </div>
                      <div className="form-group">
                          <div className="form-group">
                      







                    <label style={{textAlign: 'center', width: '100%'}}>🗣️ Línguas Utilizadas: <span style={{color: 'red'}}>*</span></label>
                        <p>{newTravel.languages && newTravel.languages.length > 0 ? newTravel.languages.join(', ') : 'Nenhuma língua selecionada'}</p>
                        <button type="button" onClick={() => setIsLanguageModalOpen(true)} title="Abrir seletor de idiomas">
                          🗣️ Selecionar Idiomas
                        </button>

                        {isLanguageModalOpen && (
                          <div className="modal-overlay">
                            <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                              <h3>🗣️ Selecionar Idiomas</h3>
                              <div className="category-list">
                                {languages.map((lang) => (
                                  <div 
                                    key={lang} 
                                    className={`category-item ${(newTravel.languages || []).includes(lang) ? 'selected' : ''}`}
                                    onClick={() => {
                                      const event = {
                                        target: {
                                          name: 'languages',
                                          value: lang,
                                          type: 'checkbox',
                                          checked: !(newTravel.languages || []).includes(lang)
                                        }
                                      };
                                      handleChange(event);
                                    }}
                                    style={{
                                      padding: '12px 16px',
                                      border: `2px solid ${(newTravel.languages || []).includes(lang) ? '#007bff' : '#e9ecef'}`,
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      backgroundColor: (newTravel.languages || []).includes(lang) ? '#f0f8ff' : 'white',
                                      marginBottom: '8px'
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name="languages"
                                      value={lang}
                                      checked={(newTravel.languages || []).includes(lang)}
                                      onChange={() => {}} // Controle pelo onClick do div
                                      style={{ marginRight: '8px', pointerEvents: 'none' }}
                                    />
                                    <label style={{ cursor: 'pointer', pointerEvents: 'none' }}>{lang}</label>
                                  </div>
                                ))}
                              </div>
                              <div className="modal-actions">
                                <button type="button-danger" onClick={() => setIsLanguageModalOpen(false)}>
                                  Fechar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                      </div>


                      
                    </div>





                   

              

                    {/* Seção de Descrições da Viagem */}
                    <div className="description-section">
                      <h4>Descrições da Viagem</h4>
                      
                      <div className="description-fields">
                        <div className="description-field short">
                          <label style={{textAlign: 'center', width: '100%'}}>
                            📝 Descrição Curta: <span style={{color: 'red'}}>*</span>
                          </label>
                          <input
                            type="text"
                            name="description"
                            value={newTravel.description}
                            onChange={handleChange}
                            placeholder="Ex.: Uma aventura incrível pelas ruas históricas de Lisboa, descobrindo sabores e tradições únicas..."
                            maxLength="350"
                            title="Descrição breve que aparecerá como prévia da viagem (máximo 350 caracteres)"
                          />
                          <div className={`char-counter ${newTravel.description.length > 280 ? 'warning' : ''} ${newTravel.description.length > 330 ? 'danger' : ''}`}>
                            {newTravel.description.length}/350 caracteres
                          </div>
                        </div>

                        <div className="description-field long">
                          <label style={{textAlign: 'center', width: '100%'}}>
                            📖 Descrição Longa: <span style={{color: 'red'}}>*</span>
                          </label>
                          <textarea
                            name="longDescription"
                            value={newTravel.longDescription}
                            onChange={handleChange}
                            placeholder="Conte a história completa da sua viagem! Descreva os lugares que visitou, as experiências que viveu, as pessoas que conheceu, os sabores que experimentou, os momentos mais marcantes... Seja detalhado e inspire outros viajantes com a sua experiência única!"
                            rows="8"
                            maxLength="6000"
                            title="Descrição completa e detalhada da sua experiência de viagem (máximo 6000 caracteres)"
                            style={{ resize: 'vertical', minHeight: '150px', overflow: 'hidden' }}
                          />
                          <div className={`char-counter ${newTravel.longDescription.length > 4500 ? 'warning' : ''} ${newTravel.longDescription.length > 5400 ? 'danger' : ''}`}>
                            {newTravel.longDescription.length}/6000 caracteres
                          </div>
                        </div>
                      </div>

                    
                    </div>

                    <div className="description-section">
                      <label style={{textAlign: 'center', width: '100%'}}>🌡️ Temperatura/Clima:</label>
                      <input
                        type="text"
                        name="climate"
                        value={newTravel.climate}
                        onChange={handleChange}
                        placeholder="Ex.: Média do Clima foi de 30º, apanhamos uma excelente temperatura!"
                        maxLength="350"
                        title="Informações sobre o clima e temperatura durante a viagem (máximo 350 caracteres)"
                        style={{width: '100%'}}
                      />
                      <div className={`char-counter ${newTravel.climate.length > 280 ? 'warning' : ''} ${newTravel.climate.length > 330 ? 'danger' : ''}`}>
                        {newTravel.climate.length}/350 caracteres
                      </div>
                    </div>
                  </div>

                  <div className="RightPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>🖼️ Imagem de Destaque: <span style={{color: 'red'}}>*</span></label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="highlightImage"
                        onChange={handleChange}
                        accept="image/*"
                        id="highlightImageInput"
                        className="image-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="highlightImageInput" className="upload-button" style={{textAlign: 'center', width: '100% !important'}}>
                        <span role="img" aria-label="câmera">📸</span> Adicionar Foto Principal
                      </label>
                      {imagePreview ? (
                        <div className="image-preview-container">
                          <img
                            src={imagePreview}
                            alt="Preview da imagem"
                            className="image-preview"
                            onError={() => setImagePreview(null)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setNewTravel((prev) => ({ ...prev, highlightImage: '' }));
                            }}
                            className="remove-preview-button"
                            title="Remover foto principal"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <p className="upload-placeholder">Nenhuma imagem selecionada. Adicione uma foto para destacar a sua viagem!</p>
                      )}
                    </div>

                    <div style={{marginTop: '20px'}}>
                      <label style={{textAlign: 'center', width: '100%'}}>🎥 Vídeos da Viagem:</label>
                       <label htmlFor="travelVideosInput" className="upload-button" title="Selecione vídeos que representem a sua viagem" style={{textAlign: 'center', width: '100% !important'}}>
                          <span role="img" aria-label="video">🎬</span> Adicionar Vídeos
                        </label>
                      <div style={{
                        background: '#f8f9fa',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        padding: '12px',
                        marginBottom: '10px',
                        fontSize: '14px',
                        color: '#495057'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>ℹ️</span>
                          <strong>Requisitos dos Vídeos:</strong>
                        </div>
                        <div style={{ paddingLeft: '24px' }}>
                          <div>• <strong>Duração total máxima:</strong> 3 minutos (soma de todos os vídeos)</div>
                          <div>• <strong>Tamanho total máximo:</strong> 100 MB (soma de todos os vídeos)</div>
                          <div>• <strong>Quantidade:</strong> Ilimitada (respeitando os limites acima)</div>
                          <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                            Os vídeos serão reproduzidos em sequência no feed!
                          </div>
                        </div>
                        {newTravel.travelVideos.length > 0 && (
                          <div style={{
                            marginTop: '10px',
                            padding: '8px',
                            background: '#e8f5e8',
                            border: '1px solid #d4edda',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#155724'
                          }}>
                            {(() => {
                              const totals = calculateVideoTotals(newTravel.travelVideos, videosInfo);
                              return (
                                <div>
                                  <strong>📊 Totais atuais:</strong>
                                  <div>⏱️ Duração: {totals.formattedDuration} / 3:00</div>
                                  <div>💾 Tamanho: {totals.formattedSize} / 100 MB</div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="video-upload-container">
                        <input
                          type="file"
                          name="travelVideos"
                          onChange={handleChange}
                          accept="video/*"
                          multiple
                          id="travelVideosInput"
                          className="video-input"
                          style={{ display: 'none' }}
                        />
                       
                        {videosPreviews.length > 0 ? (
                          <div style={{ marginTop: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                              {videosPreviews.map((preview, index) => (
                                <div key={index} className="video-preview-container" style={{ position: 'relative' }}>
                                  <video
                                    src={preview}
                                    className="video-preview"
                                    controls
                                    style={{
                                      width: '100%',
                                      height: 'auto',
                                      maxHeight: '200px',
                                      borderRadius: '8px'
                                    }}
                                    onError={() => {
                                      console.error(`Erro ao carregar vídeo ${index}`);
                                    }}
                                  />
                                  {videosInfo[index] && (
                                    <div style={{
                                      background: '#e8f5e8',
                                      border: '1px solid #d4edda',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      marginTop: '5px',
                                      fontSize: '12px',
                                      color: '#155724'
                                    }}>
                                      <div style={{ fontWeight: 'bold' }}>📄 {videosInfo[index].name}</div>
                                      <div>⏱️ {videosInfo[index].duration} | 💾 {videosInfo[index].size}</div>
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeVideo(index)}
                                    className="remove-preview-button"
                                    title="Remover este vídeo"
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(255, 255, 255, 0.9)',
                                      color: '#e74c3c',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      fontSize: '14px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      zIndex: 10,
                                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhum vídeo selecionado. Adicione vídeos para destacar a sua viagem!</p>
                        )}
                      </div>
                    </div>
<br></br><br></br>
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📷 Fotografias das Informações Gerais:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_generalInformation"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="generalInfoImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="generalInfoImagesInput" className="upload-button" title="Adicione fotos que representem as informações gerais da viagem" style={{textAlign: 'center',}}>
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos das Informações Gerais
                        </label>
                        {generalInfoImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {generalInfoImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto das informações gerais ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = generalInfoImagePreviews.filter((_, i) => i !== index);
                                    setGeneralInfoImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_generalInformation: prev.images_generalInformation.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                  title="Remover esta foto das informações gerais"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar as informações gerais!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  

          
                </>
              )}

              {activeTab === 'prices' && (
                <div className="prices-section">
                  <h3>💰 Preços da Viagem</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🏨 Estadia (€):</label>
                      <input
                        type="number"
                        name="priceDetails.hotel"
                        value={newTravel.priceDetails.hotel}
                        onChange={handleChange}
                        placeholder="Ex.: 150"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em estadia (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Alimentação (€):</label>
                      <input
                        type="number"
                        name="priceDetails.food"
                        value={newTravel.priceDetails.food}
                        onChange={handleChange}
                        placeholder="Ex.: 80"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em alimentação (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🚌 Transportes (€):</label>
                      <input
                        type="number"
                        name="priceDetails.transport"
                        value={newTravel.priceDetails.transport}
                        onChange={handleChange}
                        placeholder="Ex.: 200"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em transportes (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🎁 Extras (€):</label>
                      <input
                        type="number"
                        name="priceDetails.extras"
                        value={newTravel.priceDetails.extras}
                        onChange={handleChange}
                        placeholder="Ex.: 50"
                        min="0"
                        step="0.01"
                        max="999999.99"
                        title="Valor gasto em extras (máximo 999999.99€)"
                      />
                      <small style={{fontSize: '12px', color: '#6c757d'}}>Máximo: 999999.99€</small>
                    </div>
                  </div>
                  
                  <div className="price-total-section">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>💰 Preço Total da Viagem (€):</label>
                      <input
                        type="number"
                        name="price"
                        value={calculateTotalPrice()}
                        readOnly
                        className="calculated-total"
                        style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold', fontSize: '18px' }}
                      />
                      <small style={{fontSize: '12px', color: '#6c757d', textAlign: 'center', display: 'block'}}>
                        Calculado automaticamente (€{calculateTotalPrice().toFixed(2)})
                      </small>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '20px',
                    padding: '12px',
                    backgroundColor: '#f0f7ff',
                    border: '1px solid #d4e4ff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#0056b3'
                  }}>
                    <strong>💡 Dica:</strong> Preencha todos os valores para ter um cálculo automático preciso do total da viagem.
                  </div>
                </div>
              )}

              {activeTab === 'accommodation' && (
                <div className="tab-content">
                  {/* Seletor de destino para viagens multidestino */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa", 
                      borderRadius: "8px" 
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        🎯 Selecione o destino para adicionar alojamento:
                      </label>
                      <select
                        value={selectedDestinationIndex}
                        onChange={(e) => setSelectedDestinationIndex(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                      >
                        <option value="">Selecione um destino</option>
                        {multiDestinations.map((dest, index) => (
                          <option key={dest.id || index} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está adicionando */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#e8f4fd", 
                      borderRadius: "5px",
                      textAlign: "center"
                    }}>
                      <strong>📍 A adicionar alojamento para: </strong>
                      {selectedDestinationIndex === "" 
                        ? "Selecione um destino" 
                        : (multiDestinations[selectedDestinationIndex]?.city && multiDestinations[selectedDestinationIndex]?.country
                          ? `${multiDestinations[selectedDestinationIndex].city}, ${multiDestinations[selectedDestinationIndex].country}`
                          : "Destino não definido - Adicione país e cidade primeiro")
                      }
                    </div>
                  )}

                  {/* Avisos informativos */}
                  {selectedTravelType.main === 'single' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      ⚠️ <strong>Atenção:</strong> Ao alterar o país ou cidade na aba "Informações Gerais", todos os dados de estadias e pontos de referência serão limpos automaticamente.
                    </div>
                  )}

                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#d1ecf1", 
                      border: "1px solid #bee5eb", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      💡 <strong>Informação:</strong> Cada destino tem as suas próprias estadias. Ao mudar de destino, só verá as estadias desse local específico.
                    </div>
                  )}

                  <div className="LeftPosition">
                    <div className="accommodation-header">
                      <h3>Alojamentos da Viagem</h3>
                      <button 
                        type="button" 
                        onClick={addAccommodation}
                        className="button-success"
                      >
                        + Adicionar Estadia
                      </button>
                    </div>
                    
                    {Array.isArray(getCurrentAccommodations()) && getCurrentAccommodations().length > 0 ? (
                      getCurrentAccommodations().map((accommodation, index) => (
                        <div key={index} className="accommodation-section">
                          <div className="accommodation-header-item">
                            <h4>{accommodation.name || `Estadia ${index + 1}`}</h4>
                            {getCurrentAccommodations().length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAccommodation(index)}
                                className="remove-button"
                              >
                                Remover
                              </button>
                            )}
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏨 Nome do Alojamento:</label>
                              <input
                                type="text"
                                name={`accommodations${index}.name`}
                                value={accommodation.name}
                                onChange={handleChange}
                                placeholder="Ex.: Hotel Pestana"
                                maxLength="150"
                                title="Nome do alojamento (máximo 150 caracteres)"
                              />
                              <small style={{fontSize: '12px', color: accommodation.name.length > 120 ? '#ff9800' : '#6c757d'}}>
                                {accommodation.name.length}/150 caracteres
                              </small>
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🌙 Número de Noites:</label>
                              <input
                                type="number"
                                name={`accommodations${index}.nights`}
                                value={accommodation.nights}
                                onChange={handleChange}
                                placeholder="Ex.: 3"
                                min="1"
                                max="365"
                                title="Número de noites (máximo 365)"
                              />
                              <small style={{fontSize: '12px', color: '#6c757d'}}>De 1 a 365 noites</small>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏠 Tipo de Alojamento:</label>
                              <select
                                name={`accommodations${index}.type`}
                                value={accommodation.type}
                                onChange={handleChange}
                              >
                                <option value="">Selecione o tipo</option>
                                <option value="Hotel">🏨 Hotel</option>
                                <option value="Hostel">🎒 Hostel</option>
                                <option value="Apartamento">🏠 Apartamento</option>
                                <option value="Pousada">🏡 Pousada</option>
                                <option value="Casa de Férias">🏖️ Casa de Férias</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🍽️ Regime:</label>
                              <select
                                name={`accommodations${index}.regime`}
                                value={accommodation.regime}
                                onChange={handleChange}
                              >
                                <option value="">Selecione o regime</option>
                                <option value="Tudo Incluído">🍽️ Tudo Incluído</option>
                                <option value="Meia Pensão">🥐 Meia Pensão</option>
                                <option value="Pensão Completa">🍳 Pensão Completa</option>
                                <option value="Apenas Alojamento">🛏️ Apenas Alojamento</option>
                              </select>
                            </div>
                          </div>

                          <label style={{textAlign: 'center', width: '100%'}}>📝 A sua opinião da Estadia:</label>
                          <textarea
                            name={`accommodations${index}.description`}
                            value={accommodation.description}
                            onChange={handleChange}
                            rows="4"
                            maxLength="500"
                            placeholder="Ex.: Hotel 5 estrelas com vista para o mar, staff muito simpático, pequeno-almoço excelente..."
                            style={{ resize: 'vertical', minHeight: '100px', overflow: 'hidden' }}
                            title="A sua opinião sobre a estadia (máximo 500 caracteres)"
                          />
                          <small style={{fontSize: '12px', color: accommodation.description && accommodation.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                            {accommodation.description ? accommodation.description.length : 0}/500 caracteres
                          </small>

                          <label style={{textAlign: 'center', width: '100%'}}>⭐ Avaliação da Estadia:</label>
                          <StarRating
                            rating={accommodation.rating || 0}
                            onRatingChange={(rating) => {
                              if (selectedTravelType.main === 'single') {
                                setNewTravel(prev => {
                                  const updatedAccommodations = [...prev.accommodations];
                                  updatedAccommodations[index] = {
                                    ...updatedAccommodations[index],
                                    rating: rating
                                  };
                                  return { ...prev, accommodations: updatedAccommodations };
                                });
                              } else if (selectedTravelType.main === 'multi') {
                                const destinationKey = getCurrentDestinationKey();
                                if (destinationKey) {
                                  const currentAccommodations = accommodationsByDestination[destinationKey] || [];
                                  const updatedAccommodations = [...currentAccommodations];
                                  updatedAccommodations[index] = {
                                    ...updatedAccommodations[index],
                                    rating: rating
                                  };
                                  setAccommodationsByDestination(prev => ({
                                    ...prev,
                                    [destinationKey]: updatedAccommodations
                                  }));
                                }
                              }
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <p>Nenhum alojamento adicionado ainda.</p>
                    )}
                  </div>

                  <div className="RightPosition">
                    <label>📷 Fotografias da Estadia:</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="accommodationImages"
                        onChange={handleChange}
                        accept="image/*"
                        multiple
                        id="accommodationImagesInput"
                        className="image-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="accommodationImagesInput" className="upload-button" title="Adicione fotos do alojamento onde ficou hospedado">
                        <span role="img" aria-label="câmera">📸</span> Adicionar Fotos da Estadia
                      </label>
                      {accommodationImagePreviews.length > 0 ? (
                        <div className="general-info-image-previews">
                          {accommodationImagePreviews.map((preview, imgIndex) => (
                            <div key={imgIndex} className="general-info-image-preview-container">
                              <img src={preview} alt={`Preview da foto do alojamento ${imgIndex + 1}`} className="general-info-image-preview" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPreviews = accommodationImagePreviews.filter((_, i) => i !== imgIndex);
                                  setAccommodationImagePreviews(newPreviews);
                                  setNewTravel((prev) => {
                                    const updatedAccommodations = [...prev.accommodations];
                                    updatedAccommodations[0] = {
                                      ...updatedAccommodations[0],
                                      images: updatedAccommodations[0].images.filter((_, i) => i !== imgIndex)
                                    };
                                    return { ...prev, accommodations: updatedAccommodations };
                                  });
                                }}
                                className="remove-preview-button"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar o alojamento!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'food' && (
                <div className="tab-content">
                  <div className="RightPosition">
                    <h3>🍽️ Recomendações Alimentares</h3>
                    {Array.isArray(newTravel.foodRecommendations) && newTravel.foodRecommendations.length > 0 ? (
                      <ul className="recommendations-list">
                        {newTravel.foodRecommendations.map((recommendation, index) => (
                          <li key={index} className="recommendation-item">
                            <div className="point-info">
                              <strong>🍽️ {recommendation.name || 'Sem nome'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                📝 {recommendation.description || 'Sem descrição'}
                              </p>
                            </div>
                            <div className="recommendation-actions">
                              <button
                                onClick={(e) => handleEditFoodRecommendation(e, index)}
                                className="edit-button"
                                title="Editar esta recomendação alimentar"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteFoodRecommendation(e, index)}
                                className="delete-button"
                                title="Remover esta recomendação alimentar"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">🍽️</div>
                        <p>Nenhuma recomendação alimentar adicionada ainda</p>
                        <small>Adicione pratos e restaurantes que recomenda a outros viajantes</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Nome da nova Recomendação:</label>
                      <input
                        type="text"
                        name="name"
                        value={newFoodRecommendation.name}
                        onChange={handleFoodChange}
                        placeholder="Ex.: Bacalhau à Brás, Restaurante O Fado, Pastéis de Nata..."
                        maxLength="150"
                        key={`name-input-${editingFoodIndex}`}
                        title="Nome da recomendação alimentar (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newFoodRecommendation.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newFoodRecommendation.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newFoodRecommendation.description}
                        onChange={handleFoodChange}
                        rows="4"
                        maxLength="500"
                        placeholder="Ex.: Prato tradicional português com bacalhau desfiado, batatas, ovos e cebola. Encontrado no Restaurante Tradicional, custou cerca de 15€. Sabor autêntico e porção generosa..."
                        key={`desc-input-${editingFoodIndex}`}
                        style={{ resize: 'vertical', minHeight: '100px', overflow: 'hidden' }}
                        title="Descrição da recomendação alimentar (máximo 500 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newFoodRecommendation.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newFoodRecommendation.description.length}/500 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditFoodRecommendation(e)}
                          className="button-success"
                          disabled={!newFoodRecommendation.name.trim() || !newFoodRecommendation.description.trim()}
                        >
                          {editingFoodIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingFoodIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditFood(e)}
                            className="button-secondary"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="image-upload-section">
                      <label>📷 Fotografias das Recomendações Alimentares:</label>
                      <div className="image-upload-container">
                        <input
                          type="file"
                          name="images_foodRecommendations"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="foodRecommendationImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="foodRecommendationImagesInput" className="upload-button" title="Adicione fotos de pratos e restaurantes que recomenda">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos das Recomendações Alimentares
                        </label>
                        {foodRecommendationImagePreviews.length > 0 ? (
                          <div className="image-previews">
                            {foodRecommendationImagePreviews.map((preview, index) => (
                              <div key={index} className="image-preview-container">
                                <img src={preview} alt={`Preview da foto de recomendação alimentar ${index + 1}`} className="image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = foodRecommendationImagePreviews.filter((_, i) => i !== index);
                                    setFoodRecommendationImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_foodRecommendations: prev.images_foodRecommendations.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar as suas recomendações alimentares!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transport' && (
                <div className="tab-content">
                  
                  <div className="RightPosition">
                  
 <div className="image-upload-section">
                      <label>📷 Fotografias dos Métodos de Transporte:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_localTransport"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="transportImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="transportImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos dos Métodos de Transporte
                        </label>
                        {transportImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {transportImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de transporte ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = transportImagePreviews.filter((_, i) => i !== index);
                                    setTransportImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_localTransport: prev.images_localTransport.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar os métodos de transporte!</p>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>🚗 Métodos de Transporte Selecionados:</label>
                      <br></br>
                      <p>{newTravel.localTransport.length > 0 ? newTravel.localTransport.join(', ') : 'Nenhum método selecionado'}</p>
                      <button type="button" onClick={() => setIsTransportModalOpen(true)}>
                        ➕ Adicionar Métodos de Transporte
                      </button>

                      {isTransportModalOpen && (
                        <div className="modal-overlay">
                          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>🚗 Adicionar Métodos de Transporte</h3>
                            <div className="category-list">
                              {transportOptions.map((option) => (
                                <div 
                                  key={option}
                                  className={`category-item ${newTravel.localTransport.includes(option) ? 'selected' : ''}`}
                                  onClick={() => {
                                    const event = {
                                      target: {
                                        name: 'localTransport',
                                        value: option,
                                        type: 'checkbox',
                                        checked: !newTravel.localTransport.includes(option)
                                      }
                                    };
                                    handleChange(event);
                                  }}
                                  style={{
                                    padding: '12px 16px',
                                    border: `2px solid ${newTravel.localTransport.includes(option) ? '#007bff' : '#e9ecef'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: newTravel.localTransport.includes(option) ? '#f0f8ff' : 'white',
                                    marginBottom: '8px'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    name="localTransport"
                                    value={option}
                                    checked={newTravel.localTransport.includes(option)}
                                    onChange={() => {}} // Controle pelo onClick do div
                                    style={{ marginRight: '8px', pointerEvents: 'none' }}
                                  />
                                  <label style={{ cursor: 'pointer', pointerEvents: 'none' }}>{option}</label>
                                </div>
                              ))}
                            </div>
                            <div className="modal-actions">
                              <button type="button-danger" onClick={() => setIsTransportModalOpen(false)}>
                                Fechar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pointsOfInterest' && (
                <div className="tab-content">
                  {/* Seletor de destino para viagens multidestino */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa", 
                      borderRadius: "8px" 
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        🎯 Selecione o destino para adicionar pontos de referência:
                      </label>
                      <select
                        value={selectedDestinationIndex}
                        onChange={(e) => setSelectedDestinationIndex(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                      >
                        <option value="">Selecione um destino</option>
                        {multiDestinations.map((dest, index) => (
                          <option key={dest.id || index} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está visualizando */}
                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#e8f4fd", 
                      borderRadius: "5px",
                      textAlign: "center"
                    }}>
                      <strong>📍 Pontos de referência para: </strong>
                      {selectedDestinationIndex === "" 
                        ? "Selecione um destino" 
                        : (multiDestinations[selectedDestinationIndex]?.city && multiDestinations[selectedDestinationIndex]?.country
                          ? `${multiDestinations[selectedDestinationIndex].city}, ${multiDestinations[selectedDestinationIndex].country}`
                          : "Destino não definido - Adicione país e cidade primeiro")
                      }
                    </div>
                  )}

                  {/* Avisos informativos para pontos de referência */}
                  {selectedTravelType.main === 'single' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#fff3cd", 
                      border: "1px solid #ffeaa7", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      ⚠️ <strong>Atenção:</strong> Ao alterar o país ou cidade na aba "Informações Gerais", todos os pontos de referência serão limpos automaticamente.
                    </div>
                  )}

                  {selectedTravelType.main === 'multi' && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#d1ecf1", 
                      border: "1px solid #bee5eb", 
                      borderRadius: "5px", 
                      fontSize: "14px" 
                    }}>
                      💡 <strong>Informação:</strong> Cada destino tem os seus próprios pontos de referência. Ao mudar de destino, só verá os pontos desse local específico.
                    </div>
                  )}

                  <div className="RightPosition">
                    <h3>📍 Pontos de Referência</h3>
                    {(() => {
                      const currentPoints = getCurrentPointsOfInterest();
                      return Array.isArray(currentPoints) && currentPoints.length > 0 ? (
                        <ul className="points-list">
                          {currentPoints.map((point, index) => (
                            <li key={index} className="point-item">
                              <div className="point-info">
                                <strong>📌 {point.name || 'Sem nome'}</strong>
                                <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                  📝 {point.description || 'Sem descrição'}
                                </p>
                              </div>
                              <div className="point-actions">
                                <button
                                  onClick={(e) => handleEditPointOfInterest(e, index)}
                                  className="edit-button"
                                  title="Editar este ponto de interesse"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={(e) => handleDeletePointOfInterest(e, index)}
                                  className="delete-button"
                                  title="Remover este ponto de interesse"
                                >
                                  🗑️ Remover
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="empty-state">
                          <div className="empty-icon">📍</div>
                          <p>Nenhum ponto de referência adicionado ainda</p>
                          <small>Adicione locais de interesse que visitou durante a viagem</small>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📌 Nome do Ponto de Referência:</label>
                      <input
                        type="text"
                        name="name"
                        value={newPointOfInterest.name}
                        onChange={handlePointChange}
                        placeholder="Ex.: Torre de Belém"
                        maxLength="150"
                        key={`name-input-point-${editingPointIndex}`}
                        title="Digite o nome do ponto de interesse (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newPointOfInterest.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newPointOfInterest.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newPointOfInterest.description}
                        onChange={handlePointChange}
                        rows="8"
                        maxLength="1000"
                        placeholder="Ex.: Monumento histórico do século XVI, símbolo de Lisboa. Construído por Manuel I, oferece uma vista fantástica do Tejo. Aberto de segunda a domingo..."
                        title="Descreva o ponto de interesse em detalhe (máximo 1000 caracteres)"
                        key={`desc-input-point-${editingPointIndex}`}
                        style={{ resize: 'vertical', minHeight: '200px', overflow: 'hidden', wordWrap: 'break-word' }}
                      />
                      <small style={{fontSize: '12px', color: newPointOfInterest.description.length > 800 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newPointOfInterest.description.length}/1000 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditPointOfInterest(e)}
                          className="button-success"
                          disabled={!newPointOfInterest.name.trim() || !newPointOfInterest.description.trim()}
                          title={editingPointIndex !== null ? "Guardar as alterações do ponto de interesse" : "Adicionar novo ponto de interesse"}
                        >
                          {editingPointIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingPointIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditPoint(e)}
                            className="button-secondary"
                            title="Cancelar edição do ponto de interesse"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="image-upload-section">
                      <label>📷 Fotografias dos Pontos de Referência:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_referencePoints"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="referencePointImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="referencePointImagesInput" className="upload-button" title="Adicione fotos dos locais de interesse e pontos de referência">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos dos Pontos de Referência
                        </label>
                        {referencePointImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {referencePointImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de ponto de referência ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = referencePointImagePreviews.filter((_, i) => i !== index);
                                    setReferencePointImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_referencePoints: prev.images_referencePoints.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar os pontos de referência!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div className="tab-content">
                  <div className="RightPosition">
                    <h3>🗓️ Itinerário da Viagem</h3>
                    <p><strong>Duração Total:</strong> {calculateTripDays()} dias</p>
                    {Array.isArray(newTravel.itinerary) && newTravel.itinerary.length > 0 ? (
                      <ul className="itinerary-list">
                        {newTravel.itinerary.map((item, index) => (
                          <li key={index} className="itinerary-item">
                            <div className="itinerary-day">
                              <strong>Dia {item.day}:</strong>
                              <ul className="activities-list">
                                {item.activities.map((activity, actIndex) => (
                                  <li key={actIndex}>{activity}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="itinerary-actions">
                              <button
                                onClick={(e) => handleEditItineraryDay(e, index)}
                                className="edit-button"
                                title="Editar as atividades deste dia"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteItineraryDay(e, index)}
                                className="delete-button"
                                title="Remover este dia do itinerário"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">🗓️</div>
                        <p>Nenhum dia adicionado ao itinerário ainda</p>
                        <small>Adicione atividades por dia para organizar a sua viagem</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📅 Dia:</label>
                      <input
                        type="number"
                        name="day"
                        value={newItineraryDay.day}
                        onChange={handleItineraryChange}
                        min="1"
                        max={calculateTripDays()}
                        placeholder={`Digite um número entre 1 e ${calculateTripDays()}`}
                        key={`day-input-${editingItineraryDay}`}
                        title="Escolha o dia da viagem para adicionar atividades"
                      />
                      {itineraryError && (
                        <p className="error-message" style={{color: '#d32f2f', fontSize: '12px', marginTop: '5px'}}>{itineraryError}</p>
                      )}
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>🎯 Atividades:</label>
                      <textarea
                        name="activities-text"
                        value={newItineraryDay.activities.join('\n')}
                        onChange={(e) => {
                          const activities = e.target.value.split('\n').filter(a => a.trim() !== '');
                          setNewItineraryDay(prev => ({...prev, activities: activities.length > 0 ? activities : ['']}));
                        }}
                        placeholder="Ex.: Visita ao museu, Almoço no restaurante X, Passeio pela cidade..."
                        maxLength="1500"
                        title="Descreva todas as atividades deste dia (máximo 1500 caracteres, uma por linha)"
                        rows="8"
                        style={{width: '100%', resize: 'vertical', minHeight: '200px', overflow: 'hidden', wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap'}}
                      />
                      <small style={{fontSize: '12px', color: (newItineraryDay.activities.join('\n').length > 1200) ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newItineraryDay.activities.join('\n').length}/1500 caracteres
                      </small>
                      
                      <div className="action-buttons" style={{marginTop: '15px'}}>
                        <button
                          onClick={(e) => handleAddOrEditItineraryDay(e)}
                          className="button-success"
                          disabled={!newItineraryDay.day || newItineraryDay.activities.every((act) => !act.trim())}
                          title={editingItineraryDay !== null ? "Guardar as alterações do dia" : "Adicionar este dia ao itinerário"}
                        >
                          {editingItineraryDay !== null ? '💾 Guardar Alterações' : '➕ Adicionar Dia'}
                        </button>
                        {editingItineraryDay !== null && (
                          <button
                            onClick={(e) => handleCancelEditItinerary(e)}
                            className="button-secondary"
                            title="Cancelar edição do itinerário"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'negativePoints' && (
                <div className="tab-content">
                  <div className="RightPosition">
                    <h3>⚠️ Pontos Negativos</h3>
                    {Array.isArray(newTravel.negativePoints) && newTravel.negativePoints.length > 0 ? (
                      <ul className="points-list">
                        {newTravel.negativePoints.map((point, index) => (
                          <li key={index} className="point-item">
                            <div className="point-info">
                              <strong>⚠️ {point.name || 'Sem nome'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                📝 {point.description || 'Sem descrição'}
                              </p>
                            </div>
                            <div className="point-actions">
                              <button
                                onClick={(e) => handleEditNegativePoint(e, index)}
                                className="edit-button"
                                title="Editar este ponto negativo"
                              >
                                ✏️ Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteNegativePoint(e, index)}
                                className="delete-button"
                                title="Remover este ponto negativo"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">⚠️</div>
                        <p>Nenhum ponto negativo adicionado ainda</p>
                        <small>Registe aspetos negativos para melhorar viagens futuras</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>⚠️ Nome do Ponto Negativo:</label>
                      <input
                        type="text"
                        name="name"
                        value={newNegativePoint.name}
                        onChange={handleNegativeChange}
                        placeholder="Ex.: Trânsito intenso, Preços elevados"
                        maxLength="150"
                        key={`name-input-negative-${editingNegativeIndex}`}
                        title="Digite o aspecto negativo da viagem (máximo 150 caracteres)"
                      />
                      <small style={{fontSize: '12px', color: newNegativePoint.name.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newNegativePoint.name.length}/150 caracteres
                      </small>
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição:</label>
                      <textarea
                        name="description"
                        value={newNegativePoint.description}
                        onChange={handleNegativeChange}
                        rows="5"
                        maxLength="500"
                        placeholder="Ex.: O trânsito da cidade estava muito congestionado durante todo o dia, causando atrasos nos transportes e cansaço dos viajantes..."
                        title="Descreva detalhadamente o aspecto negativo (máximo 500 caracteres)"
                        key={`desc-input-negative-${editingNegativeIndex}`}
                        style={{ resize: 'vertical', minHeight: '150px', overflow: 'hidden' }}
                      />
                      <small style={{fontSize: '12px', color: newNegativePoint.description.length > 400 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newNegativePoint.description.length}/500 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditNegativePoint(e)}
                          className="button-success"
                          disabled={!newNegativePoint.name.trim() || !newNegativePoint.description.trim()}
                          title={editingNegativeIndex !== null ? "Guardar as alterações do ponto negativo" : "Adicionar novo ponto negativo"}
                        >
                          {editingNegativeIndex !== null ? '💾 Guardar Alterações' : '➕ Adicionar'}
                        </button>
                        {editingNegativeIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditNegative(e)}
                            className="button-secondary"
                            title="Cancelar edição do ponto negativo"
                          >
                            ❌ Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'group' && selectedTravelType.isGroup && (
                <div className="tab-content">
                  <div className="RightPosition">
                    <h3>👥 Membros do Grupo</h3>
                    {Array.isArray(groupMembers) && groupMembers.length > 0 ? (
                      <ul className="points-list">
                        {groupMembers.map((member, index) => (
                          <li key={member.id} className="point-item">
                            <div className="point-info">
                              <strong>👤 {member.email || 'Sem email'}</strong>
                              <p style={{ margin: '5px 0', color: '#6c757d' }}>
                                🔗 {member.status || 'Pendente'}
                              </p>
                            </div>
                            <div className="point-actions">
                              <button
                                onClick={() => removeGroupMember(member.id)}
                                className="delete-button"
                                title="Remover membro do grupo"
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>Nenhum membro adicionado ainda</p>
                        <small>Adicione outros viajantes por email para partilharem esta experiência</small>
                      </div>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>✉️ Email do Membro:</label>
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        maxLength="150"
                        title="Digite o email do membro (máximo 150 caracteres)"
                        style={{
                          padding: '12px 15px',
                          border: '2px solid #e9ecef',
                          borderRadius: '8px',
                          fontSize: '14px',
                          width: '100%',
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#007bff'}
                        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
                      />
                      <small style={{fontSize: '12px', color: newMemberEmail.length > 120 ? '#ff9800' : '#6c757d', display: 'block', marginTop: '5px'}}>
                        {newMemberEmail.length}/150 caracteres
                      </small>

                      <div className="action-buttons">
                        <button
                          onClick={addGroupMemberByEmail}
                          className="button-success"
                          disabled={!newMemberEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newMemberEmail)}
                          title="Adicionar novo membro ao grupo"
                        >
                          ➕ Adicionar Membro
                        </button>
                      </div>

                      {/* Nota de Integração Futura */}
                      <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'rgba(255, 193, 7, 0.1)',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#856404'
                      }}>
                        � <strong>Integração futura:</strong> Os convites serão enviados por email aos membros adicionados. Eles poderão aceitar ou rejeitar o convite.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Fixed Navigation Buttons */}
            <div className="fixed-nav-buttons">
              <button
                onClick={handlePrevTab}
                disabled={tabs.indexOf(activeTab) === 0}
                className="nav-button prev-button"
                title="Voltar à aba anterior"
              >
                ← Anterior
              </button>
              
              <button
                onClick={(activeTab === 'group' || activeTab === 'negativePoints') ? handleAddTravel : handleNextTab}
                disabled={tabs.indexOf(activeTab) === tabs.length - 1 && activeTab !== 'group'}
                className="nav-button next-button"
                title={(activeTab === 'group' || activeTab === 'negativePoints') ? "Guardar viagem" : "Avançar para próxima aba"}
              >
                {(activeTab === 'group' || activeTab === 'negativePoints')
                  ? (isEditing ? "💾 Guardar Alterações" : "✅ Adicionar") 
                  : "Avançar →"}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e estatísticas */}
      <div className="travels-header">
        <div className="travels-stats">
          <h2>As minhas viagens ({travels.length})</h2>
          <br></br>
          <div className="stats-cards">
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => !t.travelType?.main || t.travelType?.main === 'single').length}
              </span>
              <span className="stat-label">🎯 Destino Único</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => t.travelType?.main === 'multi' || t.multiDestinations).length}
              </span>
              <span className="stat-label">🗺️ Multidestino</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {travels.filter(t => t.travelType?.isGroup || t.groupData).length}
              </span>
              <span className="stat-label">👥 Em Grupo</span>
            </div>
          </div>
        </div>

        <div className="travels-filters">
          <button className='button' onClick={openModal} style={{marginBottom: '10px'}}>Adicionar Viagem</button>

          <label>Filtrar por:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">🌟 Todas as viagens ({travels.length})</option>
            <option value="single">🎯 Destino Único ({travels.filter(t => !t.travelType?.main || t.travelType?.main === 'single').length})</option>
            <option value="multi">🗺️ Multidestino ({travels.filter(t => t.travelType?.main === 'multi' || t.multiDestinations).length})</option>
            <option value="group">👥 Viagens em Grupo ({travels.filter(t => t.travelType?.isGroup || t.groupData).length})</option>
            <option value="public">🌍 Públicas ({travels.filter(t => !t.privacy || t.privacy === 'public').length})</option>
            <option value="followers">👥 Para Seguidores ({travels.filter(t => t.privacy === 'followers').length})</option>
            <option value="private">🔒 Privadas ({travels.filter(t => t.privacy === 'private').length})</option>
          </select>
        </div>
      </div>

      <div className="travels-grid">
        {getFilteredTravels().length === 0 ? (
          filterType === 'all' ? (
            <div className="empty-travels-message">
              <div className="empty-icon"></div>
              <h3>Nenhuma viagem adicionada ainda</h3>
              <p>Comece por adicionar uma nova viagem e partilhe as suas experiências!</p>
            </div>
          ) : (
            <div className="empty-travels-message">
              <div className="empty-icon">🔍</div>
              <h3>Nenhuma viagem encontrada</h3>
              <p>Não existem viagens que correspondam ao filtro selecionado.</p>
              <button 
                onClick={() => setFilterType('all')} 
                className="button-success"
                style={{ marginTop: '15px' }}
              >
                Ver todas as viagens
              </button>
            </div>
          )
        ) : (
          getFilteredTravels().map((travel) => (
            <div key={travel.id} className="travel-card">
              <div className="travel-card-header">
                {/* Tags da viagem */}
                <div className="travel-tags">
                  {/* Tag Tipo de Viagem */}
                  <span className={`tag tag-destination ${
                    (travel.travelType?.main === 'multi' || travel.multiDestinations) 
                      ? 'multi-destination' 
                      : 'single-destination'
                  }`}>
                    {(travel.travelType?.main === 'multi' || travel.multiDestinations) 
                      ? '🗺️ Multidestino' 
                      : '🎯 Destino Único'}
                  </span>
                  
                  {/* Tag Viagem em Grupo */}
                  {(travel.travelType?.isGroup || travel.groupData) && (
                    <span className="tag tag-group">
                      👥 Viagem em Grupo
                    </span>
                  )}
                  
                  {/* Tag Privacidade */}
                  <span className={`tag tag-privacy privacy-${travel.privacy || 'public'}`}>
                    {travel.privacy === 'private' && '🔒 Privada'}
                    {travel.privacy === 'followers' && '👥 Seguidores'}
                    {(!travel.privacy || travel.privacy === 'public') && '🌍 Pública'}
                  </span>
                </div>
              </div>

              <div className="travel-content">
                <Link to={`/travel/${travel.id}`}>
                  {travel.highlightImage ? (
                    <img
                      src={
                        travel.highlightImage instanceof File
                          ? URL.createObjectURL(travel.highlightImage)
                          : travel.highlightImage
                      }
                      alt={travel.name}
                      className="highlight-image"
                      onError={(e) => (e.target.src = '/default-image.jpg')}
                    />
                  ) : 
                    <div className="no-image-placeholder">
                      <div className="no-image-icon">📸</div>
                      <span>Sem imagem</span>
                    </div>
                  }
                  
                  <div className="travel-text">
                    <h3>{travel.name}</h3>
                    
                    <div className="travel-info">
                      <div className="info-item">
                        <span className="info-icon">👤</span>
                        <span>Por {user.firstName}</span>
                      </div>
                      
                      {/* Mostrar destinos - diferente para single vs multi */}
                      {(travel.travelType?.main === 'multi' || travel.multiDestinations) && travel.multiDestinations ? (
                        <div className="info-item">
                          <span className="info-icon">🌍</span>
                          <span>
                            {travel.multiDestinations.slice(0, 2).map(dest => `${dest.city}, ${dest.country}`).join(' • ')}
                            {travel.multiDestinations.length > 2 && ` +${travel.multiDestinations.length - 2} destinos`}
                          </span>
                        </div>
                      ) : (
                        <div className="info-item">
                          <span className="info-icon">🌍</span>
                          <span>{travel.city}, {travel.countryName || travel.country}</span>
                        </div>
                      )}
                      
                      <div className="info-item">
                        <span className="info-icon">📅</span>
                        <span>{travel.tripDurationDays || travel.days} dias</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">💰</span>
                        <span>{travel.cost?.total || travel.price}€</span>
                      </div>
                      
                      <div className="info-item rating">
                        <span className="info-icon">⭐</span>
                        <span className="stars">
                          {renderStars(travel.tripRating || travel.stars)}
                        </span>
                      </div>
                      
                      {/* Categorias */}
                      {travel.category && travel.category.length > 0 && (
                        <div className="info-item categories">
                          <span className="info-icon">🗂️</span>
                          <span>{travel.category.slice(0, 2).join(', ')}{travel.category.length > 2 && '...'}</span>
                        </div>
                      )}

                      {/* Membros do grupo */}
                      {((travel.travelType?.isGroup && travel.groupData?.members) || travel.groupData?.members) && travel.groupData.members.length > 0 && (
                        <div className="info-item group-members">
                          <span className="info-icon">👥</span>
                          <span>{travel.groupData.members.length + 1} membros</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="travel-description">
                      {travel.description && (
                        <p>{travel.description.length > 80 ? `${travel.description.substring(0, 80)}...` : travel.description}</p>
                      )}
                    </div>
                    
                    <span className="view-details-button">Ver mais detalhes →</span>
                  </div>
                </Link>
              </div>
              
              <div className="travel-actions">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(travel.id); }}
                  className="action-btn edit-btn"
                  title="Editar viagem"
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(travel.id); }}
                  className="action-btn delete-btn"
                  title="Eliminar viagem"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Toast Component */}
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={closeToast}
      />
    </div>
  );
};

export default MyTravels;