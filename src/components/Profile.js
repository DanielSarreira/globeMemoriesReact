import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Toast from './Toast';

// Avatar padrão como componente SVG
const DefaultAvatar = ({ size = 150 }) => (
  <svg width={size} height={size} viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ borderRadius: '50%' }}>
    <circle cx="75" cy="75" r="75" fill="#e0e0e0" />
    <circle cx="75" cy="60" r="25" fill="#bdbdbd" />
    <ellipse cx="75" cy="110" rx="35" ry="25" fill="#bdbdbd" />
  </svg>
);

const defaultAvatar = '/images/assets/avatar1.jpg'; // Fallback para imagem

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    bio: '',
    quote: '',
    country: '',
    city: '',
    gender: '',
    birthday: '',
    profilePicture: '',
    coverPhoto: '', // NOVO: foto de capa
    coverPhotoScale: 1,
    coverPhotoPosition: { x: 0, y: 0 },
    privacy: 'public',
  });
  // Estados para edição da foto de capa
  const [coverIsDragging, setCoverIsDragging] = useState(false);
  const [coverDragStart, setCoverDragStart] = useState({ x: 0, y: 0 });
  const coverImageRef = useRef(null);
  const coverContainerRef = useRef(null);
  // Handlers para foto de capa
  const handleCoverMouseDown = (e) => {
    if (!editing || !formData.coverPhoto) return;
    setCoverIsDragging(true);
    setCoverDragStart({ x: e.clientX - formData.coverPhotoPosition.x, y: e.clientY - formData.coverPhotoPosition.y });
    document.body.style.cursor = 'grabbing';
  };

  const handleCoverMouseMove = (e) => {
    if (!coverIsDragging) return;
    setFormData((prev) => ({
      ...prev,
      coverPhotoPosition: {
        x: e.clientX - coverDragStart.x,
        y: e.clientY - coverDragStart.y,
      },
    }));
  };

  const handleCoverMouseUp = () => {
    setCoverIsDragging(false);
    document.body.style.cursor = '';
  };

  const handleCoverWheel = (e) => {
    if (!editing || !formData.coverPhoto) return;
    e.preventDefault();
    setFormData((prev) => {
      let newScale = prev.coverPhotoScale + (e.deltaY < 0 ? 0.1 : -0.1);
      newScale = Math.max(0.5, Math.min(3, newScale));
      return { ...prev, coverPhotoScale: newScale };
    });
  };

  useEffect(() => {
    if (editing && coverIsDragging) {
      document.addEventListener('mousemove', handleCoverMouseMove);
      document.addEventListener('mouseup', handleCoverMouseUp);
      document.addEventListener('selectstart', (e) => e.preventDefault());
    }
    return () => {
      document.removeEventListener('mousemove', handleCoverMouseMove);
      document.removeEventListener('mouseup', handleCoverMouseUp);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    };
  }, [editing, coverIsDragging, coverDragStart.x, coverDragStart.y, formData.coverPhotoPosition.x, formData.coverPhotoPosition.y]);
  const { user, setUser } = useAuth();

  // Estados para o sistema de seguidores
  const [followersCount, setFollowersCount] = useState(0); // Simula número de seguidores
  const [followingCount, setFollowingCount] = useState(0); // Número de seguindo

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  
  // Estados para validação de password
  const [passwordError, setPasswordError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [bioCharCount, setBioCharCount] = useState(0);
  const [quoteCharCount, setQuoteCharCount] = useState(0);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  
  // Toast functions
  const showToast = (message, type) => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast({ message: '', type: '', isVisible: false }), 2600);
  };
  
  const hideToast = () => {
    setToast({ message: '', type: '', isVisible: false });
  };
  
  // Listas para dropdowns
  const countries = [
    'Portugal', 'Brasil', 'Espanha', 'França', 'Itália', 'Alemanha', 'Reino Unido',
    'Estados Unidos', 'Canadá', 'Austrália', 'Japão', 'China', 'Índia', 'Rússia',
    'México', 'Argentina', 'Chile', 'Colômbia', 'Peru', 'Venezuela', 'Outro'
  ];
  
  const citiesByCountry = {
    'Portugal': ['Lisboa', 'Porto', 'Braga', 'Coimbra', 'Aveiro', 'Faro', 'Setúbal', 'Évora'],
    'Brasil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba'],
    'Espanha': ['Madrid', 'Barcelona', 'Valencia', 'Sevilha', 'Bilbao', 'Málaga', 'Granada'],
    'França': ['Paris', 'Lyon', 'Marselha', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux'],
    'Itália': ['Roma', 'Milão', 'Nápoles', 'Turim', 'Palermo', 'Génova', 'Bolonha'],
    'Alemanha': ['Berlim', 'Munique', 'Hamburgo', 'Colónia', 'Frankfurt', 'Stuttgart', 'Düsseldorf'],
    'Reino Unido': ['Londres', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Leeds', 'Sheffield'],
    'Estados Unidos': ['Nova York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'],
    'Canadá': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg'],
    'Outro': []
  };
  
  // Função para validar password
  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Pelo menos uma letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Pelo menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Pelo menos um caractere especial');
    }
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validações específicas
    if (name === 'bio') {
      if (value.length <= 500) {
        setBioCharCount(value.length);
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
      return;
    }
    
    if (name === 'quote') {
      if (value.length <= 100) {
        setQuoteCharCount(value.length);
        setFormData((prevData) => ({
          ...prevData,
          [name]: value,
        }));
      }
      return;
    }
    
    if (name === 'password') {
      const errors = validatePassword(value);
      setPasswordError(errors.length > 0 ? errors.join(', ') : '');
    }
    
    if (name === 'currentPassword') {
      setCurrentPasswordError(''); // Reset error when typing
    }
    
    if (name === 'country') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
        city: '' // Reset cidade quando mudar país
      }));
      return;
    }
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditToggle = (e) => {
    e.preventDefault(); // Previne o comportamento padrão do botão
    setEditing(!editing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    setCurrentPasswordError('');
    
      // Salvar dados da capa no localStorage (simulação de persistência)
      if (formData.coverPhoto) {
        localStorage.setItem(`${formData.username}_coverPhoto`, formData.coverPhoto);
        localStorage.setItem(`${formData.username}_coverPhotoScale`, formData.coverPhotoScale);
        localStorage.setItem(`${formData.username}_coverPhotoPosition`, JSON.stringify(formData.coverPhotoPosition));
      }

    // Validações antes de guardar
    if (formData.password) {
      // Se está tentando alterar a password, deve confirmar a atual
      if (!formData.currentPassword) {
        setCurrentPasswordError('Deve confirmar a password atual para alterá-la');
        setIsSaving(false);
        return;
      }
      
      // Validar nova password
      const errors = validatePassword(formData.password);
      if (errors.length > 0) {
        setSaveError('Password não atende aos critérios de segurança: ' + errors.join(', '));
        showToast('Password não atende aos critérios de segurança: ' + errors.join(', '), 'error');
        setIsSaving(false);
        return;
      }
      
      // Confirmar que as novas passwords coincidem
      if (formData.password !== formData.confirmPassword) {
        setSaveError('As novas passwords não coincidem');
        showToast('As novas passwords não coincidem', 'error');
        setIsSaving(false);
        return;
      }
      
      // Aqui validaria a palavra-passe actual com o backend
      // Por agora, simularemos que está correcto
      // if (!await validateCurrentPassword(formData.currentPassword)) {
      //   setCurrentPasswordError('Palavra-passe actual incorrecta');
      //   setIsSaving(false);
      //   return;
      // }
    }

    // Função helper para atualizar estado/localStorage (fallback local)
    const persistLocal = () => {
      const updatedUser = {
        ...user,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        quote: formData.quote,
        nationality: formData.country,
        city: formData.city,
        gender: formData.gender,
        birthDate: formData.birthday,
        profilePicture: formData.profilePicture,
        coverPhoto: formData.coverPhoto,
        coverPhotoScale: formData.coverPhotoScale,
        coverPhotoPosition: formData.coverPhotoPosition,
        privacy: formData.privacy
      };

      setUser(updatedUser);
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('Não foi possível gravar no localStorage:', err);
      }
      setSaveSuccess(true);
      showToast('Perfil atualizado localmente!', 'success');
      setEditing(false);
      setShowChangePassword(false);
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        password: '',
        confirmPassword: ''
      }));
      setTimeout(() => setSaveSuccess(false), 3000);
    };

    const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend-api.com';

    try {
      // Só tenta chamar backend se não for o placeholder
      if (!API_URL.includes('your-backend-api.com')) {
        const response = await axios.put(`${API_URL}/user/profile`, formData, {
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${user?.token}` // descomentar quando existir token
          }
        });

        if (response.status === 200) {
          // Se o backend retornou dados atualizados, usar eles, senão usar formData
          const data = response.data || {};
            const updatedUser = {
              ...user,
              ...data,
              // Garantir mapeamento consistente das chaves usadas no frontend
              firstName: data.firstName ?? formData.firstName,
              lastName: data.lastName ?? formData.lastName,
              bio: data.bio ?? formData.bio,
              quote: data.quote ?? formData.quote,
              nationality: data.nationality ?? formData.country,
              city: data.city ?? formData.city,
              gender: data.gender ?? formData.gender,
              birthDate: data.birthDate ?? formData.birthday,
              profilePicture: data.profilePicture ?? formData.profilePicture,
              coverPhoto: data.coverPhoto ?? formData.coverPhoto,
              coverPhotoScale: data.coverPhotoScale ?? formData.coverPhotoScale,
              coverPhotoPosition: data.coverPhotoPosition ?? formData.coverPhotoPosition,
              privacy: data.privacy ?? formData.privacy
            };
          setUser(updatedUser);
          try { localStorage.setItem('user', JSON.stringify(updatedUser)); } catch {}
          setSaveSuccess(true);
          showToast('Perfil atualizado com sucesso!', 'success');
          setEditing(false);
          setShowChangePassword(false);
          setFormData(prev => ({
            ...prev,
            currentPassword: '',
            password: '',
            confirmPassword: ''
          }));
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else {
        // Sem backend configurado: fallback local
        persistLocal();
      }
    } catch (error) {
      console.error('Erro ao guardar os dados no backend. A aplicar fallback local:', error);
      // Em caso de falha no backend, ainda assim persistimos localmente
      persistLocal();
      setSaveError('Sem ligação ao servidor. Alterações guardadas localmente.');
      setErrorVisible(true);
      setTimeout(() => {
        setErrorVisible(false);
        setTimeout(() => setSaveError(null), 300);
      }, 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    const container = containerRef.current;
    if (img && container) {
      const scale = Math.max(container.offsetWidth / img.naturalWidth, container.offsetHeight / img.naturalHeight);
      setImageScale(scale);
    }
  };

  const handleMouseDown = (e) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y,
      startX: e.clientX,
      startY: e.clientY
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !editing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Limitar o movimento para manter a imagem dentro dos limites razoáveis
    const maxMove = 100;
    const limitedX = Math.max(-maxMove, Math.min(maxMove, newX));
    const limitedY = Math.max(-maxMove, Math.min(maxMove, newY));
    
    setImagePosition({ x: limitedX, y: limitedY });
  };

  const handleMouseUp = (e) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (!editing) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.max(0.5, Math.min(3, imageScale + delta));
    setImageScale(newScale);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('https://your-backend-api.com/user/profile');
        if (response.status === 200) {
          setFormData(response.data);
          // Simulação de dados de seguidores até o backend estar pronto
          setFollowersCount(10); // Mock
          setFollowingCount(5); // Mock
        } else {
          console.error('Erro ao buscar os dados do perfil.');
        }
      } catch (error) {
        console.error('Erro na comunicação com o servidor:', error);
      }
    };

    fetchProfile();
  }, []);

  // Novo useEffect para actualizar formData quando o utilizador mudar
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        currentPassword: '',
        password: '',
        confirmPassword: '',
        bio: user.bio || '',
        quote: user.quote || '',
        country: user.nationality || '',
        city: user.city || '',
        gender: user.gender || '',
        birthday: user.birthDate || '',
        profilePicture: user.profilePicture || '',
        coverPhoto: user.coverPhoto || '',
        coverPhotoScale: user.coverPhotoScale || 1,
        coverPhotoPosition: user.coverPhotoPosition || { x: 0, y: 0 },
        privacy: user.privacy || 'public',
      });
      setBioCharCount((user.bio || '').length);
      setQuoteCharCount((user.quote || '').length);
    }
  }, [user]);

  useEffect(() => {
    if (editing && isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectstart', (e) => e.preventDefault()); // Previne seleção de texto
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectstart', (e) => e.preventDefault());
    };
  }, [editing, isDragging, dragStart.x, dragStart.y, imagePosition.x, imagePosition.y]);

  return (
    <React.Fragment>
    <div className="profile-page">
      <div className="profile-container">
        {user ? (
            <form className="profile-form" onSubmit={handleSave}>
              {/* Foto de Capa será renderizada abaixo do button-group */}
              <div className="button-group">
                {editing ? (
                  <>
                    <button 
                      type="submit" 
                      className="save-button"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <div className="loading-spinner" style={{width: '20px', height: '20px', margin: '0 10px 0 0'}}></div>
                          A Guardar...
                        </>
                      ) : (
                        <>
                          💾 Guardar
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="cancel-button"
                      onClick={handleEditToggle}
                      disabled={isSaving}
                    >
                      ❌ Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="button"
                    onClick={handleEditToggle}
                  >
                    ✏️ Editar Perfil
                  </button>
                )}
              </div>
              

              {saveError && (
                <div className="error-message">
                  ⚠️ {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="success-message">
                  ✅ Dados salvos com sucesso!
                </div>
              )}

              <div className="form-section">
                {/* Informações Complementares (lado esquerdo) */}
                <div className="form-left">
                  <h3>📝 Informações Pessoais</h3>
                  {/* Foto de Perfil Reformulada */}
                  <div className="profile-photo-section">
                    <div className="photo-container">
                      <div 
                        className="photo-wrapper"
                        onMouseDown={handleMouseDown}
                        onWheel={handleWheel}
                        style={{
                          cursor: editing && formData.profilePicture ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                      >
                        {formData.profilePicture ? (
                          <img
                            ref={imageRef}
                            src={formData.profilePicture}
                            alt="Foto de perfil"
                            className="profile-photo"
                            style={{
                              transform: `scale(${imageScale}) translate(${imagePosition.x / imageScale}px, ${imagePosition.y / imageScale}px)`,
                              transition: isDragging ? 'none' : 'transform 0.2s ease'
                            }}
                            onLoad={handleImageLoad}
                            draggable="false"
                          />
                        ) : (
                          <div className="photo-placeholder">
                            <DefaultAvatar size={120} />
                          </div>
                        )}
                        
                        {isDragging && (
                          <div className="drag-overlay">
                            <span>A Posicionar...</span>
                          </div>
                        )}
                      </div>
                      
                      {editing && (
                        <div className="photo-controls">
                          <label htmlFor="photoUpload" className="upload-btn">
                            <span>📷</span>
                            Alterar Foto
                          </label>
                          <input
                            id="photoUpload"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Validar tamanho do ficheiro (5MB máximo)
                                if (file.size > 5 * 1024 * 1024) {
                                  showToast('A imagem deve ter no máximo 5MB', 'error');
                                  e.target.value = '';
                                  return;
                                }
                                
                                // Validar tipo de ficheiro
                                if (!file.type.startsWith('image/')) {
                                  showToast('Por favor, selecione apenas imagens', 'error');
                                  e.target.value = '';
                                  return;
                                }
                                
                                setFormData(prev => ({
                                  ...prev,
                                  profilePicture: URL.createObjectURL(file)
                                }));
                                setImageScale(1);
                                setImagePosition({ x: 0, y: 0 });
                                showToast('Foto de perfil carregada com sucesso', 'success');
                              }
                            }}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {editing && formData.profilePicture && (
                      <div className="photo-editor">
                        <div className="editor-header">
                          <span className="editor-title">Editar Foto</span>
                        </div>
                        
                        <div className="zoom-section">
                          <span className="zoom-label">Zoom</span>
                          <div className="zoom-controls">
                            <button
                              type="button"
                              onClick={() => setImageScale(prev => Math.max(0.5, prev - 0.1))}
                              disabled={imageScale <= 0.5}
                              className="zoom-btn minus"
                            >
                              −
                            </button>
                            
                            <div className="zoom-display">
                              <span className="zoom-value">{Math.round(imageScale * 100)}%</span>
                              <div className="zoom-bar">
                                <div 
                                  className="zoom-fill"
                                  style={{ width: `${((imageScale - 0.5) / 2.5) * 100}%` }}
                                />
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => setImageScale(prev => Math.min(3, prev + 0.1))}
                              disabled={imageScale >= 3}
                              className="zoom-btn plus"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <div className="editor-actions">
                          <button
                            type="button"
                            onClick={() => {
                              setImageScale(1);
                              setImagePosition({ x: 0, y: 0 });
                            }}
                            className="reset-btn"
                          >
                            Resetar
                          </button>
                        </div>
                        
                        <div className="editor-tips">
                          <span>💡 Arraste para mover • Use scroll para zoom</span>
                        </div>
                      </div>
                    )}
                  </div>
<br></br>
                  {/* Contadores de seguidores */}


                  <div className="form-group" style={{ display: 'flex', gap: '23px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '230px', position: 'relative' }}>
                      <label>👤 Primeiro Nome:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={(e) => { console.debug('firstName change', e.target.value); handleInputChange(e); }}
                          placeholder="Digite o seu primeiro nome"
                          maxLength={50}
                          autoFocus
                          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 5 }}
                        />
                      ) : (
                        <p style={{ marginTop: 6 }}>{user.firstName}</p>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: '230px', position: 'relative' }}>
                      <label>👤 Último Nome:</label>
                      {editing ? (
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={(e) => { console.debug('lastName change', e.target.value); handleInputChange(e); }}
                          placeholder="Digite o seu último nome"
                          maxLength={50}
                          style={{ pointerEvents: 'auto', position: 'relative', zIndex: 5 }}
                        />
                      ) : (
                        <p style={{ marginTop: 6 }}>{user.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>📝 Frase sobre Mim:</label>
                    {editing ? (
                      <div>
                        <input
                          type="text"
                          name="quote"
                          value={formData.quote}
                          onChange={handleInputChange}
                          placeholder="Uma frase que te descreva..."
                          maxLength="100"
                        />
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          {quoteCharCount}/100 caracteres
                        </small>
                      </div>
                    ) : (
                      <p>{user.quote || 'Nenhuma frase definida.'}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>📝 Sobre Mim:</label>
                    {editing ? (
                      <div>
                        <textarea
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Conte um pouco sobre si..."
                          rows="4"
                          maxLength="500"
                        />
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          {bioCharCount}/500 caracteres
                        </small>
                      </div>
                    ) : (
                      <p>{user.bio || 'Ainda não há uma biografia.'}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <div className="form-group-LeftPosition">
                      <label>🌍 País:</label>
                      {editing ? (
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                        >
                          <option value="">Selecione um país</option>
                          {countries.map((country) => (
                            <option key={country} value={country}>
                              {country}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p>{user.nationality || 'Não informado'}</p>
                      )}
                    </div>
                    <div className="form-group-RightPosition">
                      <label>🏙️ Cidade:</label>
                      {editing ? (
                        <select
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!formData.country || formData.country === 'Outro'}
                        >
                          <option value="">Selecione uma cidade</option>
                          {formData.country && citiesByCountry[formData.country] && 
                            citiesByCountry[formData.country].map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          {formData.country === 'Outro' && (
                            <option value="Outra">Outra</option>
                          )}
                        </select>
                      ) : (
                        <p>{user.city || 'Não informado'}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div className="form-group-LeftPosition">
                      <label>⚧️ Género:</label>
                      {editing ? (
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleInputChange}
                        >
                          <option value="">Selecione</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      ) : (
                        <p>{user.gender || 'Não informado'}</p>
                      )}
                    </div>
                    <div className="form-group-RightPosition">
                      <label>🎂 Aniversário:</label>
                      {editing ? (
                        <input
                          type="date"
                          name="birthday"
                          value={formData.birthday}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <p>{user.birthDate || 'Não informado'}</p>
                      )}
                    </div>
                  </div>

                 
                </div>

                {/* Informações Obrigatórias (lado direito) */}
                <div className="form-right">
                  <h3>🔒 Informações Obrigatórias</h3>
                  {/* Foto de Capa acima do username */}
                  <div className="cover-photo-section" style={{ marginBottom: 12 }}>
                    <div
                      className="cover-photo-wrapper"
                      ref={coverContainerRef}
                      style={{
                        width: '100%',
                        height: 166,
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: '#e0e0e0',
                        position: 'relative',
                        cursor: editing && formData.coverPhoto ? (coverIsDragging ? 'grabbing' : 'grab') : 'default',
                        marginBottom: 8,
                      }}
                      onMouseDown={handleCoverMouseDown}
                      onWheel={handleCoverWheel}
                    >
                      {formData.coverPhoto ? (
                        <img
                          ref={coverImageRef}
                          src={formData.coverPhoto}
                          alt="Foto de capa"
                          className="cover-photo"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: `scale(${formData.coverPhotoScale}) translate(${formData.coverPhotoPosition.x / formData.coverPhotoScale}px, ${formData.coverPhotoPosition.y / formData.coverPhotoScale}px)`,
                            transition: coverIsDragging ? 'none' : 'transform 0.2s ease',
                          }}
                          draggable="false"
                        />
                      ) : (
                        <div className="cover-photo-placeholder" style={{ width: '100%', height: '100%', background: '#bdbdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18 }}>
                          Sem foto de capa
                        </div>
                      )}
                      {coverIsDragging && (
                        <div className="drag-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                          <span style={{ color: '#333' }}>A Posicionar...</span>
                        </div>
                      )}
                    </div>
                    {editing && (
                      <div className="cover-photo-controls" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                        <label htmlFor="coverPhotoUpload" className="upload-btn">
                          <span role="img" aria-label="Upload">🖼️</span> Alterar Capa
                        </label>
                        <input
                          id="coverPhotoUpload"
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              // Validar tamanho do ficheiro (10MB máximo para capa)
                              if (file.size > 10 * 1024 * 1024) {
                                showToast('A imagem de capa deve ter no máximo 10MB', 'error');
                                e.target.value = '';
                                return;
                              }
                              
                              // Validar tipo de ficheiro
                              if (!file.type.startsWith('image/')) {
                                showToast('Por favor, selecione apenas imagens', 'error');
                                e.target.value = '';
                                return;
                              }
                              
                              setFormData(prev => ({ ...prev, coverPhoto: URL.createObjectURL(file), coverPhotoScale: 1, coverPhotoPosition: { x: 0, y: 0 } }));
                              showToast('Foto de capa carregada com sucesso', 'success');
                            }
                          }}
                          style={{ display: 'none' }}
                        />
                        <div className="zoom-controls">
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverPhotoScale: Math.max(0.5, prev.coverPhotoScale - 0.1) }))} disabled={formData.coverPhotoScale <= 0.5} className="zoom-btn minus">−</button>
                          <span className="zoom-value">{Math.round(formData.coverPhotoScale * 100)}%</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, coverPhotoScale: Math.min(3, prev.coverPhotoScale + 0.1) }))} disabled={formData.coverPhotoScale >= 3} className="zoom-btn plus">+</button>
                        </div>
                        <button type="button" className="reset-btn" onClick={() => setFormData(prev => ({ ...prev, coverPhotoScale: 1, coverPhotoPosition: { x: 0, y: 0 } }))}>Resetar</button>
                        <span style={{ fontSize: 12, color: '#666' }}>💡 Arraste • Scroll para zoom</span>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <br></br>
                    <label>👥 Username:</label>
                    {editing ? (
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Digite o seu nome de utilizador"
                      />
                    ) : (
                      <p>{user.username}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>📧 Email:</label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Digite seu email"
                      />
                    ) : (
                      <p>{user.email}</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>{editing ? '🔐 Alterar Palavra-Passe:' : '🔐 Palavra-Passe:'}</label>
                    {editing ? (
                      <div>
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '5px', color: '#666' }}>
                            Password Atual (obrigatória para alterar):
                          </label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            placeholder="Digite a sua password atual"
                            style={{
                              borderColor: currentPasswordError ? 'red' : 'var(--border-color)'
                            }}
                          />
                          {currentPasswordError && (
                            <small style={{ color: 'red', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                              ❌ {currentPasswordError}
                            </small>
                          )}
                        </div>
                        
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ fontSize: '14px', marginBottom: '5px', color: '#666' }}>
                            Nova Password (opcional):
                          </label>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Digite uma nova senha (deixe vazio para manter atual)"
                            disabled={!formData.currentPassword}
                            style={{
                              backgroundColor: !formData.currentPassword ? '#f5f5f5' : 'white',
                              borderColor: passwordError ? 'red' : 'var(--border-color)'
                            }}
                          />
                          <div style={{ marginTop: '8px' }}>
                            <small style={{ color: '#666', fontSize: '11px', display: 'block' }}>
                              Regras de segurança: Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 especial
                            </small>
                          </div>
                          {passwordError && (
                            <small style={{ color: 'red', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                              ❌ {passwordError}
                            </small>
                          )}
                          {!passwordError && formData.password && (
                            <small style={{ color: 'green', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                              ✅ Password válida
                            </small>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p>••••••••</p>
                    )}
                  </div>
                  {editing && formData.password && (
                    <div className="form-group">
                      <label>🔐 Confirmar Nova Password:</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword || ''}
                        onChange={handleInputChange}
                        placeholder="Confirme a nova senha"
                        style={{
                          borderColor: (formData.confirmPassword && formData.password !== formData.confirmPassword) ? 'red' : 'var(--border-color)'
                        }}
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <small style={{ color: 'red', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                          ❌ As passwords não coincidem
                        </small>
                      )}
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <small style={{ color: 'green', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                          ✅ Passwords coincidem
                        </small>
                      )}
                    </div>
                  )}
                
                
                </div> {/* close .form-right */}
              </div> {/* close .form-section */}
              </form>
        ) : null}
      </div>
    </div>
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
    </React.Fragment>
  );
};

export default Profile;