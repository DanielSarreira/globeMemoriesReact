import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/components/modal.css";
import "../styles/pages/future-travels.css";
import "../styles/pages/future-travels-modal.css";
// ...existing code...

// Componente de Toast para feedback
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return <div className={`toast ${type}`}>{message}</div>;
};

const FutureTravels = () => {
  const [futureTravels, setFutureTravels] = useState([]);
  const [newTravel, setNewTravel] = useState({
    name: "",
    user: "Tiago",
    category: [],
    price: "",
    startDate: "",
    endDate: "",
    BookingTripPaymentDate: "",
    priceDetails: { hotel: "", transport: "", food: "", extras: "" },
    description: "",
    accommodations: [{ name: "", type: "" }],
    pointsOfInterest: [],
    itinerary: [],
    localTransport: [],
    privacy: "public",
    checklist: [],
    coordinates: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isTravelTypeModalOpen, setIsTravelTypeModalOpen] = useState(false);
  const [travelToAdd, setTravelToAdd] = useState(null);
  const [previewTravel, setPreviewTravel] = useState(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState("generalInfo");
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  const [newPointOfInterest, setNewPointOfInterest] = useState({ name: "", type: "", link: "" });
  const [editingPointIndex, setEditingPointIndex] = useState(null);
  const [newItineraryDay, setNewItineraryDay] = useState({ day: "", activities: [""] });
  const [editingItineraryDay, setEditingItineraryDay] = useState(null);
  const [itineraryError, setItineraryError] = useState("");
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [editingChecklistIndex, setEditingChecklistIndex] = useState(null);
  const [tooltipModal, setTooltipModal] = useState({ show: false, title: "", content: "", position: { x: 0, y: 0 } });
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPreferences, setAiPreferences] = useState({
    categories: [],
    budget: '',
    country: '',
    city: '',
    duration: 7,
    travelStyle: 'balanced'
  });
  const [selectedTravelType, setSelectedTravelType] = useState({
    main: '', // 'single', 'multi'
    isGroup: false
  });
  const [groupMembers, setGroupMembers] = useState([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [sentInvites, setSentInvites] = useState([]);
  const [multiDestinations, setMultiDestinations] = useState([]);
  const [newDestination, setNewDestination] = useState({ country: "", city: "" });
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const transportOptions = [
    "Carro",
    "Comboio",
    "Autocarro",
    "Avião",
    "Bicicleta",
    "A Pé",
    "Barco",
    "Táxi",
  ];

  const categories = [
    "Natureza",
    "Cidade",
    "Cultural",
    "Foodie",
    "História",
    "Praia",
    "Montanhas",
    "City Break",
    "Vida Selvagem",
    "Luxo",
    "Orçamento",
    "Viagem Solo",
    "Família",
    "Romântico",
  ];

  const tabs = [
    { id: "generalInfo", label: "1 - Informações Gerais" },
    { id: "prices", label: "2 - Preços Estimados" },
    { id: "accommodation", label: "3 - Estadia" },
    { id: "transport", label: "4 - Transporte" },
    { id: "pointsOfInterest", label: "5 - Pontos de Referência" },
    { id: "itinerary", label: "6 - Itinerário" },
    { id: "checklist", label: "7 - Checklist de Viagem" },
    ...(newTravel.travelType?.isGroup ? [{ id: "group", label: "8 - Grupo de Viagem" }] : [])
  ];

  // Lista de cidades por país
  const citiesByCountry = {
    "Portugal": [
      // Distrito de Lisboa
      "Lisboa", "Sintra", "Cascais", "Oeiras", "Loures", "Amadora", "Odivelas", "Vila Franca de Xira", "Mafra", "Alcochete", "Barreiro", "Montijo", "Palmela", "Seixal", "Sesimbra", "Setúbal",
      // Distrito do Porto
      "Porto", "Vila Nova de Gaia", "Matosinhos", "Maia", "Gondomar", "Valongo", "Paredes", "Vila do Conde", "Póvoa de Varzim", "Santo Tirso", "Trofa", "Espinho", "Santa Maria da Feira", "São João da Madeira", "Oliveira de Azeméis",
      // Distrito de Braga
      "Braga", "Guimarães", "Barcelos", "Fafe", "Vila Nova de Famalicão", "Esposende", "Vizela", "Amares", "Celorico de Basto", "Cabeceiras de Basto", "Terras de Bouro", "Arouca",
      // Distrito de Coimbra
      "Coimbra", "Figueira da Foz", "Cantanhede", "Mira", "Montemor-o-Velho", "Oliveira do Hospital", "Tábua", "Arganil", "Lousã", "Penacova", "Condeixa-a-Nova",
      // Distrito de Aveiro
      "Aveiro", "Águeda", "Albergaria-a-Velha", "Anadia", "Estarreja", "Ílhavo", "Murtosa", "Oliveira de Azeméis", "Ovar", "Santa Maria da Feira", "São João da Madeira", "Sever do Vouga", "Vagos",
      // Distrito de Faro
      "Faro", "Albufeira", "Lagoa", "Lagos", "Loulé", "Olhão", "Portimão", "São Brás de Alportel", "Silves", "Tavira", "Vila Real de Santo António",
      // Distrito de Leiria
      "Leiria", "Alcobaça", "Batalha", "Caldas da Rainha", "Marinha Grande", "Nazaré", "Óbidos", "Peniche", "Pombal", "Porto de Mós",
      // Distrito de Santarém
      "Santarém", "Abrantes", "Almeirim", "Benavente", "Cartaxo", "Entroncamento", "Ourém", "Rio Maior", "Tomar", "Torres Novas",
      // Distrito de Viseu
      "Viseu", "Castro Daire", "Lamego", "Mangualde", "Nelas", "Oliveira de Frades", "Santa Comba Dão", "São Pedro do Sul", "Tondela", "Vila Nova de Paiva",
      // Distrito de Vila Real
      "Vila Real", "Chaves", "Mondim de Basto", "Murça", "Peso da Régua", "Ribeira de Pena", "Sabrosa", "Santa Marta de Penaguião", "Valpaços", "Vila Pouca de Aguiar",
      // Distrito de Bragança
      "Bragança", "Alfândega da Fé", "Carrazeda de Ansiães", "Freixo de Espada à Cinta", "Macedo de Cavaleiros", "Miranda do Douro", "Mirandela", "Mogadouro", "Torre de Moncorvo", "Vila Flor", "Vimioso", "Vinhais",
      // Distrito de Guarda
      "Guarda", "Aguiar da Beira", "Almeida", "Celorico da Beira", "Figueira de Castelo Rodrigo", "Fornos de Algodres", "Gouveia", "Manteigas", "Mêda", "Pinhel", "Sabugal", "Seia", "Trancoso",
      // Distrito de Castelo Branco
      "Castelo Branco", "Belmonte", "Covilhã", "Fundão", "Idanha-a-Nova", "Oleiros", "Penamacor", "Proença-a-Nova", "Sertã", "Vila de Rei", "Vila Velha de Ródão",
      // Distrito de Portalegre
      "Portalegre", "Alter do Chão", "Arronches", "Avis", "Campo Maior", "Castelo de Vide", "Crato", "Elvas", "Fronteira", "Gavião", "Marvão", "Monforte", "Nisa", "Ponte de Sor", "Sousel",
      // Distrito de Évora
      "Évora", "Alandroal", "Arraiolos", "Borba", "Estremoz", "Montemor-o-Novo", "Mora", "Mourão", "Portel", "Redondo", "Reguengos de Monsaraz", "Vendas Novas", "Viana do Alentejo", "Vila Viçosa",
      // Distrito de Beja
      "Beja", "Aljustrel", "Almodôvar", "Alvito", "Barrancos", "Castro Verde", "Cuba", "Ferreira do Alentejo", "Mértola", "Moura", "Odemira", "Ourique", "Serpa", "Vidigueira",
      // Região Autónoma dos Açores
      "Ponta Delgada", "Angra do Heroísmo", "Horta", "Lagoa", "Lajes do Pico", "Madalena", "Nordeste", "Povoação", "Praia da Vitória", "Ribeira Grande", "Santa Cruz da Graciosa", "Santa Cruz das Flores", "Velas", "Vila do Porto", "Vila Franca do Campo",
      // Região Autónoma da Madeira
      "Funchal", "Câmara de Lobos", "Machico", "Ponta do Sol", "Porto Moniz", "Porto Santo", "Ribeira Brava", "Santa Cruz", "Santana", "São Vicente"
    ],
    "Brasil": [
      // São Paulo
      "São Paulo", "Guarulhos", "Campinas", "São Bernardo do Campo", "Santo André", "Osasco", "São José dos Campos", "Ribeirão Preto", "Sorocaba", "Santos", "São José do Rio Preto", "Mauá", "São Caetano do Sul", "Diadema", "Jundiaí", "Piracicaba", "Carapicuíba", "Bauru", "Itaquaquecetuba", "São Vicente",
      // Rio de Janeiro
      "Rio de Janeiro", "São Gonçalo", "Duque de Caxias", "Nova Iguaçu", "Niterói", "Belford Roxo", "São João de Meriti", "Petrópolis", "Volta Redonda", "Magé", "Itaboraí", "Nova Friburgo", "Barra Mansa", "Teresópolis", "Mesquita", "Nilópolis", "Maricá", "Itaguaí", "Cabo Frio", "Angra dos Reis",
      // Minas Gerais
      "Belo Horizonte", "Uberlândia", "Contagem", "Juiz de Fora", "Betim", "Montes Claros", "Ribeirão das Neves", "Uberaba", "Governador Valadares", "Ipatinga", "Santa Luzia", "Sete Lagoas", "Divinópolis", "Ibirité", "Poços de Caldas", "Pouso Alegre", "Patos de Minas", "Barbacena", "Sabará", "Itabira",
      // Bahia
      "Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari", "Itabuna", "Juazeiro", "Lauro de Freitas", "Teixeira de Freitas", "Barreiras", "Alagoinhas", "Porto Seguro", "Simões Filho", "Paulo Afonso", "Eunápolis", "Santo Antônio de Jesus", "Ilhéus", "Itapetinga", "Jequié", "Lucas do Rio Verde", "Macaé",
      // Paraná
      "Curitiba", "Londrina", "Maringá", "Ponta Grossa", "Cascavel", "São José dos Pinhais", "Foz do Iguaçu", "Colombo", "Guarapuava", "Paranaguá", "Arapongas", "Apucarana", "Pinhais", "Campo Largo", "Araucária", "Cambé", "Piraquara", "Almirante Tamandaré", "Umuarama", "Toledo",
      // Rio Grande do Sul
      "Porto Alegre", "Caxias do Sul", "Pelotas", "Canoas", "Santa Maria", "Gravataí", "Viamão", "Novo Hamburgo", "São Leopoldo", "Rio Grande", "Alvorada", "Passo Fundo", "Uruguaiana", "Bagé", "Sapucaia do Sul", "Guaíba", "Cachoeirinha", "Santa Cruz do Sul", "Erechim", "Gravataí",
      // Pernambuco
      "Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina", "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Garanhuns", "Vitória de Santo Antão", "São Lourenço da Mata", "Igarassu", "Abreu e Lima", "Santa Cruz do Capibaribe", "Carpina", "Gravatá", "Goiana", "Arcoverde", "Belo Jardim", "Serra Talhada",
      // Ceará
      "Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú", "Sobral", "Crato", "Itapipoca", "Maranguape", "Iguatu", "Quixadá", "Pacatuba", "Quixeramobim", "Crateús", "Acaraú", "Canindé", "Aracati", "Cascavel", "Horizonte", "Icó", "Limoeiro do Norte",
      // Pará
      "Belém", "Ananindeua", "Santarém", "Marabá", "Castanhal", "Abaetetuba", "Cametá", "Marituba", "Bragança", "Parauapebas", "Altamira", "Tucuruí", "Paragominas", "Itaituba", "Tailândia", "Barcarena", "Breves", "Capanema", "Moju", "Oriximiná",
      // Santa Catarina
      "Florianópolis", "Joinville", "Blumenau", "São José", "Criciúma", "Itajaí", "Lages", "Jaraguá do Sul", "Palhoça", "Balneário Camboriú", "Brusque", "Tubarão", "São Bento do Sul", "Biguaçu", "Camboriú", "Navegantes", "São Francisco do Sul", "Araranguá", "Caçador", "Concórdia"
    ],
    "United States": [
      // New York
      "New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica",
      // California
      "Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Long Beach", "Sacramento", "Oakland", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Chula Vista", "Irvine", "Fremont", "San Bernardino", "Modesto", "Oxnard", "Fontana", "Moreno Valley",
      // Texas
      "Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Laredo", "Lubbock", "Garland", "Irving", "Amarillo", "Grand Prairie", "Brownsville", "Pasadena", "McKinney", "Mesquite", "McAllen",
      // Florida
      "Miami", "Orlando", "Jacksonville", "Tampa", "St. Petersburg", "Hialeah", "Tallahassee", "Fort Lauderdale", "Port St. Lucie", "Cape Coral", "Gainesville", "Miramar", "Hollywood", "Pembroke Pines", "Coral Springs", "Clearwater", "Palm Bay", "West Palm Beach", "Pompano Beach", "Lakeland",
      // Illinois
      "Chicago", "Aurora", "Rockford", "Joliet", "Naperville", "Springfield", "Peoria", "Elgin", "Waukegan", "Champaign", "Bloomington", "Decatur", "Arlington Heights", "Evanston", "Schaumburg", "Bolingbrook", "Palatine", "Skokie", "Des Plaines", "Orland Park",
      // Pennsylvania
      "Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona", "York", "State College", "Wilkes-Barre", "Chester", "Williamsport", "Lebanon", "Hazleton", "New Castle", "Johnstown", "Butler",
      // Ohio
      "Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls", "Middletown", "Newark", "Mansfield", "Mentor", "Beavercreek",
      // Georgia
      "Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "Roswell", "Albany", "Johns Creek", "Warner Robins", "Alpharetta", "Marietta", "Valdosta", "Smyrna", "Dunwoody", "Rome", "Gainesville", "Hinesville", "Kennesaw",
      // North Carolina
      "Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Greenville", "Asheville", "Concord", "Gastonia", "Jacksonville", "Chapel Hill", "Rocky Mount", "Burlington", "Huntersville", "Wilson", "Kannapolis",
      // Michigan
      "Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Lansing", "Ann Arbor", "Flint", "Dearborn", "Livonia", "Westland", "Troy", "Farmington Hills", "Kalamazoo", "Wyoming", "Rochester Hills", "Southfield", "Traverse City", "Pontiac", "Dearborn Heights", "Portage"
    ],
    "Espanha": [
      // Madrid
      "Madrid", "Alcalá de Henares", "Alcobendas", "Alcorcón", "Fuenlabrada", "Getafe", "Leganés", "Móstoles", "Parla", "Pozuelo de Alarcón", "Rivas-Vaciamadrid", "San Sebastián de los Reyes", "Torrejón de Ardoz", "Las Rozas de Madrid", "Majadahonda", "Collado Villalba", "Aranjuez", "Arganda del Rey", "Boadilla del Monte", "Colmenar Viejo",
      // Barcelona
      "Barcelona", "L'Hospitalet de Llobregat", "Terrassa", "Badalona", "Sabadell", "Lleida", "Tarragona", "Mataró", "Santa Coloma de Gramenet", "Reus", "Girona", "Sant Cugat del Vallès", "Cornellà de Llobregat", "Sant Boi de Llobregat", "Rubí", "Manresa", "Vilanova i la Geltrú", "Castelldefels", "El Prat de Llobregat", "Granollers",
      // Valência
      "Valência", "Alicante", "Elche", "Castellón de la Plana", "Torrevieja", "Orihuela", "Gandia", "Benidorm", "Alcoy", "Elda", "San Vicente del Raspeig", "Villena", "Torrent", "Sagunto", "Alzira", "Paterna", "Mislata", "Burjassot", "Ontinyent", "Xàtiva",
      // Sevilha
      "Sevilha", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Écija", "Mairena del Aljarafe", "Algeciras", "Sanlúcar de Barrameda", "Jerez de la Frontera", "Cádiz", "Huelva", "Marbella", "Málaga", "Córdoba", "Jaén", "Granada", "Almería", "Roquetas de Mar", "El Ejido", "Vélez-Málaga",
      // Zaragoza
      "Zaragoza", "Huesca", "Teruel", "Calatayud", "Ejea de los Caballeros", "Barbastro", "Monzón", "Alcañiz", "Fraga", "Tarazona", "Caspe", "Jaca", "Binéfar", "Sariñena", "La Almunia de Doña Godina", "Utebo", "Cuarte de Huerva", "Zuera", "Ejea de los Caballeros", "Alagón",
      // Málaga
      "Málaga", "Marbella", "Vélez-Málaga", "Mijas", "Fuengirola", "Torremolinos", "Benalmádena", "Estepona", "Antequera", "Rincón de la Victoria", "Ronda", "Alhaurín de la Torre", "Alhaurín el Grande", "Nerja", "Álora", "Coín", "Cártama", "Almogía", "Campillos", "Archidona",
      // Múrcia
      "Múrcia", "Cartagena", "Lorca", "Molina de Segura", "Alcantarilla", "Cieza", "Yecla", "San Javier", "Águilas", "Totana", "Mazarrón", "Caravaca de la Cruz", "Jumilla", "Torre-Pacheco", "San Pedro del Pinatar", "Los Alcázares", "Santomera", "Las Torres de Cotillas", "Alhama de Murcia", "Bullas",
      // Palma
      "Palma", "Calvià", "Manacor", "Llucmajor", "Marratxí", "Inca", "Alcúdia", "Felanitx", "Pollença", "Sóller", "Sa Pobla", "Santanyí", "Capdepera", "Andratx", "Binissalem", "Alaró", "Consell", "Santa Margalida", "Porreres", "Campos",
      // Las Palmas
      "Las Palmas de Gran Canaria", "Telde", "Santa Lucía de Tirajana", "San Bartolomé de Tirajana", "Arucas", "Ingenio", "Agüimes", "Gáldar", "Mogán", "Santa Brígida", "Teror", "Valsequillo", "Firgas", "Agaete", "Valleseco", "Tejeda", "Vega de San Mateo", "San Nicolás de Tolentino", "Moya", "Artenara",
      // Bilbao
      "Bilbao", "Barakaldo", "Getxo", "Portugalete", "Santurtzi", "Basauri", "Leioa", "Galdakao", "Sestao", "Durango", "Erandio", "Ermua", "Gernika-Lumo", "Mungia", "Amorebieta-Etxano", "Lekeitio", "Ondarroa", "Markina-Xemein", "Bermeo", "Elorrio"
    ],
    "França": [
      // Paris
      "Paris", "Boulogne-Billancourt", "Saint-Denis", "Argenteuil", "Montreuil", "Nanterre", "Vitry-sur-Seine", "Créteil", "Aubervilliers", "Asnières-sur-Seine", "Colombes", "Courbevoie", "Versailles", "Aulnay-sous-Bois", "Rueil-Malmaison", "Champigny-sur-Marne", "Saint-Maur-des-Fossés", "Drancy", "Issy-les-Moulineaux", "Noisy-le-Grand",
      // Marselha
      "Marselha", "Aix-en-Provence", "Toulon", "Avignon", "La Seyne-sur-Mer", "Hyères", "Arles", "Fréjus", "Martigues", "Aubagne", "Istres", "Gap", "Draguignan", "Carpentras", "Salon-de-Provence", "Vitrolles", "Marignane", "La Ciotat", "Miramas", "Pertuis",
      // Lyon
      "Lyon", "Villeurbanne", "Vénissieux", "Saint-Étienne", "Vaulx-en-Velin", "Caluire-et-Cuire", "Bron", "Saint-Priest", "Oullins", "Rillieux-la-Pape", "Décines-Charpieu", "Givors", "Écully", "Tassin-la-Demi-Lune", "Saint-Genis-Laval", "Meyzieu", "Saint-Chamond", "Roanne", "Bourg-en-Bresse", "Vienne",
      // Toulouse
      "Toulouse", "Montpellier", "Narbonne", "Perpignan", "Béziers", "Nîmes", "Alès", "Sète", "Carcassonne", "Castres", "Albi", "Rodez", "Millau", "Mende", "Foix", "Pamiers", "Lourdes", "Tarbes", "Auch", "Cahors",
      // Nice
      "Nice", "Cannes", "Antibes", "Grasse", "Cagnes-sur-Mer", "Le Cannet", "Mandelieu-la-Napoule", "Vallauris", "Saint-Laurent-du-Var", "Carros", "Menton", "Beausoleil", "Vence", "Saint-Jeannet", "La Trinité", "Falicon", "Tourrette-Levens", "Aspremont", "Contes", "L'Escarène",
      // Nantes
      "Nantes", "Saint-Nazaire", "Saint-Herblain", "Rezé", "Orvault", "Vertou", "Couëron", "Carquefou", "Bouguenais", "Châteaubriant", "Ancenis", "Clisson", "Pornic", "Challans", "Les Sables-d'Olonne", "La Roche-sur-Yon", "Fontenay-le-Comte", "Luçon", "Les Herbiers", "Montaigu",
      // Estrasburgo
      "Estrasburgo", "Mulhouse", "Colmar", "Haguenau", "Schiltigheim", "Sélestat", "Bischwiller", "Saverne", "Obernai", "Wissembourg", "Sainte-Marie-aux-Mines", "Guebwiller", "Ribeauvillé", "Thann", "Masevaux", "Altkirch", "Soultz-Haut-Rhin", "Rixheim", "Cernay", "Ensisheim",
      // Montpellier
      "Montpellier", "Béziers", "Sète", "Narbonne", "Perpignan", "Nîmes", "Alès", "Lunel", "Agde", "Frontignan", "Bagnols-sur-Cèze", "Beaucaire", "Carcassonne", "Castelnau-le-Lez", "Lattes", "Mauguio", "Mèze", "Palavas-les-Flots", "Pézenas", "Villeneuve-lès-Maguelone",
      // Bordeaux
      "Bordeaux", "Pessac", "Mérignac", "Talence", "Villenave-d'Ornon", "Saint-Médard-en-Jalles", "Bègles", "Pau", "Bayonne", "Biarritz", "Anglet", "Hendaye", "Saint-Jean-de-Luz", "Dax", "Mont-de-Marsan", "Libourne", "Périgueux", "Agen", "Bergerac", "Arcachon",
      // Lille
      "Lille", "Roubaix", "Tourcoing", "Dunkerque", "Villeneuve-d'Ascq", "Dunkerque", "Calais", "Boulogne-sur-Mer", "Arras", "Lens", "Liévin", "Hénin-Beaumont", "Dunkerque", "Dunkerque", "Dunkerque", "Dunkerque", "Dunkerque", "Dunkerque", "Dunkerque", "Dunkerque"
    ],
    "Itália": [
      // Roma
      "Roma", "Guidonia Montecelio", "Aprilia", "Civitavecchia", "Velletri", "Pomezia", "Tivoli", "Ardea", "Anzio", "Nettuno", "Albano Laziale", "Marino", "Ladispoli", "Cerveteri", "Fiumicino", "Ostia", "Frascati", "Monterotondo", "Formia", "Terracina",
      // Milão
      "Milão", "Brescia", "Monza", "Bergamo", "Varese", "Como", "Busto Arsizio", "Sesto San Giovanni", "Cinisello Balsamo", "Legnano", "Rho", "Cologno Monzese", "Paderno Dugnano", "Rozzano", "San Giuliano Milanese", "Desio", "Seregno", "Lissone", "Cesano Maderno", "Brugherio",
      // Nápoles
      "Nápoles", "Giugliano in Campania", "Torre del Greco", "Casoria", "Pozzuoli", "Caserta", "Castellammare di Stabia", "Afragola", "Benevento", "Aversa", "Portici", "Ercolano", "Avellino", "Salerno", "Battipaglia", "Cava de' Tirreni", "Nocera Inferiore", "Pagani", "Sarno", "Angri",
      // Turim
      "Turim", "Novara", "Alessandria", "Asti", "Cuneo", "Alba", "Pinerolo", "Settimo Torinese", "Rivoli", "Collegno", "Grugliasco", "Chieri", "Nichelino", "Moncalieri", "Venaria Reale", "Savigliano", "Bra", "Fossano", "Saluzzo", "Alpignano",
      // Palermo
      "Palermo", "Catania", "Messina", "Ragusa", "Siracusa", "Gela", "Agrigento", "Trapani", "Caltanissetta", "Enna", "Marsala", "Bagheria", "Mazara del Vallo", "Termini Imerese", "Sciacca", "Licata", "Canicattì", "Modica", "Vittoria", "Comiso",
      // Génova
      "Génova", "La Spezia", "Savona", "Sanremo", "Imperia", "Ventimiglia", "Rapallo", "Chiavari", "Sestri Levante", "Alassio", "Finale Ligure", "Varazze", "Cogoleto", "Arenzano", "Recco", "Santa Margherita Ligure", "Camogli", "Lavagna", "Sarzana", "Bordighera",
      // Bolonha
      "Bolonha", "Parma", "Modena", "Reggio Emilia", "Ravenna", "Rimini", "Ferrara", "Forlì", "Piacenza", "Cesena", "Imola", "Faenza", "Carpi", "Sassuolo", "Casalecchio di Reno", "San Lazzaro di Savena", "Cervia", "Riccione", "Cattolica", "Bellaria-Igea Marina",
      // Florença
      "Florença", "Prato", "Livorno", "Pisa", "Arezzo", "Siena", "Lucca", "Carrara", "Viareggio", "Grosseto", "Massa", "Pistoia", "Empoli", "Sesto Fiorentino", "Campi Bisenzio", "Fucecchio", "San Giovanni Valdarno", "Figline Valdarno", "Montevarchi", "Certaldo",
      // Bari
      "Bari", "Taranto", "Foggia", "Lecce", "Brindisi", "Andria", "Barletta", "Trani", "Monopoli", "Altamura", "Bitonto", "Bisceglie", "Molfetta", "Terlizzi", "Ruvo di Puglia", "Gravina in Puglia", "Putignano", "Conversano", "Martina Franca", "Nardò",
      // Catania
      "Catania", "Siracusa", "Ragusa", "Gela", "Caltagirone", "Acireale", "Paternò", "Misterbianco", "Caltanissetta", "Enna", "Aci Catena", "Aci Sant'Antonio", "Belpasso", "Adrano", "Biancavilla", "Randazzo", "Lentini", "Scordia", "Palagonia", "Gravina di Catania"
    ]
  };

  // Funções para gerenciar múltiplos destinos
  const addDestination = () => {
    if (!newDestination.country || !newDestination.city.trim()) {
      setToast({ 
        message: "Por favor, selecione um país e uma cidade!", 
        type: "error", 
        show: true 
      });
      return;
    }

    // Verificar se o destino já existe
    const destinationExists = multiDestinations.some(dest => 
      dest.country === newDestination.country && dest.city === newDestination.city
    );

    if (destinationExists) {
      setToast({ 
        message: "Este destino já foi adicionado!", 
        type: "error", 
        show: true 
      });
      return;
    }

    const destination = {
      id: Date.now(),
      country: newDestination.country,
      city: newDestination.city,
      accommodations: [{ name: "", type: "" }],
      pointsOfInterest: [],
      localTransport: [],
      coordinates: null,
      priceDetails: { hotel: "", transport: "", food: "", extras: "" },
      price: ""
    };

    setMultiDestinations(prev => [...prev, destination]);
    setNewDestination({ country: "", city: "" });
    setToast({ 
      message: `Destino ${newDestination.city}, ${newDestination.country} adicionado!`, 
      type: "success", 
      show: true 
    });
  };

  const removeDestination = (destinationId) => {
    setMultiDestinations(prev => prev.filter(dest => dest.id !== destinationId));
    // Se removeu o destino selecionado, selecionar o primeiro
    if (selectedDestinationIndex >= multiDestinations.length - 1) {
      setSelectedDestinationIndex(0);
    }
    setToast({ 
      message: "Destino removido!", 
      type: "success", 
      show: true 
    });
  };

  // Função para calcular o preço total de uma viagem de destino único
  const calculateSingleDestinationTotal = () => {
    const hotel = parseFloat(newTravel.priceDetails.hotel || 0);
    const food = parseFloat(newTravel.priceDetails.food || 0);
    const transport = parseFloat(newTravel.priceDetails.transport || 0);
    const extras = parseFloat(newTravel.priceDetails.extras || 0);
    
    return hotel + food + transport + extras;
  };

  // Função para atualizar preços de viagem única com cálculo automático do total
  const updateSingleDestinationPrices = (field, value) => {
    const updatedPrices = { ...newTravel.priceDetails, [field]: value };
    const hotel = parseFloat(updatedPrices.hotel || 0);
    const food = parseFloat(updatedPrices.food || 0);
    const transport = parseFloat(updatedPrices.transport || 0);
    const extras = parseFloat(updatedPrices.extras || 0);
    const total = hotel + food + transport + extras;
    
    setNewTravel(prev => ({
      ...prev,
      priceDetails: updatedPrices,
      price: total > 0 ? total.toString() : ""
    }));
  };

  // Função para calcular o preço total de um destino
  const calculateDestinationTotal = (destIndex) => {
    if (destIndex === "" || !multiDestinations[destIndex]) return 0;
    
    const destPrices = multiDestinations[destIndex]?.priceDetails || {};
    const hotel = parseFloat(destPrices.hotel || 0);
    const food = parseFloat(destPrices.food || 0);
    const transport = parseFloat(destPrices.transport || 0);
    const extras = parseFloat(destPrices.extras || 0);
    
    return hotel + food + transport + extras;
  };

  // Função para atualizar preços de destino com cálculo automático do total
  const updateDestinationPrices = (destinationId, field, value) => {
    setMultiDestinations(prev => prev.map(dest => {
      if (dest.id === destinationId) {
        const updatedPrices = { ...dest.priceDetails, [field]: value };
        const hotel = parseFloat(updatedPrices.hotel || 0);
        const food = parseFloat(updatedPrices.food || 0);
        const transport = parseFloat(updatedPrices.transport || 0);
        const extras = parseFloat(updatedPrices.extras || 0);
        const total = hotel + food + transport + extras;
        
        return {
          ...dest,
          priceDetails: updatedPrices,
          price: total > 0 ? total.toString() : ""
        };
      }
      return dest;
    }));
  };

  const updateDestinationData = (destinationId, field, value) => {
    setMultiDestinations(prev => prev.map(dest => 
      dest.id === destinationId 
        ? { ...dest, [field]: value }
        : dest
    ));
  };

  const handleDestinationChange = (e) => {
    const { name, value } = e.target;
    setNewDestination(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'country' ? { city: '' } : {})
    }));

    if (name === 'country') {
      fetchCities(value);
    }
  };

  // Funções para gerenciar grupo de viagem
  const searchUsers = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setAvailableUsers([]);
      return;
    }

    setIsLoadingUsers(true);
    try {
      // Simular busca de utilizadores na app
      // Em uma implementação real, isso seria uma chamada para a API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Lista fictícia de utilizadores para demonstração
      const mockUsers = [
        { id: 1, name: "Ana Silva", email: "ana.silva@email.com", avatar: "/images/avatar1.jpg" },
        { id: 2, name: "João Santos", email: "joao.santos@email.com", avatar: "/images/avatar2.jpg" },
        { id: 3, name: "Maria Costa", email: "maria.costa@email.com", avatar: "/images/avatar3.jpg" },
        { id: 4, name: "Pedro Oliveira", email: "pedro.oliveira@email.com", avatar: "/images/avatar4.jpg" },
        { id: 5, name: "Sofia Rodrigues", email: "sofia.rodrigues@email.com", avatar: "/images/avatar5.jpg" }
      ];

      // Filtrar utilizadores baseado no termo de busca
      const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error("Erro ao buscar utilizadores:", error);
      setToast({ 
        message: "Erro ao buscar utilizadores. Tente novamente.", 
        type: "error", 
        show: true 
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const addMemberToGroup = (user) => {
    // Verificar se o utilizador já está no grupo
    if (groupMembers.find(member => member.id === user.id)) {
      setToast({ 
        message: "Este utilizador já está no grupo!", 
        type: "error", 
        show: true 
      });
      return;
    }

    // Adicionar membro ao grupo com status pendente
    const newMember = {
      ...user,
      status: 'pending', // pending, accepted, rejected
      invitedAt: new Date().toISOString(),
      role: 'member' // member, admin
    };

    setGroupMembers(prev => [...prev, newMember]);
    setNewMemberEmail("");
    setAvailableUsers([]);
    
    setToast({ 
      message: `Convite enviado para ${user.name}!`, 
      type: "success", 
      show: true 
    });
  };

  const removeMemberFromGroup = (memberId) => {
    setGroupMembers(prev => prev.filter(member => member.id !== memberId));
    setToast({ 
      message: "Membro removido do grupo!", 
      type: "success", 
      show: true 
    });
  };

  const sendGroupInvites = async () => {
    if (groupMembers.length === 0) {
      setToast({ 
        message: "Adicione pelo menos um membro ao grupo antes de enviar convites!", 
        type: "error", 
        show: true 
      });
      return;
    }

    try {
      // Simular envio de convites
      // Em uma implementação real, isso seria uma chamada para a API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Marcar todos os convites como enviados
      const invites = groupMembers.map(member => ({
        ...member,
        status: 'sent',
        sentAt: new Date().toISOString()
      }));

      setSentInvites(invites);
      
      setToast({ 
        message: `${groupMembers.length} convites enviados com sucesso!`, 
        type: "success", 
        show: true 
      });
    } catch (error) {
      console.error("Erro ao enviar convites:", error);
      setToast({ 
        message: "Erro ao enviar convites. Tente novamente.", 
        type: "error", 
        show: true 
      });
    }
  };

  const handleMemberEmailChange = (e) => {
    const value = e.target.value;
    setNewMemberEmail(value);
    
    // Buscar utilizadores conforme o utilizador digita
    if (value.length >= 2) {
      searchUsers(value);
    } else {
      setAvailableUsers([]);
    }
  };

  // Função para obter coordenadas usando Nominatim
  const getCoordinates = async (country, city) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&format=json&limit=1&accept-language=pt-PT`
      );
      const data = await response.json();
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (error) {
      console.error(`Erro ao obter coordenadas para ${city}, ${country}:`, error);
    }
    return null;
  };

  // Funções para o modal de tooltip
  const showTooltip = (e, title, content) => {
    const rect = e.target.getBoundingClientRect();
    setTooltipModal({
      show: true,
      title,
      content,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  };

  const hideTooltip = () => {
    setTooltipModal({ show: false, title: "", content: "", position: { x: 0, y: 0 } });
  };

  useEffect(() => {
    // Safely load and sanitize futureTravels from localStorage
    let savedFutureTravels = [];
    try {
      const rawData = localStorage.getItem("futureTravels");
      if (rawData) {
        savedFutureTravels = JSON.parse(rawData);
        // Ensure every travel has a category array
        savedFutureTravels = savedFutureTravels.map((travel) => ({
          ...travel,
          category: Array.isArray(travel.category) ? travel.category : [],
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar futureTravels do localStorage:", error);
      setToast({ message: "Erro ao carregar viagens salvas!", type: "error", show: true });
    }
    setFutureTravels(savedFutureTravels);
  }, []);

  // Abrir modal automaticamente ao redirecionar com estado
  useEffect(() => {
    if (location.state?.openModal && !isModalOpen) {
      if (location.state.editCity && location.state.editCountry && location.state.editName) {
        const travelToEdit = futureTravels.find(t => 
          t.city === location.state.editCity && 
          t.country === location.state.editCountry &&
          t.name === location.state.editName
        );
        
        if (travelToEdit) {
          // Se encontrar a viagem, abrir em modo de edição
          setNewTravel({
            ...travelToEdit,
            category: Array.isArray(travelToEdit.category) ? travelToEdit.category : [],
            priceDetails: travelToEdit.priceDetails || { hotel: "", transport: "", food: "", extras: "" },
            accommodations: Array.isArray(travelToEdit.accommodations) && travelToEdit.accommodations.length > 0
              ? travelToEdit.accommodations
              : [{ name: "", type: "" }],
            pointsOfInterest: Array.isArray(travelToEdit.pointsOfInterest) ? travelToEdit.pointsOfInterest : [],
            itinerary: Array.isArray(travelToEdit.itinerary) ? travelToEdit.itinerary : [],
            localTransport: Array.isArray(travelToEdit.localTransport) ? travelToEdit.localTransport : [],
            checklist: Array.isArray(travelToEdit.checklist) ? travelToEdit.checklist : [],
            privacy: travelToEdit.privacy || "public",
            coordinates: travelToEdit.coordinates || null,
          });
          setEditTravelId(travelToEdit.id);
          setIsEditing(true);
          setIsModalOpen(true);
          setActiveTab("generalInfo");
        } else {
          // Se não encontrar a viagem, criar uma nova com os dados do mapa
          const today = new Date();
          
          // Define a data de início como amanhã
          const tomorrow = new Date();
          tomorrow.setDate(today.getDate() + 1);
          
          // Define a data de fim como 6 dias após a data de início
          const nextWeek = new Date(tomorrow);
          nextWeek.setDate(tomorrow.getDate() + 6);

          // Formata as datas para o formato YYYY-MM-DD
          const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          };

          const newTravelFromMap = {
            name: location.state.editName,
            user: "Tiago",
            category: [],
            country: location.state.editCountry,
            city: location.state.editCity,
            price: "",
            startDate: formatDate(tomorrow),
            endDate: formatDate(nextWeek),
            BookingTripPaymentDate: "",
            priceDetails: { hotel: "", transport: "", food: "", extras: "" },
            description: "",
            accommodations: [{ name: "", type: "" }],
            pointsOfInterest: [],
            itinerary: [],
            localTransport: [],
            privacy: "public",
            checklist: [],
            coordinates: null,
          };
          setNewTravel(newTravelFromMap);
          setIsModalOpen(true);
          setIsEditing(true);
          setEditTravelId(Date.now());
          setActiveTab("generalInfo");
        }
        // Limpar o estado após abrir o modal
        window.history.replaceState({}, document.title, location.pathname);
      }
    }
  }, [location.state]);

  const validateForm = () => {
    if (!newTravel.name.trim()) {
      setToast({ 
        message: "Por favor, preencha todos os campos marcados com *!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    if (newTravel.travelType?.main !== 'multi' && !newTravel.country) {
      setToast({ 
        message: "Por favor, preencha todos os campos marcados com *!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    if (newTravel.travelType?.main !== 'multi' && !newTravel.city.trim()) {
      setToast({ 
        message: "Por favor, preencha todos os campos marcados com *!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ 
        message: "Por favor, preencha todos os campos marcados com *!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(newTravel.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(newTravel.endDate);
    endDate.setHours(0, 0, 0, 0);

    // Verifica se a data de início é pelo menos um dia após hoje
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (startDate <= today) {
      setToast({ 
        message: "A data de início deve ser pelo menos um dia após a data atual!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    if (endDate < startDate) {
      setToast({ 
        message: "A data de fim deve ser posterior à data de início da viagem!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    return true;
  };

  // Função para determinar o status da viagem
  const getTripStatus = (startDate, endDate) => {
    if (!startDate || !endDate) return { status: "unknown", label: "Datas não definidas", color: "#6c757d" };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    if (today >= start && today <= end) {
      return { status: "ongoing", label: "Viagem a decorrer", color: "#ff9900" };
    } else if (today < start) {
      return { status: "future", label: "Viagem Futura", color: "#28a745" };
    } else {
      return { status: "completed", label: "Viagem Terminada / Data Expirada", color: "#DC3545" };
    }
  };

  // Função para abrir modal de preferências de IA
  const planTripWithAI = () => {
    setIsAIModalOpen(true);
    setAiPreferences({
      categories: [],
      budget: '',
      country: '',
      city: '',
      duration: 7,
      travelStyle: 'balanced'
    });
  };

  // Função para lidar com mudanças nas preferências de IA
  const handleAIPreferenceChange = (e) => {
    const { name, value } = e.target;
    setAiPreferences(prev => ({
      ...prev,
      [name]: value
    }));

    // Atualizar cidades quando o país muda
    if (name === 'country') {
      fetchCitiesForAI(value);
      setAiPreferences(prev => ({ ...prev, city: '' }));
    }
  };

  // Função para lidar com seleção de categorias na IA
  const handleAICategoryToggle = (category) => {
    setAiPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  // Função para buscar cidades para IA
  const fetchCitiesForAI = async (country) => {
    if (!country) {
      setCities([]);
      return;
    }

    setIsLoadingCities(true);
    try {
      const cityList = citiesByCountry[country] || [];
      const sortedCities = cityList.sort((a, b) => a.localeCompare(b, 'pt-PT'));
      setCities(sortedCities);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      setToast({ 
        message: "Erro ao carregar lista de cidades. Por favor, tente novamente.", 
        type: "error", 
        show: true 
      });
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Função principal para gerar viagem com IA
  const generateAITrip = async () => {
    setIsLoadingAI(true);
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { country, city, categories, budget, duration, travelStyle } = aiPreferences;
      
      // Se não há país selecionado, escolher um aleatório
      const selectedCountry = country || getRandomCountry();
      const selectedCity = city || getRandomCity(selectedCountry);
      const selectedCategories = categories.length > 0 ? categories : getRandomCategories();
      const selectedBudget = budget || 'medio';
      const selectedDuration = duration || Math.floor(Math.random() * 7) + 3; // 3-10 dias
      
      // Gerar datas automáticas
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() + 30); // Começar em 30 dias
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + selectedDuration);

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Gerar pontos de interesse baseados no destino e categorias
      const pointsOfInterest = generatePointsOfInterest(selectedCity, selectedCountry, selectedCategories);
      
      // Gerar acomodações
      const accommodations = generateAccommodations(selectedCity, selectedCountry, selectedBudget, travelStyle);
      
      // Gerar itinerário
      const itinerary = generateItinerary(selectedDuration, pointsOfInterest, selectedCategories);
      
      // Gerar transporte local
      const localTransport = generateLocalTransport(selectedCity, selectedCountry, travelStyle);
      
      // Gerar checklist
      const checklist = generateTravelChecklist(selectedCountry, selectedCategories, selectedDuration);
      
      // Calcular preço estimado
      const estimatedPrice = calculateEstimatedPrice(selectedBudget, selectedDuration, selectedCountry);
      
      // Gerar descrição
      const description = generateTripDescription(selectedCity, selectedCountry, selectedCategories, selectedDuration);

      // Obter coordenadas
      const coordinates = await getCoordinates(selectedCountry, selectedCity);

      const generatedTrip = {
        id: Date.now(),
        name: `Viagem a ${selectedCity} - Planeada pela Globe Memories`,
        user: "Tiago",
        category: selectedCategories,
        country: selectedCountry,
        city: selectedCity,
        price: estimatedPrice.toString(),
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        BookingTripPaymentDate: "",
        priceDetails: {
          hotel: Math.round(estimatedPrice * 0.4).toString(),
          transport: Math.round(estimatedPrice * 0.3).toString(),
          food: Math.round(estimatedPrice * 0.2).toString(),
          extras: Math.round(estimatedPrice * 0.1).toString()
        },
        description,
        accommodations,
        pointsOfInterest,
        itinerary,
        localTransport,
        privacy: "public",
        checklist,
        coordinates,
        aiGenerated: true
      };
      
      // Definir a viagem gerada para preview
      setPreviewTravel(generatedTrip);
      setIsAIModalOpen(false);
      setIsPreviewModalOpen(true);
      
      setToast({ 
        message: "Viagem gerada com sucesso pela IA!", 
        type: "success", 
        show: true 
      });
    } catch (error) {
      console.error("Erro ao gerar viagem com IA:", error);
      setToast({ 
        message: "Erro ao gerar viagem. Tente novamente.", 
        type: "error", 
        show: true 
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Funções auxiliares para seleção aleatória
  const getRandomCountry = () => {
    const countries = ["Portugal", "Espanha", "França", "Itália", "Brasil", "United States"];
    return countries[Math.floor(Math.random() * countries.length)];
  };

  const getRandomCity = (country) => {
    const cityList = citiesByCountry[country] || [];
    if (cityList.length === 0) return "Lisboa";
    return cityList[Math.floor(Math.random() * Math.min(cityList.length, 10))];
  };

  const getRandomCategories = () => {
    const availableCategories = ["Cidade", "Cultural", "História", "Foodie", "Natureza"];
    const numCategories = Math.floor(Math.random() * 3) + 1; // 1-3 categorias
    const shuffled = availableCategories.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numCategories);
  };

  // Função para gerar pontos de interesse
  const generatePointsOfInterest = (city, country, categories) => {
    const pointsDatabase = {
      "Lisboa": [
        { name: "Torre de Belém", type: "História", link: "https://www.torrebelem.gov.pt" },
        { name: "Mosteiro dos Jerónimos", type: "História", link: "https://www.mosteirojeronimos.gov.pt" },
        { name: "Castelo de São Jorge", type: "História", link: "https://www.castelodesaojorge.pt" },
        { name: "Bairro Alto", type: "Cidade", link: "" },
        { name: "Miradouro da Senhora do Monte", type: "Cidade", link: "" },
        { name: "Oceanário de Lisboa", type: "Família", link: "https://www.oceanario.pt" },
        { name: "Museu Nacional de Arte Antiga", type: "Cultural", link: "https://www.museudearteantiga.pt" },
        { name: "Pastéis de Belém", type: "Foodie", link: "https://pasteisdebelem.pt" }
      ],
      "Porto": [
        { name: "Torre dos Clérigos", type: "História", link: "https://www.torredosclerigos.pt" },
        { name: "Livraria Lello", type: "Cultural", link: "https://www.livrarialello.pt" },
        { name: "Ribeira do Porto", type: "Cidade", link: "" },
        { name: "Caves do Vinho do Porto", type: "Foodie", link: "" },
        { name: "Casa da Música", type: "Cultural", link: "https://www.casadamusica.com" },
        { name: "Mercado do Bolhão", type: "Foodie", link: "" },
        { name: "Jardins do Palácio de Cristal", type: "Natureza", link: "" }
      ],
      "Paris": [
        { name: "Torre Eiffel", type: "História", link: "https://www.toureiffel.paris" },
        { name: "Museu do Louvre", type: "Cultural", link: "https://www.louvre.fr" },
        { name: "Notre-Dame", type: "História", link: "" },
        { name: "Champs-Élysées", type: "Cidade", link: "" },
        { name: "Montmartre", type: "Cultural", link: "" },
        { name: "Versalhes", type: "História", link: "https://www.chateauversailles.fr" }
      ],
      "Roma": [
        { name: "Coliseu", type: "História", link: "https://www.coopculture.it" },
        { name: "Vaticano", type: "História", link: "https://www.vatican.va" },
        { name: "Fontana di Trevi", type: "História", link: "" },
        { name: "Panteão", type: "História", link: "" },
        { name: "Fórum Romano", type: "História", link: "" }
      ],
      "Barcelona": [
        { name: "Sagrada Família", type: "História", link: "https://sagradafamilia.org" },
        { name: "Park Güell", type: "Cultural", link: "https://www.parkguell.cat" },
        { name: "Las Ramblas", type: "Cidade", link: "" },
        { name: "Bairro Gótico", type: "História", link: "" },
        { name: "Casa Batlló", type: "Cultural", link: "https://www.casabatllo.es" }
      ]
    };

    let points = pointsDatabase[city] || [
      { name: `Centro Histórico de ${city}`, type: "História", link: "" },
      { name: `Museu Principal de ${city}`, type: "Cultural", link: "" },
      { name: `Mercado Local de ${city}`, type: "Foodie", link: "" },
      { name: `Parque Central de ${city}`, type: "Natureza", link: "" }
    ];

    // Filtrar pontos baseados nas categorias selecionadas se houver
    if (categories.length > 0) {
      points = points.filter(point =>
        categories.some(category =>
          point.type.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(point.type.toLowerCase())
        )
      );
      
      // Se não há pontos após filtrar, usar pontos genéricos
      if (points.length === 0) {
        points = [
          { name: `Atração Principal de ${city}`, type: categories[0], link: "" },
          { name: `Local ${categories[0]} em ${city}`, type: categories[0], link: "" }
        ];
      }
    }

    return points.slice(0, 6); // Máximo 6 pontos
  };

  // Função para gerar acomodações
  const generateAccommodations = (city, country, budget, travelStyle) => {
    const budgetRanges = {
      'baixo': { min: 30, max: 80, type: 'Hostel/Pensão' },
      'medio': { min: 80, max: 150, type: 'Hotel 3-4 estrelas' },
      'alto': { min: 150, max: 300, type: 'Hotel 4-5 estrelas' },
      'luxo': { min: 300, max: 600, type: 'Hotel de Luxo' }
    };

    const range = budgetRanges[budget] || budgetRanges['medio'];
    const hotelNames = {
      "Lisboa": "Hotel Tivoli Oriente",
      "Porto": "Hotel Infante Sagres",
      "Paris": "Hotel Le Marais",
      "Roma": "Hotel Artemide",
      "Barcelona": "Hotel Casa Fuster",
      "Madrid": "Hotel Villa Real"
    };

    return [{
      name: hotelNames[city] || `Hotel ${city} ${range.type}`,
      type: range.type,
      link: `https://www.booking.com/searchresults.pt.html?ss=${encodeURIComponent(city)}`
    }];
  };

  // Função para gerar itinerário
  const generateItinerary = (duration, pointsOfInterest, categories) => {
    const itinerary = [];
    const activitiesPerDay = Math.max(1, Math.ceil(pointsOfInterest.length / duration));
    
    for (let day = 1; day <= duration; day++) {
      const dayActivities = [];
      const startIndex = (day - 1) * activitiesPerDay;
      const endIndex = Math.min(startIndex + activitiesPerDay, pointsOfInterest.length);
      
      // Adicionar atividades baseadas nos pontos de interesse
      for (let i = startIndex; i < endIndex; i++) {
        if (pointsOfInterest[i]) {
          dayActivities.push(`Visitar ${pointsOfInterest[i].name}`);
        }
      }
      
      // Adicionar atividades padrão se necessário
      if (dayActivities.length === 0) {
        dayActivities.push("Explorar a cidade");
        dayActivities.push("Experimentar culinária local");
      }
      
      // Adicionar atividade de descanso/refeição
      if (day === 1) {
        dayActivities.unshift("Check-in no hotel");
      }
      if (day === duration) {
        dayActivities.push("Check-out e partida");
      } else {
        dayActivities.push("Jantar em restaurante local");
      }
      
      itinerary.push({
        day: day,
        activities: dayActivities
      });
    }
    
    return itinerary;
  };

  // Função para gerar transporte local
  const generateLocalTransport = (city, country, travelStyle) => {
    const transportOptions = {
      "Lisboa": ["Metro de Lisboa", "Elétrico 28", "Autocarro Carris", "Táxi/Uber"],
      "Porto": ["Metro do Porto", "Autocarro STCP", "Elétrico histórico", "Táxi/Uber"],
      "Paris": ["Metro de Paris", "RER", "Autocarro", "Vélib' (bicicletas)"],
      "Roma": ["Metro de Roma", "Autocarro ATAC", "Elétrico", "Táxi"],
      "Barcelona": ["Metro de Barcelona", "Autocarro TMB", "Bicicleta Bicing", "Táxi"],
      "Madrid": ["Metro de Madrid", "Autocarro EMT", "Cercanías", "Táxi"]
    };

    return transportOptions[city] || ["Transporte público local", "Táxi/Uber", "A pé"];
  };

  // Função para gerar checklist de viagem
  const generateTravelChecklist = (country, categories, duration) => {
    const baseChecklist = [
      { name: "Passaporte/Documento de identificação", checked: false },
      { name: "Reservas de hotel confirmadas", checked: false },
      { name: "Seguro de viagem", checked: false },
      { name: "Medicamentos pessoais", checked: false },
      { name: "Carregadores de dispositivos", checked: false },
      { name: "Roupa adequada ao clima", checked: false },
      { name: "Dinheiro/Cartões de crédito", checked: false }
    ];

    // Adicionar itens específicos baseados no país
    if (country !== "Portugal") {
      baseChecklist.push({ name: "Adaptador de tomada", checked: false });
      baseChecklist.push({ name: "Tradutor/App de idiomas", checked: false });
    }

    // Adicionar itens baseados nas categorias
    if (categories.includes("Praia")) {
      baseChecklist.push({ name: "Protetor solar", checked: false });
      baseChecklist.push({ name: "Fato de banho", checked: false });
    }
    
    if (categories.includes("Montanhas") || categories.includes("Natureza")) {
      baseChecklist.push({ name: "Calçado de caminhada", checked: false });
      baseChecklist.push({ name: "Casaco impermeável", checked: false });
    }

    if (categories.includes("Cultural")) {
      baseChecklist.push({ name: "Câmara fotográfica", checked: false });
      baseChecklist.push({ name: "Guia turístico", checked: false });
    }

    return baseChecklist;
  };

  // Função para calcular preço estimado
  const calculateEstimatedPrice = (budget, duration, country) => {
    const budgetMultipliers = {
      'baixo': 50,
      'medio': 100,
      'alto': 200,
      'luxo': 400
    };

    const countryMultipliers = {
      "Portugal": 1,
      "Espanha": 1.1,
      "França": 1.3,
      "Itália": 1.2,
      "United States": 1.5,
      "Brasil": 0.8
    };

    const basePrice = budgetMultipliers[budget] || 100;
    const countryMultiplier = countryMultipliers[country] || 1;
    
    return Math.round(basePrice * duration * countryMultiplier);
  };

  // Função para gerar descrição da viagem
  const generateTripDescription = (city, country, categories, duration) => {
    const categoryDescriptions = {
      "História": "explorando monumentos históricos e locais emblemáticos",
      "Cultural": "descobrindo museus, galerias e tradições locais",
      "Foodie": "saboreando a deliciosa gastronomia local",
      "Natureza": "desfrutando de paisagens naturais deslumbrantes",
      "Praia": "relaxando em praias paradisíacas",
      "Cidade": "explorando a vida urbana vibrante",
      "Romântico": "criando momentos especiais e românticos",
      "Família": "aproveitando atividades para toda a família"
    };

    const selectedDescriptions = categories
      .map(cat => categoryDescriptions[cat])
      .filter(desc => desc)
      .join(", ");

    return `Descubra ${city}, ${country} numa viagem de ${duration} dias cuidadosamente planeada pela Globe Memories. ` +
           `Esta experiência única combina ${selectedDescriptions || "as melhores atrações locais"}. ` +
           `Prepare-se para uma aventura inesquecível com itinerário personalizado, acomodações selecionadas e ` +
           `recomendações locais autênticas. A Globe Memories criou este plano especialmente para si, ` +
           `garantindo que cada momento da sua viagem seja memorável.`;
  };

  // Função para limpar o localStorage quando necessário
  const clearLocalStorageIfNeeded = () => {
    try {
      // Tenta limpar o localStorage
      localStorage.clear();
      setToast({ message: "Armazenamento limpo para salvar nova viagem.", type: "info", show: true });
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error);
    }
  };

  const confirmAIPlan = () => {
    try {
      const updatedTravel = { ...previewTravel, id: Date.now() };
      
      // Tenta salvar no localStorage
      try {
        const updatedFutureTravels = [...futureTravels, updatedTravel];
        localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));
        setFutureTravels(updatedFutureTravels);
      } catch (error) {
        // Se falhar, limpa o localStorage e tenta novamente
        clearLocalStorageIfNeeded();
        const updatedFutureTravels = [updatedTravel]; // Começa com apenas a nova viagem
        localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));
        setFutureTravels(updatedFutureTravels);
      }

      // Atualiza futureTrips
      try {
        const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
        futureTrips.push({
          coordinates: previewTravel.coordinates,
          label: previewTravel.name,
          country: previewTravel.country,
          city: previewTravel.city,
        });
        localStorage.setItem("futureTrips", JSON.stringify(futureTrips));
      } catch (error) {
        // Se falhar, limpa e salva apenas a nova viagem
        clearLocalStorageIfNeeded();
        const newFutureTrips = [{
          coordinates: previewTravel.coordinates,
          label: previewTravel.name,
          country: previewTravel.country,
          city: previewTravel.city,
        }];
        localStorage.setItem("futureTrips", JSON.stringify(newFutureTrips));
      }

      setToast({ 
        message: `Viagem a ${previewTravel.city} planeada com sucesso Globe Memories!`, 
        type: "success", 
        show: true 
      });
      setIsPreviewModalOpen(false);
      setPreviewTravel(null);
    } catch (error) {
      console.error("Erro ao confirmar plano de Globe Memories!:", error);
      setToast({ 
        message: "Erro ao salvar viagem planeada pela Globe Memories!. Tente novamente.", 
        type: "error", 
        show: true 
      });
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (name === "category") {
        setNewTravel((prevState) => {
          let updatedCategories = [...prevState.category];
          if (checked) {
            updatedCategories.push(value);
          } else {
            updatedCategories = updatedCategories.filter((category) => category !== value);
          }
          return { ...prevState, category: updatedCategories };
        });
      } else if (name === "localTransport") {
        setNewTravel((prevState) => {
          let updatedTransport = [...prevState.localTransport];
          if (checked) {
            // Adiciona o transporte como string simples
            updatedTransport.push(value);
          } else {
            // Remove o transporte independente do formato
            updatedTransport = updatedTransport.filter((transport) => 
              typeof transport === 'string' ? transport !== value : transport.name !== value
            );
          }
          return { ...prevState, localTransport: updatedTransport };
        });
      }
    } else if (name === "country") {
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: value,
        city: "", // Limpar a cidade quando o país mudar
      }));
      fetchCities(value);
    } else if (name.startsWith("accommodations")) {
      const [indexStr, field] = name.split(".");
      const index = parseInt(indexStr.replace("accommodations", ""), 10);
      setNewTravel((prevState) => {
        const updatedAccommodations = [...prevState.accommodations];
        updatedAccommodations[index] = {
          ...updatedAccommodations[index],
          [field]: value,
        };
        return { ...prevState, accommodations: updatedAccommodations };
      });
    } else if (name.includes("priceDetails.")) {
      const field = name.split(".")[1];
      setNewTravel((prevState) => ({
        ...prevState,
        priceDetails: { ...prevState.priceDetails, [field]: value },
      }));
    } else {
      setNewTravel((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handlePointChange = (e) => {
    const { name, value } = e.target;
    setNewPointOfInterest((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditPointOfInterest = (e) => {
    e.stopPropagation();
    if (!newPointOfInterest.name.trim()) {
      setToast({ message: "O nome do ponto de referência é obrigatório!", type: "error", show: true });
      return;
    }

    if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
      // Adicionar/editar ponto no destino específico
      const destIndex = selectedDestinationIndex;
      const currentPoints = multiDestinations[destIndex]?.pointsOfInterest || [];
      const updatedPoints = [...currentPoints];
      
      if (editingPointIndex !== null) {
        updatedPoints[editingPointIndex] = {
          name: newPointOfInterest.name,
          type: newPointOfInterest.type,
          link: newPointOfInterest.link,
        };
      } else {
        updatedPoints.push({
          name: newPointOfInterest.name,
          type: newPointOfInterest.type,
          link: newPointOfInterest.link,
        });
      }
      
      updateDestinationData(multiDestinations[destIndex].id, 'pointsOfInterest', updatedPoints);
    } else {
      // Adicionar/editar ponto no destino principal
      setNewTravel((prev) => {
        const updatedPoints = [...prev.pointsOfInterest];
        if (editingPointIndex !== null) {
          updatedPoints[editingPointIndex] = {
            name: newPointOfInterest.name,
            type: newPointOfInterest.type,
            link: newPointOfInterest.link,
          };
        } else {
          updatedPoints.push({
            name: newPointOfInterest.name,
            type: newPointOfInterest.type,
            link: newPointOfInterest.link,
          });
        }
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    }

    setNewPointOfInterest({ name: "", type: "", link: "" });
    setEditingPointIndex(null);
    setToast({ message: "Ponto de referência adicionado/editado com sucesso!", type: "success", show: true });
  };

  const handleDeletePointOfInterest = (e, index) => {
    e.stopPropagation();
    
    if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
      // Remover ponto do destino específico
      const destIndex = selectedDestinationIndex;
      const currentPoints = multiDestinations[destIndex]?.pointsOfInterest || [];
      const updatedPoints = currentPoints.filter((_, i) => i !== index);
      updateDestinationData(multiDestinations[destIndex].id, 'pointsOfInterest', updatedPoints);
    } else {
      // Remover ponto do destino principal
      setNewTravel((prev) => {
        const updatedPoints = prev.pointsOfInterest.filter((_, i) => i !== index);
        return { ...prev, pointsOfInterest: updatedPoints };
      });
    }

    setEditingPointIndex(null);
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setToast({ message: "Ponto de referência removido com sucesso!", type: "success", show: true });
  };

  const handleEditPointOfInterest = (e, index) => {
    e.stopPropagation();
    let point;
    
    if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
      // Editar ponto do destino específico
      const destIndex = selectedDestinationIndex;
      const currentPoints = multiDestinations[destIndex]?.pointsOfInterest || [];
      point = currentPoints[index];
    } else {
      // Editar ponto do destino principal
      point = newTravel.pointsOfInterest[index];
    }

    setNewPointOfInterest({
      name: point.name || "",
      type: point.type || "",
      link: point.link || "",
    });
    setEditingPointIndex(index);
  };

  const handleCancelEditPoint = (e) => {
    e.stopPropagation();
    setNewPointOfInterest({ name: "", type: "", link: "" });
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
    if (name === "day") {
      setNewItineraryDay((prev) => ({ ...prev, day: value }));
      setItineraryError("");
    } else if (name.startsWith("activity")) {
      const activityIndex = parseInt(name.split("-")[1], 10);
      const updatedActivities = [...newItineraryDay.activities];
      updatedActivities[activityIndex] = value;
      setNewItineraryDay((prev) => ({ ...prev, activities: updatedActivities }));
    }
  };

  const handleAddActivityField = (e) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: [...prev.activities, ""],
    }));
  };

  const handleRemoveActivityField = (e, index) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index),
    }));
  };

  const handleAddOrEditItineraryDay = (e) => {
    e.stopPropagation();
    const totalDays = calculateTripDays();
    const dayToAdd = parseInt(newItineraryDay.day, 10);

    if (isNaN(dayToAdd) || dayToAdd < 1 || dayToAdd > totalDays) {
      setItineraryError(`Por favor, introduza um dia entre 1 e ${totalDays}.`);
      return;
    }

    const dayExists = newTravel.itinerary.some(
      (item) => item.day === dayToAdd && editingItineraryDay === null
    );
    if (dayExists) {
      setItineraryError("Este dia já existe no itinerário. Edite o existente ou escolha outro.");
      return;
    }

    setNewTravel((prev) => {
      const updatedItinerary = [...prev.itinerary];
      const filteredActivities = newItineraryDay.activities.filter((act) => act.trim() !== "");
      if (editingItineraryDay !== null) {
        updatedItinerary[editingItineraryDay] = {
          day: dayToAdd,
          activities: filteredActivities,
        };
      } else {
        updatedItinerary.push({
          day: dayToAdd,
          activities: filteredActivities,
        });
      }
      return { ...prev, itinerary: updatedItinerary.sort((a, b) => a.day - b.day) };
    });
    setNewItineraryDay({ day: "", activities: [""] });
    setEditingItineraryDay(null);
    setItineraryError("");
    setToast({ message: "Dia do itinerário adicionado/editado com sucesso!", type: "success", show: true });
  };

  const handleEditItineraryDay = (e, index) => {
    e.stopPropagation();
    const day = newTravel.itinerary[index];
    setNewItineraryDay({
      day: day.day.toString(),
      activities: day.activities.length > 0 ? [...day.activities] : [""],
    });
    setEditingItineraryDay(index);
    setItineraryError("");
  };

  const handleDeleteItineraryDay = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index),
    }));
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: "", activities: [""] });
    setItineraryError("");
    setToast({ message: "Dia do itinerário removido com sucesso!", type: "success", show: true });
  };

  const handleCancelEditItinerary = (e) => {
    e.stopPropagation();
    setNewItineraryDay({ day: "", activities: [""] });
    setEditingItineraryDay(null);
    setItineraryError("");
  };

  const handleChecklistChange = (e) => {
    setNewChecklistItem(e.target.value);
  };

  const handleAddOrEditChecklistItem = (e) => {
    e.stopPropagation();
    if (!newChecklistItem.trim()) {
      setToast({ message: "O nome do item é obrigatório!", type: "error", show: true });
      return;
    }
    setNewTravel((prev) => {
      const updatedChecklist = [...prev.checklist];
      if (editingChecklistIndex !== null) {
        updatedChecklist[editingChecklistIndex] = {
          name: newChecklistItem,
          checked: updatedChecklist[editingChecklistIndex].checked,
        };
      } else {
        updatedChecklist.push({ name: newChecklistItem, checked: false });
      }
      return { ...prev, checklist: updatedChecklist };
    });
    setNewChecklistItem("");
    setEditingChecklistIndex(null);
    setToast({ message: "Item adicionado/editado com sucesso!", type: "success", show: true });
  };

  const handleToggleChecklistItem = (index) => {
    setNewTravel((prev) => {
      const updatedChecklist = [...prev.checklist];
      updatedChecklist[index] = {
        ...updatedChecklist[index],
        checked: !updatedChecklist[index].checked
      };
      return { ...prev, checklist: updatedChecklist };
    });
  };

  const handleEditChecklistItem = (e, index) => {
    e.stopPropagation();
    setNewChecklistItem(newTravel.checklist[index].name);
    setEditingChecklistIndex(index);
  };

  const handleDeleteChecklistItem = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
    setEditingChecklistIndex(null);
    setNewChecklistItem("");
    setToast({ message: "Item removido com sucesso!", type: "success", show: true });
  };

  const handleCancelEditChecklist = (e) => {
    e.stopPropagation();
    setNewChecklistItem("");
    setEditingChecklistIndex(null);
  };

  const handleEdit = (id) => {
    const travelToEdit = futureTravels.find((travel) => travel.id === id);
    if (!travelToEdit) {
      setToast({ message: `Viagem com ID ${id} não encontrada!`, type: "error", show: true });
      return;
    }

    setNewTravel({
      ...travelToEdit,
      category: Array.isArray(travelToEdit.category) ? travelToEdit.category : [],
      priceDetails: travelToEdit.priceDetails || { hotel: "", transport: "", food: "", extras: "" },
      accommodations: Array.isArray(travelToEdit.accommodations) && travelToEdit.accommodations.length > 0
        ? travelToEdit.accommodations
        : [{ name: "", type: "" }],
      pointsOfInterest: Array.isArray(travelToEdit.pointsOfInterest) ? travelToEdit.pointsOfInterest : [],
      itinerary: Array.isArray(travelToEdit.itinerary) ? travelToEdit.itinerary : [],
      localTransport: Array.isArray(travelToEdit.localTransport) ? travelToEdit.localTransport : [],
      checklist: Array.isArray(travelToEdit.checklist) ? travelToEdit.checklist : [],
      privacy: travelToEdit.privacy || "public",
      coordinates: travelToEdit.coordinates || null,
    });

    // Carregar as cidades do país selecionado
    if (travelToEdit.country) {
      fetchCities(travelToEdit.country);
    }

    // Carregar dados de múltiplos destinos se existirem
    if (travelToEdit.multiDestinations && Array.isArray(travelToEdit.multiDestinations)) {
      const updatedDestinations = travelToEdit.multiDestinations.map(dest => ({
        ...dest,
        priceDetails: dest.priceDetails || { hotel: "", transport: "", food: "", extras: "" },
        price: dest.price || ""
      }));
      setMultiDestinations(updatedDestinations);
    }

    // Carregar dados do grupo se existirem
    if (travelToEdit.groupData) {
      setGroupMembers(travelToEdit.groupData.members || []);
      setSentInvites(travelToEdit.groupData.invitesSent || []);
    }

    // Carregar tipo de viagem
    if (travelToEdit.travelType) {
      setSelectedTravelType(travelToEdit.travelType);
    }

    setEditTravelId(id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveTab("generalInfo");
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: "", activities: [""] });
    setEditingItineraryDay(null);
    setNewChecklistItem("");
    setEditingChecklistIndex(null);
    setItineraryError("");
  };

  const handleDelete = (id) => {
    const travelToDelete = futureTravels.find((travel) => travel.id === id);
    const updatedTravels = futureTravels.filter((travel) => travel.id !== id);
    setFutureTravels(updatedTravels);
    localStorage.setItem("futureTravels", JSON.stringify(updatedTravels));

    const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
    const updatedFutureTrips = futureTrips.filter(
      (trip) => !(trip.city === travelToDelete.city && trip.country === travelToDelete.country)
    );
    localStorage.setItem("futureTrips", JSON.stringify(updatedFutureTrips));

    setToast({ message: "Viagem futura excluída com sucesso!", type: "success", show: true });
  };

  const openConfirmModal = (travel) => {
    setTravelToAdd(travel);
    setIsConfirmModalOpen(true);
  };

  const handleAddToMyTravels = () => {
    if (!travelToAdd) return;

    // Load past travels from localStorage
    let pastTravels = JSON.parse(localStorage.getItem("pastTravels")) || [];
    
    // Check if the travel is already in pastTravels to avoid duplicates
    const travelExists = pastTravels.some(
      (pastTravel) => pastTravel.id === travelToAdd.id
    );
    
    if (!travelExists) {
      // Add the travel to pastTravels
      pastTravels.push({ ...travelToAdd, id: Date.now() }); // Assign new ID to avoid conflicts
      localStorage.setItem("pastTravels", JSON.stringify(pastTravels));
      
      // Remove from futureTravels
      const updatedFutureTravels = futureTravels.filter((t) => t.id !== travelToAdd.id);
      setFutureTravels(updatedFutureTravels);
      localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));
      
      // Update futureTrips
      const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
      const updatedFutureTrips = futureTrips.filter(
        (trip) => !(trip.city === travelToAdd.city && trip.country === travelToAdd.country)
      );
      localStorage.setItem("futureTrips", JSON.stringify(updatedFutureTrips));
      
      setToast({ message: `Viagem a ${travelToAdd.city} adicionada às suas viagens!`, type: "success", show: true });
      
      // Navigate to My Travels page
      navigate("/my-travels");
    } else {
      setToast({ message: "Esta viagem já foi adicionada às suas viagens!", type: "error", show: true });
    }

    setIsConfirmModalOpen(false);
    setTravelToAdd(null);
  };

  const cancelAddToMyTravels = () => {
    setIsConfirmModalOpen(false);
    setTravelToAdd(null);
  };

  const handleAddTravel = async () => {
    if (!newTravel.name.trim()) {
      setToast({ message: "O nome da viagem é obrigatório!", type: "error", show: true });
      return;
    }
    if (newTravel.travelType?.main !== 'multi' && !newTravel.country) {
      setToast({ message: "O país é obrigatório!", type: "error", show: true });
      return;
    }
    if (newTravel.travelType?.main !== 'multi' && !newTravel.city.trim()) {
      setToast({ message: "A cidade é obrigatória!", type: "error", show: true });
      return;
    }
    if (!newTravel.startDate) {
      setToast({ message: "A data de início é obrigatória!", type: "error", show: true });
      return;
    }
    if (!newTravel.endDate) {
      setToast({ message: "A data de fim é obrigatória!", type: "error", show: true });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(newTravel.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(newTravel.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (startDate <= today) {
      setToast({ 
        message: "A data de início deve ser pelo menos um dia após a data atual!", 
        type: "error", 
        show: true 
      });
      return;
    }
    if (endDate < startDate) {
      setToast({ 
        message: "A data de fim deve ser posterior à data de início da viagem!", 
        type: "error", 
        show: true 
      });
      return;
    }

    try {
      let coordinates = null;
      
      // Só obter coordenadas se for viagem de destino único
      if (newTravel.travelType?.main !== 'multi') {
        coordinates = await getCoordinates(newTravel.country, newTravel.city);
        if (!coordinates) {
          setToast({ message: "Não foi possível obter coordenadas para a localização!", type: "error", show: true });
          return;
        }
      }

      const updatedTravel = {
        ...newTravel,
        id: isEditing ? editTravelId : Date.now(),
        accommodations: newTravel.accommodations,
        pointsOfInterest: newTravel.pointsOfInterest.filter(
          (point) => point.name.trim() !== "" || point.type.trim() !== "" || point.link.trim() !== ""
        ),
        itinerary: newTravel.itinerary.filter((item) => item.day && item.activities.length > 0),
        localTransport: newTravel.localTransport || [],
        checklist: newTravel.checklist || [],
        coordinates,
        category: newTravel.category || [],
        // Adicionar dados do grupo se for viagem em grupo
        groupData: newTravel.travelType?.isGroup ? {
          members: groupMembers,
          admin: "Tiago",
          invitesSent: sentInvites,
          createdAt: new Date().toISOString()
        } : null,
        // Adicionar dados de múltiplos destinos se for viagem multidestino
        multiDestinations: newTravel.travelType?.main === 'multi' ? multiDestinations : null
      };

      // Primeiro, atualizar o estado local
      let updatedFutureTravels;
      if (isEditing) {
        updatedFutureTravels = futureTravels.map((travel) => (travel.id === editTravelId ? updatedTravel : travel));
      } else {
        updatedFutureTravels = [...futureTravels, updatedTravel];
      }
      setFutureTravels(updatedFutureTravels);

      // Depois, salvar no localStorage
      localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));

      // Atualizar futureTrips apenas para viagens de destino único
      if (newTravel.travelType?.main !== 'multi') {
        const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
        const newFutureTrip = {
          coordinates,
          label: newTravel.name,
          country: newTravel.country,
          city: newTravel.city,
        };

        if (isEditing) {
          const tripIndex = futureTrips.findIndex(
            (trip) => trip.city === newTravel.city && trip.country === newTravel.country
          );
          if (tripIndex !== -1) {
            futureTrips[tripIndex] = newFutureTrip;
          } else {
            futureTrips.push(newFutureTrip);
          }
        } else {
          futureTrips.push(newFutureTrip);
        }
        localStorage.setItem("futureTrips", JSON.stringify(futureTrips));
      }

      // Mostrar mensagem de sucesso
      setToast({ 
        message: isEditing ? "Viagem futura editada com sucesso!" : "Viagem futura adicionada com sucesso!", 
        type: "success", 
        show: true 
      });

      // Fechar o modal e limpar estados
      setIsModalOpen(false);
      resetForm();
      
      // Limpar o estado de redirecionamento do mapa
      if (location.state?.fromMap) {
        window.history.replaceState({}, document.title, location.pathname);
      }
    } catch (error) {
      console.error("Erro ao salvar viagem:", error);
      setToast({ message: "Erro ao salvar viagem. Tente novamente.", type: "error", show: true });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
    // Limpar o estado ao fechar o modal
    window.history.replaceState({}, document.title, location.pathname);
  };

  const resetForm = () => {
    setNewTravel({
      name: "",
      user: "Tiago",
      category: [],
      country: "",
      city: "",
      price: "",
      startDate: "",
      endDate: "",
      BookingTripPaymentDate: "",
      priceDetails: { hotel: "", transport: "", food: "", extras: "" },
      description: "",
      accommodations: [{ name: "", type: "" }],
      pointsOfInterest: [],
      itinerary: [],
      localTransport: [],
      privacy: "public",
      checklist: [],
      coordinates: null,
    });
    setIsEditing(false);
    setEditTravelId(null);
    setIsCategoryModalOpen(false);
    setIsTransportModalOpen(false);
    setIsTravelTypeModalOpen(false);
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: "", activities: [""] });
    setEditingItineraryDay(null);
    setNewChecklistItem("");
    setEditingChecklistIndex(null);
    setItineraryError("");
    setActiveTab("generalInfo");
    // Limpar dados do grupo
    setGroupMembers([]);
    setNewMemberEmail("");
    setAvailableUsers([]);
    setSentInvites([]);
    setSelectedTravelType({ main: '', isGroup: false });
    // Limpar dados de múltiplos destinos
    setMultiDestinations([]);
    setNewDestination({ country: "", city: "" });
    setSelectedDestinationIndex(0);
  };

  const openModal = () => {
    // Abrir primeiro o modal de seleção de tipo de viagem
    setSelectedTravelType({ main: '', isGroup: false });
    setIsTravelTypeModalOpen(true);
  };

  // Função para lidar com seleção de tipo de viagem
  const handleTravelTypeSelection = (type) => {
    if (type === 'group') {
      // Se é viagem em grupo, toggle o estado mas mantém a seleção principal
      setSelectedTravelType(prev => ({
        ...prev,
        isGroup: !prev.isGroup
      }));
    } else {
      // Se é tipo principal (single ou multi), atualiza o tipo principal
      setSelectedTravelType(prev => ({
        ...prev,
        main: prev.main === type ? '' : type // Toggle se for o mesmo tipo
      }));
    }
  };

  // Função para confirmar seleção de tipo e abrir modal principal
  const confirmTravelType = () => {
    if (!selectedTravelType.main) {
      setToast({ 
        message: "Por favor, selecione pelo menos um tipo de viagem (Destino Único ou Multidestino)!", 
        type: "error", 
        show: true 
      });
      return;
    }
    openMainModal();
  };

  const openMainModal = () => {
    
    // Define a data de início como amanhã
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    // Define a data de fim como 6 dias após a data de início
    const nextWeek = new Date(tomorrow);
    nextWeek.setDate(tomorrow.getDate() + 6);

    // Formata as datas para o formato YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setIsEditing(false);
    setEditTravelId(null);
    setNewTravel({
      name: "",
      user: "Tiago",
      category: [],
      country: "",
      city: "",
      price: "",
      startDate: formatDate(tomorrow),
      endDate: formatDate(nextWeek),
      BookingTripPaymentDate: "",
      priceDetails: { hotel: "", transport: "", food: "", extras: "" },
      description: "",
      accommodations: [{ name: "", type: "" }],
      pointsOfInterest: [],
      itinerary: [],
      localTransport: [],
      privacy: "public",
      checklist: [],
      coordinates: null,
      travelType: selectedTravelType // Adicionar o tipo de viagem selecionado
    });
    setIsTravelTypeModalOpen(false);
    setIsModalOpen(true);
    setActiveTab("generalInfo");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setItineraryError("");
  };

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };



  // Função para buscar cidades de um país
  const fetchCities = async (country) => {
    if (!country) {
      setCities([]);
      return;
    }

    setIsLoadingCities(true);
    try {
      // Usar a lista estática de cidades
      const cityList = citiesByCountry[country] || [];
      
      // Ordenar as cidades
      const sortedCities = cityList.sort((a, b) => a.localeCompare(b, 'pt-PT'));
      
      console.log(`Encontradas ${sortedCities.length} cidades para ${country}:`, sortedCities);
      setCities(sortedCities);
    } catch (error) {
      console.error("Erro ao buscar cidades:", error);
      setToast({ 
        message: "Erro ao carregar lista de cidades. Por favor, tente novamente.", 
        type: "error", 
        show: true 
      });
    } finally {
      setIsLoadingCities(false);
    }
  };

  return (
    <div className="my-travels-container">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        <button className="primary-action-button" onClick={openModal}>
          Planear Nova Viagem
        </button>
        <button
          className="primary-action-button"
          onClick={planTripWithAI}
          style={{ backgroundColor: "#28a745" }}
          disabled={isLoadingAI}
        >
          {isLoadingAI ? "A Planeaer..." : "Planeie a Minha Viagem a Globe Memories!"}
        </button>
      </div>
      <br />
      <br />

      {/* Modal de Seleção de Tipo de Viagem */}
      {isTravelTypeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{  }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <h2 style={{ 
                textAlign: "center", 
                color: "#2c3e50", 
                marginBottom: "10px",
                fontSize: "30px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}>
                ✈️ Que tipo de viagem pretende planear?
              </h2>
              <p style={{ 
                textAlign: "center", 
                color: "#666",
                marginBottom: "30px",
                fontSize: "16px"
              }}>
                
              </p>
              
              <div className="modal-header-buttons">
                <button 
                  type="button-danger" 
                  onClick={() => setIsTravelTypeModalOpen(false)} 
                  className="button-danger"
                >
                  Fechar
                </button>
                <button
                  type="button-success"
                  onClick={confirmTravelType}
                  className="button-success"
                  disabled={!selectedTravelType.main}
                >
                  Continuar
                </button>
              </div>
            </div>

            <div style={{ padding: "20px 0" }}>
              {/* Tipos principais de viagem */}
              <div style={{ marginBottom: "30px" }}>
                <h3 style={{ 
                  color: "#2c3e50", 
                  marginBottom: "20px",
                  fontSize: "18px",
                  textAlign: "center"
                }}>
                  Tipo de Destino:
                </h3>
                
                <div style={{ 
                  display: "flex", 
                  gap: "20px", 
                  justifyContent: "center",
                  flexWrap: "wrap"
                }}>
                  {/* Viagem a Destino Único */}
                  <div 
                    onClick={() => handleTravelTypeSelection('single')}
                    style={{
                      flex: 1,
                      minWidth: "250px",
                      maxWidth: "300px",
                      padding: "20px",
                      border: selectedTravelType.main === 'single' ? "3px solid #007bff" : "2px solid #e9ecef",
                      borderRadius: "12px",
                      backgroundColor: selectedTravelType.main === 'single' ? "#f0f8ff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "center",
                      boxShadow: selectedTravelType.main === 'single' ? "0 4px 12px rgba(0,123,255,0.2)" : "0 2px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "15px" }}>🎯</div>
                    <h4 style={{ 
                      color: selectedTravelType.main === 'single' ? "#007bff" : "#2c3e50",
                      marginBottom: "10px",
                      fontSize: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}>
                      Viagem a Destino Único
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#007bff", 
                          color: "white", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "11px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "🎯 Viagem a Destino Único", "Viagem focada numa única localização (um país e uma cidade). Ideal para escapadas de fim de semana, city breaks, ou quando pretende explorar profundamente um local específico.")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </h4>
                    <p style={{ 
                      color: "#666", 
                      fontSize: "14px", 
                      lineHeight: "1.5",
                      margin: 0
                    }}>
                      Uma viagem focada num único país e uma única cidade. 
                    </p>
                    <div style={{ 
                      marginTop: "15px", 
                      fontSize: "12px", 
                      color: "#888" 
                    }}>
                      Exemplo: Portugal - Lisboa
                    </div>
                  </div>

                  {/* Viagem Multidestino */}
                  <div 
                    onClick={() => handleTravelTypeSelection('multi')}
                    style={{
                      flex: 1,
                      minWidth: "250px",
                      maxWidth: "300px",
                      padding: "20px",
                      border: selectedTravelType.main === 'multi' ? "3px solid #007bff" : "2px solid #e9ecef",
                      borderRadius: "12px",
                      backgroundColor: selectedTravelType.main === 'multi' ? "#f0f8ff" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      textAlign: "center",
                      boxShadow: selectedTravelType.main === 'multi' ? "0 4px 12px rgba(0,123,255,0.2)" : "0 2px 6px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ fontSize: "40px", marginBottom: "15px" }}>🗺️</div>
                    <h4 style={{ 
                      color: selectedTravelType.main === 'multi' ? "#007bff" : "#2c3e50",
                      marginBottom: "10px",
                      fontSize: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}>
                      Viagem Multidestino
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#007bff", 
                          color: "white", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "11px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "🗺️ Viagem Multidestino", "Viagem que inclui múltiplos países e/ou cidades. Perfeita para roteiros complexos, viagens longas, tours pela Europa, ou quando pretende visitar vários locais numa única viagem.")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </h4>
                    <p style={{ 
                      color: "#666", 
                      fontSize: "14px", 
                      lineHeight: "1.5",
                      margin: 0
                    }}>
                      Uma viagem que inclui vários países e/ou várias cidades. 
                    </p>
                    <div style={{ 
                      marginTop: "15px", 
                      fontSize: "12px", 
                      color: "#888" 
                    }}>
                      Exemplo: Portugal - Lisboa, Coimbra / Espanha - Madrid
                    </div>
                  </div>
                </div>

                {/* Checkbox para Viagem em Grupo no modal de seleção de tipo */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    id="modalGroupCheckbox"
                    checked={selectedTravelType.isGroup || false}
                    onChange={(e) => setSelectedTravelType(prev => ({ ...prev, isGroup: e.target.checked }))}
                    style={{ transform: "scale(1.15)" }}
                  />
                  <label htmlFor="modalGroupCheckbox" style={{ fontSize: "15px", fontWeight: "600", color: "#2c3e50", cursor: "pointer" }}>
                    👥 Viagem em Grupo
                  </label>
                  <span
                    className="tooltip-icon"
                    onMouseEnter={(e) => showTooltip(e, "Viagem em Grupo", "Ative se esta viagem for feita por um grupo. Irá permitir convidar membros e partilhar detalhes do grupo.")}
                    onMouseLeave={hideTooltip}
                  >
                    ?
                  </span>
                </div>
              </div>

           

              {/* Resumo da seleção */}
              {(selectedTravelType.main || selectedTravelType.isGroup) && (
                <div style={{ 
                  marginTop: "30px", 
                  padding: "20px", 
                  backgroundColor: "#f8f9fa", 
                  borderRadius: "8px",
                  border: "1px solid #e9ecef"
                }}>
                  <h4 style={{ 
                    color: "#2c3e50", 
                    marginBottom: "10px",
                    textAlign: "center"
                  }}>
                    A Sua Seleção:
                  </h4>
                  <div style={{ 
                    textAlign: "center", 
                    color: "#666" 
                  }}>
                    {selectedTravelType.main === 'single' && "✅ Viagem a Destino Único"}
                    {selectedTravelType.main === 'multi' && "✅ Viagem Multidestino"}
                    {selectedTravelType.isGroup && (
                      <div style={{ marginTop: "5px" }}>
                        ✅ Viagem em Grupo
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="travel-planner-modal">
          <div className="travel-planner-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <h2>
                ✈️ {isEditing ? "Editar Viagem Futura" : "Planear Nova Viagem"}
              </h2>
              
              <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "15px", flexWrap: "wrap", justifyContent: "center" }}>
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
                    <span 
                      className="tooltip-icon"
                      onMouseEnter={(e) => showTooltip(e, "Privacidade da Viagem", "Defina quem pode ver a sua viagem: Pública (todos), Somente para Seguidores (apenas quem o segue), ou Privada (apenas você).")}
                      onMouseLeave={hideTooltip}
                    >
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
                    checked={newTravel.travelType?.isGroup || false}
                    onChange={(e) => {
                      setNewTravel(prev => ({
                        ...prev,
                        travelType: {
                          ...prev.travelType,
                          isGroup: e.target.checked
                        }
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
                      color: "#2c3e50"
                    }}
                  >
                    👥 Viagem em Grupo
                  </label>
                  
                  {/* Dropdown para alternar entre Destino Único e Multidestino */}
                  {(newTravel.travelType?.main === 'single' || newTravel.travelType?.main === 'multi') && (
                    <div style={{ marginLeft: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <label style={{ fontWeight: "600", color: "#007bff", fontSize: "14px" }}>
                        Tipo:
                      </label>
                      <select
                        value={newTravel.travelType.main}
                        onChange={e => {
                          const value = e.target.value;
                          setNewTravel(prev => ({
                            ...prev,
                            travelType: {
                              ...prev.travelType,
                              main: value
                            }
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
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                    window.history.replaceState({}, document.title, location.pathname);
                  }} 
                  className="button-danger"
                >
                  ✕ Fechar
                </button>
                <button
                  type="button"
                  onClick={handleAddTravel}
                  className="button-success"
                >
                  {isEditing ? "💾 Guardar Alterações" : "✅ Adicionar Viagem Futura"}
                </button>
              </div>

                    </div>
                  )}
                </div>
              </div>

     
            </div>

            <div className="tab-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={activeTab === tab.id ? "active" : ""}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="modal-form-content">
              <form onSubmit={(e) => e.preventDefault()}>
                {activeTab === "generalInfo" && (
                  <div>
                    {/* Mostrar tipo de viagem selecionado - versão discreta */}
                

                    <div className="form-row">
                      <div className="">
                        <div>
                          <label>
                            ✏️ Nome da Viagem Futura: *
                            <span 
                              className="tooltip-icon"
                              onMouseEnter={(e) => showTooltip(e, "✏️ Nome da Viagem", "Dê um nome único e descritivo à sua viagem. Ex: 'Escapadinha a Paris', 'Lua de Mel na Tailândia', 'Aventura na Islândia'.")}
                              onMouseLeave={hideTooltip}
                            >
                              ?
                            </span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={newTravel.name}
                            onChange={handleChange}
                            required
                            placeholder="Ex.: Viagem futura a Paris"
                          />
                        </div>

                  

                        {/* Seção para destino único */}
                        {newTravel.travelType?.main === 'single' && (
                          <div className="destination-section">
                            <h4>
                              🎯 Destino da Viagem (Viagem a Destino Único)
                            </h4>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                              <div>
                                <label>
                                  🌍 País: *
                                  <span 
                                    className="tooltip-icon"
                                    onMouseEnter={(e) => showTooltip(e, "🌍 País", "Selecione o país de destino da sua viagem. Este será o local principal onde irá passar as suas férias.")}
                                    onMouseLeave={hideTooltip}
                                  >
                                    ?
                                  </span>
                                </label>
                                <select
                                  name="country"
                                  value={newTravel.country}
                                  onChange={(e) => {
                                    handleChange(e);
                                    fetchCities(e.target.value);
                                  }}
                                  required
                                >
                                  <option value="">Selecione um país</option>
                                  <option value="Portugal">Portugal</option>
                                  <option value="Brasil">Brasil</option>
                                  <option value="United States">Estados Unidos</option>
                                  <option value="Espanha">Espanha</option>
                                  <option value="França">França</option>
                                  <option value="Itália">Itália</option>
                                  <option value="Alemanha">Alemanha</option>
                                  <option value="Reino Unido">Reino Unido</option>
                                  <option value="Japão">Japão</option>
                                  <option value="Tailândia">Tailândia</option>
                                  <option value="Grécia">Grécia</option>
                                  <option value="Turquia">Turquia</option>
                                </select>
                              </div>
                              <div>
                                <label>
                                  🏙️ Cidade: *
                                  <span 
                                    className="tooltip-icon"
                                    onMouseEnter={(e) => showTooltip(e, "🏙️ Cidade", "Escolha a cidade específica dentro do país selecionado. Esta será a sua base principal durante a viagem.")}
                                    onMouseLeave={hideTooltip}
                                  >
                                    ?
                                  </span>
                                </label>
                                <select
                                  name="city"
                                  value={newTravel.city}
                                  onChange={handleChange}
                                  required
                                  disabled={!newTravel.country}
                                >
                                  <option value="">Selecione uma cidade</option>
                                  {cities.map((city) => (
                                    <option key={city} value={city}>
                                      {city}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Seção para múltiplos destinos */}
                        {newTravel.travelType?.main === 'multi' && (
                          <div className="multi-destination-section">
                            <h4>
                              🗺️ Destinos da Viagem (Viagem Multidestino)
                              <span 
                                className="tooltip-icon"
                                onMouseEnter={(e) => showTooltip(e, "🗺️ Destinos da Viagem Multidestino", "Adicione múltiplos países e cidades à sua viagem. Pode criar um roteiro complexo visitando vários locais numa única viagem.")}
                                onMouseLeave={hideTooltip}
                              >
                                ?
                              </span>
                            </h4>
                            
                            {/* Formulário para adicionar novos destinos */}
                            <div style={{ 
                              display: "grid", 
                              gridTemplateColumns: "1fr 1fr auto", 
                              gap: "15px", 
                              marginBottom: "20px",
                              alignItems: "end"
                            }}>
                              <div>
                                <label>
                                  🌍 País:
                                  <span 
                                    className="tooltip-icon"
                                    onMouseEnter={(e) => showTooltip(e, "🌍 País (Multidestino)", "Selecione um país para adicionar ao seu roteiro multidestino. Pode adicionar múltiplos países para criar uma viagem completa.")}
                                    onMouseLeave={hideTooltip}
                                  >
                                    ?
                                  </span>
                                </label>
                                <select 
                                  name="country" 
                                  value={newDestination.country} 
                                  onChange={handleDestinationChange}
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
                              <div>
                                <label>
                                  🏙️ Cidade:
                                  <span 
                                    className="tooltip-icon"
                                    onMouseEnter={(e) => showTooltip(e, "🏙️ Cidade (Multidestino)", "Escolha a cidade específica dentro do país selecionado. Pode adicionar múltiplas cidades para criar um roteiro detalhado.")}
                                    onMouseLeave={hideTooltip}
                                  >
                                    ?
                                  </span>
                                </label>
                                <select
                                  name="city"
                                  value={newDestination.city}
                                  onChange={handleDestinationChange}
                                  disabled={!newDestination.country}
                                >
                                  <option value="">Selecione uma cidade</option>
                                  {cities.map((city) => (
                                    <option key={city} value={city}>
                                      {city}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={addDestination}
                                  disabled={!newDestination.country || !newDestination.city}
                                  style={{
                                    padding: "12px 16px",
                                    backgroundColor: "#28a745",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontWeight: "600"
                                  }}
                                >
                                  + Adicionar
                                </button>
                              </div>
                            </div>

                            {/* Lista de destinos adicionados */}
                            {multiDestinations.length > 0 && (
                              <div>
                                <h5 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                                  Destinos Adicionados ({multiDestinations.length}):
                                </h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                  {multiDestinations.map((destination, index) => (
                                    <div 
                                      key={destination.id}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "12px",
                                        backgroundColor: "#fff",
                                        borderRadius: "8px",
                                        border: "1px solid #ddd",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                                      }}
                                    >
                                      <span style={{ fontWeight: "600" }}>
                                        📍 {destination.city}, {destination.country}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeDestination(destination.id)}
                                        style={{
                                          padding: "6px 12px",
                                          backgroundColor: "#dc3545",
                                          color: "#fff",
                                          border: "none",
                                          borderRadius: "6px",
                                          cursor: "pointer",
                                          fontSize: "14px"
                                        }}
                                      >
                                        🗑️ Remover
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <label>
                            🗂️ Categorias Selecionadas:
                            <span 
                              className="tooltip-icon"
                              onMouseEnter={(e) => showTooltip(e, "🗂️ Categorias", "Escolha as categorias que melhor descrevem o tipo de viagem e atividades que pretende realizar.")}
                              onMouseLeave={hideTooltip}
                            >
                              ?
                            </span>
                          </label>
                          <p style={{ 
                            padding: "12px 16px", 
                            backgroundColor: "#f8f9fa", 
                            borderRadius: "8px",
                            border: "1px solid #e9ecef",
                            margin: "8px 0 12px 0"
                          }}>
                            {newTravel.category.length > 0 ? newTravel.category.join(", ") : "Nenhuma categoria selecionada"}
                          </p>
                          <button 
                            type="button" 
                            onClick={() => setIsCategoryModalOpen(true)}
                            style={{
                              backgroundColor: "#6f42c1",
                              color: "white"
                            }}
                          >
                            🏷️ Selecionar Categorias
                          </button>
                        </div>
                      </div>

                      <div className="">
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                          <div>
                            <label>
                              📅 Data de Início: *
                              <span 
                                className="tooltip-icon"
                                onMouseEnter={(e) => showTooltip(e, "📅 Data de Início", "Selecione o dia em que pretende iniciar a sua viagem. Deve ser pelo menos um dia depois de hoje.")}
                                onMouseLeave={hideTooltip}
                              >
                                ?
                              </span>
                            </label>
                            <input
                              type="date"
                              name="startDate"
                              value={newTravel.startDate}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div>
                            <label>
                              📅 Data de Fim: *
                              <span 
                                className="tooltip-icon"
                                onMouseEnter={(e) => showTooltip(e, "📅 Data de Fim", "Selecione o último dia da sua viagem. Deve ser posterior à data de início.")}
                                onMouseLeave={hideTooltip}
                              >
                                ?
                              </span>
                            </label>
                            <input
                              type="date"
                              name="endDate"
                              value={newTravel.endDate}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <br></br>
                          <label>
                            📅 Data Prevista de Reserva/Pagamento:
                            <span 
                              className="tooltip-icon"
                              onMouseEnter={(e) => showTooltip(e, "📅 Data de Reserva", "Defina uma data limite para fazer as reservas e pagamentos da viagem (hotéis, voos, atividades).")}
                              onMouseLeave={hideTooltip}
                            >
                              ?
                            </span>
                          </label>
                          <input
                            type="date"
                            name="BookingTripPaymentDate"
                            value={newTravel.BookingTripPaymentDate}
                            onChange={handleChange}
                          />
                        </div>

                        <div>
                          <br></br>
                          <label>
                            📖 Descrição Curta do Plano:
                            <span 
                              className="tooltip-icon"
                              onMouseEnter={(e) => showTooltip(e, "📖 Descrição do Plano", "Escreva uma breve descrição dos principais objetivos e atividades planeadas para esta viagem.")}
                              onMouseLeave={hideTooltip}
                            >
                              ?
                            </span>
                          </label>
                          <textarea
                            name="description"
                            value={newTravel.description}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Introduza uma descrição curta do plano"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal de Categorias */}
                {isCategoryModalOpen && (
                  <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
                    <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                      <h3>🗂️ Selecionar Categorias</h3>
                      <div className="category-list">
                        {categories.map((cat) => {
                          const isSelected = newTravel.category.includes(cat);
                          return (
                            <label
                              key={cat}
                              className="category-item"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #007bff' : '1px solid #e9ecef',
                                background: isSelected ? '#f0f8ff' : 'transparent',
                                marginBottom: '8px'
                              }}
                            >
                              <input
                                type="checkbox"
                                name="category"
                                value={cat}
                                checked={isSelected}
                                onChange={handleChange}
                                style={{ transform: 'scale(1.05)' }}
                              />
                              <span style={{ margin: 0 }}>{cat}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div className="modal-actions">
                        <button type="button" onClick={() => setIsCategoryModalOpen(false)}>
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {activeTab === "prices" && (
                <div>
                 

                  {/* Seção visual para destino único */}
                  {newTravel.travelType?.main === 'single' && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f0f8ff", 
                      borderRadius: "8px",
                      border: "1px solid #007bff"
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold", color: "#007bff" }}>
                        💰 Preços Estimados - Viagem a Destino Único:
                      </label>
                      <div style={{ 
                        padding: "10px", 
                        backgroundColor: "#e8f4fd", 
                        borderRadius: "5px",
                        textAlign: "center"
                      }}>
                        <strong>📍 Destino: </strong>
                        {newTravel.city && newTravel.country 
                          ? `${newTravel.city}, ${newTravel.country}`
                          : "Selecione o destino na aba 'Informações Gerais'"
                        }
                      </div>
                    </div>
                  )}
                  
                  {/* Seletor de destino para viagens multidestino */}
                  {newTravel.travelType?.main === 'multi' && multiDestinations.length > 0 && (
                    <div style={{ 
                      marginBottom: "25px", 
                      padding: "15px", 
                      backgroundColor: "#f8f9fa", 
                      borderRadius: "8px" 
                    }}>
                      <label style={{ display: "block", marginBottom: "10px", fontWeight: "bold" }}>
                        🎯 Selecione o destino para adicionar preços estimados:
                      </label>
                      <select
                        value={selectedDestinationIndex}
                        onChange={(e) => setSelectedDestinationIndex(parseInt(e.target.value))}
                        style={{ width: "100%", padding: "10px", borderRadius: "5px" }}
                      >
                        <option value="">Selecione um destino</option>
                        {multiDestinations.map((dest, index) => (
                          <option key={dest.id} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está adicionando preços */}
                  {newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" && (
                    <div style={{ 
                      marginBottom: "15px", 
                      padding: "10px", 
                      backgroundColor: "#e8f4fd", 
                      borderRadius: "5px",
                      textAlign: "center"
                    }}>
                      <strong>💰 A adicionar preços para: </strong>
                      {multiDestinations[selectedDestinationIndex]?.city && multiDestinations[selectedDestinationIndex]?.country
                        ? `${multiDestinations[selectedDestinationIndex].city}, ${multiDestinations[selectedDestinationIndex].country}`
                        : "Destino não definido - Adicione país e cidade primeiro"
                      }
                    </div>
                  )}

                  <div className="LeftPosition">
                    <label>💰 Preços Estimados da Viagem:</label>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          🏨 Estadia (€):
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "🏨 Estadia", "Introduza o custo estimado do alojamento (hotéis, pousadas, Airbnb, etc.). Inclua todas as noites da viagem.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        <input
                          type="number"
                          name="priceDetails.hotel"
                          value={
                            newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" 
                              ? multiDestinations[selectedDestinationIndex]?.priceDetails?.hotel || ""
                              : newTravel.priceDetails.hotel
                          }
                          onChange={(e) => {
                            if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                              const destIndex = selectedDestinationIndex;
                              const destination = multiDestinations[destIndex];
                              
                              // Verificar se país e cidade estão definidos
                              if (!destination?.country || !destination?.city) {
                                alert("Por favor, defina primeiro o país e a cidade para este destino antes de adicionar preços.");
                                return;
                              }
                              
                              updateDestinationPrices(destination.id, 'hotel', e.target.value);
                            } else {
                              updateSingleDestinationPrices('hotel', e.target.value);
                            }
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          🍽️ Alimentação (€):
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "🍽️ Alimentação", "Estimativa de gastos com refeições (restaurantes, lanches, compras no supermercado). Considere todas as refeições da viagem.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        <input
                          type="number"
                          name="priceDetails.food"
                          value={
                            newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" 
                              ? multiDestinations[selectedDestinationIndex]?.priceDetails?.food || ""
                              : newTravel.priceDetails.food
                          }
                          onChange={(e) => {
                            if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                              const destIndex = selectedDestinationIndex;
                              const destination = multiDestinations[destIndex];
                              
                              // Verificar se país e cidade estão definidos
                              if (!destination?.country || !destination?.city) {
                                alert("Por favor, defina primeiro o país e a cidade para este destino antes de adicionar preços.");
                                return;
                              }
                              
                              updateDestinationPrices(destination.id, 'food', e.target.value);
                            } else {
                              updateSingleDestinationPrices('food', e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                       <br></br>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          🚗 Transportes (€):
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "🚗 Transportes", "Custos de transporte (avião, comboio, autocarros, táxis, aluguer de carro, combustível, etc.). Inclua ida e volta.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        <input
                          type="number"
                          name="priceDetails.transport"
                          value={
                            newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" 
                              ? multiDestinations[selectedDestinationIndex]?.priceDetails?.transport || ""
                              : newTravel.priceDetails.transport
                          }
                          onChange={(e) => {
                            if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                              const destIndex = selectedDestinationIndex;
                              const destination = multiDestinations[destIndex];
                              
                              // Verificar se país e cidade estão definidos
                              if (!destination?.country || !destination?.city) {
                                alert("Por favor, defina primeiro o país e a cidade para este destino antes de adicionar preços.");
                                return;
                              }
                              
                              updateDestinationPrices(destination.id, 'transport', e.target.value);
                            } else {
                              updateSingleDestinationPrices('transport', e.target.value);
                            }
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <br></br>
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          🎁 Extras (€):
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "🎁 Extras", "Gastos adicionais como souvenirs, atividades extras, entradas em museus, passeios, compras, seguros de viagem, etc.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        <input
                          type="number"
                          name="priceDetails.extras"
                          value={
                            newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" 
                              ? multiDestinations[selectedDestinationIndex]?.priceDetails?.extras || ""
                              : newTravel.priceDetails.extras
                          }
                          onChange={(e) => {
                            if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                              const destIndex = selectedDestinationIndex;
                              const destination = multiDestinations[destIndex];
                              
                              // Verificar se país e cidade estão definidos
                              if (!destination?.country || !destination?.city) {
                                alert("Por favor, defina primeiro o país e a cidade para este destino antes de adicionar preços.");
                                return;
                              }
                              
                              updateDestinationPrices(destination.id, 'extras', e.target.value);
                            } else {
                              updateSingleDestinationPrices('extras', e.target.value);
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Preço total do destino selecionado para multidestino */}
                    {newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "" && (
                      <div className="RightPositionY">
                        <br></br>
                        <label>💰 Preço Total Estimado do Destino (€):</label>
                        <input
                          type="number"
                          value={calculateDestinationTotal(selectedDestinationIndex) || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                        />
                      </div>
                    )}
<br></br>
                    {/* Preço total para destino único */}
                    {newTravel.travelType?.main !== 'multi' && (
                      <div className="RightPositionY">
                        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                          💰 Preço Total Estimado (€):
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#28a745", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "💰 Preço Total", "Este valor é calculado automaticamente somando os custos de estadia, alimentação, transportes e extras.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        
                        <input
                          type="number"
                          value={calculateSingleDestinationTotal() || ""}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                        />

                        <br></br><br></br><br></br>
                      </div>
                      
                    )}

                  </div>
                  <div className="RightPosition">
                    {/* Resumo visual para viagem de destino único */}
                    {newTravel.travelType?.main === 'single' && newTravel.city && newTravel.country && (
                      <div style={{ 
                        marginTop: "30px", 
                        padding: "20px", 
                        backgroundColor: "#f0f8ff", 
                        borderRadius: "10px",
                        border: "2px solid #007bff"
                      }}>
                        <h3 style={{ 
                          color: "#007bff", 
                          marginBottom: "20px",
                          textAlign: "center",
                          fontSize: "20px"
                        }}>
                          💰 Resumo da Viagem a Destino Único
                        </h3>
                        
                        {/* Detalhes do destino */}
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                            📍 Destino:
                          </h4>
                          <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "15px",
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            border: "1px solid #007bff",
                            marginBottom: "15px"
                          }}>
                            <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                              🏙️ {newTravel.city}, {newTravel.country}
                            </span>
                          </div>
                        </div>

                        {/* Breakdown de preços */}
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                            Breakdown de Preços:
                          </h4>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              backgroundColor: "#fff",
                              borderRadius: "5px",
                              border: "1px solid #ddd"
                            }}>
                              <span>🏨 Estadia:</span>
                              <span style={{ fontWeight: "bold", color: "#007bff" }}>
                                {parseFloat(newTravel.priceDetails.hotel || 0) > 0 ? `${newTravel.priceDetails.hotel}€` : "0€"}
                              </span>
                            </div>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              backgroundColor: "#fff",
                              borderRadius: "5px",
                              border: "1px solid #ddd"
                            }}>
                              <span>🍽️ Alimentação:</span>
                              <span style={{ fontWeight: "bold", color: "#007bff" }}>
                                {parseFloat(newTravel.priceDetails.food || 0) > 0 ? `${newTravel.priceDetails.food}€` : "0€"}
                              </span>
                            </div>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              backgroundColor: "#fff",
                              borderRadius: "5px",
                              border: "1px solid #ddd"
                            }}>
                              <span>🚗 Transportes:</span>
                              <span style={{ fontWeight: "bold", color: "#007bff" }}>
                                {parseFloat(newTravel.priceDetails.transport || 0) > 0 ? `${newTravel.priceDetails.transport}€` : "0€"}
                              </span>
                            </div>
                            <div style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              backgroundColor: "#fff",
                              borderRadius: "5px",
                              border: "1px solid #ddd"
                            }}>
                              <span>🎁 Extras:</span>
                              <span style={{ fontWeight: "bold", color: "#007bff" }}>
                                {parseFloat(newTravel.priceDetails.extras || 0) > 0 ? `${newTravel.priceDetails.extras}€` : "0€"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Total geral */}
                        <div style={{ 
                          textAlign: "center", 
                          padding: "15px",
                          backgroundColor: "#007bff",
                          borderRadius: "8px",
                          color: "#fff"
                        }}>
                          <h3 style={{ margin: 0, fontSize: "24px" }}>
                            💰 Preço Total Estimado: {calculateSingleDestinationTotal()}€
                          </h3>
                        </div>
                      </div>
                    )}

                    {/* Preço total de toda a viagem multidestino */}
                    {newTravel.travelType?.main === 'multi' && multiDestinations.length > 0 && (
                      <div style={{ 
                        marginTop: "30px", 
                        padding: "20px", 
                        backgroundColor: "#f0fff4", 
                        borderRadius: "10px",
                        border: "2px solid #28a745"
                      }}>
                        <h3 style={{ 
                          color: "#28a745", 
                          marginBottom: "20px",
                          textAlign: "center",
                          fontSize: "20px"
                        }}>
                          💰 Resumo Total da Viagem Multidestino
                        </h3>
                        
                        {/* Lista de preços por destino */}
                        <div style={{ marginBottom: "20px" }}>
                          <h4 style={{ color: "#2c3e50", marginBottom: "15px" }}>
                            Preços por Destino:
                          </h4>
                          {multiDestinations.map((dest, index) => {
                            const price = parseFloat(dest.price || 0);
                            return (
                              <div 
                                key={dest.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "10px",
                                  backgroundColor: "#fff",
                                  borderRadius: "5px",
                                  border: "1px solid #ddd",
                                  marginBottom: "10px"
                                }}
                              >
                                <span style={{ fontWeight: "bold" }}>
                                  📍 {dest.city}, {dest.country}
                                </span>
                                <span style={{ 
                                  fontWeight: "bold", 
                                  color: "#28a745",
                                  fontSize: "16px"
                                }}>
                                  {price > 0 ? `${price}€` : "Não definido"}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Total geral */}
                        <div style={{ 
                          textAlign: "center", 
                          padding: "15px",
                          backgroundColor: "#28a745",
                          borderRadius: "8px",
                          color: "#fff"
                        }}>
                          <h3 style={{ margin: 0, fontSize: "24px" }}>
                            💰 Preço Total Estimado: {
                              multiDestinations.reduce((total, dest) => {
                                return total + parseFloat(dest.price || 0);
                              }, 0)
                            }€
                          </h3>
                        </div>
                      </div>
                    )}
                    </div>
                </div>

              )}

              {activeTab === "accommodation" && (
                <div className="form-group-CenterPosition">
                  <label>Alojamento Planeado (Opcional):</label>
                  
                  {/* Seletor de destino para viagens multidestino */}
                  {newTravel.travelType?.main === 'multi' && multiDestinations.length > 0 && (
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
                          <option key={dest.id} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mostrar para qual destino está adicionando */}
                  {newTravel.travelType?.main === 'multi' && (
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

                  {/* Formulário de alojamento */}
                  {(newTravel.travelType?.main !== 'multi' ? newTravel.accommodations : 
                    selectedDestinationIndex === "" 
                      ? [] 
                      : multiDestinations[selectedDestinationIndex]?.accommodations || []
                  ).map((accommodation, index) => (
                    <div key={index} className="accommodation-section">
                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                        Nome do Alojamento:
                        <span 
                          style={{ 
                            display: "inline-block",
                            width: "16px", 
                            height: "16px", 
                            backgroundColor: "#fd7e14", 
                            color: "white", 
                            borderRadius: "50%", 
                            textAlign: "center", 
                            fontSize: "12px", 
                            lineHeight: "16px", 
                            cursor: "help"
                          }}
                          onMouseEnter={(e) => showTooltip(e, "🏨 Nome do Alojamento", "Introduza o nome do hotel, pousada, Airbnb ou outro local onde pretende ficar hospedado.")}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>
                      </label>
                      <input
                        type="text"
                        name={`accommodations${index}.name`}
                        value={accommodation.name}
                        onChange={(e) => {
                          if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                            // Atualizar alojamento do destino específico
                            const destIndex = selectedDestinationIndex;
                            const updatedAccommodations = [...multiDestinations[destIndex].accommodations];
                            updatedAccommodations[index] = { ...updatedAccommodations[index], name: e.target.value };
                            updateDestinationData(multiDestinations[destIndex].id, 'accommodations', updatedAccommodations);
                          } else {
                            // Atualizar alojamento do destino principal
                            handleChange(e);
                          }
                        }}
                        placeholder="Ex.: Hotel Pestana"
                        style={{ width: "100%", marginBottom: "10px" }}
                      />

                      <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                        Tipo de Alojamento:
                        <span 
                          style={{ 
                            display: "inline-block",
                            width: "16px", 
                            height: "16px", 
                            backgroundColor: "#fd7e14", 
                            color: "white", 
                            borderRadius: "50%", 
                            textAlign: "center", 
                            fontSize: "12px", 
                            lineHeight: "16px", 
                            cursor: "help"
                          }}
                          onMouseEnter={(e) => showTooltip(e, "🏠 Tipo de Alojamento", "Selecione o tipo de alojamento que melhor descreve onde irá ficar (hotel, hostel, apartamento, etc.).")}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>
                      </label>
                      <select
                        name={`accommodations${index}.type`}
                        value={accommodation.type}
                        onChange={(e) => {
                          if (newTravel.travelType?.main === 'multi' && selectedDestinationIndex !== "") {
                            // Atualizar tipo do destino específico
                            const destIndex = selectedDestinationIndex;
                            const updatedAccommodations = [...multiDestinations[destIndex].accommodations];
                            updatedAccommodations[index] = { ...updatedAccommodations[index], type: e.target.value };
                            updateDestinationData(multiDestinations[destIndex].id, 'accommodations', updatedAccommodations);
                          } else {
                            // Atualizar tipo do destino principal
                            handleChange(e);
                          }
                        }}
                        style={{ width: "100%", marginBottom: "10px" }}
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="Hotel">Hotel</option>
                        <option value="Hostel">Hostel</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Pousada">Pousada</option>
                        <option value="Casa de Férias">Casa de Férias</option>
                      </select>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "transport" && (
                <div className="form-group-CenterPosition">
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                    Métodos de Transporte Planeado:
                    <span 
                      style={{ 
                        display: "inline-block",
                        width: "16px", 
                        height: "16px", 
                        backgroundColor: "#20c997", 
                        color: "white", 
                        borderRadius: "50%", 
                        textAlign: "center", 
                        fontSize: "12px", 
                        lineHeight: "16px", 
                        cursor: "help"
                      }}
                      onMouseEnter={(e) => showTooltip(e, "🚗 Métodos de Transporte", "Selecione os meios de transporte que pretende utilizar durante a viagem (avião, comboio, autocarro, carro alugado, etc.).")}
                      onMouseLeave={hideTooltip}
                    >
                      ?
                    </span>
                  </label>
                  <p>
                    {newTravel.localTransport.length > 0
                      ? newTravel.localTransport.map(transport => 
                          typeof transport === 'string' ? transport : `${transport.name} - ${transport.type} (${transport.price})`
                        ).join(", ")
                      : "Nenhum método selecionado"}
                  </p>
                  <button type="button" onClick={() => setIsTransportModalOpen(true)}>
                    Selecionar Métodos de Transporte
                  </button>

                  {isTransportModalOpen && (
                    <div className="modal-overlay" onClick={() => setIsTransportModalOpen(false)}>
                      <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>🚗 Selecionar Métodos de Transporte</h3>
                        <div className="category-list">
                          {transportOptions.map((option) => (
                            <label key={option} className="category-item">
                              <input
                                type="checkbox"
                                name="localTransport"
                                value={option}
                                checked={newTravel.localTransport.some(t => 
                                  typeof t === 'string' ? t === option : t.name === option
                                )}
                                onChange={handleChange}
                              />
                              <span>{option}</span>
                            </label>
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
              )}

              {activeTab === "pointsOfInterest" && (
                <div>
                  {/* Seletor de destino para viagens multidestino */}
                  {newTravel.travelType?.main === 'multi' && multiDestinations.length > 0 && (
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
                          <option key={dest.id} value={index}>
                            Destino {index + 1}: {dest.city}, {dest.country}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="RightPosition">
                    <h3>Pontos de Referência Planeados</h3>
                    
                    {/* Mostrar para qual destino está visualizando */}
                    {newTravel.travelType?.main === 'multi' && (
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

                    {(newTravel.travelType?.main !== 'multi' ? newTravel.pointsOfInterest : 
                      selectedDestinationIndex === "" 
                        ? [] 
                        : multiDestinations[selectedDestinationIndex]?.pointsOfInterest || []
                    ).length > 0 ? (
                      <ul style={{ listStyle: "none", padding: "0" }}>
                        {(newTravel.travelType?.main !== 'multi' ? newTravel.pointsOfInterest : 
                          selectedDestinationIndex === "" 
                            ? [] 
                            : multiDestinations[selectedDestinationIndex]?.pointsOfInterest || []
                        ).map((point, index) => (
                          <li
                            key={index}
                            style={{ marginBottom: "10px", padding: "10px", border: "1px solid #e9ecef", borderRadius: "4px" }}
                          >
                            <strong>{point.name}</strong> ({point.type || "Sem tipo"})
                            <br />
                            {point.link && (
                              <a href={point.link} target="_blank" rel="noopener noreferrer">
                                {point.link}
                              </a>
                            )}
                            <div style={{ marginTop: "5px" }}>
                              <button
                                onClick={(e) => handleEditPointOfInterest(e, index)}
                                style={{
                                  marginRight: "10px",
                                  padding: "5px 10px",
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeletePointOfInterest(e, index)}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "#dc3545",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                }}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum ponto de referência planeado adicionado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      Nome do Ponto de Referência:
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#ffc107", 
                          color: "black", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "12px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "📍 Ponto de Referência", "Introduza o nome do local que pretende visitar (monumentos, museus, restaurantes, praias, etc.).")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newPointOfInterest.name}
                      onChange={handlePointChange}
                      placeholder="Ex.: Torre Eiffel"
                    />

                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                     <br></br>
                      Tipo:
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#ffc107", 
                          color: "black", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "12px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "🏷️ Tipo de Local", "Selecione a categoria que melhor descreve o tipo de local (monumento, museu, restaurante, natureza, etc.).")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </label>
                    <select
                      name="type"
                      value={newPointOfInterest.type}
                      onChange={handlePointChange}
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Monumento histórico">Monumento histórico</option>
                      <option value="Parque">Parque</option>
                      <option value="Museu">Museu</option>
                      <option value="Praia">Praia</option>
                      <option value="Mercado">Mercado</option>
                    </select>
<br></br><br></br>
                    <button
                      onClick={(e) => handleAddOrEditPointOfInterest(e)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "10px",
                      }}
                      disabled={!newPointOfInterest.name.trim()}
                    >
                      
                      {editingPointIndex !== null ? "Guardar Alterações" : "Adicionar"}
                    </button>
                    {editingPointIndex !== null && (
                      <button
                        onClick={(e) => handleCancelEditPoint(e)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "itinerary" && (
                <div>
                  <div className="RightPosition">
                    <h3>Itinerário planeado da Viagem</h3>
                    <p>
                      <strong>Duração Total:</strong> {calculateTripDays()} dias
                    </p>
                    {newTravel.itinerary.length > 0 ? (
                      <ul style={{ listStyle: "none", padding: 0 }}>
                        {newTravel.itinerary.map((item, index) => (
                          <li
                            key={index}
                            style={{ marginBottom: "10px", padding: "10px", border: "1px solid #e9ecef", borderRadius: "4px" }}
                          >
                            <strong>Dia {item.day}:</strong>
                            <ul style={{ paddingLeft: "20px" }}>
                              {item.activities.map((activity, actIndex) => (
                                <li key={actIndex}>{activity}</li>
                              ))}
                            </ul>
                            <div style={{ marginTop: "5px" }}>
                              <button
                                onClick={(e) => handleEditItineraryDay(e, index)}
                                style={{
                                  marginRight: "10px",
                                  padding: "5px 10px",
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteItineraryDay(e, index)}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "#dc3545",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                }}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum dia adicionado ao itinerário planeado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      Dia:
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#795548", 
                          color: "white", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "12px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "📅 Dia da Viagem", "Especifique em que dia da viagem pretende realizar estas atividades (1 = primeiro dia, 2 = segundo dia, etc.).")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </label>
                    <input
                      type="number"
                      name="day"
                      value={newItineraryDay.day}
                      onChange={handleItineraryChange}
                      min="1"
                      max={calculateTripDays()}
                      placeholder={`Introduza um número entre 1 e ${calculateTripDays()}`}
                    />
                    {itineraryError && <p style={{ color: "red", marginBottom: "10px" }}>{itineraryError}</p>}
<br></br><br></br>
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                      Atividades Planeadas:
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "16px", 
                          height: "16px", 
                          backgroundColor: "#795548", 
                          color: "white", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "12px", 
                          lineHeight: "16px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "📝 Atividades Planeadas", "Descreva as atividades que pretende realizar neste dia (visitas, passeios, refeições especiais, etc.).")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </label>
                    {newItineraryDay.activities.map((activity, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                        <input
                          type="text"
                          name={`activity-${index}`}
                          value={activity}
                          onChange={(e) => handleItineraryChange(e, index)}
                          placeholder="Ex.: Visita à Torre Eiffel"
                        />
                        {newItineraryDay.activities.length > 1 && (
                          <button
                            onClick={(e) => handleRemoveActivityField(e, index)}
                            style={{
                              marginLeft: "10px",
                              padding: "5px 10px",
                              backgroundColor: "#dc3545",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                            }}
                          >
                            -
                          </button>
                        )}
                      </div>
                    ))}
                    <br></br>
                    <button
                      onClick={handleAddActivityField}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#28a745",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "10px",
                      }}
                    >
                      + Adicionar Atividade
                    </button>

                    <button
                      onClick={(e) => handleAddOrEditItineraryDay(e)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "10px",
                      }}
                      disabled={!newItineraryDay.day || newItineraryDay.activities.every((act) => !act.trim())}
                    >
                      {editingItineraryDay !== null ? "Guardar Alterações" : "Adicionar Dia"}
                    </button>
                    {editingItineraryDay !== null && (
                      <button
                        onClick={(e) => handleCancelEditItinerary(e)}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#6c757d",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "checklist" && (
                <div>
                  <div className="RightPosition">
                    <h3 style={{ 
                      color: "#2c3e50", 
                      marginBottom: "20px",
                      textAlign: "center",
                      fontSize: "24px"
                    }}>✅ Checklist de Viagem</h3>
                    <p style={{ 
                      textAlign: "center", 
                      color: "#666",
                      marginBottom: "20px",
                      fontSize: "16px"
                    }}>
                      Marque os itens que já preparou para a sua viagem
                    </p>
                    {newTravel.checklist.length > 0 ? (
                      <ul style={{ 
                        listStyle: "none", 
                        padding: 0,
                        width: "100%"
                      }}>
                        {newTravel.checklist.map((item, index) => (
                          <li key={index} style={{ 
                            marginBottom: "15px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "10px",
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                            transition: "all 0.3s ease"
                          }}>
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleChecklistItem(index)}
                              style={{ 
                                marginRight: "15px",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer"
                              }}
                            />
                            <span style={{ 
                              fontSize: "16px",
                              color: item.checked ? "#28a745" : "#2c3e50",
                              textDecoration: item.checked ? "line-through" : "none",
                              transition: "all 0.3s ease",
                              textAlign: "center",
                              flex: 1
                            }}>
                              {item.name}
                            </span>
                            <div style={{ 
                              marginLeft: "15px",
                              display: "flex",
                              gap: "10px"
                            }}>
                              <button
                                onClick={(e) => handleEditChecklistItem(e, index)}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  transition: "background-color 0.3s"
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = "#0056b3"}
                                onMouseOut={(e) => e.target.style.backgroundColor = "#007bff"}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteChecklistItem(e, index)}
                                style={{
                                  padding: "5px 10px",
                                  backgroundColor: "#dc3545",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  transition: "background-color 0.3s"
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                                onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ textAlign: "center", color: "#666" }}>Nenhum item adicionado à checklist ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div style={{ 
                      
                      borderRadius: "10px",
                      marginBottom: "20px"
                    }}>
                      <label style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        gap: "5px",
                        marginBottom: "10px",
                        fontSize: "16px",
                        color: "#2c3e50"
                      }}>
                        Item da Checklist:
                        <span 
                          style={{ 
                            display: "inline-block",
                            width: "16px", 
                            height: "16px", 
                            backgroundColor: "#6f42c1", 
                            color: "white", 
                            borderRadius: "50%", 
                            textAlign: "center", 
                            fontSize: "12px", 
                            lineHeight: "16px", 
                            cursor: "help"
                          }}
                          onMouseEnter={(e) => showTooltip(e, "Item da Checklist", "Adicione itens importantes para não esquecer na sua viagem (ex: passaporte, medicamentos, carregadores, roupa adequada).")}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>
                      </label>
                      <input
                        type="text"
                        value={newChecklistItem}
                        onChange={handleChecklistChange}
                        placeholder="Ex: Levar protetor solar"
                        style={{
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #ddd",
                          marginBottom: "15px"
                        }}
                      />

                      <div style={{ 
                        display: "flex",
                        gap: "10px",
                        justifyContent: "center"
                      }}>
                        <button
                          onClick={(e) => handleAddOrEditChecklistItem(e)}
                          style={{
                            padding: "10px 20px",
                            backgroundColor: "#28a745",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            transition: "background-color 0.3s",
                            fontSize: "16px"
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
                          onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
                          disabled={!newChecklistItem.trim()}
                        >
                          {editingChecklistIndex !== null ? "Guardar Alterações" : "Adicionar Item"}
                        </button>
                        {editingChecklistIndex !== null && (
                          <button
                            onClick={(e) => handleCancelEditChecklist(e)}
                            style={{
                              padding: "10px 20px",
                              backgroundColor: "#6c757d",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              transition: "background-color 0.3s",
                              fontSize: "16px"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#5a6268"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#6c757d"}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "group" && newTravel.travelType?.isGroup && (
                <div>
                  <div style={{ 
                    textAlign: "center", 
                    marginBottom: "30px",
                    padding: "20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "10px",
                    border: "1px solid #e9ecef"
                  }}>
                    <h3 style={{ 
                      color: "#2c3e50", 
                      marginBottom: "15px",
                      fontSize: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px"
                    }}>
                      👥 Gestão do Grupo de Viagem
                      <span 
                        style={{ 
                          display: "inline-block",
                          width: "20px", 
                          height: "20px", 
                          backgroundColor: "#28a745", 
                          color: "white", 
                          borderRadius: "50%", 
                          textAlign: "center", 
                          fontSize: "14px", 
                          lineHeight: "20px", 
                          cursor: "help"
                        }}
                        onMouseEnter={(e) => showTooltip(e, "👥 Gestão do Grupo de Viagem", "Crie e gira um grupo de viagem colaborativo. Convide amigos para planear a viagem em conjunto, partilhar ideias e dividir responsabilidades na organização.")}
                        onMouseLeave={hideTooltip}
                      >
                        ?
                      </span>
                    </h3>
                    <p style={{ 
                      color: "#666",
                      fontSize: "16px",
                      marginBottom: "10px"
                    }}>
                      Convide amigos para planear esta viagem em conjunto. 
                      Os membros poderão colaborar na edição do plano de viagem.
                    </p>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "center", 
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "15px"
                    }}>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        👤 Administrador: Tiago
                      </span>
                      <span style={{ color: "#666" }}>
                        | 👥 Membros: {groupMembers.length}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                    {/* Lado esquerdo - Adicionar membros */}
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <h4 style={{ 
                        color: "#2c3e50", 
                        marginBottom: "20px",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}>
                        ➕ Adicionar Membros ao Grupo
                        <span 
                          style={{ 
                            display: "inline-block",
                            width: "18px", 
                            height: "18px", 
                            backgroundColor: "#007bff", 
                            color: "white", 
                            borderRadius: "50%", 
                            textAlign: "center", 
                            fontSize: "12px", 
                            lineHeight: "18px", 
                            cursor: "help"
                          }}
                          onMouseEnter={(e) => showTooltip(e, "➕ Adicionar Membros ao Grupo", "Pesquise e convide amigos para se juntarem ao grupo de viagem. Introduza o nome ou email do utilizador que pretende adicionar à viagem.")}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>
                      </h4>
                      
                      <div style={{ marginBottom: "20px" }}>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          marginBottom: "10px",
                          fontSize: "16px",
                          color: "#2c3e50"
                        }}>
                          🔍 Buscar utilizadores:
                          <span 
                            style={{ 
                              display: "inline-block",
                              width: "16px", 
                              height: "16px", 
                              backgroundColor: "#17a2b8", 
                              color: "white", 
                              borderRadius: "50%", 
                              textAlign: "center", 
                              fontSize: "12px", 
                              lineHeight: "16px", 
                              cursor: "help"
                            }}
                            onMouseEnter={(e) => showTooltip(e, "🔍 Buscar Utilizadores", "Introduza o nome de utilizador ou endereço de email da pessoa que pretende convidar para o grupo de viagem. O sistema irá procurar utilizadores registados na plataforma.")}
                            onMouseLeave={hideTooltip}
                          >
                            ?
                          </span>
                        </label>
                        <input
                          type="text"
                          value={newMemberEmail}
                          onChange={handleMemberEmailChange}
                          placeholder="Introduza o nome ou email do utilizador..."
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "1px solid #ddd",
                            fontSize: "16px"
                          }}
                        />
                        
                        {isLoadingUsers && (
                          <div style={{ 
                            marginTop: "10px", 
                            color: "#666",
                            textAlign: "center"
                          }}>
                            🔄 Procurando utilizadores...
                          </div>
                        )}

                        {/* Lista de utilizadores encontrados */}
                        {availableUsers.length > 0 && (
                          <div style={{ 
                            marginTop: "15px",
                            border: "1px solid #e9ecef",
                            borderRadius: "8px",
                            backgroundColor: "#fff",
                            maxHeight: "200px",
                            overflowY: "auto"
                          }}>
                            {availableUsers.map((user) => (
                              <div 
                                key={user.id}
                                onClick={() => addMemberToGroup(user)}
                                style={{
                                  padding: "12px",
                                  borderBottom: "1px solid #f8f9fa",
                                  cursor: "pointer",
                                  transition: "background-color 0.3s",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px"
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = "#f8f9fa"}
                                onMouseOut={(e) => e.target.style.backgroundColor = "transparent"}
                              >
                                <div style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "18px",
                                  fontWeight: "bold"
                                }}>
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                                    {user.name}
                                  </div>
                                  <div style={{ fontSize: "14px", color: "#666" }}>
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {groupMembers.length > 0 && (
                        <div style={{ marginTop: "30px" }}>
                          <button
                            onClick={sendGroupInvites}
                            style={{
                              width: "100%",
                              padding: "15px",
                              backgroundColor: "#28a745",
                              color: "#fff",
                              border: "none",
                              borderRadius: "8px",
                              fontSize: "16px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "background-color 0.3s"
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
                            onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
                          >
                            📨 Enviar Convites ({groupMembers.length})
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Lado direito - Membros do grupo */}
                    <div style={{ flex: 1, minWidth: "300px" }}>
                      <h4 style={{ 
                        color: "#2c3e50", 
                        marginBottom: "20px",
                        fontSize: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}>
                        👥 Membros do Grupo ({groupMembers.length})
                        <span 
                          style={{ 
                            display: "inline-block",
                            width: "18px", 
                            height: "18px", 
                            backgroundColor: "#6f42c1", 
                            color: "white", 
                            borderRadius: "50%", 
                            textAlign: "center", 
                            fontSize: "12px", 
                            lineHeight: "18px", 
                            cursor: "help"
                          }}
                          onMouseEnter={(e) => showTooltip(e, "👥 Membros do Grupo", "Lista de todos os membros que fazem parte do grupo de viagem. Os membros podem colaborar na edição do plano, adicionar sugestões e partilhar responsabilidades.")}
                          onMouseLeave={hideTooltip}
                        >
                          ?
                        </span>
                      </h4>
                      
                      {groupMembers.length === 0 ? (
                        <div style={{ 
                          textAlign: "center",
                          padding: "40px 20px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          color: "#666"
                        }}>
                          <div style={{ fontSize: "48px", marginBottom: "15px" }}>👥</div>
                          <p>Nenhum membro adicionado ainda.</p>
                          <p style={{ fontSize: "14px" }}>
                            Use a busca ao lado para encontrar e adicionar amigos ao grupo!
                          </p>
                        </div>
                      ) : (
                        <div style={{ 
                          display: "flex",
                          flexDirection: "column",
                          gap: "15px"
                        }}>
                          {groupMembers.map((member, index) => (
                            <div 
                              key={member.id}
                              style={{
                                padding: "15px",
                                border: "1px solid #e9ecef",
                                borderRadius: "8px",
                                backgroundColor: "#fff",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                                <div style={{
                                  width: "50px",
                                  height: "50px",
                                  borderRadius: "50%",
                                  backgroundColor: "#007bff",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "20px",
                                  fontWeight: "bold"
                                }}>
                                  {member.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ 
                                    fontWeight: "bold", 
                                    color: "#2c3e50",
                                    fontSize: "16px"
                                  }}>
                                    {member.name}
                                  </div>
                                  <div style={{ 
                                    fontSize: "14px", 
                                    color: "#666",
                                    marginBottom: "5px"
                                  }}>
                                    {member.email}
                                  </div>
                                  <div style={{ 
                                    fontSize: "12px",
                                    color: member.status === 'pending' ? "#ffc107" : "#28a745",
                                    fontWeight: "bold"
                                  }}>
                                    {member.status === 'pending' && "⏳ Convite pendente"}
                                    {member.status === 'sent' && "📨 Convite enviado"}
                                    {member.status === 'accepted' && "✅ Aceito"}
                                    {member.status === 'rejected' && "❌ Rejeitado"}
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => removeMemberFromGroup(member.id)}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: "#dc3545",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "6px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  transition: "background-color 0.3s"
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = "#c82333"}
                                onMouseOut={(e) => e.target.style.backgroundColor = "#dc3545"}
                              >
                                🗑️ Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Informações sobre convites enviados */}
                      {sentInvites.length > 0 && (
                        <div style={{ 
                          marginTop: "30px",
                          padding: "20px",
                          backgroundColor: "#d4edda",
                          borderRadius: "8px",
                          border: "1px solid #c3e6cb"
                        }}>
                          <h5 style={{ 
                            color: "#155724", 
                            marginBottom: "15px",
                            fontSize: "16px"
                          }}>
                            ✅ Convites Enviados com Sucesso!
                          </h5>
                          <p style={{ 
                            color: "#155724", 
                            fontSize: "14px",
                            margin: 0
                          }}>
                            Os membros receberão uma notificação na app e poderão aceitar 
                            ou rejeitar o convite para participar no planeamento desta viagem.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div className="fixed-nav-buttons">
            <button
              onClick={handlePrevTab}
              disabled={tabs.findIndex((tab) => tab.id === activeTab) === 0}
              className="nav-button prev-button"
            >
              Anterior
            </button>
              <button
                onClick={
                  (activeTab === "checklist" && !newTravel.travelType?.isGroup) || 
                  (activeTab === "group" && newTravel.travelType?.isGroup) 
                    ? handleAddTravel 
                    : handleNextTab
                }
                disabled={
                  tabs.findIndex((tab) => tab.id === activeTab) === tabs.length - 1 && 
                  activeTab !== "checklist" && 
                  activeTab !== "group"
                }
                className="nav-button next-button"
              >
                {(activeTab === "checklist" && !newTravel.travelType?.isGroup) || 
                 (activeTab === "group" && newTravel.travelType?.isGroup)
                  ? (isEditing ? "Guardar Alterações" : "Adicionar Viagem Futura") 
                  : "Avançar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Categorias */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🗂️ Selecionar Categorias</h3>
            <div className="category-list">
              {categories.map((cat) => (
                <label key={cat} className="category-item">
                  <input
                    type="checkbox"
                    name="category"
                    value={cat}
                    checked={newTravel.category.includes(cat)}
                    onChange={handleChange}
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setIsCategoryModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isPreviewModalOpen && previewTravel && (
        <div className="modal-overlay">
          <div className="modal-content preview-modal" style={{ 
            maxWidth: "800px", 
            padding: "30px",
            backgroundColor: "#fff",
            borderRadius: "15px",
            boxShadow: "0 5px 15px rgba(0,0,0,0.2)"
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              textAlign: "center", 
              marginBottom: "30px",
              borderBottom: "2px solid #f0f0f0",
              paddingBottom: "20px"
            }}>
              <h2 style={{ 
                color: "#2c3e50", 
                fontSize: "28px",
                marginBottom: "10px"
              }}>✨ Viagem Planeada pela Globe Memories! ✨</h2>
              <p style={{ 
                color: "#666",
                fontSize: "16px"
              }}>Confira os detalhes da sua viagem personalizada</p>
            </div>

            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{ 
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px"
              }}>
                <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>📌 Informações Básicas</h3>
                <p><strong>Nome:</strong> {previewTravel.name}</p>
                <p><strong>Destino:</strong> {previewTravel.city}, {previewTravel.country}</p>
                <p><strong>Datas:</strong> {previewTravel.startDate} a {previewTravel.endDate}</p>
                <p><strong>Preço Estimado:</strong> {previewTravel.price} €</p>
                <p><strong>Categorias:</strong> {previewTravel.category.length > 0 ? previewTravel.category.join(", ") : "Nenhuma categoria"}</p>
              </div>

              <div style={{ 
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px"
              }}>
                <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>🏨 Acomodações</h3>
                <p><strong>Hotel:</strong> {previewTravel.accommodations[0].name}</p>
                <p><strong>Tipo:</strong> {previewTravel.accommodations[0].type}</p>
                {previewTravel.accommodations[0].link && (
                  <a href={previewTravel.accommodations[0].link} target="_blank" rel="noopener noreferrer" 
                    style={{ color: "#007bff", textDecoration: "none" }}>
                    Ver detalhes do hotel
                  </a>
                )}
              </div>
            </div>

            <div style={{ 
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              marginBottom: "30px"
            }}>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>📝 Descrição</h3>
              <p style={{ lineHeight: "1.6" }}>{previewTravel.description}</p>
            </div>

            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              marginBottom: "30px"
            }}>
              <div style={{ 
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px"
              }}>
                <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>🎯 Pontos de Interesse</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {previewTravel.pointsOfInterest.map((point, index) => (
                    <li key={index} style={{ marginBottom: "10px" }}>
                      • {point.name} {point.link && (
                        <a href={point.link} target="_blank" rel="noopener noreferrer" 
                          style={{ color: "#007bff", textDecoration: "none", fontSize: "0.9em" }}>
                          (Ver mais)
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ 
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "10px"
              }}>
                <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>🚗 Transporte Local</h3>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {previewTravel.localTransport.map((transport, index) => (
                    <li key={index} style={{ marginBottom: "10px" }}>
                      • {typeof transport === 'string' ? transport : `${transport.name} - ${transport.type} (${transport.price})`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div style={{ 
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              marginBottom: "30px"
            }}>
              <h3 style={{ color: "#2c3e50", marginBottom: "15px" }}>📅 Itinerário</h3>
              <div style={{ display: "grid", gap: "15px" }}>
                {previewTravel.itinerary.map((day, index) => (
                  <div key={index} style={{ 
                    padding: "15px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                  }}>
                    <h4 style={{ color: "#2c3e50", marginBottom: "10px" }}>Dia {day.day}</h4>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {day.activities.map((activity, actIndex) => (
                        <li key={actIndex} style={{ 
                          marginBottom: "5px",
                          padding: "5px 0",
                          borderBottom: "1px solid #eee"
                        }}>
                          • {activity}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "10px",
              marginBottom: "30px",
              width: "97.6%"
            }}>
              <h3 style={{ 
                color: "#2c3e50", 
                marginBottom: "20px",
                textAlign: "center",
                fontSize: "24px"
              }}>✅ Checklist de Viagem</h3>
              <p style={{ 
                textAlign: "center", 
                color: "#666",
                marginBottom: "20px",
                fontSize: "16px"
              }}>
                Marque os itens que já preparou para a sua viagem
              </p>
              <ul style={{ 
                listStyle: "none", 
                padding: 0,
                width: "100%"
              }}>
                {previewTravel.checklist.map((item, index) => (
                  <li key={index} style={{ 
                    marginBottom: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "10px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "all 0.3s ease"
                  }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {
                        const updatedChecklist = [...previewTravel.checklist];
                        updatedChecklist[index].checked = !updatedChecklist[index].checked;
                        setPreviewTravel({
                          ...previewTravel,
                          checklist: updatedChecklist
                        });
                      }}
                      style={{ 
                        marginRight: "15px",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer"
                      }}
                    />
                    <span style={{ 
                      fontSize: "16px",
                      color: item.checked ? "#28a745" : "#2c3e50",
                      textDecoration: item.checked ? "line-through" : "none",
                      transition: "all 0.3s ease",
                      textAlign: "center"
                    }}>
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ 
              display: "flex",
              gap: "15px",
              justifyContent: "center",
              marginTop: "30px"
            }}>
              <button className="button-success"
                onClick={confirmAIPlan}
                style={{ 
                  padding: "12px 30px",
                  backgroundColor: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#218838"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#28a745"}
              >
                ✨ Confirmar e Guardar
              </button>
              <button className="button-danger"
                onClick={() => setIsPreviewModalOpen(false)}
                style={{ 
                  padding: "12px 30px",
                  backgroundColor: "#6c757d",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = "#5a6268"}
                onMouseOut={(e) => e.target.style.backgroundColor = "#6c757d"}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {isConfirmModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <h2>Tem a certeza?</h2>
            <p>Deseja adicionar esta viagem às suas viagens concluídas?</p>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                onClick={handleAddToMyTravels}
                style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}
              >
                Sim
              </button>
              <button
                onClick={cancelAddToMyTravels}
                style={{ padding: "10px 20px", backgroundColor: "#6c757d", color: "#fff", border: "none", borderRadius: "4px" }}
              >
                Não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preferências de IA */}
      {isAIModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <h2>🤖 Planeamento Inteligente com IA - Globe Memories</h2>
              <p style={{ color: "#666", marginBottom: "20px" }}>
                Deixe a nossa IA criar o plano de viagem perfeito para si! Todos os campos são opcionais.
              </p>
              
              <div className="modal-header-buttons">
                <button 
                  type="button-danger" 
                  onClick={() => setIsAIModalOpen(false)} 
                  className="button-danger"
                >
                  Fechar
                </button>
                <button
                  type="button-success"
                  onClick={generateAITrip}
                  className="button-success"
                  disabled={isLoadingAI}
                  style={{ backgroundColor: "#28a745" }}
                >
                  {isLoadingAI ? "🔄 A Gerar..." : "✨ Gerar Viagem com IA"}
                </button>
              </div>
            </div>

            <div style={{ padding: "20px 0" }}>
              {/* Categorias */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}>
                  🏷️ Categorias de Interesse (opcional):
                  <span 
                    style={{ 
                      display: "inline-block",
                      width: "16px", 
                      height: "16px", 
                      backgroundColor: "#17a2b8", 
                      color: "white", 
                      borderRadius: "50%", 
                      textAlign: "center", 
                      fontSize: "12px", 
                      lineHeight: "16px", 
                      cursor: "help"
                    }}
                    onMouseEnter={(e) => showTooltip(e, "🏷️ Categorias de Interesse", "Selecione os tipos de atividades e experiências que mais lhe interessam. Isto ajudará a personalizar as sugestões da sua viagem.")}
                    onMouseLeave={hideTooltip}
                  >
                    ?
                  </span>
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {categories.map((category) => (
                    <label key={category} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={aiPreferences.categories.includes(category)}
                        onChange={() => handleAICategoryToggle(category)}
                        style={{ marginRight: "8px" }}
                      />
                      {category}
                    </label>
                  ))}
                </div>
              </div>

              {/* País e Cidade */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                    🌍 País (opcional):
                  </label>
                  <select 
                    name="country" 
                    value={aiPreferences.country} 
                    onChange={handleAIPreferenceChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  >
                    <option value="">Deixar a IA escolher</option>
                    <option value="Portugal">Portugal</option>
                    <option value="Brasil">Brasil</option>
                    <option value="United States">Estados Unidos</option>
                    <option value="Espanha">Espanha</option>
                    <option value="França">França</option>
                    <option value="Itália">Itália</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                    🏠 Cidade (opcional):
                  </label>
                  {isLoadingCities ? (
                    <div>Carregando cidades...</div>
                  ) : (
                    <select 
                      name="city" 
                      value={aiPreferences.city} 
                      onChange={handleAIPreferenceChange}
                      style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                      disabled={!aiPreferences.country}
                    >
                      <option value="">Deixar a IA escolher</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Orçamento e Duração */}
              <div style={{ display: "flex", gap: "20px", marginBottom: "25px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                    💰 Orçamento (opcional):
                  </label>
                  <select 
                    name="budget" 
                    value={aiPreferences.budget} 
                    onChange={handleAIPreferenceChange}
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  >
                    <option value="">Deixar a IA escolher</option>
                    <option value="baixo">Baixo (€50-80/dia)</option>
                    <option value="medio">Médio (€80-150/dia)</option>
                    <option value="alto">Alto (€150-300/dia)</option>
                    <option value="luxo">Luxo (€300+/dia)</option>
                  </select>
                </div>
                
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                    📅 Duração (dias):
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={aiPreferences.duration}
                    onChange={handleAIPreferenceChange}
                    min="1"
                    max="30"
                    style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                  />
                </div>
              </div>

              {/* Estilo de Viagem */}
              <div style={{ marginBottom: "25px" }}>
                <label style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "10px", display: "block" }}>
                  ✈️ Estilo de Viagem:
                </label>
                <select 
                  name="travelStyle" 
                  value={aiPreferences.travelStyle} 
                  onChange={handleAIPreferenceChange}
                  style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ddd" }}
                >
                  <option value="balanced">Equilibrado</option>
                  <option value="relaxed">Relaxado</option>
                  <option value="adventure">Aventura</option>
                  <option value="cultural">Cultural</option>
                  <option value="luxury">Luxo</option>
                </select>
              </div>

              <div style={{ 
                backgroundColor: "#e8f4fd", 
                padding: "15px", 
                borderRadius: "8px", 
                border: "1px solid #bee5eb",
                marginTop: "20px"
              }}>
                <p style={{ margin: 0, color: "#0c5460", fontSize: "14px" }}>
                  💡 <strong>Dica:</strong> Quanto mais informações fornecer, mais personalizada será a sua viagem! 
                  Mas não se preocupe - a nossa IA pode criar uma viagem incrível mesmo sem preferências específicas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="travels-list">
        {futureTravels.length === 0 ? (
          <p>
            Nenhuma viagem planeada ainda. <br />
            Comece a planear agora a sua viagem!
          </p>
        ) : (
          futureTravels.map((travel) => {
            const { status, label, color } = getTripStatus(travel.startDate, travel.endDate);
            return (
              <div key={travel.id} className="travel-card">
                <div className="travel-content">
                  <div className="no-image-placeholder"></div>
                  <div className="travel-text">
                    <span
                      style={{
                        display: "inline-block",
                        backgroundColor: color,
                        color: "#fff",
                        padding: "5px 10px",
                        borderRadius: "4px",
                        marginBottom: "10px",
                      }}
                    >
                      {label}
                    </span>
                    <h2>{travel.name}</h2>
                    <p>
                      <b>👤 Utilizador:</b> {travel.user || "Desconhecido"}
                    </p>
                    {/* Mostrar informações do tipo de viagem */}
                    {travel.travelType && (
                      <p>
                        <b>🎯 Tipo:</b> 
                        {travel.travelType.main === 'single' && " Destino Único"}
                        {travel.travelType.main === 'multi' && " Multidestino"}
                        {travel.travelType.isGroup && (
                          <span style={{ color: "#28a745", fontWeight: "bold" }}>
                            {travel.travelType.main ? " + " : ""}👥 Viagem em Grupo
                          </span>
                        )}
                      </p>
                    )}
                    {/* Mostrar informações do grupo se for viagem em grupo */}
                    {travel.groupData && (
                      <p>
                        <b>👥 Grupo:</b> {travel.groupData.members.length} membro(s) convidado(s)
                        <br />
                        <small style={{ color: "#666" }}>
                          Admin: {travel.groupData.admin}
                        </small>
                      </p>
                    )}
                    <p>
                      <b>🌍 País:</b> {travel.country || "Não definido"}
                    </p>
                    <p>
                      <b>🏙️ Cidade:</b> {travel.city || "Não definido"}
                    </p>
                    {/* Mostrar destinos adicionais se for viagem multidestino */}
                    {travel.multiDestinations && travel.multiDestinations.length > 0 && (
                      <div style={{ 
                        marginTop: "10px", 
                        padding: "10px", 
                        backgroundColor: "#f8f9fa", 
                        borderRadius: "5px" 
                      }}>
                        <p style={{ margin: "0 0 5px 0", fontWeight: "bold" }}>
                          <b>🗺️ Destinos Adicionais:</b>
                        </p>
                        {travel.multiDestinations.map((dest, index) => (
                          <p key={dest.id} style={{ margin: "2px 0", fontSize: "14px" }}>
                            📍 {dest.city}, {dest.country}
                          </p>
                        ))}
                        <small style={{ color: "#666" }}>
                          Total: {travel.multiDestinations.length + 1} destino(s)
                        </small>
                      </div>
                    )}
                    <p>
                      <b>🗂️ Categoria:</b> {Array.isArray(travel.category) && travel.category.length > 0 ? travel.category.join(", ") : "Nenhuma categoria"}
                    </p>
                    <p>
                      <b>📅 Início:</b> {travel.startDate || "Não definido"}
                    </p>
                    <p>
                      <b>📅 Fim:</b> {travel.endDate || "Não definido"}
                    </p>
                    <p>
                      <b>💰 Preço Estimado:</b> {travel.price || "Não definido"} €
                    </p>
                    {status === "completed" && (
                      <button
                        onClick={() => openConfirmModal(travel)}
                        className="feed-details-link"
                      >
                        Adicionar às minhas viagens
                      </button>
                    )}
                  </div>
                </div>
                <div className="travel-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(travel.id); }}>Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(travel.id); }}>Excluir</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Tooltip */}
      {tooltipModal.show && (
        <div
          style={{
            position: "fixed",
            left: `${tooltipModal.position.x}px`,
            top: `${tooltipModal.position.y}px`,
            transform: "translate(-50%, -100%)",
            backgroundColor: "#2c3e50",
            color: "white",
            padding: "15px 20px",
            borderRadius: "12px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            zIndex: 10000,
            maxWidth: "350px",
            fontSize: "14px",
            lineHeight: "1.5",
            border: "2px solid #34495e",
            animation: "fadeInTooltip 0.3s ease-out",
          }}
          onMouseEnter={() => setTooltipModal(prev => ({ ...prev, show: true }))}
          onMouseLeave={hideTooltip}
        >
          {tooltipModal.title && (
            <div style={{ 
              fontWeight: "bold", 
              marginBottom: "8px", 
              fontSize: "16px",
              color: "#3498db"
            }}>
              {tooltipModal.title}
            </div>
          )}
          <div>{tooltipModal.content}</div>
          {/* Seta apontando para baixo */}
          <div style={{
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "0",
            height: "0",
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid #2c3e50"
          }}></div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeInTooltip {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default FutureTravels;