import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Para navegação entre páginas
import "../styles/MyTravels.css";

const MyTravels = () => {
  const [travels, setTravels] = useState([
    {
      id: 1,
      name: "Viagem a Andorra",
      user: "Tiago",
      category: ["Cidade", "Natureza"],
      country: "Andorra",
      city: "La Cortinada",
      price: 100,
      days: 20,
      transport: "Avião",
      startDate: "2025-01-05",
      endDate: "2025-02-03",
      highlightImage: require("../images/highlightImage/lacortinada.jpg"),
      views: 100,
      description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTravel, setEditingTravel] = useState(null);

  const navigate = useNavigate(); // Hook para navegação

  // Função para abrir o modal
  const openModal = (travel = null) => {
    setEditingTravel(travel);
    setIsModalOpen(true);
  };

  // Função para fechar o modal
  const closeModal = () => {
    setEditingTravel(null);
    setIsModalOpen(false);
  };

  // Função para salvar ou editar uma viagem
  const handleSaveTravel = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const newTravel = {
      id: editingTravel ? editingTravel.id : Date.now(),
      name: formData.get("name"),
      category: formData.get("category").split(","),
      country: formData.get("country"),
      city: formData.get("city"),
      price: parseFloat(formData.get("price")),
      days: parseInt(formData.get("days")),
      transport: formData.get("transport"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      highlightImage: require("../images/highlightImage/lacortinada.jpg"), // Placeholder
    };

    if (editingTravel) {
      setTravels(travels.map((travel) => (travel.id === editingTravel.id ? newTravel : travel)));
    } else {
      setTravels([...travels, newTravel]);
    }

    closeModal();
  };

  return (
    <div className="my-travels-container">
      <h1>As Minhas Viagens</h1>
      <button className="add-travel-btn" onClick={() => openModal()}>
        Adicionar Nova Viagem
      </button>
      <div className="travels-grid">
        {travels.map((travel) => (
          <div className="travel-card" key={travel.id}>
            <img src={travel.highlightImage} alt={travel.name} className="travel-image" />
            <div className="travel-info">
              <h3>{travel.name}</h3>
              <p>
                {travel.city}, {travel.country}
              </p>
              <p><strong>Preço:</strong> €{travel.price}</p>
              <p><strong>Duração:</strong> {travel.days} dias</p>
              <p><strong>Categorias:</strong> {travel.category.join(", ")}</p>
              <p><strong>Transporte:</strong> {travel.transport}</p>
              <div className="travel-actions">
                <button onClick={() => navigate(`/travel/${travel.id}`)} className="details-btn">
                  Ver Viagem
                </button>
                <button onClick={() => openModal(travel)} className="edit-btn">
                  Editar
                </button>
                <button
                  onClick={() =>
                    window.confirm("Tem certeza que deseja apagar esta viagem?") &&
                    setTravels(travels.filter((t) => t.id !== travel.id))
                  }
                  className="delete-btn"
                >
                  Apagar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingTravel ? "Editar Viagem" : "Adicionar Nova Viagem"}</h2>
            <form onSubmit={handleSaveTravel}>
              <label>
                Nome:
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTravel?.name || ""}
                  required
                />
              </label>
              <label>
                Categorias (separadas por vírgula):
                <input
                  type="text"
                  name="category"
                  defaultValue={editingTravel?.category.join(", ") || ""}
                  required
                />
              </label>
              <label>
                País:
                <input
                  type="text"
                  name="country"
                  defaultValue={editingTravel?.country || ""}
                  required
                />
              </label>
              <label>
                Cidade:
                <input
                  type="text"
                  name="city"
                  defaultValue={editingTravel?.city || ""}
                  required
                />
              </label>
              <label>
                Preço (€):
                <input
                  type="number"
                  name="price"
                  defaultValue={editingTravel?.price || ""}
                  required
                />
              </label>
              <label>
                Dias:
                <input
                  type="number"
                  name="days"
                  defaultValue={editingTravel?.days || ""}
                  required
                />
              </label>
              <label>
                Transporte:
                <input
                  type="text"
                  name="transport"
                  defaultValue={editingTravel?.transport || ""}
                  required
                />
              </label>
              <label>
                Data de Início:
                <input
                  type="date"
                  name="startDate"
                  defaultValue={editingTravel?.startDate || ""}
                  required
                />
              </label>
              <label>
                Data de Fim:
                <input
                  type="date"
                  name="endDate"
                  defaultValue={editingTravel?.endDate || ""}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  Salvar
                </button>
                <button type="button" onClick={closeModal} className="cancel-btn">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTravels;
