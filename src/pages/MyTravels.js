import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlusCircle, FaSave, FaInfoCircle } from 'react-icons/fa';
import '../styles/MyTravels.css';
import travelsData from '../data/travelsData';

const MyTravels = () => {
  const [travels, setTravels] = useState(travelsData);
  const [editingTravel, setEditingTravel] = useState(null);
  const [filter, setFilter] = useState('');
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [isEditingModalOpen, setEditingModalOpen] = useState(false);

  const handleEdit = (id) => {
    const travelToEdit = travels.find((travel) => travel.id === id);
    setEditingTravel(travelToEdit);
    setEditingModalOpen(true);
  };

  const handleSave = () => {
    setTravels((prevTravels) =>
      prevTravels.map((travel) =>
        travel.id === editingTravel.id ? editingTravel : travel
      )
    );
    setEditingTravel(null);
    setEditingModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem a certeza que deseja eliminar esta viagem?')) {
      setTravels(travels.filter((travel) => travel.id !== id));
    }
  };

  const handleAddTravel = () => {
    const newTravel = {
      id: travels.length + 1,
      title: '',
      image: '',
      category: '',
      shortDescription: '',
      longDescription: '',
    };
    setTravels([...travels, newTravel]);
    setEditingTravel(newTravel);
    setEditingModalOpen(true);
  };

  const handleFilter = (e) => {
    setFilter(e.target.value);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingTravel({ ...editingTravel, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredTravels = filter
    ? travels.filter((travel) => travel.category === filter)
    : travels;

  return (
    <div className="my-travels-page">
      <h1>As Minhas Viagens</h1>
      <p>Estas são as minhas viagens únicas, para um dia mais tarde recordar!</p>

      <div className="filter-section">
        <label htmlFor="filter">Filtrar por Categoria:</label>
        <select id="filter" value={filter} onChange={handleFilter}>
          <option value="">Todas</option>
          <option value="Natureza">Natureza</option>
          <option value="Praias">Praias</option>
          <option value="Cultura">Cultura</option>
        </select>
      </div>

      <div className="travels-grid">
        {filteredTravels.map((travel) => (
          <div key={travel.id} className="travel-card">
            <img src={travel.image} alt={travel.title} className="travel-image" />
            <h3>{travel.title}</h3>
            <p><strong>Categoria:</strong> {travel.category}</p>
            <div className="card-actions">
              <button className="edit-button" onClick={() => handleEdit(travel.id)}>
                <FaEdit /> Editar
              </button>
              <button className="delete-button" onClick={() => handleDelete(travel.id)}>
                <FaTrash /> Eliminar
              </button>
              <button
                className="details-button"
                onClick={() => setSelectedTravel(travel)}
              >
                <FaInfoCircle /> Detalhes
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="add-travel-button" onClick={handleAddTravel}>
        <FaPlusCircle /> Adicionar Nova Viagem
      </button>

      {selectedTravel && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedTravel.title}</h2>
            <img src={selectedTravel.image} alt={selectedTravel.title} />
            <p><strong>Categoria:</strong> {selectedTravel.category}</p>
            <p><strong>Descrição Curta:</strong> {selectedTravel.shortDescription}</p>
            <p><strong>Descrição Longa:</strong> {selectedTravel.longDescription}</p>
            <button onClick={() => setSelectedTravel(null)}>Fechar</button>
          </div>
        </div>
      )}

      {isEditingModalOpen && editingTravel && (
        <div className="modal">
          <div className="modal-content">
            <h2>Editar Viagem</h2>
            <input
              type="text"
              value={editingTravel.title}
              onChange={(e) =>
                setEditingTravel({ ...editingTravel, title: e.target.value })
              }
              placeholder="Nome da Viagem"
            />
            <textarea
              value={editingTravel.shortDescription}
              onChange={(e) =>
                setEditingTravel({
                  ...editingTravel,
                  shortDescription: e.target.value,
                })
              }
              placeholder="Descrição Curta"
            />
            <textarea
              value={editingTravel.longDescription}
              onChange={(e) =>
                setEditingTravel({
                  ...editingTravel,
                  longDescription: e.target.value,
                })
              }
              placeholder="Descrição Longa"
            />
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            {editingTravel.image && (
              <img
                src={editingTravel.image}
                alt="Pré-visualização"
                className="preview-image"
              />
            )}
            <div className="category-checkboxes">
  {Array.from(new Set(travels.map((travel) => travel.category))).map((category) => (
    <label key={category}>
      <input
        type="checkbox"
        checked={editingTravel.category === category}
        onChange={() =>
          setEditingTravel({ ...editingTravel, category })
        }
      />
      {category}
    </label>
  ))}
</div>

            <button className="save-button" onClick={handleSave}>
              <FaSave /> Salvar
            </button>
            <button onClick={() => setEditingModalOpen(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTravels;
