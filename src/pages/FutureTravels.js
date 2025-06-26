import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/styles.css";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
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
  const [toast, setToast] = useState({ message: "", type: "", show: false });
  const [cities, setCities] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

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
    if (!newTravel.country) {
      setToast({ 
        message: "Por favor, preencha todos os campos marcados com *!", 
        type: "error", 
        show: true 
      });
      return false;
    }
    if (!newTravel.city.trim()) {
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

  // Função da IA para planear uma viagem completa
  const planTripWithAI = async () => {
    setIsLoadingAI(true);
    try {
      const destinations = [
        {
          country: "Portugal",
          city: "Lisboa",
          coordinates: [38.7223, -9.1393],
          hotel: { name: "Pestana Palace Lisboa", pricePerNight: 250, type: "Hotel 5*", link: "https://www.pestanapalacelisboa.com" },
          food: [
            { name: "Belcanto", type: "Restaurante 2* Michelin", price: "150€", link: "https://www.belcanto.pt" },
            { name: "Ramiro", type: "Marisqueira", price: "50€", link: "https://www.cervejariaramiro.pt" },
            { name: "Time Out Market", type: "Mercado Gastronómico", price: "30€", link: "https://www.timeoutmarket.com/lisboa" }
          ],
          transport: [
            { name: "Metro", price: "1.50€", type: "Transporte Público" },
            { name: "Elétrico 28", price: "3.00€", type: "Transporte Turístico" },
            { name: "Táxi", price: "10-20€", type: "Transporte Privado" }
          ],
          attractions: [
            { name: "Torre de Belém", type: "Monumento histórico", price: "6€", link: "https://www.torrebelem.pt" },
            { name: "Mosteiro dos Jerónimos", type: "Monumento histórico", price: "10€", link: "https://www.mosteirojeronimos.pt" },
            { name: "Castelo de São Jorge", type: "Castelo", price: "8.50€", link: "https://castelodesaojorge.pt" }
          ],
          categories: ["Cidade", "História", "Foodie", "Cultural"]
        },
        {
          country: "França",
          city: "Paris",
          coordinates: [48.8566, 2.3522],
          hotel: { name: "Le Bristol Paris", pricePerNight: 800, type: "Hotel 5*", link: "https://www.oetkercollection.com" },
          food: [
            { name: "Le Jules Verne", type: "Restaurante 1* Michelin", price: "200€", link: "https://www.lejulesverne-paris.com" },
            { name: "L'Ami Louis", type: "Bistrô tradicional", price: "100€", link: "https://www.amilouis.paris" },
            { name: "Le Marais", type: "Bairro gastronómico", price: "40€", link: "" }
          ],
          transport: [
            { name: "Metro", price: "1.90€", type: "Transporte Público" },
            { name: "Vélib'", price: "5€/dia", type: "Bicicleta" },
            { name: "Táxi", price: "15-30€", type: "Transporte Privado" }
          ],
          attractions: [
            { name: "Torre Eiffel", type: "Monumento", price: "26€", link: "https://www.toureiffel.paris" },
            { name: "Museu do Louvre", type: "Museu", price: "17€", link: "https://www.louvre.fr" },
            { name: "Palácio de Versalhes", type: "Palácio", price: "20€", link: "https://www.chateauversailles.fr" }
          ],
          categories: ["Cidade", "Romântico", "Cultural", "Luxo"]
        }
      ];

      const destination = destinations[Math.floor(Math.random() * destinations.length)];
      const today = new Date();
      const startDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split("T")[0];
      const tripDuration = Math.floor(Math.random() * 4) + 3; // 3-6 dias
      const endDate = new Date(today.setDate(today.getDate() + tripDuration)).toISOString().split("T")[0];
      const bookingDate = new Date(today.setDate(today.getDate() - 15)).toISOString().split("T")[0];

      const hotelPrice = destination.hotel.pricePerNight * tripDuration;
      const transportPrice = Math.floor(tripDuration * 50);
      const foodPrice = Math.floor(tripDuration * 100);
      const attractionsPrice = Math.floor(tripDuration * 50);
      const totalPrice = hotelPrice + transportPrice + foodPrice + attractionsPrice;

      const itinerary = Array.from({ length: tripDuration }, (_, i) => {
        const day = i + 1;
        const activities = [];
        
        // Manhã
        const morningAttraction = destination.attractions[Math.floor(Math.random() * destination.attractions.length)];
        activities.push(`Manhã: Visita a ${morningAttraction.name} (${morningAttraction.price})`);
        
        // Almoço
        const lunchRestaurant = destination.food[Math.floor(Math.random() * destination.food.length)];
        activities.push(`Almoço: ${lunchRestaurant.name} - ${lunchRestaurant.type} (${lunchRestaurant.price})`);
        
        // Tarde
        const afternoonAttraction = destination.attractions[Math.floor(Math.random() * destination.attractions.length)];
        activities.push(`Tarde: ${afternoonAttraction.name} (${afternoonAttraction.price})`);
        
        // Jantar
        const dinnerRestaurant = destination.food[Math.floor(Math.random() * destination.food.length)];
        activities.push(`Jantar: ${dinnerRestaurant.name} - ${dinnerRestaurant.type} (${dinnerRestaurant.price})`);

        return { day, activities };
      });

      const checklist = [
        { name: "Passaporte/Visto", checked: false },
        { name: `Reservar ${destination.hotel.name}`, checked: false },
        { name: "Comprar seguro de viagem", checked: false },
        { name: "Reservar voos", checked: false },
        { name: "Fazer câmbio de moeda", checked: false },
        { name: "Baixar mapas offline", checked: false },
        { name: "Verificar adaptadores de tomada", checked: false }
      ];

      const aiTravel = {
        name: `Viagem a ${destination.city}`,
        user: "Tiago",
        category: destination.categories,
        country: destination.country,
        city: destination.city,
        price: totalPrice.toString(),
        startDate,
        endDate,
        BookingTripPaymentDate: bookingDate,
        priceDetails: {
          hotel: hotelPrice.toString(),
          transport: transportPrice.toString(),
          food: foodPrice.toString(),
          extras: attractionsPrice.toString(),
        },
        description: `Uma experiência única em ${destination.city}, explorando sua rica cultura, gastronomia local e pontos turísticos imperdíveis! Inclui estadia no ${destination.hotel.name}, visitas aos principais pontos turísticos e experiências gastronômicas exclusivas.`,
        accommodations: [{ 
          name: destination.hotel.name, 
          type: destination.hotel.type,
          link: destination.hotel.link
        }],
        pointsOfInterest: destination.attractions.map(attr => ({
          name: attr.name,
          type: attr.type,
          price: attr.price,
          link: attr.link
        })),
        itinerary,
        localTransport: destination.transport.map(t => ({
          name: t.name,
          type: t.type,
          price: t.price
        })),
        privacy: "public",
        checklist,
        coordinates: destination.coordinates,
      };

      setPreviewTravel(aiTravel);
      setIsPreviewModalOpen(true);
    } catch (error) {
      console.error("Erro ao planear viagem:", error);
      setToast({ message: "Erro ao planear viagem!", type: "error", show: true });
    } finally {
      setIsLoadingAI(false);
    }
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
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setEditingPointIndex(null);
    setToast({ message: "Ponto de referência adicionado/editado com sucesso!", type: "success", show: true });
  };

  const handleDeletePointOfInterest = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => {
      const updatedPoints = prev.pointsOfInterest.filter((_, i) => i !== index);
      return { ...prev, pointsOfInterest: updatedPoints };
    });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setToast({ message: "Ponto de referência removido com sucesso!", type: "success", show: true });
  };

  const handleEditPointOfInterest = (e, index) => {
    e.stopPropagation();
    const point = newTravel.pointsOfInterest[index];
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
      setItineraryError(`Por favor, insira um dia entre 1 e ${totalDays}.`);
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
    fetchCities(travelToEdit.country);

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
    if (!newTravel.country) {
      setToast({ message: "O país é obrigatório!", type: "error", show: true });
      return;
    }
    if (!newTravel.city.trim()) {
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
      const coordinates = await getCoordinates(newTravel.country, newTravel.city);
      if (!coordinates) {
        setToast({ message: "Não foi possível obter coordenadas para a localização!", type: "error", show: true });
        return;
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

      // Atualizar futureTrips
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
    setNewPointOfInterest({ name: "", type: "", link: "" });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: "", activities: [""] });
    setEditingItineraryDay(null);
    setNewChecklistItem("");
    setEditingChecklistIndex(null);
    setItineraryError("");
    setActiveTab("generalInfo");
  };

  const openModal = () => {
    // Obtém a data atual
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
    });
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

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <h2>Comece hoje a planear a sua viagem de sonho com a Globe Memories!</h2>
              <label>🔒 Privacidade da Viagem:</label>
              <select
                name="privacy"
                value={newTravel.privacy}
                onChange={handleChange}
                style={{ width: "15%", padding: "12px", borderRadius: "8px" }}
              >
                <option value="public">Pública</option>
                <option value="followers">Somente para Seguidores</option>
                <option value="private">Privada</option>
              </select>

              <div className="modal-header-buttons">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                    window.history.replaceState({}, document.title, location.pathname);
                  }} 
                  className="secondary-action-button"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleAddTravel}
                  className="primary-action-button"
                >
                  {isEditing ? "Guardar Alterações" : "Adicionar Viagem Futura"}
                </button>
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

            <form onSubmit={(e) => e.preventDefault()}>
              {activeTab === "generalInfo" && (
                <div>
                  <div className="RightPosition">
                    <label>📖 Descrição Curta do Plano:</label>
                    <textarea
                      name="description"
                      value={newTravel.description}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Insira uma descrição curta do plano"
                      style={{ width: "100%" }}
                    />
                  </div>

                  <div className="LeftPosition">
                    <label>Nome da Viagem Futura: *</label>
                    <input
                      type="text"
                      name="name"
                      value={newTravel.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex.: Viagem futura a Paris"
                    />

                    <br />
                    <br />

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>🌍 País: *</label>
                        <select name="country" value={newTravel.country} onChange={handleChange} required>
                          <option value="">Selecione um país</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Brasil">Brasil</option>
                          <option value="United States">Estados Unidos</option>
                          <option value="Espanha">Espanha</option>
                          <option value="França">França</option>
                          <option value="Itália">Itália</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>🏙️ Cidade: *</label>
                        {isLoadingCities ? (
                          <div>Carregando cidades...</div>
                        ) : (
                          <>
                            <select
                              name="city"
                              value={newTravel.city}
                              onChange={handleChange}
                              required
                              disabled={!newTravel.country}
                              style={{ width: "100%" }}
                            >
                              <option value="">Selecione uma cidade</option>
                              {cities.map((city) => (
                                <option key={city} value={city}>
                                  {city}
                                </option>
                              ))}
                            </select>
                            {cities.length > 0 && (
                              <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
                                {cities.length} cidades encontradas
                              </small>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <br />
                    <br />

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>📅 Data de Início: *</label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>📅 Data de Fim: *</label>
                        <input
                          type="date"
                          name="endDate"
                          value={newTravel.endDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <br />
                    <br />

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>📅 Data Prevista de Reserva/Pagamento:</label>
                        <input
                          type="date"
                          name="BookingTripPaymentDate"
                          value={newTravel.BookingTripPaymentDate}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <br />
                    <br />

                    <label>🗂️ Categorias Selecionadas:</label>
                    <p>
                      {newTravel.category.length > 0 ? newTravel.category.join(", ") : "Nenhuma categoria selecionada"}
                    </p>
                    <button type="button" onClick={() => setIsCategoryModalOpen(true)}>
                      Selecionar Categorias
                    </button>

                    {isCategoryModalOpen && (
                      <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
                        <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                          <h3>🗂️ Selecionar Categorias</h3>
                          <div className="category-list">
                            {categories.map((cat) => (
                              <div key={cat}>
                                <input
                                  type="checkbox"
                                  name="category"
                                  value={cat}
                                  checked={newTravel.category.includes(cat)}
                                  onChange={handleChange}
                                />
                                <label>{cat}</label>
                              </div>
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

                    <br />
                    <br />
                  </div>
                </div>
              )}

              {activeTab === "prices" && (
                <div>
                  <div className="RightPosition">
                    <br />
                    <h2>Estes preços são uma estimativa do que pretendo gastar na viagem!</h2>
                  </div>
                  <div className="LeftPosition">
                    <label>💰 Preços Estimados da Viagem:</label>
                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>💰 Estadia (€):</label>
                        <input
                          type="number"
                          name="priceDetails.hotel"
                          value={newTravel.priceDetails.hotel}
                          onChange={handleChange}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>💰 Alimentação (€):</label>
                        <input
                          type="number"
                          name="priceDetails.food"
                          value={newTravel.priceDetails.food}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>💰 Transportes (€):</label>
                        <input
                          type="number"
                          name="priceDetails.transport"
                          value={newTravel.priceDetails.transport}
                          onChange={handleChange}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>💰 Extras (€):</label>
                        <input
                          type="number"
                          name="priceDetails.extras"
                          value={newTravel.priceDetails.extras}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="RightPositionY">
                      <label>💰 Preço Total Estimado (€):</label>
                      <input
                        type="number"
                        name="price"
                        value={newTravel.price}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "accommodation" && (
                <div className="form-group-CenterPosition">
                  <label>Alojamento Planeado (Opcional):</label>
                  {newTravel.accommodations.map((accommodation, index) => (
                    <div key={index} className="accommodation-section">
                      <label>Nome do Alojamento:</label>
                      <input
                        type="text"
                        name={`accommodations${index}.name`}
                        value={accommodation.name}
                        onChange={handleChange}
                        placeholder="Ex.: Hotel Pestana"
                        style={{ width: "100%", marginBottom: "10px" }}
                      />

                      <label>Tipo de Alojamento:</label>
                      <select
                        name={`accommodations${index}.type`}
                        value={accommodation.type}
                        onChange={handleChange}
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
                  <label>Métodos de Transporte Planeado:</label>
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
                            <div key={option}>
                              <input
                                type="checkbox"
                                name="localTransport"
                                value={option}
                                checked={newTravel.localTransport.some(t => 
                                  typeof t === 'string' ? t === option : t.name === option
                                )}
                                onChange={handleChange}
                              />
                              <label>{option}</label>
                            </div>
                          ))}
                        </div>
                        <div className="modal-actions">
                          <button type="button" onClick={() => setIsTransportModalOpen(false)}>
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
                  <div className="RightPosition">
                    <h3>Pontos de Referência Planeados</h3>
                    {newTravel.pointsOfInterest.length > 0 ? (
                      <ul style={{ listStyle: "none", padding: "0" }}>
                        {newTravel.pointsOfInterest.map((point, index) => (
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
                    <label>Nome do Ponto de Referência:</label>
                    <input
                      type="text"
                      name="name"
                      value={newPointOfInterest.name}
                      onChange={handlePointChange}
                      placeholder="Ex.: Torre Eiffel"
                    />

                    <label>Tipo:</label>
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
                      <ul style={{ listStyle: "none", padding: "0" }}>
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
                    <label>Dia:</label>
                    <input
                      type="number"
                      name="day"
                      value={newItineraryDay.day}
                      onChange={handleItineraryChange}
                      min="1"
                      max={calculateTripDays()}
                      placeholder={`Digite um número entre 1 e ${calculateTripDays()}`}
                    />
                    {itineraryError && <p style={{ color: "red", marginBottom: "10px" }}>{itineraryError}</p>}

                    <label>Atividades Planeadas:</label>
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
                        display: "block",
                        marginBottom: "10px",
                        fontSize: "16px",
                        color: "#2c3e50"
                      }}>Item da Checklist:</label>
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
            </form>

            <div className="fixed-nav-buttons">
              <button
                onClick={handlePrevTab}
                disabled={tabs.findIndex((tab) => tab.id === activeTab) === 0}
                className="nav-button prev-button"
              >
                Anterior
              </button>
              <button
                onClick={activeTab === "checklist" ? handleAddTravel : handleNextTab}
                disabled={tabs.findIndex((tab) => tab.id === activeTab) === tabs.length - 1 && activeTab !== "checklist"}
                className="nav-button next-button"
              >
                {activeTab === "checklist" ? (isEditing ? "Guardar Alterações" : "Adicionar Viagem Futura") : "Avançar"}
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
              <button
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
              <button
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
                    <p>
                      <b>🌍 País:</b> {travel.country || "Não definido"}
                    </p>
                    <p>
                      <b>🏙️ Cidade:</b> {travel.city}
                    </p>
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
                  <button onClick={() => handleEdit(travel.id)}>Editar</button>
                  <button onClick={() => handleDelete(travel.id)}>Excluir</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FutureTravels;