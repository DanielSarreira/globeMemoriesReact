import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import { request, setAuthHeader } from '../axios_helper';
import "../styles/components/modal.css";
import "../styles/pages/future-travels.css";
import "../styles/pages/future-travels-modal.css";
import "../styles/pages/my-travels.css";
import "../styles/pages/my-travels-modal.css";

// ...existing code...

// Componente de Toast para feedback
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

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
    isSpecial: false
  });
  const { user } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTravelTypeModalOpen, setIsTravelTypeModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generalInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
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

  // Função para validar campos obrigatórios
  const validateForm = () => {
    if (!newTravel.name.trim()) {
      setToast({ message: 'O nome da viagem é obrigatório!', type: 'error', show: true });
      return false;
    }
    if (selectedTravelType.main === 'multi') {
      if (multiDestinations.length === 0) {
        setToast({ message: 'Adicione pelo menos um destino!', type: 'error', show: true });
        return false;
      }
    } else {
      if (!newTravel.country) {
        setToast({ message: 'Selecione um país!', type: 'error', show: true });
        return false;
      }
      if (!newTravel.city.trim()) {
        setToast({ message: 'A cidade é obrigatória!', type: 'error', show: true });
        return false;
      }
    }
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ message: 'As datas de início e fim são obrigatórias!', type: 'error', show: true });
      return false;
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
    setNewPointOfInterest({ name: '', type: '', link: '' });
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
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
    setNewPointOfInterest({ name: '', type: '', link: '' });
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
    setToast({ message: 'Viagem excluída com sucesso!', type: 'success', show: true });
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
        setToast({ message: 'Viagem multidestino editada (armazenada local).', type: 'success', show: true });
      } else {
        setTravels(prev => [...prev, multiTravel]);
        setToast({ message: 'Viagem multidestino adicionada (armazenada local).', type: 'success', show: true });
      }
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
    languageSpokenIds: newTravel.language.split(',').map(lang => {
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
                highlightImage: newTravel.highlightImage, // Manter o valor existente, seja File ou string
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
      setToast({ message: 'Viagem editada com sucesso!', type: 'success', show: true });
    } else {
      request(
              "POST",
              "/trips",
              tripData
            ).then(
              (response) => {
                console.log(response)
                setToast({ message: 'Viagem adicionada com sucesso!', type: 'success', show: true });
              }).catch(
              (error) => {
                console.log(error)
              }
            );
      //setTravels((prevTravels) => [...prevTravels, addedTravel]);
      
    }
    resetForm();
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
    setGeneralInfoImagePreviews([]);
    setAccommodationImagePreviews([]);
    setFoodRecommendationImagePreviews([]);
    setTransportImagePreviews([]);
    setReferencePointImagePreviews([]);
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', type: '', link: '' });
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
    if (!destinationKey) return newTravel.accommodations;
    
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
    return newTravel.accommodations;
  };

  // Função para obter pontos de interesse do destino atual
  const getCurrentPointsOfInterest = () => {
    const destinationKey = getCurrentDestinationKey();
    if (!destinationKey) return newTravel.pointsOfInterest;
    
    if (selectedTravelType.main === 'multi') {
      return pointsOfInterestByDestination[destinationKey] || [];
    }
    return newTravel.pointsOfInterest;
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

  const closeModal = () => {
    resetForm();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setItineraryError('');
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
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const handleNextTab = () => {
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1]);
    }
  };

  return (
    <div className="my-travels-container">
      {/* Exibir Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button className='button-success' onClick={openModal}>Adicionar Viagem</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: '600', color: '#2c3e50' }}>Tipo:</label>
          <select 
            value={selectedTravelType.main === 'multi' ? 'multi' : 'single'}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTravelType(prev => ({
                ...prev,
                main: value
              }));
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '2px solid #e9ecef',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <option value="single">Destino Único</option>
            <option value="multi">Multidestino</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#2c3e50' }}>
            <input
              type="checkbox"
              checked={selectedTravelType.isGroup}
              onChange={(e) => {
                setSelectedTravelType(prev => ({
                  ...prev,
                  isGroup: e.target.checked
                }));
              }}
              style={{ transform: 'scale(1.2)' }}
            />
            👥 Viagem em Grupo
          </label>
        </div>
      </div>

      {isTravelTypeModalOpen && (
        <div className="travel-planner-modal travel-type-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <h2>Que tipo de viagem realizou?</h2>
              <div className="modal-header-buttons">
                <button type="button" className="button-danger" onClick={resetForm}>Fechar</button>
                <button type="button" className="button-success" onClick={confirmTravelType}>Continuar</button>
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
                  <span className="tooltip-icon" title="Ao marcar esta opção, será adicionada uma aba especial onde pode adicionar outros viajantes que participaram na viagem. Eles poderão partilhar fotos e experiências.">?</span>
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
            <div className="modal-header-actions">
              <h2>
                ✈️ {isEditing ? "Editar Viagem" : "Planear Nova Viagem"}
              </h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginTop: "15px", flexWrap: "wrap", justifyContent: "center" }}>
                {/* Privacidade da Viagem */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "5px",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}>
                    🔒 Privacidade:
                    <span className="tooltip-icon" title="Defina quem pode ver a sua viagem: Pública (todos), Somente para Seguidores (apenas quem o segue), ou Privada (apenas si).">
                      ?
                    </span>
                  </label>
                  <select
                    name="privacy"
                    value={newTravel.privacy}
                    onChange={handleChange}
                    style={{ 
                      padding: "8px 12px", 
                      borderRadius: "8px", 
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      background: "#fff"
                    }}
                  >
                    <option value="public">Pública</option>
                    <option value="followers">Somente para Seguidores</option>
                    <option value="private">Privada</option>
                  </select>
                </div>

              

                {/* Checkbox Viagem em Grupo */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
                    style={{ transform: "scale(1.2)" }}
                  />
                  <label 
                    htmlFor="groupTravelCheckbox" 
                    style={{ 
                      cursor: "pointer", 
                      fontSize: "14px", 
                      fontWeight: "500",
                      color: "#2c3e50",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    👥 Viagem em Grupo
                    <span className="tooltip-icon" title="Marque se viajou acompanhado por outras pessoas. Poderá adicionar membros na aba Grupo.">
                      ?
                    </span>
                  </label>
                  
                  {/* Dropdown para alternar entre Destino Único e Multidestino */}
                  <div style={{ marginLeft: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <label style={{ fontWeight: "600", color: "#007bff", fontSize: "14px" }}>
                      Tipo:
                      <span className="tooltip-icon" title="Escolha entre visitar um único destino ou múltiplos destinos na mesma viagem.">
                        ?
                      </span>
                    </label>
                    <select
                      value={selectedTravelType.main}
                      onChange={e => {
                        const value = e.target.value;
                        setSelectedTravelType(prev => ({
                          ...prev,
                          main: value
                        }));
                      }}
                      style={{ 
                        padding: "6px 12px", 
                        borderRadius: "8px", 
                        border: "2px solid #007bff", 
                        fontWeight: "600", 
                        color: "#007bff", 
                        background: "#f0f8ff", 
                        fontSize: "14px",
                        boxShadow: "0 2px 8px rgba(0,123,255,0.08)" 
                      }}
                    >
                      <option value="single">🎯 Destino Único</option>
                      <option value="multi">🗺️ Multidestino</option>
                    </select>


                        <div className="modal-header-buttons">
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="button-danger"
                >
                  ✕ Fechar
                </button>
                <button
                  type="button"
                  onClick={handleAddTravel}
                  className="button-success"
                  title={isEditing ? "Guardar as alterações da viagem" : "Adicionar nova viagem"}
                >
                  {isEditing ? "💾 Guardar Alterações" : "✅ Adicionar Viagem"}
                </button>
              </div>
            </div>
          </div>
        </div>

          
            </div>
            <div className="tab-nav">
              <button onClick={() => handleTabChange('generalInfo')} className={activeTab === 'generalInfo' ? 'active' : ''} title="Informações básicas da viagem">
                1 - Informações Gerais
              </button>
              <button onClick={() => handleTabChange('prices')} className={activeTab === 'prices' ? 'active' : ''} title="Custos e preços da viagem">
                2 - Preços da Viagem
              </button>
              <button onClick={() => handleTabChange('accommodation')} className={activeTab === 'accommodation' ? 'active' : ''} title="Informações sobre alojamento">
                3 - Estadia
              </button>
              <button onClick={() => handleTabChange('food')} className={activeTab === 'food' ? 'active' : ''} title="Recomendações alimentares">
                4 - Alimentação
              </button>
              <button onClick={() => handleTabChange('transport')} className={activeTab === 'transport' ? 'active' : ''} title="Métodos de transporte utilizados">
                5 - Transportes
              </button>
              <button onClick={() => handleTabChange('pointsOfInterest')} className={activeTab === 'pointsOfInterest' ? 'active' : ''} title="Locais de interesse visitados">
                6 - Pontos de Referência
              </button>
              <button onClick={() => handleTabChange('itinerary')} className={activeTab === 'itinerary' ? 'active' : ''} title="Planeamento diário da viagem">
                7 - Itinerário da Viagem
              </button>
              <button onClick={() => handleTabChange('negativePoints')} className={activeTab === 'negativePoints' ? 'active' : ''} title="Aspectos negativos da viagem">
                8 - Pontos Negativos
              </button>
              {selectedTravelType.isGroup && (
                <button onClick={() => handleTabChange('group')} className={activeTab === 'group' ? 'active' : ''} title="Informações sobre o grupo de viagem">
                  {selectedTravelType.main === 'multi' ? '9' : '9'} - Viagem em Grupo
                </button>
              )}
            </div>
            <div className="modal-form-content">
            <form onSubmit={(e) => e.preventDefault()}>
              {activeTab === 'generalInfo' && (
                <>
                  <div className="RightPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>🖼️ Imagem de Destaque: <span className="tooltip-icon" title="Selecione uma foto principal que represente melhor a sua viagem">?</span></label>
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
                      <label htmlFor="highlightImageInput" className="upload-button" title="Selecione uma imagem que represente a sua viagem" style={{textAlign: 'center', width: '100% !important'}}>
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
<br></br><br></br>
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📷 Fotografias das Informações Gerais: <span className="tooltip-icon" title="Adicione fotos gerais da viagem, paisagens, momentos especiais">?</span></label>
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

                  <div className="LeftPosition">
                    <label style={{textAlign: 'center', width: '100%'}}>📝 Nome da Viagem: <span className="tooltip-icon" title="Digite um nome descritivo e único para identificar a sua viagem">?</span></label>
                    <input
                      type="text"
                      name="name"
                      value={newTravel.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex.: Viagem à cidade de Coimbra"
                      title="Digite um nome descritivo para a sua viagem"
                    />

                    <br /><br />

                    {selectedTravelType.main !== 'multi' && (
                      <div className="form-row">
                        <div className="form-group">
                          <label style={{textAlign: 'center', width: '100%'}}>🌍 País: <span className="tooltip-icon" title="Selecione o país onde realizou a viagem">?</span></label>
                          <select 
                            name="country" 
                            value={newTravel.country} 
                            onChange={handleChange} 
                            required
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
                          <label style={{textAlign: 'center', width: '100%'}}>🏙️ Cidade: <span className="tooltip-icon" title="Selecione a cidade principal da viagem">?</span></label>
                          <select
                            name="city"
                            value={newTravel.city}
                            onChange={handleChange}
                            required
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
                        
                        <label style={{textAlign: 'center', width: '100%'}}>🌐 Destinos: <span className="tooltip-icon" title="Adicione todos os destinos que visitou nesta viagem">?</span></label>
                        <div className="destination-controls">
                          <select 
                            name="multiCountry" 
                            value={newDestination.country} 
                            onChange={(e)=>setNewDestination(prev=>({...prev,country:e.target.value, city:''}))}
                            title="Selecione o país do destino"
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
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Início: <span className="tooltip-icon" title="Selecione quando começou a viagem">?</span></label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                          required
                          title="Selecione a data de início da viagem"
                        />
                      </div>
                      <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>📅 Data de Fim: <span className="tooltip-icon" title="Selecione quando terminou a viagem">?</span></label>
                        <input
                          type="date"
                          name="endDate"
                          value={newTravel.endDate}
                          onChange={handleChange}
                          required
                          title="Selecione a data de fim da viagem"
                        />
                      </div>


                      
                    </div>





                    <div className="form-row">
                      <div className="form-group">
                       
                     <label style={{textAlign: 'center', width: '100%'}}>� Data de Marcação / Pagamento da Viagem: <span className="tooltip-icon" title="Data em que fez a reserva ou pagamento da viagem">?</span></label>
                        <input
                          type="date"
                          name="BookingTripPaymentDate"
                          value={newTravel.BookingTripPaymentDate}
                          onChange={handleChange}
                          required
                          title="Data da reserva ou pagamento"
                        />
                      </div>
                      <div className="form-group">
                          <div className="form-group">
                        <label style={{textAlign: 'center', width: '100%'}}>⭐ Avaliação Geral da Viagem (1 a 5): <span className="tooltip-icon" title="Avalie a sua experiência geral da viagem de 1 a 5 estrelas">?</span></label>
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
                        <label style={{textAlign: 'center', width: '100%'}}>🗂️ Categorias Selecionadas: <span className="tooltip-icon" title="Categorize a sua viagem para facilitar a organização e busca">?</span></label>
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
                      







                    <label style={{textAlign: 'center', width: '100%'}}>🗣️ Línguas Utilizadas: <span className="tooltip-icon" title="Que idiomas falou ou ouviu durante a viagem">?</span></label>
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
                            Descrição Curta: 
                            <span className="tooltip-icon" title="Escreva um resumo breve e atrativo da sua viagem (máximo 150 caracteres). Esta descrição aparecerá como prévia nos cartões de viagem.">?</span>
                          </label>
                          <input
                            type="text"
                            name="description"
                            value={newTravel.description}
                            onChange={handleChange}
                            placeholder="Ex.: Uma aventura incrível pelas ruas históricas de Lisboa, descobrindo sabores e tradições únicas..."
                            maxLength="150"
                            title="Descrição breve que aparecerá como prévia da viagem"
                          />
                          <div className={`char-counter ${newTravel.description.length > 120 ? 'warning' : ''} ${newTravel.description.length > 140 ? 'danger' : ''}`}>
                            {newTravel.description.length}/150 caracteres
                          </div>
                        </div>

                        <div className="description-field long">
                          <label style={{textAlign: 'center', width: '100%'}}>
                            Descrição Detalhada: 
                            <span className="tooltip-icon" title="Conte a história completa da sua viagem! Inclua detalhes sobre os lugares visitados, experiências marcantes, pessoas que conheceu, desafios enfrentados e momentos especiais. Esta descrição ajudará outros viajantes a se inspirarem.">?</span>
                          </label>
                          <textarea
                            name="longDescription"
                            value={newTravel.longDescription}
                            onChange={handleChange}
                            placeholder="Conte a história completa da sua viagem! Descreva os lugares que visitou, as experiências que viveu, as pessoas que conheceu, os sabores que experimentou, os momentos mais marcantes... Seja detalhado e inspire outros viajantes com a sua experiência única!"
                            rows="6"
                            maxLength="2000"
                            title="Descrição completa e detalhada da sua experiência de viagem"
                          />
                          <div className={`char-counter ${newTravel.longDescription.length > 1500 ? 'warning' : ''} ${newTravel.longDescription.length > 1800 ? 'danger' : ''}`}>
                            {newTravel.longDescription.length}/2000 caracteres
                          </div>
                        </div>
                      </div>

                    
                    </div>


                          <label style={{textAlign: 'center', width: '100%'}}>🌡️ Temperatura (°C): <span className="tooltip-icon" title="Descreva as condições climáticas durante a viagem, incluindo temperaturas médias e observações sobre o tempo">?</span></label>
                    <input
                      type="text"
                      name="climate"
                      value={newTravel.climate}
                      onChange={handleChange}
                      placeholder="Ex.: Média do Clima foi de 30º, apanhamos uma excelente temperatura!"
                      title="Informações sobre o clima e temperatura durante a viagem"
                    />
                    
                    <br></br><br></br><br></br>
                  </div>

          
                </>
              )}

              {activeTab === 'prices' && (
                <div className="prices-section">
                  <h3>Preços da Viagem </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🏨 Estadia (€): <span className="tooltip-icon" title="Custo total do alojamento (hotéis, hostels, Airbnb, etc.)">?</span></label>
                      <input
                        type="number"
                        name="priceDetails.hotel"
                        value={newTravel.priceDetails.hotel}
                        onChange={handleChange}
                        placeholder="Ex.: 150"
                        title="Valor gasto em alojamento"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Alimentação (€): <span className="tooltip-icon" title="Custo total com refeições, lanches e bebidas">?</span></label>
                      <input
                        type="number"
                        name="priceDetails.food"
                        value={newTravel.priceDetails.food}
                        onChange={handleChange}
                        placeholder="Ex.: 80"
                        title="Valor gasto em alimentação"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>� Transportes (€): <span className="tooltip-icon" title="Custo com transportes (voos, comboios, autocarros, táxis, combustível)">?</span></label>
                      <input
                        type="number"
                        name="priceDetails.transport"
                        value={newTravel.priceDetails.transport}
                        onChange={handleChange}
                        placeholder="Ex.: 200"
                        title="Valor gasto em transportes"
                      />
                    </div>
                    <div className="form-group">
                      <label>🎁 Extras (€): <span className="tooltip-icon" title="Outros gastos (souvenirs, atividades, seguros, vistos, etc.)">?</span></label>
                      <input
                        type="number"
                        name="priceDetails.extras"
                        value={newTravel.priceDetails.extras}
                        onChange={handleChange}
                        placeholder="Ex.: 50"
                        title="Valor gasto em extras"
                      />
                    </div>
                  </div>
                  
                  <div className="price-total-section">
                    <div className="form-group">
                      <label style={{textAlign: 'center', width: '100%'}}>💰 Preço Total da Viagem (€): <span className="tooltip-icon" title="Soma de todos os custos da viagem ou valor total gasto">?</span></label>
                      <input
                        type="number"
                        name="price"
                        value={calculateTotalPrice()}
                        readOnly
                        className="calculated-total"
                        style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}
                      />
                     
                    </div>
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
                              <label style={{textAlign: 'center', width: '100%'}}>🏨 Nome do Alojamento: <span className="tooltip-icon" title="Digite o nome do hotel, pousada, Airbnb ou local onde se hospedou">?</span></label>
                              <input
                                type="text"
                                name={`accommodations${index}.name`}
                                value={accommodation.name}
                                onChange={handleChange}
                                placeholder="Ex.: Hotel Pestana"
                              />
                            </div>
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🌙 Número de Noites: <span className="tooltip-icon" title="Quantas noites ficou hospedado neste local">?</span></label>
                              <input
                                type="number"
                                name={`accommodations${index}.nights`}
                                value={accommodation.nights}
                                onChange={handleChange}
                                placeholder="Ex.: 3"
                                min="1"
                              />
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label style={{textAlign: 'center', width: '100%'}}>🏠 Tipo de Alojamento: <span className="tooltip-icon" title="Selecione o tipo de acomodação onde se hospedou">?</span></label>
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
                              <label style={{textAlign: 'center', width: '100%'}}>🍽️ Regime: <span className="tooltip-icon" title="Tipo de refeições incluídas na estadia">?</span></label>
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

                          <label style={{textAlign: 'center', width: '100%'}}>📝 A sua opinião da Estadia: <span className="tooltip-icon" title="Descreva a sua experiência no alojamento: conforto, localização, serviços, pontos positivos e negativos">?</span></label>
                          <textarea
                            name={`accommodations${index}.description`}
                            value={accommodation.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ex.: Hotel 5 estrelas com vista para o mar, staff muito simpático, pequeno-almoço excelente..."
                          />

                          <label style={{textAlign: 'center', width: '100%'}}>⭐ Avaliação da Estadia: <span className="tooltip-icon" title="Avalie a sua experiência geral no alojamento de 1 a 5 estrelas">?</span></label>
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
                    <label>📷 Fotografias da Estadia: <span className="tooltip-icon" title="Adicione fotos do alojamento, do quarto, das instalações e vistas">?</span></label>
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
                    <h3>🍽️ Recomendações Alimentares <span className="tooltip-icon" title="Registe pratos, restaurantes e experiências gastronómicas que recomenda">?</span></h3>
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
                      <label style={{textAlign: 'center', width: '100%'}}>🍽️ Nome da nova Recomendação: <span className="tooltip-icon" title="Digite o nome do prato, restaurante, lanche ou bebida que recomenda">?</span></label>
                      <input
                        type="text"
                        name="name"
                        value={newFoodRecommendation.name}
                        onChange={handleFoodChange}
                        placeholder="Ex.: Bacalhau à Brás, Restaurante O Fado, Pastéis de Nata..."
                        key={`name-input-${editingFoodIndex}`}
                      />
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição: <span className="tooltip-icon" title="Descreva o sabor, ingredientes, onde encontrar, preço aproximado e por que recomenda">?</span></label>
                      <textarea
                        name="description"
                        value={newFoodRecommendation.description}
                        onChange={handleFoodChange}
                        rows="3"
                        placeholder="Ex.: Prato tradicional português com bacalhau desfiado, batatas, ovos e cebola. Encontrado no Restaurante Tradicional, custou cerca de 15€. Sabor autêntico e porção generosa..."
                        key={`desc-input-${editingFoodIndex}`}
                      />

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditFoodRecommendation(e)}
                          className="button-success"
                          disabled={!newFoodRecommendation.name.trim()}
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
                      <label>📷 Fotografias das Recomendações Alimentares: <span className="tooltip-icon" title="Adicione fotos dos pratos, restaurantes, mercados ou experiências gastronômicas">?</span></label>
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
                      <label>📷 Fotografias dos Métodos de Transporte: <span className="tooltip-icon" title="Adicione fotos dos transportes utilizados: aviões, comboios, autocarros, táxis, carros alugados, etc.">?</span></label>
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
                      <label style={{textAlign: 'center', width: '100%'}}>🚗 Métodos de Transporte Selecionados: <span className="tooltip-icon" title="Selecione todos os tipos de transporte que utilizou durante a viagem">?</span></label>
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
                    <h3>📍 Pontos de Referência <span className="tooltip-icon" title="Lista de todos os pontos de interesse e locais visitados">?</span></h3>
                    {Array.isArray(getCurrentPointsOfInterest()) && getCurrentPointsOfInterest().length > 0 ? (
                      <ul className="points-list">
                        {getCurrentPointsOfInterest().map((point, index) => (
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
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label style={{textAlign: 'center', width: '100%'}}>📌 Nome do Ponto de Referência: <span className="tooltip-icon" title="Digite o nome do local ou ponto de interesse">?</span></label>
                      <input
                        type="text"
                        name="name"
                        value={newPointOfInterest.name}
                        onChange={handlePointChange}
                        placeholder="Ex.: Torre de Belém"
                        key={`name-input-point-${editingPointIndex}`}
                        title="Digite o nome do ponto de interesse"
                      />
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição: <span className="tooltip-icon" title="Descreva o que visitou e a sua experiência no local">?</span></label>
                      <textarea
                        name="description"
                        value={newPointOfInterest.description}
                        onChange={handlePointChange}
                        rows="3"
                        placeholder="Ex.: Monumento histórico do século XVI, símbolo de Lisboa..."
                        title="Descreva o ponto de interesse em detalhe"
                        key={`desc-input-point-${editingPointIndex}`}
                      />

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditPointOfInterest(e)}
                          className="button-success"
                          disabled={!newPointOfInterest.name.trim()}
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
                      <label>📷 Fotografias dos Pontos de Referência: <span className="tooltip-icon" title="Adicione fotos dos locais de interesse visitados">?</span></label>
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
                    <h3>🗓️ Itinerário da Viagem <span className="tooltip-icon" title="Organize as atividades de cada dia da sua viagem">?</span></h3>
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
                      <label style={{textAlign: 'center', width: '100%'}}>📅 Dia: <span className="tooltip-icon" title="Selecione qual dia da viagem (1 até duração total)">?</span></label>
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
                        <p className="error-message">{itineraryError}</p>
                      )}
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>🎯 Atividades: <span className="tooltip-icon" title="Liste todas as atividades que planeia fazer neste dia">?</span></label>
                      <div className="activities-input-section">
                        {newItineraryDay.activities.map((activity, index) => (
                          <div key={index} className="activity-input-row">
                            <input
                              type="text"
                              name={`activity-${index}`}
                              value={activity}
                              onChange={(e) => handleItineraryChange(e, index)}
                              placeholder="Ex.: Visita ao museu, Almoço no restaurante X"
                              title="Descreva a atividade que vai fazer neste dia"
                            />
                            {newItineraryDay.activities.length > 1 && (
                              <button
                                onClick={(e) => handleRemoveActivityField(e, index)}
                                className="remove-activity-button"
                                title="Remover esta atividade"
                              >
                                ❌
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="activity-controls">
                        <button
                          onClick={handleAddActivityField}
                          className="button-success"
                          title="Adicionar mais uma atividade a este dia"
                        >
                          ➕ Adicionar Atividade
                        </button>
                      </div>

                      <div className="action-buttons">
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
                    <h3>⚠️ Pontos Negativos <span className="tooltip-icon" title="Registe aspetos negativos da viagem para referência futura">?</span></h3>
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
                      <label style={{textAlign: 'center', width: '100%'}}>⚠️ Nome do Ponto Negativo: <span className="tooltip-icon" title="Digite o aspeto negativo que encontrou na viagem">?</span></label>
                      <input
                        type="text"
                        name="name"
                        value={newNegativePoint.name}
                        onChange={handleNegativeChange}
                        placeholder="Ex.: Trânsito intenso, Preços elevados"
                        key={`name-input-negative-${editingNegativeIndex}`}
                        title="Digite o aspecto negativo da viagem"
                      />
<br></br><br></br>
                      <label style={{textAlign: 'center', width: '100%'}}>📝 Descrição: <span className="tooltip-icon" title="Descreva detalhadamente o problema encontrado">?</span></label>
                      <textarea
                        name="description"
                        value={newNegativePoint.description}
                        onChange={handleNegativeChange}
                        rows="3"
                        placeholder="Ex.: O trânsito da cidade estava muito congestionado durante todo o dia, causando atrasos..."
                        title="Descreva detalhadamente o aspecto negativo"
                        key={`desc-input-negative-${editingNegativeIndex}`}
                      />

                      <div className="action-buttons">
                        <button
                          onClick={(e) => handleAddOrEditNegativePoint(e)}
                          className="button-success"
                          disabled={!newNegativePoint.name.trim()}
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
                  <div className="form-section">
                    <div className="LeftPosition">
                      <h3>
                        👥 Membros do Grupo
                        <span className="tooltip-icon" title="Adicione outros viajantes que participaram nesta viagem. Eles poderão partilhar fotos e experiências.">
                          ?
                        </span>
                      </h3>
                    
                    
                    <div className="group-add-section">
                      <div className="add-member-controls">
                        <input
                          type="email"
                          placeholder="email@exemplo.com"
                          value={newMemberEmail}
                          onChange={(e) => setNewMemberEmail(e.target.value)}
                          className="form-control"
                        />
                        <button
                          type="button"
                          onClick={addGroupMemberByEmail}
                          disabled={!newMemberEmail.trim()}
                          className="button-primary"
                          title="Adicionar membro ao grupo"
                        >
                          ➕ Adicionar
                        </button>
                      </div>
                      
                      <div className="integration-note">
                        💡 <strong>Integração futura:</strong> pesquisa de utilizadores e convites automáticos.
                      </div>
                    </div>
                    </div>

                    {groupMembers.length > 0 ? (
                      <div className="RightPosition">
                        <h4>
                          Membros Adicionados ({groupMembers.length})
                          <span className="tooltip-icon" title="Lista de todos os membros que fazem parte desta viagem em grupo.">
                            ?
                          </span>
                        </h4>
                        <ul className="group-members-list">
                          {groupMembers.map((m) => (
                            <li key={m.id} className="group-member-item">
                              <span className="member-info">
                                👤 {m.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeGroupMember(m.id)}
                                className="remove-member-button"
                                title="Remover membro do grupo"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <p>Nenhum membro adicionado ainda</p>
                        <small>Adicione outros viajantes por email para partilharem esta experiência</small>
                      </div>
                    )}

                    <div className="group-benefits">
                      <h4>
                        ✨ Benefícios das Viagens em Grupo
                        <span className="tooltip-icon" title="Vantagens de viajar acompanhado e partilhar experiências.">
                          ?
                        </span>
                      </h4>
                      <div className="benefits-grid">
                        <div className="benefit-card">
                          <div className="benefit-icon">📸</div>
                          <div className="benefit-text">
                            <strong>Partilha de Fotos</strong>
                            <p>Todos os membros podem contribuir com as suas fotos da viagem</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <div className="benefit-icon">💰</div>
                          <div className="benefit-text">
                            <strong>Divisão de Custos</strong>
                            <p>Partilhem despesas e economizem juntos</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <div className="benefit-icon">🗺️</div>
                          <div className="benefit-text">
                            <strong>Planeamento Colaborativo</strong>
                            <p>Planeiem atividades e itinerários em conjunto</p>
                          </div>
                        </div>
                        <div className="benefit-card">
                          <div className="benefit-icon">🎯</div>
                          <div className="benefit-text">
                            <strong>Experiências Únicas</strong>
                            <p>Criem memórias especiais que durarão para sempre</p>
                          </div>
                        </div>
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
                onClick={activeTab === 'group' ? handleAddTravel : handleNextTab}
                disabled={tabs.indexOf(activeTab) === tabs.length - 1 && activeTab !== 'group'}
                className="nav-button next-button"
                title={activeTab === 'group' ? "Guardar viagem" : "Avançar para próxima aba"}
              >
                {activeTab === 'group' 
                  ? (isEditing ? "💾 Guardar Alterações" : "✅ Adicionar Viagem") 
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
              <div className="empty-icon">✈️</div>
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
                  title="Excluir viagem"
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTravels;