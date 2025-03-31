import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import travels from "../data/travelsData";
import L from "leaflet";

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

const InteractiveMap = () => {
  const [locations, setLocations] = useState([]);
  const [futureTrips, setFutureTrips] = useState([]);

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
          name: data[0].display_name.split(",")[0], // Usa o nome localizado em pt-PT
        };
      }
    } catch (error) {
      console.error(`Erro ao obter coordenadas para ${city}, ${country}:`, error);
    }
    return null;
  };

  // Carrega as viagens futuras e visitadas do localStorage quando o componente é montado
  useEffect(() => {
    const savedFutureTrips = JSON.parse(localStorage.getItem("futureTrips"));
    if (savedFutureTrips) {
      setFutureTrips(savedFutureTrips);
    }

    const savedVisitedTrips = JSON.parse(localStorage.getItem("visitedTrips"));
    if (savedVisitedTrips) {
      setLocations(savedVisitedTrips);
    }

    const fetchCoordinates = async () => {
      const uniqueLocations = new Map();

      // Garante que cada cidade aparece apenas uma vez com a data mais recente
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
            displayName: result.name, // Nome em pt-PT
          });
        }
      }

      setLocations(locationsWithCoords);
      localStorage.setItem("visitedTrips", JSON.stringify(locationsWithCoords)); // Salva as viagens visitadas no localStorage
    };

    fetchCoordinates();
  }, []);

  // Componente para gerenciar eventos do mapa
  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        const newFutureTrip = { coordinates: [lat, lng], label: "Futura viagem" };
        setFutureTrips((prevTrips) => {
          const updatedTrips = [...prevTrips, newFutureTrip];
          localStorage.setItem("futureTrips", JSON.stringify(updatedTrips)); // Salva no localStorage
          return updatedTrips;
        });
      },
    });

    // Impede que o mapa se repita horizontalmente
    map.setMaxBounds([[-90, -180], [90, 180]]);
    map.setMinZoom(3);

    return null;
  };

  // Função para remover uma viagem futura
  const removeFutureTrip = (index, e) => {
    e.stopPropagation();
    setFutureTrips((prevTrips) => {
      const updatedTrips = prevTrips.filter((_, i) => i !== index);
      localStorage.setItem("futureTrips", JSON.stringify(updatedTrips)); // Atualiza o localStorage
      return updatedTrips;
    });
  };

  return (
    <div style={{ height: "100%", width: "100%", overflow: "hidden" }}>
      <div style={{ height: "870px", width: "100%", position: "relative" }}>
        <MapContainer
          center={[20, 0]}
          zoom={3}
          style={{ height: "100%", width: "100%" }}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">Colaboradores do OpenStreetMap</a>'
            noWrap={true}
          />

          {/* Marcadores de países e cidades visitados */}
          {locations.map((location) => (
            <Marker key={location.city + location.country} position={location.coordinates} icon={greenIcon}>
              <Popup>
                <h3>{location.displayName} |</h3>
                <p>Visitado em: {location.startDate}</p>
                <p>Cidade: {location.city}</p>
              </Popup>
            </Marker>
          ))}

          {/* Marcadores de futuras viagens */}
          {futureTrips.map((trip, index) => (
            <Marker key={`future-${index}`} position={trip.coordinates} icon={orangeIcon}>
              <Popup>
                <h3>{trip.label}</h3>
                <p>
                  Coordenadas: {trip.coordinates[0].toFixed(4)}, {trip.coordinates[1].toFixed(4)}
                </p>
                <button
                  onClick={(e) => removeFutureTrip(index, e)}
                  style={{ marginTop: "5px", cursor: "pointer" }}
                >
                  Remover
                </button>
              </Popup>
            </Marker>
          ))}

          <MapEvents />
        </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;
