import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { FaStar, FaPlus, FaUser, FaUsers, FaGlobe, FaTimes, FaInfoCircle, FaCamera, FaTrash, FaEdit, FaEye } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext'; 
import { request, setAuthHeader } from '../axios_helper';
import '../styles/pages/future-travels-modal.css';

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

const MyTravels = () => {
  const [travels, setTravels] = useState([]);
  const [newTravel, setNewTravel] = useState({
    name: '',
    user: 'Tiago',
    category: [],
    country: '',
    city: '',
    price: '',
    startDate: '',
    endDate: '',
    BookingTripPaymentDate: '',
    priceDetails: { hotel: '', transport: '', food: '', extras: '' },
    description: '',
    accommodations: [{ name: '', type: '', description: '', nights: '', rating: '', images: [] }],
    pointsOfInterest: [],
    itinerary: [],
    localTransport: [],
    privacy: 'public',
    checklist: [],
    coordinates: null,
    negativePoints: [], 
    foodRecommendations: [], 
    // Campos de imagem
    highlightImage: null,
    images_generalInformation: [],
    images_accommodation: [],
    images_foodRecommendations: [],
    images_localTransport: [],
    images_referencePoints: [],
    travelType: {
      main: '', // 'single' | 'multi'
      isGroup: false
    },
    // Campos para multidestinos
    multiDestinations: [],
    selectedDestinationIndex: 0
  });
  
  const { user } = useAuth(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados do modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isTravelTypeModalOpen, setIsTravelTypeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [travelToAdd, setTravelToAdd] = useState(null);
  const [previewTravel, setPreviewTravel] = useState(null);
  
  // Estados de navegação
  const [activeTab, setActiveTab] = useState('generalInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  
  // Estados para edição de seções
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [newFoodRecommendation, setNewFoodRecommendation] = useState({ name: '', description: '', images: [] });
  const [editingPointIndex, setEditingPointIndex] = useState(null);
  const [newPointOfInterest, setNewPointOfInterest] = useState({ name: '', description: '', link: '', images: [] });
  const [editingNegativeIndex, setEditingNegativeIndex] = useState(null);
  const [newNegativePoint, setNewNegativePoint] = useState({ name: '', description: '' });
  const [editingItineraryDay, setEditingItineraryDay] = useState(null);
  const [newItineraryDay, setNewItineraryDay] = useState({ day: '', activities: [''] });
  const [itineraryError, setItineraryError] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [editingChecklistIndex, setEditingChecklistIndex] = useState(null);
  
  // Estados para multidestino e grupo
  const [multiDestinations, setMultiDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({ country: "", city: "" });
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const [selectedTravelType, setSelectedTravelType] = useState({
    main: '',
    isGroup: false
  });
  
  // Estados para feedback e tooltips
  const [toast, setToast] = useState({ message: '', type: '', show: false });
  const [tooltipModal, setTooltipModal] = useState({ show: false, title: '', content: '', position: { x: 0, y: 0 } });
  
  // Estados para cidades
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Configurações e opções
  const transportOptions = [
    'Carro', 'Comboio', 'Autocarro', 'Avião', 'Bicicleta', 'A Pé', 'Barco', 'Táxi'
  ];

  const categories = [
    'Natureza', 'Cidade', 'Cultural', 'Foodie', 'História',
    'Praia', 'Montanhas', 'City Break', 'Vida Selvagem', 'Luxo', 
    'Orçamento', 'Viagem Solo', 'Família', 'Romântico'
  ];

  // Definir abas dinâmicas baseadas no tipo de viagem (removendo atividades)
  const tabs = [
    { id: "generalInfo", label: "1 - Informações Gerais" },
    { id: "prices", label: "2 - Preços Totais" },
    { id: "accommodation", label: "3 - Estadia" },
    { id: "transport", label: "4 - Transporte" },
    { id: "pointsOfInterest", label: "5 - Pontos de Referência" },
    { id: "foodRecommendations", label: "6 - Recomendações de Comida" },
    { id: "itinerary", label: "7 - Itinerário" },
    { id: "negativePoints", label: "8 - Pontos Negativos" },
    ...(newTravel.travelType?.isGroup ? [{ id: "group", label: "9 - Grupo de Viagem" }] : [])
  ];

  // Lista de cidades por país
  const citiesByCountry = {
    "Portugal": [
      "Lisboa", "Sintra", "Cascais", "Oeiras", "Loures", "Amadora", "Odivelas", "Vila Franca de Xira", "Mafra", "Alcochete", "Barreiro", "Montijo", "Palmela", "Seixal", "Sesimbra", "Setúbal",
      "Porto", "Vila Nova de Gaia", "Matosinhos", "Maia", "Gondomar", "Valongo", "Paredes", "Vila do Conde", "Póvoa de Varzim", "Santo Tirso", "Trofa", "Espinho", "Santa Maria da Feira", "São João da Madeira", "Oliveira de Azeméis",
      "Braga", "Guimarães", "Barcelos", "Fafe", "Vila Nova de Famalicão", "Esposende", "Vizela", "Amares", "Celorico de Basto", "Cabeceiras de Basto", "Terras de Bouro", "Arouca",
      "Coimbra", "Figueira da Foz", "Cantanhede", "Mira", "Montemor-o-Velho", "Oliveira do Hospital", "Tábua", "Arganil", "Lousã", "Penacova", "Condeixa-a-Nova",
      "Aveiro", "Águeda", "Albergaria-a-Velha", "Anadia", "Estarreja", "Ílhavo", "Murtosa", "Oliveira de Azeméis", "Ovar", "Santa Maria da Feira", "São João da Madeira", "Sever do Vouga", "Vagos",
      "Faro", "Albufeira", "Lagoa", "Lagos", "Loulé", "Olhão", "Portimão", "São Brás de Alportel", "Silves", "Tavira", "Vila Real de Santo António"
    ],
    "Brasil": [
      "São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Santos",
      "Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Petrópolis", "Volta Redonda", "Magé",
      "Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga",
      "Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Teixeira de Freitas", "Barreiras", "Alagoinhas"
    ],
    "Espanha": [
      "Madrid", "Alcalá de Henares", "Alcobendas", "Alcorcón", "Fuenlabrada", "Getafe", "Leganés", "Móstoles", "Parla", "Pozuelo de Alarcón",
      "Barcelona", "L'Hospitalet de Llobregat", "Terrassa", "Badalona", "Sabadell", "Lleida", "Tarragona", "Mataró", "Santa Coloma de Gramenet", "Reus",
      "Valência", "Alicante", "Elche", "Castellón de la Plana", "Torrevieja", "Orihuela", "Gandia", "Benidorm", "Alcoy", "Elda",
      "Sevilha", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Écija", "Mairena del Aljarafe", "Algeciras", "Sanlúcar de Barrameda", "Jerez de la Frontera", "Cádiz"
    ],
    "França": [
      "Paris", "Marselha", "Lyon", "Toulouse", "Nice", "Nantes", "Estrasburgo", "Montpellier", "Bordeaux", "Lille"
    ],
    "Itália": [
      "Roma", "Milão", "Nápoles", "Turim", "Palermo", "Génova", "Bolonha", "Florença", "Bari", "Catania"
    ],
    "Estados Unidos": [
      "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"
    ]
  };

  // Função para renderizar estrelas
  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  // Funções para tooltip
  const showTooltip = (e, title, content) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipModal({
      show: true,
      title,
      content,
      position: { x: rect.left + rect.width / 2, y: rect.top }
    });
  };

  const hideTooltip = () => {
    setTooltipModal({ show: false, title: "", content: "", position: { x: 0, y: 0 } });
  };

  // Continue with more functions...
  return (
    <div className="my-travels-page">
      <h1>🧳 Minhas Viagens</h1>
      <p>Gerencie suas viagens realizadas e adicione novas experiências!</p>
      
      {/* Lista de viagens existentes */}
      <div className="travels-grid">
        {travels.length === 0 ? (
          <div className="no-travels">
            <p>🌍 Ainda não há viagens cadastradas!</p>
            <p>Adicione sua primeira viagem clicando no botão abaixo.</p>
          </div>
        ) : (
          travels.map((travel) => (
            <div key={travel.id} className="travel-card">
              <div className="travel-card-image">
                {travel.highlightImage ? (
                  <img src={travel.highlightImage} alt={travel.name} />
                ) : (
                  <div className="placeholder-image">📸</div>
                )}
                <div className="travel-card-overlay">
                  <h3>{travel.name}</h3>
                  <p>⭐ {renderStars(travel.rating)}</p>
                </div>
              </div>
              <div className="travel-card-actions">
                <button onClick={() => handleEdit(travel.id)}>
                  <FaEdit /> Editar
                </button>
                <button onClick={() => handleDelete(travel.id)}>
                  <FaTrash /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botão para adicionar nova viagem */}
      <button className="add-travel-btn" onClick={openModal}>
        <FaPlus /> Adicionar Nova Viagem
      </button>

      {/* Toast para feedback */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  );
};

export default MyTravels;
