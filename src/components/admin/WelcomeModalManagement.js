import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaSave, 
  FaEye, 
  FaPlus, 
  FaTrash, 
  FaArrowUp, 
  FaArrowDown,
  FaImage,
  FaVideo,
  FaStar
} from 'react-icons/fa';

/**
 * Componente do Backoffice para Gestão de Modals de Boas-Vindas
 * Permite criar, editar e visualizar versões do modal
 */
const WelcomeModalManager = () => {
  const [modalVersions, setModalVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    slides: [
      {
        title: '',
        subtitle: '',
        showVideo: false,
        videoUrl: '',
        showFeatures: false,
        features: []
      }
    ]
  });

  // Carregar versões existentes
  useEffect(() => {
    fetchModalVersions();
  }, []);

  const fetchModalVersions = async () => {
    try {
      // TODO: Implementar chamada à API
      // const response = await fetch('/api/admin/welcome-modal/versions');
      // const data = await response.json();
      
      // Mock data para demonstração
      const mockData = [
        {
          version: '20251014-1',
          active: true,
          createdAt: '2025-10-14T10:00:00Z',
          createdBy: 'admin@globememories.com',
          stats: {
            views: 1250,
            completions: 890,
            dontShowAgainRate: 15
          }
        },
        {
          version: '20251013-1',
          active: false,
          createdAt: '2025-10-13T15:30:00Z',
          createdBy: 'admin@globememories.com',
          stats: {
            views: 3420,
            completions: 2150,
            dontShowAgainRate: 22
          }
        }
      ];
      
      setModalVersions(mockData);
      setCurrentVersion(mockData.find(v => v.active));
    } catch (error) {
      console.error('Error fetching modal versions:', error);
    }
  };

  const generateNewVersion = () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    
    // Encontrar o próximo número da versão para hoje
    const todayVersions = modalVersions.filter(v => 
      v.version.startsWith(dateStr)
    );
    const nextNumber = todayVersions.length + 1;
    
    return `${dateStr}-${nextNumber}`;
  };

  const handleCreateNew = () => {
    setIsEditing(true);
    setFormData({
      version: generateNewVersion(),
      slides: [
        {
          title: 'Bem-vindo à Globe Memories',
          subtitle: 'Descubra experiências de viagem reais',
          showVideo: true,
          videoUrl: '',
          showFeatures: false,
          features: []
        }
      ]
    });
  };

  const handleAddSlide = () => {
    setFormData({
      ...formData,
      slides: [
        ...formData.slides,
        {
          title: '',
          subtitle: '',
          showVideo: false,
          videoUrl: '',
          showFeatures: false,
          features: []
        }
      ]
    });
  };

  const handleRemoveSlide = (index) => {
    const newSlides = formData.slides.filter((_, i) => i !== index);
    setFormData({ ...formData, slides: newSlides });
  };

  const handleMoveSlide = (index, direction) => {
    const newSlides = [...formData.slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newSlides.length) {
      [newSlides[index], newSlides[targetIndex]] = 
      [newSlides[targetIndex], newSlides[index]];
      setFormData({ ...formData, slides: newSlides });
    }
  };

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...formData.slides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setFormData({ ...formData, slides: newSlides });
  };

  const handleAddFeature = (slideIndex) => {
    const newSlides = [...formData.slides];
    newSlides[slideIndex].features.push({
      icon: 'FaCamera',
      title: '',
      description: ''
    });
    setFormData({ ...formData, slides: newSlides });
  };

  const handleRemoveFeature = (slideIndex, featureIndex) => {
    const newSlides = [...formData.slides];
    newSlides[slideIndex].features = newSlides[slideIndex].features.filter(
      (_, i) => i !== featureIndex
    );
    setFormData({ ...formData, slides: newSlides });
  };

  const handleFeatureChange = (slideIndex, featureIndex, field, value) => {
    const newSlides = [...formData.slides];
    newSlides[slideIndex].features[featureIndex][field] = value;
    setFormData({ ...formData, slides: newSlides });
  };

  const handleSave = async () => {
    try {
      // TODO: Implementar chamada à API
      // const response = await fetch('/api/admin/welcome-modal/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      
      console.log('Saving modal version:', formData);
      alert('Versão do modal salva com sucesso!');
      setIsEditing(false);
      fetchModalVersions();
    } catch (error) {
      console.error('Error saving modal version:', error);
      alert('Erro ao salvar versão do modal');
    }
  };

  const iconOptions = [
    'FaCamera', 'FaMapMarkedAlt', 'FaUsers', 'FaStar', 
    'FaHeart', 'FaGlobe', 'FaPlane', 'FaCompass'
  ];

  return (
    <div className="welcome-modal-manager">
      <div className="manager-header">
        <h2>Gestão de Modal de Boas-Vindas</h2>
        <button className="btn-primary" onClick={handleCreateNew}>
          <FaPlus /> Criar Nova Versão
        </button>
      </div>

      {/* Lista de Versões Existentes */}
      {!isEditing && (
        <div className="versions-list">
          <h3>Versões Existentes</h3>
          <div className="versions-grid">
            {modalVersions.map((version) => (
              <motion.div
                key={version.version}
                className={`version-card ${version.active ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="version-header">
                  <h4>Versão {version.version}</h4>
                  {version.active && (
                    <span className="badge-active">Ativa</span>
                  )}
                </div>
                <div className="version-info">
                  <p><strong>Criada em:</strong> {new Date(version.createdAt).toLocaleDateString('pt-PT')}</p>
                  <p><strong>Criada por:</strong> {version.createdBy}</p>
                </div>
                <div className="version-stats">
                  <div className="stat">
                    <strong>{version.stats.views}</strong>
                    <span>Visualizações</span>
                  </div>
                  <div className="stat">
                    <strong>{version.stats.completions}</strong>
                    <span>Conclusões</span>
                  </div>
                  <div className="stat">
                    <strong>{version.stats.dontShowAgainRate}%</strong>
                    <span>Não Mostrar</span>
                  </div>
                </div>
                <div className="version-actions">
                  <button className="btn-secondary">
                    <FaEye /> Visualizar
                  </button>
                  <button className="btn-secondary">Editar</button>
                  {!version.active && (
                    <button className="btn-danger">
                      <FaTrash /> Eliminar
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Editor de Nova Versão */}
      {isEditing && (
        <div className="modal-editor">
          <div className="editor-header">
            <h3>Editar Versão {formData.version}</h3>
            <div className="editor-actions">
              <button className="btn-secondary" onClick={() => setShowPreview(true)}>
                <FaEye /> Pré-visualizar
              </button>
              <button className="btn-primary" onClick={handleSave}>
                <FaSave /> Guardar
              </button>
              <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                Cancelar
              </button>
            </div>
          </div>

          <div className="slides-editor">
            {formData.slides.map((slide, slideIndex) => (
              <div key={slideIndex} className="slide-editor-card">
                <div className="slide-header">
                  <h4>Slide {slideIndex + 1}</h4>
                  <div className="slide-controls">
                    {slideIndex > 0 && (
                      <button 
                        className="btn-icon"
                        onClick={() => handleMoveSlide(slideIndex, 'up')}
                        title="Mover para cima"
                      >
                        <FaArrowUp />
                      </button>
                    )}
                    {slideIndex < formData.slides.length - 1 && (
                      <button 
                        className="btn-icon"
                        onClick={() => handleMoveSlide(slideIndex, 'down')}
                        title="Mover para baixo"
                      >
                        <FaArrowDown />
                      </button>
                    )}
                    {formData.slides.length > 1 && (
                      <button 
                        className="btn-icon btn-danger"
                        onClick={() => handleRemoveSlide(slideIndex)}
                        title="Remover slide"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(slideIndex, 'title', e.target.value)}
                    placeholder="Ex: Bem-vindo à Globe Memories"
                  />
                </div>

                <div className="form-group">
                  <label>Subtítulo</label>
                  <textarea
                    value={slide.subtitle}
                    onChange={(e) => handleSlideChange(slideIndex, 'subtitle', e.target.value)}
                    placeholder="Descrição do slide..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={slide.showVideo}
                      onChange={(e) => handleSlideChange(slideIndex, 'showVideo', e.target.checked)}
                    />
                    <span>Mostrar Vídeo</span>
                  </label>
                </div>

                {slide.showVideo && (
                  <div className="form-group">
                    <label>URL do Vídeo (YouTube)</label>
                    <input
                      type="url"
                      value={slide.videoUrl}
                      onChange={(e) => handleSlideChange(slideIndex, 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/embed/..."
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={slide.showFeatures}
                      onChange={(e) => handleSlideChange(slideIndex, 'showFeatures', e.target.checked)}
                    />
                    <span>Mostrar Funcionalidades</span>
                  </label>
                </div>

                {slide.showFeatures && (
                  <div className="features-editor">
                    <div className="features-header">
                      <h5>Funcionalidades</h5>
                      <button 
                        className="btn-small"
                        onClick={() => handleAddFeature(slideIndex)}
                      >
                        <FaPlus /> Adicionar
                      </button>
                    </div>

                    {slide.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="feature-editor">
                        <div className="feature-controls">
                          <select
                            value={feature.icon}
                            onChange={(e) => handleFeatureChange(slideIndex, featureIndex, 'icon', e.target.value)}
                          >
                            {iconOptions.map(icon => (
                              <option key={icon} value={icon}>{icon}</option>
                            ))}
                          </select>
                          <button
                            className="btn-icon btn-danger"
                            onClick={() => handleRemoveFeature(slideIndex, featureIndex)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleFeatureChange(slideIndex, featureIndex, 'title', e.target.value)}
                          placeholder="Título da funcionalidade"
                        />
                        <textarea
                          value={feature.description}
                          onChange={(e) => handleFeatureChange(slideIndex, featureIndex, 'description', e.target.value)}
                          placeholder="Descrição da funcionalidade"
                          rows="2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button className="btn-add-slide" onClick={handleAddSlide}>
              <FaPlus /> Adicionar Slide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeModalManager;
