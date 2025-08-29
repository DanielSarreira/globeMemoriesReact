import React, { useEffect, useState, useCallback, useMemo } from "react";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import travels from "../data/travelsData";
import L from "leaflet";
import debounce from "lodash/debounce";

import { useNavigate } from "react-router-dom";

// Corrige o problema de ícones padrão no Leaflet com React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ícone azul (viagens de utilizadores que sigo)
const blueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone amarelo (viagens públicas de outros)
const yellowIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// (removidas duplicações de ícones)

// Ícone verde (viagens passadas)
const greenIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone laranja (futuras viagens)
const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Ícone roxo (resultados de pesquisa)
const purpleIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
  const navigate = useNavigate();

  const MAPTILER_API_KEY = "G59o5q9sfWGLLQJsw3v7";

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
    if (mode === 'mine') {
      // Apenas as minhas viagens (concluídas e futuras)
      return { visited: myVisited, future: myFuture, following: [], public: [] };
    }
    // mode === 'all' -> Apenas viagens de outros (quem sigo e públicas)
    return {
      visited: [],
      future: [],
      following: followingTrips || [],
      public: publicTrips || [],
    };
  }, [mode, myVisited, myFuture, followingTrips, publicTrips]);

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

  // Handler para a mudança no campo de pesquisa
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
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
    <div style={{ height: "100%", width: "100%", overflow: "hidden", position: "relative" }}>
      {/* Botões de filtro principais */}
      <div
        style={{
          position: "absolute",
          bottom: "25px",
          left: "20px",
          zIndex: 1100,
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          onClick={() => { setMode('mine'); }}
          style={{
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            backgroundColor: mode === 'mine' ? '#4CAF50' : 'white',
            color: mode === 'mine' ? 'white' : '#333',
            cursor: 'pointer',
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            fontWeight: 600,
          }}
        >
          As Minhas Viagens / Futuras Viagens
        </button>
        <button
          onClick={() => setMode('all')}
          style={{
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid #ccc",
            backgroundColor: mode === 'all' ? '#1976d2' : 'white',
            color: mode === 'all' ? 'white' : '#333',
            cursor: 'pointer',
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            fontWeight: 600,
          }}
        >
          Viagens de Todos os Viajantes
        </button>
      </div>
      
      {/* Legenda */}
      <div
        style={{
          position: 'absolute',
          bottom: '90px',
          left: '20px',
          backgroundColor: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid #ddd',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          zIndex: 1100,
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Legenda</div>
        <div style={{ display: 'grid', gap: 4 }}>
          <span>• Verde = As Minhas Viagens (Concluídas)</span>
          <span>• Laranja = As Minhas Viagens (Futuras)</span>
          <span>• Azul = Viagens de quem sigo</span>
          <span>• Amarelo = Viagens Públicas</span>
        </div>
      </div>

      {/* Campo de Pesquisa */}
      <div
        style={{
          position: "absolute",
          top: "40px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "750px",
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Pesquisar países, cidades, regiões..."
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "16px",
            outline: "none",
          }}
        />
        {isLoading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              fontSize: "14px",
              color: "#666",
            }}
          >
            A Carregar...
          </div>
        )}
        {searchResults.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: "5px 0 0 0",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              maxHeight: "450px",
              overflowY: "auto",
              border: "1px solid #ddd",
              width: "771px",
            }}
          >
            {searchResults.map((result) => (
              <li
                key={result.place_id}
                onClick={() => handleSelectLocation(result)}
                style={{
                  padding: "12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = "#f5f5f5")}
                onMouseLeave={(e) => (e.target.style.backgroundColor = "white")}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{result.display_name}</strong>
                  <span style={{ 
                    color: "#666", 
                    fontSize: "12px", 
                    backgroundColor: "#fff !important",
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {result.type}
                  </span>
                </div>
                {result.address_details && (
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#666",
                    marginTop: "4px",
                    display:"flex",
                    backgroundColor:"#fff !important",
                  }}>
                    {[
                      result.address_details.city || result.address_details.town,
                      result.address_details.state || result.address_details.region,
                      result.address_details.country
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {searchQuery.length > 0 && !isLoading && searchResults.length === 0 && (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#fff !important",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              marginTop: "5px",
              color: "#666",
            }}
          >
            Nenhum resultado encontrado para "{searchQuery}"
          </div>
        )}
      </div>

      {/* Popup de Boas-Vindas */}
      {showWelcomePopup && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          <h2>Bem-vindo ao Mapa Interativo!</h2>
          <p>Aqui pode explorar as suas aventuras! <br></br>Veja como funciona:</p>
          <ul style={{ textAlign: "left", margin: "10px 0" }}>
            <li><strong>Marcadores Verdes:</strong> Mostram as viagens que já realizou...</li>
            <li><strong>Marcadores Laranjas:</strong> Adicione futuras viagens clicando no mapa!</li>
            <li><strong>Interacção:</strong> Arraste o mapa e clique nos marcadores.</li>
          </ul>
          <button
            onClick={closeWelcomePopup}
            style={{
              marginTop: "10px",
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Entendido
          </button>
        </div>
      )}

      <div style={{ height: "95vh", width: "200vh", position: "relative" }}>
        <MapContainer
          center={[20, 0]}
          zoom={3}
          style={{ height: "1000px", width: "100%" }}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_API_KEY}`}
            attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            noWrap={true}
          />

          {/* Marcadores de países e cidades visitados */}
          {filteredSets.visited.map((location, idx) => (
            <Marker
              key={`${location.city}-${location.country}-${location.user || ''}-${location.tripLink || idx}`}
              position={location.coordinates}
              icon={greenIcon}
            >
              <Popup>
                <h3>{location.country} | {location.city}</h3>
                <p>Viajante: {location.user || 'Desconhecido'}</p>
                <p>Local: {location.city}</p>
                <p>Preço total da Viagem: {location.price ? `${location.price} €` : "Sem Informação"}</p>
                <p>Visitado em: {location.startDate}</p>
                <p>Coordenadas: {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</p>
                <a href={getGoogleMapsLink(location.coordinates[0], location.coordinates[1])} target="_blank" rel="noopener noreferrer">
                  <button style={{ marginTop: "5px", cursor: "pointer" }}>Ver no Google Maps</button>
                </a>
                <br />
                <a href={location.tripLink} target="_blank" rel="noopener noreferrer">
                  <button style={{ marginTop: "5px", cursor: "pointer" }}>Ver Viagem</button>
                </a>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de futuras viagens */}
          {filteredSets.future.map((trip, index) => (
            <Marker key={`future-${index}`} position={trip.coordinates} icon={orangeIcon}>
              <Popup>
                <h3>{trip.label}</h3>
                <p>País: {trip.country}</p>
                <p>Local: {trip.city}</p>
                <p>Coordenadas: {trip.coordinates[0].toFixed(4)}, {trip.coordinates[1].toFixed(4)}</p>
                <a href={getGoogleMapsLink(trip.coordinates[0], trip.coordinates[1])} target="_blank" rel="noopener noreferrer">
                  <button style={{ marginTop: "5px", cursor: "pointer" }}>Ver no Google Maps</button>
                </a>
                <br />
                <button 
                  onClick={() => removeFutureTrip(trip)}
                  style={{
                    marginTop: "8px",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Remover
                </button>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de viagens de quem sigo (azuis) */}
          {mode === 'all' && filteredSets.following.map((trip, index) => (
            <Marker key={`following-${index}`} position={trip.coordinates} icon={blueIcon}>
              <Popup>
                <h3>{trip.label || `${trip.country} | ${trip.city}`}</h3>
                <p>Viajante: {trip.user || 'Utilizador'}</p>
                <p>País: {trip.country}</p>
                <p>Local: {trip.city}</p>
                {trip.price && <p>Preço: {trip.price} €</p>}
                {trip.startDate && <p>Data início: {trip.startDate}</p>}
                {trip.endDate && <p>Data fim: {trip.endDate}</p>}
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de viagens públicas (amarelos) */}
          {mode === 'all' && filteredSets.public.map((trip, index) => (
            <Marker key={`public-${index}`} position={trip.coordinates} icon={yellowIcon}>
              <Popup>
                <h3>{trip.label || `${trip.country} | ${trip.city}`}</h3>
                <p>País: {trip.country}</p>
                <p>Local: {trip.city}</p>
                {trip.price && <p>Preço: {trip.price} €</p>}
                {trip.startDate && <p>Data início: {trip.startDate}</p>}
                {trip.endDate && <p>Data fim: {trip.endDate}</p>}
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
              icon={purpleIcon}
              eventHandlers={{
                popupclose: () => {
                  // Remove o marcador quando o popup é fechado
                  setSearchMarker(null);
                }
              }}
            >
              <Popup closeButton={false}>
                <div style={{ textAlign: 'center', minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>{searchMarker.name}</h4>
                  
                  {/* País e Cidade */}
                  <div style={{ textAlign: 'left', marginBottom: '10px' }}>
                    {searchMarker.country && <p style={{ margin: '4px 0' }}><strong>País:</strong> {searchMarker.country}</p>}
                    {searchMarker.city && <p style={{ margin: '4px 0' }}><strong>Cidade:</strong> {searchMarker.city}</p>}
                    <p style={{ margin: '4px 0' }}><strong>Coordenadas:</strong> {searchMarker.coordinates[0].toFixed(4)}, {searchMarker.coordinates[1].toFixed(4)}</p>
                  </div>
                  
                  {/* Botão Adicionar como Viagem Futura */}
                  <button
                    onClick={() => addFutureTripFromSearch(searchMarker)}
                    style={{
                      backgroundColor: '#fd7e14', // Laranja
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      margin: '8px 0',
                      width: '100%',
                      fontWeight: 'bold'
                    }}
                  >
                    Adicionar como Viagem Futura
                  </button>
                  
                  {/* Botão Ver no Google Maps */}
                  <a 
                    href={getGoogleMapsLink(searchMarker.coordinates[0], searchMarker.coordinates[1])} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ display: 'block', textDecoration: 'none' }}
                  >
                    <button 
                      style={{ 
                        width: '100%',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        backgroundColor: '#28a745', // Verde
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        margin: '8px 0',
                        fontWeight: 'bold'
                      }}
                    >
                      Ver no Google Maps
                    </button>
                  </a>
                  
                  {/* Botão Fechar */}
                  <button
                    onClick={() => setSearchMarker(null)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #ddd',
                      cursor: 'pointer',
                      marginTop: '8px',
                      fontSize: '0.9em',
                      color: '#6c757d'
                    }}
                  >
                    Fechar
                  </button>
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

      {/* Explorar Aleatório (viagem pública aleatória) */}
      {mode === 'all' && (
        <div style={{ position: 'absolute', left: 615, bottom: 25, zIndex: 1100 }}>
          <button
            onClick={() => {
              // Considera viagens públicas e de quem sigo
              const combinedFiltered = [...(filteredSets.public || []), ...(filteredSets.following || [])];
              const combinedAll = [...(publicTrips || []), ...(followingTrips || [])];
              const basePool = combinedFiltered.length ? combinedFiltered : combinedAll;
              const pool = (basePool || []).filter(hasValidCoords);
              if (!pool.length) {
                console.warn('Sem viagens elegíveis com coordenadas válidas.');
                window.alert('Não há viagens com coordenadas válidas para explorar.');
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
            style={{
              padding: '10px 14px',
              borderRadius: 20,
              border: '1px solid #ccc',
              backgroundColor: '#ff5722',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              fontWeight: 600,
            }}
          >
            Explorar uma Viagem Aleatória
          </button>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;