import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/pages/globe-memories-interactive-map.css";
import travels from "../data/travelsData";
import L from "leaflet";
import debounce from "lodash/debounce";

import { useNavigate } from "react-router-dom";
import Toast from '../components/Toast';
import { interactiveMapModalUtils } from '../utils/modalUtils';

// Corrige o probleaflet-left .leaflet-controlma de ícones padrão no Leaflet com React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Criar ícones customizados modernos e precisos
const createCustomIcon = (color, iconType = 'location') => {
  const getIconSymbol = () => {
    switch (iconType) {
      case 'visited': return '★';
      case 'following': return '♥';
      case 'public': return '◉';
      case 'search': return '⊕';
      default: return '●';
    }
  };

  const iconHtml = `
    <div class="gm-modern-marker" style="--marker-color: ${color};">
      <div class="gm-marker-shadow"></div>
      <div class="gm-marker-body">
        <div class="gm-marker-inner">
          <span class="gm-marker-icon">${getIconSymbol()}</span>
        </div>
        <div class="gm-marker-tip"></div>
      </div>
      <div class="gm-marker-pulse"></div>
    </div>
  `;
  
  return new L.DivIcon({
    html: iconHtml,
    className: 'gm-custom-marker-container',
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -42],
  });
};

// Ícones modernos para diferentes tipos de viagem
const visitedIcon = createCustomIcon('#22c55e', 'visited'); // Verde
const followingIcon = createCustomIcon('#3b82f6', 'following'); // Azul
const publicIcon = createCustomIcon('#eab308', 'public'); // Amarelo
const searchIcon = createCustomIcon('#8b5cf6', 'search'); // Roxo

// Componente para centralizar o mapa no local selecionado
const MapController = ({ selectedLocation }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo(selectedLocation.coordinates, selectedLocation.zoom, {
        duration: 1, // Animação de 1 segundo
      });
    }
  }, [selectedLocation, map]);

  return null;
};

const InteractiveMap = () => {
  const [locations, setLocations] = useState([]);
  const [followingTrips, setFollowingTrips] = useState([]); // azul
  const [publicTrips, setPublicTrips] = useState([]); // amarelo
  const [showWelcomePopup, setShowWelcomePopup] = useState(() => interactiveMapModalUtils.shouldShow());
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [randomPopup, setRandomPopup] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("mine"); // 'mine' | 'all'
  const [showStatistics, setShowStatistics] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [streetViewPerson, setStreetViewPerson] = useState(null);
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  
  // Magic arrow states
  const [isArrowFlying, setIsArrowFlying] = useState(false);
  const [magicDestination, setMagicDestination] = useState(null);
  const [showDestinationPopup, setShowDestinationPopup] = useState(false);
  const [arrowPosition, setArrowPosition] = useState({ x: 0, y: 0 });
  
  const [filters, setFilters] = useState({
    visited: true,
    following: true,
    public: true,
    dateRange: 'all',
    priceRange: 'all'
  });
  const mapRef = useRef(null);
  const navigate = useNavigate();

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

  const MAPTILER_API_KEY = "G59o5q9sfWGLLQJsw3v7";

  // Múltiplas opções de mapas para melhor qualidade
  const mapLayers = {
    streets: {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    },
    satellite: {
      url: `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${MAPTILER_API_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    },
    terrain: {
      url: `https://api.maptiler.com/maps/outdoor-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    },
    basic: {
      url: `https://api.maptiler.com/maps/basic-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }
  };

  // Função para obter coordenadas e nome em pt-PT usando Nominatim
  const getCoordinates = async (country, city) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)},${encodeURIComponent(country)}&format=json&limit=1&accept-language=pt-PT`
      );
      const data = await response.json();
      if (data.length > 0) {
        return {
          coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)],
          name: data[0].display_name.split(",")[0],
        };
      }
    } catch (error) {
      console.error(`Erro ao obter coordenadas para ${city}, ${country}:`, error);
      showToast(`Erro ao obter coordenadas para ${city}. Tente novamente.`, 'error');
    }
    return null;
  };

  // Função para formatar o tipo de local
  const formatLocationType = (type, address) => {
    if (type === 'country') return 'País';
    if (type === 'city' || type === 'town' || type === 'village') return 'Cidade';
    if (type === 'state' || type === 'administrative') return 'Local';
    if (type === 'suburb' || type === 'neighbourhood') return 'Bairro';
    if (type === 'attraction' || type === 'landmark') return 'Ponto Turístico';
    if (address?.tourism) return 'Ponto Turístico';
    if (address?.historic) return 'Local Histórico';
    return 'Local';
  };

  // Função para formatar o nome do local
  const formatLocationName = (result) => {
    const parts = result.display_name.split(',');
    if (result.type === 'country') return `${parts[0]} - País`;
    if (result.type === 'city' || result.type === 'town') {
      const city = parts[0];
      const region = parts[parts.length - 3]?.trim();
      const country = parts[parts.length - 1]?.trim();
      return `${city}${region ? `, ${region}` : ''}${country ? ` - ${country}` : ''}`;
    }
    return result.display_name.replace(/, Portugal$/, '').replace(/,.*$/, '');
  };

  // Função para buscar locais com busca mais ampla e precisa
  const searchLocations = async (query) => {
    if (query.length < 1) {
      setSearchResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=8&accept-language=pt-PT&addressdetails=1`
      );
      const data = await response.json();
      
      // Processar e formatar os resultados
      const processedResults = data.map((result) => {
        const locationType = formatLocationType(result.type, result.address);
        const displayName = formatLocationName(result);
        
        return {
          ...result,
          display_name: displayName,
          type: locationType,
          zoom: result.type === "country" ? 5 : 
               result.type === "city" || result.type === "town" ? 10 : 
               result.type === "village" ? 12 : 14,
          address_details: result.address
        };
      });

      // Ordenar por relevância (importance) e tipo
      const sortedResults = processedResults.sort((a, b) => {
        if (a.type === 'País' && b.type !== 'País') return -1;
        if (b.type === 'País' && a.type !== 'País') return 1;
        if (a.type === 'Cidade' && b.type !== 'Cidade') return -1;
        if (b.type === 'Cidade' && a.type !== 'Cidade') return 1;
        return (b.importance || 0) - (a.importance || 0);
      });

      setSearchResults(sortedResults);
    } catch (error) {
      console.error("Erro ao buscar locais:", error);
      showToast('Erro ao buscar locais. Tente novamente.', 'error');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce para otimizar a busca
  const debouncedSearch = useCallback(debounce((query) => searchLocations(query), 300), []);

  // Util: valida se a viagem tem coordenadas válidas
  const hasValidCoords = (t) => {
    if (!t || !Array.isArray(t.coordinates) || t.coordinates.length !== 2) return false;
    const lat = Number(t.coordinates[0]);
    const lng = Number(t.coordinates[1]);
    return Number.isFinite(lat) && Number.isFinite(lng);
  };

  // Função para obter país e cidade a partir de coordenadas
  const getLocationFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-PT`
      );
      const data = await response.json();
      console.log("Dados de localização recebidos:", data); // Debug
      if (data && data.address) {
        const country = data.address.country || 
                       data.address.country_code?.toUpperCase() || 
                       "Desconhecido";
        const city = data.address.city || 
                    data.address.town || 
                    data.address.village || 
                    data.address.municipality || 
                    data.address.hamlet || 
                    data.address.suburb ||
                    "Desconhecido";
        
        console.log(`Localização processada: ${city}, ${country}`); // Debug
        return { country, city };
      }
    } catch (error) {
      console.error(`Erro ao obter localização para ${lat}, ${lng}:`, error);
    }
    return { country: "Desconhecido", city: "Desconhecido" };
  };

  // Carrega as viagens visitadas do localStorage
  useEffect(() => {
    const savedVisitedTrips = JSON.parse(localStorage.getItem("visitedTrips")) || [];
    setLocations(savedVisitedTrips);

    // Dados mock/armazenados: viagens de seguidos e públicas
    const savedFollowingTrips = JSON.parse(localStorage.getItem("followingTrips")) || [
      {
        country: "França",
        city: "Paris",
        coordinates: [48.8566, 2.3522],
        user: "Ana Silva",
        price: "850",
        startDate: "2024-05-15",
        tripLink: "/travel/paris-ana-2024"
      },
      {
        country: "Espanha",
        city: "Barcelona", 
        coordinates: [41.3851, 2.1734],
        user: "João Santos",
        price: "620",
        startDate: "2024-06-20",
        tripLink: "/travel/barcelona-joao-2024"
      }
    ];
    setFollowingTrips(savedFollowingTrips);
    
    const savedPublicTrips = JSON.parse(localStorage.getItem("publicTrips")) || [
      {
        country: "Itália",
        city: "Roma",
        coordinates: [41.9028, 12.4964],
        user: "Maria Costa",
        price: "750",
        startDate: "2024-04-10",
        endDate: "2024-04-17",
        tripLink: "/travel/roma-maria-2024"
      },
      {
        country: "Alemanha",
        city: "Berlim",
        coordinates: [52.5200, 13.4050],
        user: "Pedro Oliveira", 
        price: "580",
        startDate: "2024-07-05",
        endDate: "2024-07-12",
        tripLink: "/travel/berlim-pedro-2024"
      }
    ];
    setPublicTrips(savedPublicTrips);

    const fetchCoordinates = async () => {
      // Mostrar TODAS as viagens (mesmo que na mesma cidade), evitando só geocoding duplicado
      const geoCache = new Map(); // key: "City, Country" -> { coordinates, name }
      const locationsWithCoords = [];

      for (const travel of travels) {
        const key = `${travel.city}, ${travel.country}`;
        let geo = geoCache.get(key);
        if (!geo) {
          geo = await getCoordinates(travel.country, travel.city);
          if (geo) geoCache.set(key, geo);
        }
        if (geo) {
          locationsWithCoords.push({
            city: travel.city,
            country: travel.country,
            startDate: travel.startDate,
            price: travel.price,
            tripLink: `/travel/${travel.id}`,
            user: travel.user,
            coordinates: geo.coordinates,
            displayName: geo.name,
          });
        }
      }

      setLocations(locationsWithCoords);
      localStorage.setItem("visitedTrips", JSON.stringify(locationsWithCoords));
    };

    fetchCoordinates();
  }, []);

  // Enriquecer viagens públicas e de quem sigo com coordenadas caso faltem
  useEffect(() => {
    const enrich = async () => {
      let changedPublic = false;
      let changedFollowing = false;

      const enrichList = async (list) => {
        const result = [];
        for (const t of list || []) {
          if (!t) { result.push(t); continue; }
          // 1) Se já existem coordenadas, tentar normalizar para números
          if (Array.isArray(t.coordinates) && t.coordinates.length === 2) {
            const lat = Number(t.coordinates[0]);
            const lng = Number(t.coordinates[1]);
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
              result.push({ ...t, coordinates: [lat, lng] });
              continue;
            }
          }

          // 2) Tentar geocodificar usando country/city
          let city = t.city;
          let country = t.country;

          // 2a) Se não houver city/country, tentar inferir do label "City, Country"
          if ((!city || !country) && t.label && typeof t.label === 'string') {
            const parts = t.label.split(',').map(s => s.trim());
            if (parts.length >= 2) {
              city = city || parts[0];
              country = country || parts[parts.length - 1];
            }
          }

          // 2b) Se ainda faltar, não conseguimos enriquecer
          if (!city || !country) {
            result.push(t);
            continue;
          }

          try {
            const geo = await getCoordinates(country, city);
            if (geo && Array.isArray(geo.coordinates)) {
              result.push({ ...t, city, country, coordinates: geo.coordinates });
            } else {
              result.push(t);
            }
          } catch (e) {
            console.warn('Falha ao geocodificar viagem', t);
            result.push(t);
          }
        }
        return result;
      };

      // PublicTrips
      const needsPublic = (publicTrips || []).some(t => !Array.isArray(t?.coordinates) ||
        (Array.isArray(t?.coordinates) && (!Number.isFinite(Number(t.coordinates[0])) || !Number.isFinite(Number(t.coordinates[1]))))
      );
      let newPublic = publicTrips;
      if (needsPublic) {
        newPublic = await enrichList(publicTrips);
        if (JSON.stringify(newPublic) !== JSON.stringify(publicTrips)) {
          changedPublic = true;
        }
      }

      // FollowingTrips
      const needsFollowing = (followingTrips || []).some(t => !Array.isArray(t?.coordinates) ||
        (Array.isArray(t?.coordinates) && (!Number.isFinite(Number(t.coordinates[0])) || !Number.isFinite(Number(t.coordinates[1]))))
      );
      let newFollowing = followingTrips;
      if (needsFollowing) {
        newFollowing = await enrichList(followingTrips);
        if (JSON.stringify(newFollowing) !== JSON.stringify(followingTrips)) {
          changedFollowing = true;
        }
      }

      if (changedPublic) {
        setPublicTrips(newPublic);
        localStorage.setItem('publicTrips', JSON.stringify(newPublic));
      }
      if (changedFollowing) {
        setFollowingTrips(newFollowing);
        localStorage.setItem('followingTrips', JSON.stringify(newFollowing));
      }
    };

    // Apenas corre se houver algo a enriquecer
    if (
      (publicTrips || []).some(t => !Array.isArray(t?.coordinates) || (Array.isArray(t?.coordinates) && (!Number.isFinite(Number(t.coordinates[0])) || !Number.isFinite(Number(t.coordinates[1]))))) ||
      (followingTrips || []).some(t => !Array.isArray(t?.coordinates) || (Array.isArray(t?.coordinates) && (!Number.isFinite(Number(t.coordinates[0])) || !Number.isFinite(Number(t.coordinates[1])))))
    ) {
      enrich();
    }
  }, [publicTrips, followingTrips]);

  const myVisited = useMemo(() => locations, [locations]);

  const filteredSets = useMemo(() => {
    let visited = myVisited;
    let following = followingTrips || [];
    let publicTripsData = publicTrips || [];

    // Aplicar filtros
    if (!filters.visited) visited = [];
    if (!filters.following) following = [];
    if (!filters.public) publicTripsData = [];

    if (mode === 'mine') {
      // Apenas as minhas viagens concluídas
      return { visited, following: [], public: [] };
    }
    // mode === 'all' -> Apenas viagens de outros (quem sigo e públicas)
    return {
      visited: [],
      following,
      public: publicTripsData,
    };
  }, [mode, myVisited, followingTrips, publicTrips, filters]);

  // Componente para gerenciar eventos do mapa
const MapEvents = () => {
  const map = useMapEvents({
    // Removido funcionalidade de clique para criar viagens futuras
  });

  map.setMaxBounds([[-90, -180], [90, 180]]);
  map.setMinZoom(3);
  return null;
};



  // Função para fechar o popup de boas-vindas
  const closeWelcomePopup = () => setShowWelcomePopup(false);

  // Função para gerar o link do Google Maps
  const getGoogleMapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

  // Função para extrair o país e a cidade do resultado da pesquisa
  const extractLocationInfo = (result) => {
    const address = result.address || {};
    let country = '';
    let city = '';

    // Tenta obter o país de diferentes campos possíveis
    if (address.country) {
      country = address.country;
    } else if (address.country_code) {
      country = address.country_code.toUpperCase();
    } else if (result.display_name) {
      // Se não encontrar nos campos específicos, tenta extrair do display_name
      const parts = result.display_name.split(',');
      if (parts.length > 0) {
        country = parts[parts.length - 1].trim();
      }
    }

    // Tenta obter a cidade de diferentes campos possíveis
    if (address.city) {
      city = address.city;
    } else if (address.town) {
      city = address.town;
    } else if (address.village) {
      city = address.village;
    } else if (address.municipality) {
      city = address.municipality;
    } else if (result.display_name) {
      // Se não encontrar nos campos específicos, usa a primeira parte do display_name
      const parts = result.display_name.split(',');
      if (parts.length > 1) {
        city = parts[0].trim();
      }
    }

    return { country, city };
  };

  // Função para abrir o Street View do Google Maps
  const openStreetView = (lat, lng) => {
    const streetViewUrl = `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m7!1e1!3m5!1s0x0:0x0!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fpanoid%3D${lat}_${lng}%26cb_client%3Dsearch.gws-prod.gps%26w%3D86%26h%3D86%26yaw%3D0%26pitch%3D0%26thumbfov%3D100!7i16384!8i8192`;
    window.open(streetViewUrl, '_blank');
  };

  // Função para selecionar um local da pesquisa
  const handleSelectLocation = (result) => {
    const coordinates = [parseFloat(result.lat), parseFloat(result.lon)];
    const { country, city } = extractLocationInfo(result);
    
    setSelectedLocation({
      coordinates,
      name: result.display_name,
      zoom: result.zoom || (result.type === "País" ? 5 : result.type === "Cidade" ? 10 : 14),
      radius: result.type === "País" ? 50000 : 
             result.type === "Cidade" ? 10000 : 
             result.type === "Região" ? 20000 : 5000
    });
    
    // Adicionar marcador para o local pesquisado com informações detalhadas
    setSearchMarker({
      coordinates,
      name: result.display_name,
      country,
      city,
      address: result.address || {}
    });
    
    setSearchQuery("");
    setSearchResults([]);
  };

  // Função para sanitizar input de pesquisa (SEM remover espaços)
  const sanitizeSearchInput = (input) => {
    if (!input) return '';
    
    // Remove caracteres perigosos e scripts, MAS MANTÉM ESPAÇOS
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
    // REMOVIDO .trim() para permitir espaços
  };

  // Função para validar input de localização
  const validateLocationInput = (input) => {
    if (!input) return { isValid: true, sanitized: '' };
    
    if (input.length > 100) {
      showToast('Pesquisa não pode exceder 100 caracteres!', 'error');
      return { isValid: false, sanitized: input };
    }

    const sanitized = sanitizeSearchInput(input);
    
    // Verificar apenas se caracteres perigosos foram removidos (não comparar trim)
    if (sanitized !== input) {
      showToast('Pesquisa contém caracteres não permitidos que foram removidos!', 'error');
    }

    // Validar se contém apenas caracteres permitidos (letras, números, espaços, vírgulas, hífens)
    if (!/^[a-zA-ZÀ-ÿ0-9\s,.\-''`]+$/.test(sanitized)) {
      showToast('Pesquisa contém caracteres não permitidos!', 'error');
      return { isValid: false, sanitized: input };
    }

    return { isValid: true, sanitized };
  };

  // Handler para a mudança no campo de pesquisa
  const handleSearchChange = (e) => {
    const rawQuery = e.target.value;
    const validation = validateLocationInput(rawQuery);
    
    if (!validation.isValid) {
      return;
    }
    
    setSearchQuery(validation.sanitized);
    debouncedSearch(validation.sanitized);
  };



  // Lista de países interessantes para a seta mágica
  const magicDestinations = [
    { country: "Japão", city: "Tóquio", coordinates: [35.6762, 139.6503], emoji: "🏯" },
    { country: "França", city: "Paris", coordinates: [48.8566, 2.3522], emoji: "🗼" },
    { country: "Tailândia", city: "Banguecoque", coordinates: [13.7563, 100.5018], emoji: "🏛️" },
    { country: "Brasil", city: "Rio de Janeiro", coordinates: [-22.9068, -43.1729], emoji: "🏖️" },
    { country: "Islândia", city: "Reykjavik", coordinates: [64.1466, -21.9426], emoji: "🏔️" },
    { country: "Austrália", city: "Sydney", coordinates: [-33.8688, 151.2093], emoji: "🏄‍♂️" },
    { country: "Peru", city: "Cusco", coordinates: [-13.5319, -71.9675], emoji: "🏔️" },
    { country: "Marrocos", city: "Marraquexe", coordinates: [31.6295, -7.9811], emoji: "🕌" },
    { country: "Indonésia", city: "Bali", coordinates: [-8.3405, 115.0920], emoji: "🌴" },
    { country: "Turquia", city: "Istambul", coordinates: [41.0082, 28.9784], emoji: "🕌" },
    { country: "Grécia", city: "Santorini", coordinates: [36.3932, 25.4615], emoji: "🏛️" },
    { country: "Egito", city: "Cairo", coordinates: [30.0444, 31.2357], emoji: "🏺" },
    { country: "China", city: "Pequim", coordinates: [39.9042, 116.4074], emoji: "🏮" },
    { country: "Índia", city: "Nova Deli", coordinates: [28.7041, 77.1025], emoji: "🕌" },
    { country: "Canadá", city: "Vancouver", coordinates: [49.2827, -123.1207], emoji: "🏔️" },
    { country: "Argentina", city: "Buenos Aires", coordinates: [-34.6118, -58.3960], emoji: "💃" },
    { country: "Coreia do Sul", city: "Seul", coordinates: [37.5665, 126.9780], emoji: "🏮" },
    { country: "Vietnã", city: "Ho Chi Minh", coordinates: [10.8231, 106.6297], emoji: "🏛️" },
    { country: "Nepal", city: "Katmandu", coordinates: [27.7172, 85.3240], emoji: "🏔️" },
    { country: "Filipinas", city: "Manila", coordinates: [14.5995, 120.9842], emoji: "🏝️" }
  ];

  // Função para lançar a seta mágica
  const launchMagicArrow = () => {
    if (isArrowFlying) return;

    // Escolher destino aleatório
    const randomDestination = magicDestinations[Math.floor(Math.random() * magicDestinations.length)];
    
    // Começar animação da seta
    setIsArrowFlying(true);
    setMagicDestination(randomDestination);
    
    // Primeiro, fazer um zoom out suave para ver o mundo
    setSelectedLocation({
      coordinates: [20, 0], // Centro do mapa mundial
      name: "Procurando destino...",
      zoom: 2,
      radius: 0,
    });
    
    // Após 1 segundo, começar a "voar" para o destino
    setTimeout(() => {
      setSelectedLocation({
        coordinates: randomDestination.coordinates,
        name: `A voar para ${randomDestination.city}, ${randomDestination.country}...`,
        zoom: 6,
        radius: 50000,
      });
    }, 1000);
    
    // Simular o voo da seta (3 segundos total)
    setTimeout(() => {
      // Parar a animação da seta
      setIsArrowFlying(false);
      
      // Fazer zoom final para o destino
      setSelectedLocation({
        coordinates: randomDestination.coordinates,
        name: `${randomDestination.city}, ${randomDestination.country}`,
        zoom: 8,
        radius: 30000,
      });
      
      // Mostrar popup de destino após meio segundo
      setTimeout(() => {
        setShowDestinationPopup(true);
      }, 500);
      
    }, 3000);
  };

  // Função para navegar para a página de viagens filtrada por país
  const exploreCountryTravels = () => {
    if (magicDestination) {
      // Fechar o popup
      setShowDestinationPopup(false);
      setMagicDestination(null);
      
      // Navegar para a página de viagens com filtro por país
      navigate(`/travels?country=${encodeURIComponent(magicDestination.country)}`);
    }
  };

  // Função para fechar o popup de destino
  const closeDestinationPopup = () => {
    setShowDestinationPopup(false);
    setMagicDestination(null);
  };

  return (
    <div className="gm-map-container">
      {/* Header transparente com controles e pesquisa */}
      <div className="gm-map-header">
        <div className="gm-map-controls">
          <button
            className={`gm-map-control-btn ${mode === 'mine' ? 'active' : ''}`}
            onClick={() => setMode('mine')}
          >
            <span className="gm-map-btn-icon">🏠</span>
            As Minhas Viagens
          </button>
          <button
            className={`gm-map-control-btn ${mode === 'all' ? 'active' : ''}`}
            onClick={() => setMode('all')}
          >
            <span className="gm-map-btn-icon">🌍</span>
            Todos os Viajantes
          </button>
          
          {/* Botão da Seta Mágica */}
          <button
            className={`gm-map-control-btn magic-arrow ${isArrowFlying ? 'flying' : ''}`}
            onClick={launchMagicArrow}
            disabled={isArrowFlying}
            title="Descobrir destino surpresa!"
          >
            <span className="gm-map-btn-icon">🏹</span>
            {isArrowFlying ? 'A procurar...' : 'Destino Surpresa'}
          </button>
        </div>
        
        {/* Barra de pesquisa integrada no header */}
        <div className="gm-map-search-container">
          <div className="gm-map-search-wrapper">
            <div className="gm-map-search-input-wrapper">
              <span className="gm-map-search-icon">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Pesquisar países, cidades, locais de interesse..."
                className="gm-map-search-input"
                maxLength={100}
              />
              {isLoading && <div className="gm-map-loading-spinner">⏳</div>}
            </div>
            
            {searchResults.length > 0 && (
              <div className="gm-map-search-results">
                {searchResults.map((result) => (
                  <div
                    key={result.place_id}
                    className="gm-map-search-result-item"
                    onClick={() => handleSelectLocation(result)}
                  >
                    <div className="gm-map-result-info">
                      <strong>{result.display_name}</strong>
                      <span className="gm-map-result-type">{result.type}</span>
                    </div>
                    {result.address_details && (
                      <div className="gm-map-result-details">
                        {[
                          result.address_details.city || result.address_details.town,
                          result.address_details.state || result.address_details.region,
                          result.address_details.country
                        ].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {searchQuery.length > 0 && !isLoading && searchResults.length === 0 && (
              <div className="gm-map-no-results">
                Nenhum resultado encontrado para "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
      
    

     
      {/* Legenda moderna */}
      <div className="gm-map-legend">
        <div className="gm-map-legend-header">
          <span className="gm-map-legend-icon">🗺️</span>
          <span>Legenda</span>
        </div>
        <div className="gm-map-legend-items">
          <div className="gm-map-legend-item">
            <span className="gm-map-legend-marker visited">✓</span>
            <span>Viagens Concluídas</span>
          </div>
        </div>
      </div>

      {/* Modal de Boas-vindas */}
      {showWelcomePopup && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>Bem-vindo ao Mapa Interativo Globe Memories</h2>
              <button className="gm-map-close-btn" onClick={closeWelcomePopup}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Visualize as suas aventuras pelo mundo e descubra novos destinos através de um mapa interativo personalizado!</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🗺️</span>
                  <div>
                    <strong>Vários tipos de Mapa</strong>
                    <p>Altere entre as vistas de ruas, satélite, terreno e básica para explorar diferentes perspetivas do mundo.</p>
                  </div>
                </div>

                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">📍</span>
                  <div>
                    <strong>Marcadores Inteligentes</strong>
                    <p>Veja as suas viagens concluídas, as de viajantes que segue e as viagens públicas, identificadas com cores distintas.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🔍</span>
                  <div>
                    <strong>Pesquisa Global Avançada</strong>
                    <p>Encontre qualquer país, cidade ou ponto de interesse no mundo, com sugestões automáticas.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🏹</span>
                  <div>
                    <strong>Destino Surpresa Mágico</strong>
                    <p>Use a seta mágica para descobrir destinos aleatórios e explorar a sua próxima viagem.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
              <div className="dont-show-again">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-text">
                    Não mostrar novamente esta mensagem
                  </span>
                </label>
              </div>
              <button className="gm-map-welcome-btn primary" onClick={() => {
                if (dontShowAgain) {
                  interactiveMapModalUtils.dismiss();
                }
                setShowWelcomePopup(false);
              }}>
                Comece a explorar o mundo!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Container do Mapa com múltiplas camadas */}
      <div className="gm-map-wrapper">
        <MapContainer
          center={[20, 0]}
          zoom={3}
          className="gm-map-leaflet"
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
          ref={mapRef}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="🌍 Ruas">
              <TileLayer
                url={mapLayers.streets.url}
                attribution={mapLayers.streets.attribution}
                noWrap={true}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🛰️ Satélite">
              <TileLayer
                url={mapLayers.satellite.url}
                attribution={mapLayers.satellite.attribution}
                noWrap={true}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🏔️ Terreno">
              <TileLayer
                url={mapLayers.terrain.url}
                attribution={mapLayers.terrain.attribution}
                noWrap={true}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🗺️ Básico">
              <TileLayer
                url={mapLayers.basic.url}
                attribution={mapLayers.basic.attribution}
                noWrap={true}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Marcadores de países e cidades visitados */}
          {filteredSets.visited.map((location, idx) => (
            <Marker
              key={`${location.city}-${location.country}-${location.user || ''}-${location.tripLink || idx}`}
              position={location.coordinates}
              icon={visitedIcon}
              eventHandlers={{
                click: (e) => {
                  // Adiciona animação de bounce ao marcador quando clicado
                  const markerElement = e.target._icon?.querySelector('.gm-modern-marker');
                  if (markerElement) {
                    markerElement.classList.add('marker-clicked');
                    setTimeout(() => {
                      markerElement.classList.remove('marker-clicked');
                    }, 600);
                  }
                }
              }}
            >
              <Popup>
                <div className="gm-map-popup-content">
                  <h3>🏛️ {location.country} | {location.city}</h3>
                  <div className="gm-map-popup-info">
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">👤</span>
                      <span>Viajante: {location.user || 'Tu'}</span>
                    </div>
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">📍</span>
                      <span>Local: {location.city}</span>
                    </div>
                    {location.price && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">💰</span>
                        <span>Preço: {location.price} €</span>
                      </div>
                    )}
                    {location.startDate && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">📅</span>
                        <span>Visitado em: {location.startDate}</span>
                      </div>
                    )}

                  </div>
                  <div className="gm-map-popup-actions">
                    <a href={getGoogleMapsLink(location.coordinates[0], location.coordinates[1])} target="_blank" rel="noopener noreferrer">
                      <button className="gm-map-popup-btn primary">🗺️ Google Maps</button>
                    </a>
                    {location.tripLink && (
                      <a href={location.tripLink} target="_blank" rel="noopener noreferrer">
                        <button className="gm-map-popup-btn secondary">📖 Ver Viagem</button>
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}



          {/* Marcadores de viagens de quem sigo (azuis) */}
          {mode === 'all' && filteredSets.following.map((trip, index) => (
            <Marker 
              key={`following-${index}`} 
              position={trip.coordinates} 
              icon={followingIcon}
              eventHandlers={{
                click: (e) => {
                  const markerElement = e.target._icon?.querySelector('.gm-modern-marker');
                  if (markerElement) {
                    markerElement.classList.add('marker-clicked');
                    setTimeout(() => {
                      markerElement.classList.remove('marker-clicked');
                    }, 600);
                  }
                }
              }}
            >
              <Popup>
                <div className="gm-map-popup-content">
                  <h3>👥 {trip.label || `${trip.country} | ${trip.city}`}</h3>
                  <div className="gm-map-popup-info">
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">👤</span>
                      <span>Viajante: {trip.user || 'Utilizador'}</span>
                    </div>
             
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">📍</span>
                      <span>Local: {trip.city}</span>
                    </div>
                    {trip.price && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">💰</span>
                        <span>Preço: {trip.price} €</span>
                      </div>
                    )}
                    {trip.startDate && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">📅</span>
                        <span>Visitado em: {trip.startDate}</span>
                      </div>
                    )}
             
                  </div>
                  <div className="gm-map-popup-actions">
                    <a href={getGoogleMapsLink(trip.coordinates[0], trip.coordinates[1])} target="_blank" rel="noopener noreferrer">
                      <button className="gm-map-popup-btn primary">🗺️ Google Maps</button>
                    </a>
                    {trip.tripLink && (
                      <a href={trip.tripLink} target="_blank" rel="noopener noreferrer">
                        <button className="gm-map-popup-btn secondary">📖 Ver Viagem</button>
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de viagens públicas (amarelos) */}
          {mode === 'all' && filteredSets.public.map((trip, index) => (
            <Marker 
              key={`public-${index}`} 
              position={trip.coordinates} 
              icon={publicIcon}
              eventHandlers={{
                click: (e) => {
                  const markerElement = e.target._icon?.querySelector('.gm-modern-marker');
                  if (markerElement) {
                    markerElement.classList.add('marker-clicked');
                    setTimeout(() => {
                      markerElement.classList.remove('marker-clicked');
                    }, 600);
                  }
                }
              }}
            >
              <Popup>
                <div className="gm-map-popup-content">
                  <h3>🌍 {trip.label || `${trip.country} | ${trip.city}`}</h3>
                  <div className="gm-map-popup-info">
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">🌍</span>
                      <span>País: {trip.country}</span>
                    </div>
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">📍</span>
                      <span>Local: {trip.city}</span>
                    </div>
                    {trip.price && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">💰</span>
                        <span>Preço: {trip.price} €</span>
                      </div>
                    )}
                    {trip.startDate && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">📅</span>
                        <span>Data início: {trip.startDate}</span>
                      </div>
                    )}
                    {trip.endDate && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">🏁</span>
                        <span>Data fim: {trip.endDate}</span>
                      </div>
                    )}
                  </div>
                  <div className="gm-map-popup-actions">
                    <a href={getGoogleMapsLink(trip.coordinates[0], trip.coordinates[1])} target="_blank" rel="noopener noreferrer">
                      <button className="gm-map-popup-btn primary">🗺️ Google Maps</button>
                    </a>
                    {trip.tripLink && (
                      <a href={trip.tripLink} target="_blank" rel="noopener noreferrer">
                        <button className="gm-map-popup-btn secondary">📖 Ver Viagem</button>
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Círculo para o local selecionado */}
          {selectedLocation && (
            <Circle
              center={selectedLocation.coordinates}
              radius={selectedLocation.radius}
              pathOptions={{
                color: "#3388ff",
                fillColor: "#3388ff",
                fillOpacity: 0.2,
                weight: 3,
              }}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h3>{selectedLocation.name}</h3>
                  <p>Coordenadas: {selectedLocation.coordinates[0].toFixed(4)}, {selectedLocation.coordinates[1].toFixed(4)}</p>
                  <a href={getGoogleMapsLink(selectedLocation.coordinates[0], selectedLocation.coordinates[1])} target="_blank" rel="noopener noreferrer">
                    <button style={{ marginTop: "5px", cursor: "pointer" }}>Ver no Google Maps</button>
                  </a>
                </div>
              </Popup>
            </Circle>
          )}

          {/* Marcador do local pesquisado */}
          {searchMarker && (
            <Marker 
              position={searchMarker.coordinates} 
              icon={searchIcon}
              eventHandlers={{
                click: (e) => {
                  const markerElement = e.target._icon?.querySelector('.gm-modern-marker');
                  if (markerElement) {
                    markerElement.classList.add('marker-clicked');
                    setTimeout(() => {
                      markerElement.classList.remove('marker-clicked');
                    }, 600);
                  }
                },
                popupclose: () => {
                  // Remove o marcador quando o popup é fechado
                  setSearchMarker(null);
                }
              }}
            >
              <Popup closeButton={false}>
                <div className="gm-map-popup-content">
                  <h3>🔍 {searchMarker.name}</h3>
                  <div className="gm-map-popup-info">
                    {searchMarker.country && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">🌍</span>
                        <span>País: {searchMarker.country}</span>
                      </div>
                    )}
                    {searchMarker.city && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">📍</span>
                        <span>Local: {searchMarker.city}</span>
                      </div>
                    )}
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">🧭</span>
                      <span>Coordenadas: {searchMarker.coordinates[0].toFixed(4)}, {searchMarker.coordinates[1].toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="gm-map-popup-actions">
                    <a 
                      href={getGoogleMapsLink(searchMarker.coordinates[0], searchMarker.coordinates[1])} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'block', textDecoration: 'none', flex: 1 }}
                    >
                      <button className="gm-map-popup-btn primary">
                        🗺️ Google Maps
                      </button>
                    </a>
                    <button
                      className="gm-map-popup-btn danger"
                      onClick={() => setSearchMarker(null)}
                    >
                      ❌ Fechar
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Popup aberto automaticamente para a viagem aleatória */}
          {randomPopup && (
            <Popup position={randomPopup.coordinates} eventHandlers={{ remove: () => setRandomPopup(null) }}>
              <div style={{ maxWidth: 260 }}>
                <h3 style={{ marginTop: 0 }}>{randomPopup.label || `${randomPopup.country} | ${randomPopup.city}`}</h3>
                {randomPopup.image && (
                  <img src={randomPopup.image} alt={randomPopup.label || randomPopup.city} style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
                )}
                <p style={{ margin: '6px 0' }}>País: {randomPopup.country}</p>
                <p style={{ margin: '6px 0' }}>Local: {randomPopup.city}</p>
                {randomPopup.summary && <p style={{ margin: '6px 0' }}>{randomPopup.summary}</p>}
                {randomPopup.tripLink && (
                  <a href={randomPopup.tripLink} target="_blank" rel="noopener noreferrer">
                    <button style={{ marginTop: 6, cursor: 'pointer' }}>Ver mais</button>
                  </a>
                )}
              </div>
            </Popup>
          )}

          <MapEvents />
          <MapController selectedLocation={selectedLocation} />
        </MapContainer>
      </div>


      {/* Popup de Destino Mágico */}
      {showDestinationPopup && magicDestination && (
        <div className="gm-map-magic-popup-overlay">
          <div className="gm-map-magic-popup">
            <div className="gm-map-magic-popup-header">
              <div className="gm-map-magic-target">🎯</div>
              <button className="gm-map-close-btn" onClick={closeDestinationPopup}>×</button>
            </div>
            <div className="gm-map-magic-popup-content">
              <div className="gm-map-magic-emoji">{magicDestination.emoji}</div>
              <h2>A tua próxima aventura será em:</h2>
              <div className="gm-map-magic-destination">
                <span className="gm-map-magic-country">{magicDestination.country}</span>
                <span className="gm-map-magic-city">{magicDestination.city}</span>
              </div>
              <p className="gm-map-magic-description">
                Vamos descobrir as memórias de quem já esteve neste destino incrível?
              </p>
            </div>
            <div className="gm-map-magic-popup-actions">
              <button 
                className="gm-map-magic-btn primary"
                onClick={exploreCountryTravels}
              >
                🔍 Ver viagens em {magicDestination.country}
              </button>
            </div>
          </div>
        </div>
      )}

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

export default InteractiveMap;