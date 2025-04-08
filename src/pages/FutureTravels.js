import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
    coordinates: null, // Adicionado para armazenar coordenadas
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
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

  // Carregar viagens futuras do localStorage ao montar o componente
  useEffect(() => {
    const savedFutureTravels = JSON.parse(localStorage.getItem("futureTravels")) || [];
    setFutureTravels(savedFutureTravels);
  }, []);

  // Função para validar campos obrigatórios
  const validateForm = () => {
    if (!newTravel.name.trim()) {
      setToast({ message: "O nome da viagem é obrigatório!", type: "error", show: true });
      return false;
    }
    if (!newTravel.country) {
      setToast({ message: "Selecione um país!", type: "error", show: true });
      return false;
    }
    if (!newTravel.city.trim()) {
      setToast({ message: "A cidade é obrigatória!", type: "error", show: true });
      return false;
    }
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ message: "As datas de início e fim são obrigatórias!", type: "error", show: true });
      return false;
    }
    const today = new Date();
    if (new Date(newTravel.startDate) < today) {
      setToast({ message: "A data de início deve ser no futuro!", type: "error", show: true });
      return false;
    }
    if (new Date(newTravel.endDate) < new Date(newTravel.startDate)) {
      setToast({ message: "A data de fim deve ser após a data de início!", type: "error", show: true });
      return false;
    }
    return true;
  };

  // Funções de manipulação de estado
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
            updatedTransport.push(value);
          } else {
            updatedTransport = updatedTransport.filter((transport) => transport !== value);
          }
          return { ...prevState, localTransport: updatedTransport };
        });
      }
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
      updatedChecklist[index].checked = !updatedChecklist[index].checked;
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
      category: travelToEdit.category || [],
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

    // Remover do futureTrips no localStorage
    const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
    const updatedFutureTrips = futureTrips.filter(
      (trip) => !(trip.city === travelToDelete.city && trip.country === travelToDelete.country)
    );
    localStorage.setItem("futureTrips", JSON.stringify(updatedFutureTrips));

    setToast({ message: "Viagem futura excluída com sucesso!", type: "success", show: true });
  };

  const handleAddTravel = async () => {
    if (!validateForm()) return;

    const coordinates = await getCoordinates(newTravel.country, newTravel.city);
    if (!coordinates) {
      setToast({ message: "Não foi possível obter coordenadas para a localização!", type: "error", show: true });
      return;
    }

    const updatedTravel = {
      ...newTravel,
      id: isEditing ? editTravelId : Date.now(), // Usar timestamp para IDs únicos
      accommodations: newTravel.accommodations,
      pointsOfInterest: newTravel.pointsOfInterest.filter(
        (point) => point.name.trim() !== "" || point.type.trim() !== "" || point.link.trim() !== ""
      ),
      itinerary: newTravel.itinerary.filter((item) => item.day && item.activities.length > 0),
      localTransport: newTravel.localTransport || [],
      checklist: newTravel.checklist || [],
      coordinates,
    };

    let updatedFutureTravels;
    if (isEditing) {
      updatedFutureTravels = futureTravels.map((travel) => (travel.id === editTravelId ? updatedTravel : travel));
      setFutureTravels(updatedFutureTravels);
      setToast({ message: "Viagem futura editada com sucesso!", type: "success", show: true });
    } else {
      updatedFutureTravels = [...futureTravels, updatedTravel];
      setFutureTravels(updatedFutureTravels);
      setToast({ message: "Viagem futura adicionada com sucesso!", type: "success", show: true });
    }

    // Salvar no localStorage para FutureTravels
    localStorage.setItem("futureTravels", JSON.stringify(updatedFutureTravels));

    // Sincronizar com futureTrips para o InteractiveMap
    const futureTrips = JSON.parse(localStorage.getItem("futureTrips")) || [];
    const newFutureTrip = {
      coordinates,
      label: newTravel.name,
      country: newTravel.country,
      city: newTravel.city,
    };

    if (isEditing) {
      // Atualizar a entrada existente em futureTrips
      const tripIndex = futureTrips.findIndex(
        (trip) => trip.city === futureTravels.find((t) => t.id === editTravelId).city &&
                  trip.country === futureTravels.find((t) => t.id === editTravelId).country
      );
      if (tripIndex !== -1) {
        futureTrips[tripIndex] = newFutureTrip;
      } else {
        futureTrips.push(newFutureTrip); // Caso não encontre, adiciona (embora isso seja improvável)
      }
    } else {
      futureTrips.push(newFutureTrip);
    }

    localStorage.setItem("futureTrips", JSON.stringify(futureTrips));

    resetForm();
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
    setIsModalOpen(false);
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
  };

  const openModal = () => {
    setIsEditing(false);
    setEditTravelId(null);
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setItineraryError("");
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

      <button className="primary-action-button" onClick={openModal}>
        Planear Nova Viagem
      </button>
      <br />
      <br />

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <label>🔒 Privacidade da Viagem:</label>
              <select
                name="privacy"
                value={newTravel.privacy}
                onChange={handleChange}
                style={{ width: "15%", padding: "5px" }}
              >
                <option value="public">Pública</option>
                <option value="followers">Somente para Seguidores</option>
                <option value="private">Privada</option>
              </select>

              <button type="button" onClick={handleAddTravel} className="primary-action-button">
                {isEditing ? "Guardar Alterações" : "Adicionar Viagem Futura"}
              </button>
              <button type="button" onClick={closeModal} className="secondary-action-button">
                Fechar
              </button>
            </div>

            <div className="tab-nav">
              <button
                onClick={() => handleTabChange("generalInfo")}
                className={activeTab === "generalInfo" ? "active" : ""}
              >
                1 - Informações Gerais
              </button>
              <button
                onClick={() => handleTabChange("prices")}
                className={activeTab === "prices" ? "active" : ""}
              >
                2 - Preços Estimados
              </button>
              <button
                onClick={() => handleTabChange("accommodation")}
                className={activeTab === "accommodation" ? "active" : ""}
              >
                3 - Estadia Planejada
              </button>
              <button
                onClick={() => handleTabChange("transport")}
                className={activeTab === "transport" ? "active" : ""}
              >
                4 - Transporte
              </button>
              <button
                onClick={() => handleTabChange("pointsOfInterest")}
                className={activeTab === "pointsOfInterest" ? "active" : ""}
              >
                5 - Pontos de Referência
              </button>
              <button
                onClick={() => handleTabChange("itinerary")}
                className={activeTab === "itinerary" ? "active" : ""}
              >
                6 - Itinerário
              </button>
              <button
                onClick={() => handleTabChange("checklist")}
                className={activeTab === "checklist" ? "active" : ""}
              >
                7 - Checklist de Viagem
              </button>
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
                    <label>Nome da Viagem Futura:</label>
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
                        <label>🌍 País:</label>
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
                        <label>🏙️ Cidade:</label>
                        <input
                          type="text"
                          name="city"
                          value={newTravel.city}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <br />
                    <br />

                    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", width: "100%" }}>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>📅 Data de Início:</label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <label>📅 Data de Fim:</label>
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
                <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
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
              )}

              {activeTab === "accommodation" && (
                <div className="LeftPosition">
                  <label>Alojamento Planejado (Opcional):</label>
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
                <div className="LeftPosition">
                  <label>Métodos de Transporte Planejados:</label>
                  <p>
                    {newTravel.localTransport.length > 0
                      ? newTravel.localTransport.join(", ")
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
                                checked={newTravel.localTransport.includes(option)}
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
                    <h3>Pontos de Referência Planejados</h3>
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
                      <p>Nenhum ponto de referência planejado adicionado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <label>Nome do Ponto de Referência:</label>
                    <input
                      type="text"
                      name="name"
                      value={newPointOfInterest.name}
                      onChange={handlePointChange}
                      style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
                      placeholder="Ex.: Torre Eiffel"
                    />

                    <label>Tipo:</label>
                    <select
                      name="type"
                      value={newPointOfInterest.type}
                      onChange={handlePointChange}
                      style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="Monumento histórico">Monumento histórico</option>
                      <option value="Parque">Parque</option>
                      <option value="Museu">Museu</option>
                      <option value="Praia">Praia</option>
                      <option value="Mercado">Mercado</option>
                    </select>

                    <label>Link (opcional):</label>
                    <input
                      type="text"
                      name="link"
                      value={newPointOfInterest.link}
                      onChange={handlePointChange}
                      style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
                      placeholder="Ex.: https://www.toureiffel.paris/"
                    />

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
                    <h3>Itinerário Planejado da Viagem</h3>
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
                      <p>Nenhum dia adicionado ao itinerário planejado ainda.</p>
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
                      style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
                      placeholder={`Digite um número entre 1 e ${calculateTripDays()}`}
                    />
                    {itineraryError && <p style={{ color: "red", marginBottom: "10px" }}>{itineraryError}</p>}

                    <label>Atividades Planejadas:</label>
                    {newItineraryDay.activities.map((activity, index) => (
                      <div key={index} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                        <input
                          type="text"
                          name={`activity-${index}`}
                          value={activity}
                          onChange={(e) => handleItineraryChange(e, index)}
                          style={{ width: "100%", padding: "5px" }}
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
                    <h3>Checklist de Viagem</h3>
                    {newTravel.checklist.length > 0 ? (
                      <ul style={{ listStyle: "none", padding: "0" }}>
                        {newTravel.checklist.map((item, index) => (
                          <li
                            key={index}
                            style={{ marginBottom: "10px", padding: "10px", border: "1px solid #e9ecef", borderRadius: "4px" }}
                          >
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() => handleToggleChecklistItem(index)}
                              style={{ marginRight: "10px" }}
                            />
                            <span style={{ textDecoration: item.checked ? "line-through" : "none" }}>{item.name}</span>
                            <div style={{ marginTop: "5px" }}>
                              <button
                                onClick={(e) => handleEditChecklistItem(e, index)}
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
                                onClick={(e) => handleDeleteChecklistItem(e, index)}
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
                      <p>Nenhum item adicionado à checklist ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <label>Item da Checklist:</label>
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={handleChecklistChange}
                      style={{ width: "100%", marginBottom: "10px", padding: "5px" }}
                      placeholder="Ex.: Passaporte"
                    />

                    <button
                      onClick={(e) => handleAddOrEditChecklistItem(e)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        marginRight: "10px",
                      }}
                      disabled={!newChecklistItem.trim()}
                    >
                      {editingChecklistIndex !== null ? "Guardar Alterações" : "Adicionar Item"}
                    </button>
                    {editingChecklistIndex !== null && (
                      <button
                        onClick={(e) => handleCancelEditChecklist(e)}
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
            </form>
          </div>
        </div>
      )}

      <div className="travels-list">
        {futureTravels.length === 0 ? (
          <p>Nenhuma viagem planeada ainda. <br></br>Comece a planear agora a sua viagem!</p>
        ) : (
          futureTravels.map((travel) => (
            <div key={travel.id} className="travel-card">
              <Link to={`/future-travel/${travel.id}`}>
                <div className="travel-content">
                  <div className="no-image-placeholder"></div>
                  <div className="travel-text">
                    <h2>{travel.name}</h2>
                    <p>
                      <b>👤 Utilizador:</b> {travel.user}
                    </p>
                    <p>
                      <b>🌍 País:</b> {travel.country}
                    </p>
                    <p>
                      <b>🏙️ Cidade:</b> {travel.city}
                    </p>
                    <p>
                      <b>🗂️ Categoria:</b> {travel.category.join(", ")}
                    </p>
                    <p>
                      <b>📅 Início:</b> {travel.startDate}
                    </p>
                    <p>
                      <b>📅 Fim:</b> {travel.endDate}
                    </p>
                    <p>
                      <b>💰 Preço Estimado:</b> {travel.price || "Não definido"} €
                    </p>
                    <Link to={`/future-travel/${travel.id}`} className="button">
                      Ver mais detalhes
                    </Link>
                  </div>
                </div>
              </Link>
              <div className="travel-actions">
                <button onClick={() => handleEdit(travel.id)}>Editar</button>
                <button onClick={() => handleDelete(travel.id)}>Excluir</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FutureTravels;