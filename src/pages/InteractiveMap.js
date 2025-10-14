import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/pages/globe-memories-interactive-map.css";
import travels from "../data/travelsData";
import L from "leaflet";
import debounce from "lodash/debounce";

import { useNavigate } from "react-router-dom";
import Toast from '../components/Toast';

// Corrige o probleaflet-left .leaflet-controlma de ícones padrão no Leaflet com React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Criar ícones customizados modernos
const createCustomIcon = (color, iconType = 'location') => {
  const svgIcon = `
    <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="4" stdDeviation="3" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path d="M15 2c-7.168 0-13 5.832-13 13 0 8.284 13 23 13 23s13-14.716 13-23c0-7.168-5.832-13-13-13z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2" 
            filter="url(#shadow)"/>
      <circle cx="15" cy="15" r="6" fill="white"/>
      <text x="15" y="20" text-anchor="middle" fill="${color}" font-size="10" font-weight="bold">
        ${iconType === 'visited' ? '✓' : iconType === 'future' ? '⚡' : iconType === 'following' ? '👥' : iconType === 'public' ? '🌍' : '📍'}
      </text>
    </svg>
  `;
  
  return new L.DivIcon({
    html: svgIcon,
    className: 'gm-map-custom-marker',
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

// Ícones modernos para diferentes tipos de viagem
const visitedIcon = createCustomIcon('#22c55e', 'visited'); // Verde
const futureIcon = createCustomIcon('#f97316', 'future'); // Laranja
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
  const [futureTrips, setFutureTrips] = useState([]);
  const [followingTrips, setFollowingTrips] = useState([]); // azul
  const [publicTrips, setPublicTrips] = useState([]); // amarelo
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
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
  
  const [filters, setFilters] = useState({
    visited: true,
    future: true,
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

  // Carrega as viagens futuras e visitadas do localStorage
  useEffect(() => {
    const savedFutureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
    setFutureTrips(savedFutureTrips);

    const savedVisitedTrips = JSON.parse(localStorage.getItem("visitedTrips")) || [];
    setLocations(savedVisitedTrips);

    // Dados mock/armazenados: viagens de seguidos e públicas
    const savedFollowingTrips = JSON.parse(localStorage.getItem("followingTrips")) || [];
    setFollowingTrips(savedFollowingTrips);
    const savedPublicTrips = JSON.parse(localStorage.getItem("publicTrips")) || [];
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
  const myFuture = useMemo(() => futureTrips, [futureTrips]);

  const filteredSets = useMemo(() => {
    let visited = myVisited;
    let future = myFuture;
    let following = followingTrips || [];
    let publicTripsData = publicTrips || [];

    // Aplicar filtros
    if (!filters.visited) visited = [];
    if (!filters.future) future = [];
    if (!filters.following) following = [];
    if (!filters.public) publicTripsData = [];

    if (mode === 'mine') {
      // Apenas as minhas viagens (concluídas e futuras)
      return { visited, future, following: [], public: [] };
    }
    // mode === 'all' -> Apenas viagens de outros (quem sigo e públicas)
    return {
      visited: [],
      future: [],
      following,
      public: publicTripsData,
    };
  }, [mode, myVisited, myFuture, followingTrips, publicTrips, filters]);

  // Componente para gerenciar eventos do mapa
const MapEvents = () => {
  const map = useMapEvents({
    click: async (e) => {
      // Verifica se o clique foi em um marcador ou popup
      const target = e.originalEvent.target;
      if (target.closest('.leaflet-popup') || target.closest('.leaflet-marker-icon')) {
        return;
      }

      // Verifica se o clique foi parte de um arrasto
      if (e.originalEvent.type === 'mousedown' || e.originalEvent.type === 'mouseup') {
        return;
      }

      // Verifica se o clique foi em um botão ou elemento interativo
      if (target.closest('button') || target.closest('a')) {
        return;
      }

      // Verifica se o clique foi no mapa (não em elementos sobrepostos)
      if (!target.closest('.leaflet-container')) {
        return;
      }
      
      // Só permite adicionar viagens futuras no modo 'mine'
      if (mode !== 'mine') {
        return;
      }

      const { lat, lng } = e.latlng;
      console.log(`Clique no mapa em: ${lat}, ${lng}`); // Debug
      const location = await getLocationFromCoordinates(lat, lng);
      console.log("Localização obtida:", location); // Debug
      const newFutureTrip = {
        coordinates: [lat, lng],
        label: `Viagem Futura a ${location.city}`,
        country: location.country,
        city: location.city,
      };
      console.log("newFutureTrip criada:", newFutureTrip); // Debug

      // Adicionar ao futureTrips
      setFutureTrips((prevTrips) => {
        const updatedTrips = [...prevTrips, newFutureTrip];
        localStorage.setItem("futureTrips", JSON.stringify(updatedTrips));
        return updatedTrips;
      });

      // Adicionar ao futureTravels com valores padrão
      const futureTravels = JSON.parse(localStorage.getItem("futureTravels")) || [];
      // Calcular a data de início como o dia seguinte
      const today = new Date();
      const tomorrow = new Date(today);
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

      const newTravel = {
        id: Date.now(), // Usar timestamp para IDs únicos
        name: `Viagem Futura a ${location.city}`,
        user: "Tiago",
        category: [],
        country: location.country,
        city: location.city,
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
        coordinates: [lat, lng],
        travelType: { // Adicionar estrutura de tipo de viagem
          main: 'single', // Por padrão, viagens criadas no mapa são de destino único
          isGroup: false
        }
      };
      console.log("newTravel criada:", newTravel); // Debug

      futureTravels.push(newTravel);
      localStorage.setItem("futureTravels", JSON.stringify(futureTravels));
    },
  });

  map.setMaxBounds([[-90, -180], [90, 180]]);
  map.setMinZoom(3);
  return null;
};

  // Função para remover viagem futura
  const removeFutureTrip = (trip) => {
    // Remover do futureTrips
    setFutureTrips((prevTrips) => {
      const updatedTrips = prevTrips.filter(t => 
        !(t.coordinates[0] === trip.coordinates[0] && 
          t.coordinates[1] === trip.coordinates[1])
      );
      localStorage.setItem("futureTrips", JSON.stringify(updatedTrips));
      return updatedTrips;
    });

    // Remover do futureTravels no localStorage
    const futureTravels = JSON.parse(localStorage.getItem("futureTravels")) || [];
    const updatedFutureTravels = futureTravels.filter(t => 
      !(t.coordinates[0] === trip.coordinates[0] && 
        t.coordinates[1] === trip.coordinates[1])
    );
    localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));
  };

  // Função para verificar se o local já existe como viagem futura
  const isLocationInFutureTrips = (coordinates) => {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return false;
    }
    return futureTrips.some(trip => 
      trip.coordinates && 
      Array.isArray(trip.coordinates) && 
      trip.coordinates.length === 2 &&
      trip.coordinates[0] === coordinates[0] && 
      trip.coordinates[1] === coordinates[1]
    );
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

  // Função para sanitizar input de pesquisa
  const sanitizeSearchInput = (input) => {
    if (!input) return '';
    
    // Remove caracteres perigosos e scripts
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '')
      .trim();
  };

  // Função para validar input de localização
  const validateLocationInput = (input) => {
    if (!input) return { isValid: true, sanitized: '' };
    
    if (input.length > 100) {
      showToast('Pesquisa não pode exceder 100 caracteres!', 'error');
      return { isValid: false, sanitized: input };
    }

    const sanitized = sanitizeSearchInput(input);
    
    if (sanitized !== input.trim()) {
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

  // Função para adicionar viagem futura a partir do marcador de pesquisa
  const addFutureTripFromSearch = (marker) => {
    const newFutureTrip = {
      coordinates: marker.coordinates,
      label: `Viagem Futura a ${marker.name}`,
      country: marker.name.split(',')[marker.name.split(',').length - 1]?.trim() || "Desconhecido",
      city: marker.name.split(',')[0]?.trim() || "Desconhecido",
    };

    // Adicionar ao futureTrips
    setFutureTrips((prevTrips) => {
      const updatedTrips = [...prevTrips, newFutureTrip];
      localStorage.setItem("futureTrips", JSON.stringify(updatedTrips));
      return updatedTrips;
    });

    // Adicionar ao futureTravels com valores padrão
    const futureTravels = JSON.parse(localStorage.getItem("futureTravels")) || [];
    const today = new Date();
    const tomorrow = new Date(today);
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

    const newTravel = {
      id: Date.now(),
      name: `Viagem Futura a ${marker.name}`,
      user: "Tiago",
      category: [],
      country: newFutureTrip.country,
      city: newFutureTrip.city,
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
      coordinates: marker.coordinates,
      travelType: { // Adicionar estrutura de tipo de viagem
        main: 'single', // Por padrão, viagens criadas no mapa são de destino único
        isGroup: false
      }
    };

    futureTravels.push(newTravel);
    localStorage.setItem("futureTravels", JSON.stringify(futureTravels));
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
          <div className="gm-map-legend-item">
            <span className="gm-map-legend-marker future">⚡</span>
            <span>Viagens Futuras</span>
          </div>
         
        </div>
      </div>

      {/* Modal de Boas-vindas */}
      {showWelcomePopup && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>🗺️ Bem-vindo ao Mapa Interativo</h2>
              <button className="gm-map-close-btn" onClick={closeWelcomePopup}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Explore o mundo de forma interativa e descubra novos destinos!</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">✓</span>
                  <div>
                    <strong>Marcadores Verdes</strong>
                    <p>Viagens já realizadas</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">⚡</span>
                  <div>
                    <strong>Marcadores Laranjas</strong>
                    <p>Viagens Futuras que estão a ser planeadas</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🔍</span>
                  <div>
                    <strong>Pesquisa Inteligente</strong>
                    <p>Encontre qualquer lugar do mundo</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">📊</span>
                  <div>
                    <strong>Estatísticas</strong>
                    <p>Acompanhe o seu progresso de viagens</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
              <button className="gm-map-welcome-btn primary" onClick={closeWelcomePopup}>
                Comece a explorar!
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
                        <span>Custo: {location.price} €</span>
                      </div>
                    )}
                    {location.startDate && (
                      <div className="gm-map-info-item">
                        <span className="gm-map-info-icon">📅</span>
                        <span>Visitado em: {location.startDate}</span>
                      </div>
                    )}
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">🌍</span>
                      <span>Coordenadas: {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</span>
                    </div>
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

          {/* Marcadores de futuras viagens */}
          {filteredSets.future.map((trip, index) => (
            <Marker key={`future-${index}`} position={trip.coordinates} icon={futureIcon}>
              <Popup>
                <div className="gm-map-popup-content">
                  <h3>⚡ {trip.label || `Viagem Futura para ${trip.city}`}</h3>
                  <div className="gm-map-popup-info">
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">🌍</span>
                      <span>País: {trip.country}</span>
                    </div>
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">📍</span>
                      <span>Local: {trip.city}</span>
                    </div>
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">🧭</span>
                      <span>Coordenadas: {trip.coordinates[0].toFixed(4)}, {trip.coordinates[1].toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="gm-map-popup-actions">
                    <a href={getGoogleMapsLink(trip.coordinates[0], trip.coordinates[1])} target="_blank" rel="noopener noreferrer">
                      <button className="gm-map-popup-btn primary">🗺️ Google Maps</button>
                    </a>
                    <button 
                      className="gm-map-popup-btn danger"
                      onClick={() => removeFutureTrip(trip)}
                    >
                      🗑️ Remover
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de viagens de quem sigo (azuis) */}
          {mode === 'all' && filteredSets.following.map((trip, index) => (
            <Marker key={`following-${index}`} position={trip.coordinates} icon={followingIcon}>
              <Popup>
                <div className="gm-map-popup-content">
                  <h3>👥 {trip.label || `${trip.country} | ${trip.city}`}</h3>
                  <div className="gm-map-popup-info">
                    <div className="gm-map-info-item">
                      <span className="gm-map-info-icon">👤</span>
                      <span>Viajante: {trip.user || 'Utilizador'}</span>
                    </div>
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
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de viagens públicas (amarelos) */}
          {mode === 'all' && filteredSets.public.map((trip, index) => (
            <Marker key={`public-${index}`} position={trip.coordinates} icon={publicIcon}>
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
                    <button
                      className="gm-map-popup-btn primary"
                      onClick={() => addFutureTripFromSearch(searchMarker)}
                    >
                      ⚡ Adicionar Viagem
                    </button>
                    <a 
                      href={getGoogleMapsLink(searchMarker.coordinates[0], searchMarker.coordinates[1])} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ display: 'block', textDecoration: 'none', flex: 1 }}
                    >
                      <button className="gm-map-popup-btn secondary">
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

      {/* Botão de ação flutuante */}
      {mode === 'all' && (
        <div className="gm-map-floating-action-btn">
          <button
            className="gm-map-fab-main"
            onClick={() => {
              // Considera viagens públicas e de quem sigo
              const combinedFiltered = [...(filteredSets.public || []), ...(filteredSets.following || [])];
              const combinedAll = [...(publicTrips || []), ...(followingTrips || [])];
              const basePool = combinedFiltered.length ? combinedFiltered : combinedAll;
              const pool = (basePool || []).filter(hasValidCoords);
              if (!pool.length) {
                console.warn('Sem viagens elegíveis com coordenadas válidas.');
                showToast('Não há viagens com coordenadas válidas para explorar.', 'error');
                return;
              }
              const r = pool[Math.floor(Math.random() * pool.length)];
              const coords = [Number(r.coordinates[0]), Number(r.coordinates[1])];
              setSelectedLocation({
                coordinates: coords,
                name: `${r.city}, ${r.country}`,
                zoom: 12,
                radius: 8000,
              });
              setRandomPopup({ ...r, coordinates: coords });
            }}
          >
            <span className="gm-map-fab-icon">🎲</span>
            <span className="gm-map-fab-text">Descobrir</span>
          </button>
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