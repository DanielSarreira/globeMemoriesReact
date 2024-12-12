import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlusCircle, FaSave } from 'react-icons/fa';
import '../styles/MyTravels.css'; // Arquivo CSS específico
import travelsData from '../data/travelsData'; // Importe o arquivo de dados

const MyTravels = () => {
  const [travels, setTravels] = useState(travelsData);
  const [editingTravel, setEditingTravel] = useState(null); // Estado para viagem em edição

  const handleEdit = (id) => {
    const travelToEdit = travels.find((travel) => travel.id === id);
    setEditingTravel(travelToEdit); // Define a viagem a ser editada
  };

  const handleSave = () => {
    setTravels((prevTravels) =>
      prevTravels.map((travel) =>
        travel.id === editingTravel.id ? editingTravel : travel
      )
    );
    setEditingTravel(null); // Sai do modo de edição
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta viagem?')) {
      setTravels(travels.filter((travel) => travel.id !== id));
    }
  };

  const handleAddTravel = () => {
    const newTravel = {
      id: travels.length + 1,
      title: 'Nova Viagem',
      image: 'https://via.placeholder.com/300x200?text=Nova+Viagem',
    };
    setTravels([...travels, newTravel]);
  };

  return (
    <div className="my-travels-page">
      <h1>As Minhas Viagens</h1>
      <p>Estas são as minhas viagens únicas, para um dia mais tarde recordar!</p>
      <div className="travels-grid">
        {travels.map((travel) =>
          editingTravel && editingTravel.id === travel.id ? (
            // Exibir formulário de edição para a viagem selecionada
            <div key={travel.id} className="travel-card">
              <input
                type="text"
                value={editingTravel.title}
                onChange={(e) =>
                  setEditingTravel({ ...editingTravel, title: e.target.value })
                }
                placeholder="Título da Viagem"
              />
              <input
                type="text"
                value={editingTravel.image}
                onChange={(e) =>
                  setEditingTravel({ ...editingTravel, image: e.target.value })
                }
                placeholder="URL da Imagem"
              />
              <button className="save-button" onClick={handleSave}>
                <FaSave /> Salvar
              </button>
            </div>
          ) : (
            // Exibir cartão normal para viagens não editadas
            <div key={travel.id} className="travel-card">
              <img src={travel.image} alt={travel.title} className="travel-image" />
              <h3>{travel.title}</h3>
              <div className="card-actions">
                <button className="edit-button" onClick={() => handleEdit(travel.id)}>
                  <FaEdit /> Editar
                </button>
                <button className="delete-button" onClick={() => handleDelete(travel.id)}>
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          )
        )}
      </div>
      <button className="add-travel-button" onClick={handleAddTravel}>
        <FaPlusCircle /> Adicionar Nova Viagem
      </button>
    </div>
  );
};

export default MyTravels;
