import React, { useEffect, useState, useCallback } from "react";
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
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

  // Função para obter país e cidade a partir de coordenadas
  const getLocationFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt-PT`
      );
      const data = await response.json();
      if (data && data.address) {
        return {
          country: data.address.country || "Desconhecido",
          city: data.address.city || data.address.town || data.address.village || "Desconhecido",
        };
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

    const fetchCoordinates = async () => {
      const uniqueLocations = new Map();
      for (const travel of travels) {
        const locationKey = `${travel.city}, ${travel.country}`;
        if (
          !uniqueLocations.has(locationKey) ||
          new Date(travel.startDate) > new Date(uniqueLocations.get(locationKey).startDate)
        ) {
          uniqueLocations.set(locationKey, {
            city: travel.city,
            country: travel.country,
            startDate: travel.startDate,
            price: travel.price,
            tripLink: `/travel/${travel.id}`,
          });
        }
      }

      const locationsWithCoords = [];
      for (const location of uniqueLocations.values()) {
        const result = await getCoordinates(location.country, location.city);
        if (result) {
          locationsWithCoords.push({
            ...location,
            coordinates: result.coordinates,
            displayName: result.name,
          });
        }
      }

      setLocations(locationsWithCoords);
      localStorage.setItem("visitedTrips", JSON.stringify(locationsWithCoords));
    };

    fetchCoordinates();
  }, []);

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

      const { lat, lng } = e.latlng;
      const location = await getLocationFromCoordinates(lat, lng);
      const newFutureTrip = {
        coordinates: [lat, lng],
        label: `Viagem Futura a ${location.city}`,
        country: location.country,
        city: location.city,
      };

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
      };

      futureTravels.push(newTravel);
      localStorage.setItem("futureTravels", JSON.stringify(futureTravels));
    },
  });

  map.setMaxBounds([[-90, -180], [90, 180]]);
  map.setMinZoom(3);
  return null;
};

  // Função para verificar se o local já existe como viagem futura
  const isLocationInFutureTrips = (coordinates) => {
    return futureTrips.some(trip => 
      trip.coordinates[0] === coordinates[0] && 
      trip.coordinates[1] === coordinates[1]
    );
  };

  // Função para remover viagem futura a partir do marcador de pesquisa
  const removeFutureTripFromSearch = (marker) => {
    // Remover do futureTrips
    setFutureTrips((prevTrips) => {
      const updatedTrips = prevTrips.filter(trip => 
        !(trip.coordinates[0] === marker.coordinates[0] && 
          trip.coordinates[1] === marker.coordinates[1])
      );
      localStorage.setItem("futureTrips", JSON.stringify(updatedTrips));
      return updatedTrips;
    });

    // Remover do futureTravels
    const futureTravels = JSON.parse(localStorage.getItem("futureTravels")) || [];
    const updatedFutureTravels = futureTravels.filter(travel => 
      !(travel.coordinates[0] === marker.coordinates[0] && 
        travel.coordinates[1] === marker.coordinates[1])
    );
    localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));
  };

  // Função para fechar o popup de boas-vindas
  const closeWelcomePopup = () => setShowWelcomePopup(false);

  // Função para gerar o link do Google Maps
  const getGoogleMapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

  // Função para selecionar um local da pesquisa
  const handleSelectLocation = (result) => {
    const coordinates = [parseFloat(result.lat), parseFloat(result.lon)];
    setSelectedLocation({
      coordinates,
      name: result.display_name,
      zoom: result.zoom || (result.type === "País" ? 5 : result.type === "Cidade" ? 10 : 14),
      radius: result.type === "País" ? 50000 : 
             result.type === "Cidade" ? 10000 : 
             result.type === "Região" ? 20000 : 5000
    });
    
    // Adicionar marcador para o local pesquisado
    setSearchMarker({
      coordinates,
      name: result.display_name
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
    };

    futureTravels.push(newTravel);
    localStorage.setItem("futureTravels", JSON.stringify(futureTravels));
  };

  return (
    <div style={{ height: "100%", width: "100%", overflow: "hidden", position: "relative" }}>
      {/* Campo de Pesquisa */}
      <div
        style={{
          position: "absolute",
          top: "30px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1000,
          width: "650px",
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
              maxHeight: "250px",
              overflowY: "auto",
              border: "1px solid #ddd",
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
                    backgroundColor: "transparent",
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
                    backgroundColor:"transparent",
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
              backgroundColor: "white",
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
            <li><strong>Interação:</strong> Arraste o mapa e clique nos marcadores.</li>
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
            attribution='© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            noWrap={true}
          />

          {/* Marcadores de países e cidades visitados */}
          {locations.map((location) => (
            <Marker key={location.city + location.country} position={location.coordinates} icon={greenIcon}>
              <Popup>
                <h3>{location.country} | {location.city}</h3>
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
          {futureTrips.map((trip, index) => (
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
                  onClick={() => {
                    navigate("/futuretravels", { 
                      state: { 
                        openModal: true,
                        editCity: trip.city,
                        editCountry: trip.country,
                        editName: trip.label,
                        fromMap: true
                      } 
                    });
                  }} 
                  style={{ 
                    marginTop: "5px", 
                    cursor: "pointer",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px",
                    marginRight: "5px"
                  }}
                >
                  Editar Viagem Futura
                </button>
                <button 
                  onClick={(e) => removeFutureTripFromSearch(trip)} 
                  style={{ 
                    marginTop: "5px", 
                    cursor: "pointer",
                    backgroundColor: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "4px"
                  }}
                >
                  Remover
                </button>
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
              icon={new L.Icon({
                iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
                iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })}
            >
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <h3>{searchMarker.name}</h3>
                  <p>Coordenadas: {searchMarker.coordinates[0].toFixed(4)}, {searchMarker.coordinates[1].toFixed(4)}</p>
                  {isLocationInFutureTrips(searchMarker.coordinates) ? (
                    <button 
                      onClick={() => removeFutureTripFromSearch(searchMarker)}
                      style={{ 
                        marginTop: "5px", 
                        cursor: "pointer",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        marginRight: "5px"
                      }}
                    >
                      Remover Viagem Futura
                    </button>
                  ) : (
                    <button 
                      onClick={() => addFutureTripFromSearch(searchMarker)}
                      style={{ 
                        marginTop: "5px", 
                        cursor: "pointer",
                        backgroundColor: "#ff9800",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        marginRight: "5px"
                      }}
                    >
                      Adicionar Viagem Futura
                    </button>
                  )}
                  <br />
                  <a href={getGoogleMapsLink(searchMarker.coordinates[0], searchMarker.coordinates[1])} target="_blank" rel="noopener noreferrer">
                    <button style={{ 
                      marginTop: "5px", 
                      cursor: "pointer",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "4px"
                    }}>
                      Ver no Google Maps
                    </button>
                  </a>
                </div>
              </Popup>
            </Marker>
          )}

          <MapEvents />
          <MapController selectedLocation={selectedLocation} />
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;