import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TravelsData from '../data/travelsData.js';
import { Link } from 'react-router-dom';
import { FaStar } from 'react-icons/fa';
import '../styles/styles.css';

// Componente de Toast para feedback
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast ${type}`}>
      {message}
    </div>
  );
};

const MyTravels = () => {
  const [travels, setTravels] = useState(TravelsData);
  const [newTravel, setNewTravel] = useState({
    name: '',
    user: 'Tiago',
    category: [],
    country: '',
    city: '',
    price: '',
    days: '',
    transport: '',
    startDate: '',
    endDate: '',
    BookingTripPaymentDate: '',
    highlightImage: '',
    views: 0,
    priceDetails: { hotel: '', flight: '', food: '', extras: '' },
    images: [],
    images_generalInformation: [],
    description: '',
    longDescription: '',
    activities: [],
    accommodations: [
      {
        name: '',
        type: '',
        description: '',
        rating: '',
        checkInDate: '',
        checkOutDate: '',
        regime: '',
        images: []
      }
    ],
    foodRecommendations: [],
    images_foodRecommendations: [],
    climate: '',
    pointsOfInterest: [],
    images_referencePoints: [],
    safety: { tips: [], vaccinations: [] },
    itinerary: [],
    localTransport: [],
    language: '',
    reviews: [],
    negativePoints: '',
    privacy: 'public'
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('generalInfo');
  const [isEditing, setIsEditing] = useState(false);
  const [editTravelId, setEditTravelId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generalInfoImagePreviews, setGeneralInfoImagePreviews] = useState([]);
  const [accommodationImagePreviews, setAccommodationImagePreviews] = useState([]);
  const [foodRecommendationImagePreviews, setFoodRecommendationImagePreviews] = useState([]);
  const [transportImagePreviews, setTransportImagePreviews] = useState([]);
  const [referencePointImagePreviews, setReferencePointImagePreviews] = useState([]);
  const [editingFoodIndex, setEditingFoodIndex] = useState(null);
  const [newFoodRecommendation, setNewFoodRecommendation] = useState({ name: '', description: '' });
  const [editingPointIndex, setEditingPointIndex] = useState(null);
  const [newPointOfInterest, setNewPointOfInterest] = useState({ name: '', type: '', link: '' });
  const [editingItineraryDay, setEditingItineraryDay] = useState(null);
  const [newItineraryDay, setNewItineraryDay] = useState({ day: '', activities: [''] });
  const [itineraryError, setItineraryError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', show: false });

  const renderStars = (stars) => (
    [...Array(5)].map((_, index) => (
      <FaStar key={index} color={index < stars ? "#ffc107" : "#e4e5e9"} size={20} />
    ))
  );

  const location = useLocation();

  const transportOptions = [
    'Carro', 'Comboio', 'Autocarro', 'Avião', 'Bicicleta', 'A Pé', 'Barco', 'Táxi'
  ];

  const categories = [
    'Natureza', 'Cidade', 'Cultural', 'Nature', 'Foodie', 'History',
    'Beach', 'Mountains', 'City Break', 'Wildlife', 'Luxury', 'Budget',
    'Solo Travel', 'Family', 'Romantic'
  ];

  // Abrir modal automaticamente ao redirecionar com estado
  useEffect(() => {
    if (location.state?.openModal) {
      openModal();
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location.state]);

  // Função para validar campos obrigatórios
  const validateForm = () => {
    if (!newTravel.name.trim()) {
      setToast({ message: 'O nome da viagem é obrigatório!', type: 'error', show: true });
      return false;
    }
    if (!newTravel.country) {
      setToast({ message: 'Selecione um país!', type: 'error', show: true });
      return false;
    }
    if (!newTravel.city.trim()) {
      setToast({ message: 'A cidade é obrigatória!', type: 'error', show: true });
      return false;
    }
    if (!newTravel.startDate || !newTravel.endDate) {
      setToast({ message: 'As datas de início e fim são obrigatórias!', type: 'error', show: true });
      return false;
    }
    return true;
  };

  // Funções de manipulação de estado
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      if (name === 'category') {
        setNewTravel((prevState) => {
          let updatedCategories = [...prevState.category];
          if (checked) {
            updatedCategories.push(value);
          } else {
            updatedCategories = updatedCategories.filter((category) => category !== value);
          }
          return { ...prevState, category: updatedCategories };
        });
      } else if (name === 'localTransport') {
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
    } else if (type === 'file') {
      if (name === 'highlightImage') {
        const file = files[0];
        if (file) {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: file,
          }));
          setImagePreview(URL.createObjectURL(file));
        } else {
          setNewTravel((prevState) => ({
            ...prevState,
            highlightImage: '',
          }));
          setImagePreview(null);
        }
      } else if (name === 'images_generalInformation') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setGeneralInfoImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'accommodationImages') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => {
          const updatedAccommodations = [...prevState.accommodations];
          updatedAccommodations[0] = {
            ...updatedAccommodations[0],
            images: [...(updatedAccommodations[0].images || []), ...newFiles]
          };
          return { ...prevState, accommodations: updatedAccommodations };
        });
        setAccommodationImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_foodRecommendations') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setFoodRecommendationImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_localTransport') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setTransportImagePreviews((prev) => [...prev, ...previews]);
      } else if (name === 'images_referencePoints') {
        const newFiles = Array.from(files);
        const previews = newFiles.map((file) => URL.createObjectURL(file));
        setNewTravel((prevState) => ({
          ...prevState,
          [name]: [...(prevState[name] || []), ...newFiles],
        }));
        setReferencePointImagePreviews((prev) => [...prev, ...previews]);
      }
    } else if (name.startsWith('accommodations')) {
      const [indexStr, field] = name.split('.');
      const index = parseInt(indexStr.replace('accommodations', ''), 10);
      setNewTravel((prevState) => {
        const updatedAccommodations = [...prevState.accommodations];
        updatedAccommodations[index] = {
          ...updatedAccommodations[index],
          [field]: value
        };
        return { ...prevState, accommodations: updatedAccommodations };
      });
    } else if (name.includes('priceDetails.')) {
      const field = name.split('.')[1];
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

  const handleFoodChange = (e) => {
    const { name, value } = e.target;
    setNewFoodRecommendation((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditFoodRecommendation = (e) => {
    e.stopPropagation();
    if (!newFoodRecommendation.name.trim()) {
      setToast({ message: 'O nome da recomendação alimentar é obrigatório!', type: 'error', show: true });
      return;
    }
    setNewTravel((prev) => {
      const updatedRecommendations = [...prev.foodRecommendations];
      if (editingFoodIndex !== null) {
        updatedRecommendations[editingFoodIndex] = {
          name: newFoodRecommendation.name,
          description: newFoodRecommendation.description
        };
      } else {
        updatedRecommendations.push({
          name: newFoodRecommendation.name,
          description: newFoodRecommendation.description
        });
      }
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
    setToast({ message: 'Recomendação alimentar adicionada/editada com sucesso!', type: 'success', show: true });
  };

  const handleDeleteFoodRecommendation = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => {
      const updatedRecommendations = prev.foodRecommendations.filter((_, i) => i !== index);
      return { ...prev, foodRecommendations: updatedRecommendations };
    });
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '' });
    setToast({ message: 'Recomendação alimentar removida com sucesso!', type: 'success', show: true });
  };

  const handleEditFoodRecommendation = (e, index) => {
    e.stopPropagation();
    const recommendation = newTravel.foodRecommendations[index];
    if (recommendation) {
      setNewFoodRecommendation({
        name: recommendation.name || '',
        description: recommendation.description || ''
      });
      setEditingFoodIndex(index);
    }
  };

  const handleCancelEditFood = (e) => {
    e.stopPropagation();
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
  };

  const handlePointChange = (e) => {
    const { name, value } = e.target;
    setNewPointOfInterest((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrEditPointOfInterest = (e) => {
    e.stopPropagation();
    if (!newPointOfInterest.name.trim()) {
      setToast({ message: 'O nome do ponto de referência é obrigatório!', type: 'error', show: true });
      return;
    }
    setNewTravel((prev) => {
      const updatedPoints = [...prev.pointsOfInterest];
      if (editingPointIndex !== null) {
        updatedPoints[editingPointIndex] = {
          name: newPointOfInterest.name,
          type: newPointOfInterest.type,
          link: newPointOfInterest.link
        };
      } else {
        updatedPoints.push({
          name: newPointOfInterest.name,
          type: newPointOfInterest.type,
          link: newPointOfInterest.link
        });
      }
      return { ...prev, pointsOfInterest: updatedPoints };
    });
    setNewPointOfInterest({ name: '', type: '', link: '' });
    setEditingPointIndex(null);
    setToast({ message: 'Ponto de referência adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleDeletePointOfInterest = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => {
      const updatedPoints = prev.pointsOfInterest.filter((_, i) => i !== index);
      return { ...prev, pointsOfInterest: updatedPoints };
    });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', type: '', link: '' });
    setToast({ message: 'Ponto de referência removido com sucesso!', type: 'success', show: true });
  };

  const handleEditPointOfInterest = (e, index) => {
    e.stopPropagation();
    const point = newTravel.pointsOfInterest[index];
    if (point) {
      setNewPointOfInterest({
        name: point.name || '',
        type: point.type || '',
        link: point.link || ''
      });
      setEditingPointIndex(index);
    }
  };

  const handleCancelEditPoint = (e) => {
    e.stopPropagation();
    setNewPointOfInterest({ name: '', type: '', link: '' });
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
    if (name === 'day') {
      setNewItineraryDay((prev) => ({ ...prev, day: value }));
      setItineraryError('');
    } else if (name.startsWith('activity')) {
      const activityIndex = parseInt(name.split('-')[1], 10);
      const updatedActivities = [...newItineraryDay.activities];
      updatedActivities[activityIndex] = value;
      setNewItineraryDay((prev) => ({ ...prev, activities: updatedActivities }));
    }
  };

  const handleAddActivityField = (e) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: [...prev.activities, '']
    }));
  };

  const handleRemoveActivityField = (e, index) => {
    e.stopPropagation();
    setNewItineraryDay((prev) => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
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
      setItineraryError(
        'Este dia já foi adicionado ao itinerário. Edite o dia existente ou escolha outro número.'
      );
      return;
    }

    setNewTravel((prev) => {
      const updatedItinerary = [...prev.itinerary];
      const filteredActivities = newItineraryDay.activities.filter(
        (act) => act.trim() !== ''
      );
      if (editingItineraryDay !== null) {
        updatedItinerary[editingItineraryDay] = {
          day: dayToAdd,
          activities: filteredActivities
        };
      } else {
        updatedItinerary.push({
          day: dayToAdd,
          activities: filteredActivities
        });
      }
      return { ...prev, itinerary: updatedItinerary.sort((a, b) => a.day - b.day) };
    });
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
    setToast({ message: 'Dia do itinerário adicionado/editado com sucesso!', type: 'success', show: true });
  };

  const handleEditItineraryDay = (e, index) => {
    e.stopPropagation();
    const day = newTravel.itinerary[index];
    setNewItineraryDay({
      day: day.day.toString(),
      activities: day.activities.length > 0 ? [...day.activities] : ['']
    });
    setEditingItineraryDay(index);
    setItineraryError('');
  };

  const handleDeleteItineraryDay = (e, index) => {
    e.stopPropagation();
    setNewTravel((prev) => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setItineraryError('');
    setToast({ message: 'Dia do itinerário removido com sucesso!', type: 'success', show: true });
  };

  const handleCancelEditItinerary = (e) => {
    e.stopPropagation();
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');
  };

  const handleEdit = (id) => {
    const travelToEdit = travels.find((travel) => travel.id === id);
    if (!travelToEdit) {
      setToast({ message: `Viagem com ID ${id} não encontrada!`, type: 'error', show: true });
      return;
    }

    setNewTravel({
      ...travelToEdit,
      highlightImage: travelToEdit.highlightImage || '',
      category: travelToEdit.category || [],
      priceDetails: travelToEdit.priceDetails || { hotel: '', flight: '', food: '', extras: '' },
      accommodations: Array.isArray(travelToEdit.accommodations) && travelToEdit.accommodations.length > 0
        ? travelToEdit.accommodations.map(acc => ({
            ...acc,
            images: acc.images || []
          }))
        : [
            {
              name: '',
              type: '',
              description: '',
              rating: '',
              checkInDate: '',
              checkOutDate: '',
              regime: '',
              images: []
            }
          ],
      foodRecommendations: Array.isArray(travelToEdit.foodRecommendations)
        ? travelToEdit.foodRecommendations.map(food => ({
            name: food.name || '',
            description: food.description || ''
          }))
        : [],
      images_foodRecommendations: travelToEdit.images_foodRecommendations || [],
      pointsOfInterest: Array.isArray(travelToEdit.pointsOfInterest)
        ? travelToEdit.pointsOfInterest.map(point => ({
            name: point.name || '',
            type: point.type || '',
            link: point.link || ''
          }))
        : [],
      images_referencePoints: travelToEdit.images_referencePoints || [],
      itinerary: Array.isArray(travelToEdit.itinerary) ? travelToEdit.itinerary : [],
      localTransport: Array.isArray(travelToEdit.localTransport) ? travelToEdit.localTransport : [],
      privacy: travelToEdit.privacy || 'public'
    });

    setEditTravelId(id);
    setIsEditing(true);
    setIsModalOpen(true);
    setActiveTab('generalInfo');
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingFoodIndex(null);
    setNewPointOfInterest({ name: '', type: '', link: '' });
    setEditingPointIndex(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setEditingItineraryDay(null);
    setItineraryError('');

    // Corrigir a pré-visualização da imagem de destaque
    if (travelToEdit.highlightImage) {
      if (travelToEdit.highlightImage instanceof File) {
        setImagePreview(URL.createObjectURL(travelToEdit.highlightImage));
      } else if (typeof travelToEdit.highlightImage === 'string') {
        setImagePreview(travelToEdit.highlightImage);
      } else {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }

    if (travelToEdit.images_generalInformation && Array.isArray(travelToEdit.images_generalInformation)) {
      const previews = travelToEdit.images_generalInformation.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setGeneralInfoImagePreviews(previews);
    } else {
      setGeneralInfoImagePreviews([]);
    }

    if (travelToEdit.accommodations && Array.isArray(travelToEdit.accommodations)) {
      const accommodationImages = travelToEdit.accommodations[0]?.images || [];
      const previews = accommodationImages.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setAccommodationImagePreviews(previews);
    } else {
      setAccommodationImagePreviews([]);
    }

    if (travelToEdit.images_foodRecommendations && Array.isArray(travelToEdit.images_foodRecommendations)) {
      const previews = travelToEdit.images_foodRecommendations.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setFoodRecommendationImagePreviews(previews);
    } else {
      setFoodRecommendationImagePreviews([]);
    }

    if (travelToEdit.images_localTransport && Array.isArray(travelToEdit.images_localTransport)) {
      const previews = travelToEdit.images_localTransport.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setTransportImagePreviews(previews);
    } else {
      setTransportImagePreviews([]);
    }

    if (travelToEdit.images_referencePoints && Array.isArray(travelToEdit.images_referencePoints)) {
      const previews = travelToEdit.images_referencePoints.map((image) =>
        image instanceof File ? URL.createObjectURL(image) : image
      );
      setReferencePointImagePreviews(previews);
    } else {
      setReferencePointImagePreviews([]);
    }
  };

  const handleDelete = (id) => {
    setTravels(travels.filter((travel) => travel.id !== id));
    setToast({ message: 'Viagem excluída com sucesso!', type: 'success', show: true });
  };

  const handleAddTravel = () => {
    if (!validateForm()) return;

    if (isEditing) {
      setTravels((prevTravels) =>
        prevTravels.map((travel) =>
          travel.id === editTravelId
            ? {
                ...newTravel,
                id: editTravelId,
                highlightImage: newTravel.highlightImage, // Manter o valor existente, seja File ou string
                images_generalInformation: newTravel.images_generalInformation || [],
                accommodations: Array.isArray(newTravel.accommodations)
                  ? newTravel.accommodations.map(acc => ({
                      ...acc,
                      images: acc.images || []
                    }))
                  : [
                      {
                        name: '',
                        type: '',
                        description: '',
                        rating: '',
                        checkInDate: '',
                        checkOutDate: '',
                        regime: '',
                        images: []
                      }
                    ],
                foodRecommendations: newTravel.foodRecommendations.filter(
                  (rec) => rec.name.trim() !== '' || rec.description.trim() !== ''
                ),
                images_foodRecommendations: newTravel.images_foodRecommendations || [],
                pointsOfInterest: newTravel.pointsOfInterest.filter(
                  (point) => point.name.trim() !== '' || point.type.trim() !== '' || point.link.trim() !== ''
                ),
                images_referencePoints: newTravel.images_referencePoints || [],
                itinerary: newTravel.itinerary.filter(
                  (item) => item.day && item.activities.length > 0
                ),
                localTransport: newTravel.localTransport || [],
                images_localTransport: newTravel.images_localTransport || [],
                privacy: newTravel.privacy
              }
            : travel
        )
      );
      setToast({ message: 'Viagem editada com sucesso!', type: 'success', show: true });
    } else {
      const newId = travels.length + 1;
      const addedTravel = {
        ...newTravel,
        id: newId,
        highlightImage: newTravel.highlightImage, // Salvar como File ou string
        images_generalInformation: newTravel.images_generalInformation || [],
        accommodations: Array.isArray(newTravel.accommodations)
          ? newTravel.accommodations.map(acc => ({
              ...acc,
              images: acc.images || []
            }))
          : [
              {
                name: '',
                type: '',
                description: '',
                rating: '',
                checkInDate: '',
                checkOutDate: '',
                regime: '',
                images: []
              }
            ],
        foodRecommendations: newTravel.foodRecommendations.filter(
          (rec) => rec.name.trim() !== '' || rec.description.trim() !== ''
        ),
        images_foodRecommendations: newTravel.images_foodRecommendations || [],
        pointsOfInterest: newTravel.pointsOfInterest.filter(
          (point) => point.name.trim() !== '' || point.type.trim() !== '' || point.link.trim() !== ''
        ),
        images_referencePoints: newTravel.images_referencePoints || [],
        itinerary: newTravel.itinerary.filter(
          (item) => item.day && item.activities.length > 0
        ),
        localTransport: newTravel.localTransport || [],
        images_localTransport: newTravel.images_localTransport || [],
        privacy: newTravel.privacy
      };
      setTravels((prevTravels) => [...prevTravels, addedTravel]);
      setToast({ message: 'Viagem adicionada com sucesso!', type: 'success', show: true });
    }
    resetForm();
  };

  // Nova função para adicionar ou editar apenas os pontos negativos
  const handleAddOrEditNegativePoints = (e) => {
    e.stopPropagation();
    setToast({ message: 'Pontos negativos atualizados com sucesso!', type: 'success', show: true });
  };

  const resetForm = () => {
    setNewTravel({
      name: '',
      user: 'Tiago',
      category: [],
      country: '',
      city: '',
      price: '',
      days: '',
      transport: '',
      startDate: '',
      endDate: '',
      BookingTripPaymentDate: '',
      highlightImage: '',
      views: 0,
      priceDetails: { hotel: '', flight: '', food: '', extras: '' },
      images: [],
      images_generalInformation: [],
      description: '',
      longDescription: '',
      activities: [],
      accommodations: [
        {
          name: '',
          type: '',
          description: '',
          rating: '',
          checkInDate: '',
          checkOutDate: '',
          regime: '',
          images: []
        }
      ],
      foodRecommendations: [],
      images_foodRecommendations: [],
      climate: '',
      pointsOfInterest: [],
      images_referencePoints: [],
      safety: { tips: [], vaccinations: [] },
      itinerary: [],
      localTransport: [],
      language: '',
      reviews: [],
      negativePoints: '',
      privacy: 'public'
    });
    setIsModalOpen(false);
    setIsEditing(false);
    setEditTravelId(null);
    setIsCategoryModalOpen(false);
    setIsTransportModalOpen(false);
    setImagePreview(null);
    setGeneralInfoImagePreviews([]);
    setAccommodationImagePreviews([]);
    setFoodRecommendationImagePreviews([]);
    setTransportImagePreviews([]);
    setReferencePointImagePreviews([]);
    setEditingFoodIndex(null);
    setNewFoodRecommendation({ name: '', description: '' });
    setEditingPointIndex(null);
    setNewPointOfInterest({ name: '', type: '', link: '' });
    setEditingItineraryDay(null);
    setNewItineraryDay({ day: '', activities: [''] });
    setItineraryError('');
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
    setItineraryError('');
  };

  return (
    <div className="my-travels-container">
      {/* Exibir Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      <button className='primary-action-button' onClick={openModal}>Adicionar Viagem</button><br></br><br></br>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-actions">
              <label>🔒 Privacidade da Viagem:</label>
              <select
                name="privacy"
                value={newTravel.privacy}
                onChange={handleChange}
                style={{ width: '15%', padding: '5px' }}
              >
                <option value="public">Pública</option>
                <option value="followers">Somente para Seguidores</option>
                <option value="private">Privada</option>
              </select>

              <button type="button" onClick={handleAddTravel} className="primary-action-button">
                {isEditing ? 'Guardar Alterações' : 'Adicionar Viagem'}
              </button>
              <button type="button" onClick={closeModal} className="secondary-action-button">
                Fechar
              </button>
            </div>

            <div className="tab-nav">
              <button onClick={() => handleTabChange('generalInfo')} className={activeTab === 'generalInfo' ? 'active' : ''}>
                1 - Informações Gerais
              </button>
              <button onClick={() => handleTabChange('prices')} className={activeTab === 'prices' ? 'active' : ''}>
                2 - Preços da Viagem
              </button>
              <button onClick={() => handleTabChange('accommodation')} className={activeTab === 'accommodation' ? 'active' : ''}>
                3 - Estadia
              </button>
              <button onClick={() => handleTabChange('food')} className={activeTab === 'food' ? 'active' : ''}>
                4 - Alimentação
              </button>
              <button onClick={() => handleTabChange('transport')} className={activeTab === 'transport' ? 'active' : ''}>
                5 - Métodos de Transporte
              </button>
              <button onClick={() => handleTabChange('pointsOfInterest')} className={activeTab === 'pointsOfInterest' ? 'active' : ''}>
                6 - Pontos de Referência
              </button>
              <button onClick={() => handleTabChange('itinerary')} className={activeTab === 'itinerary' ? 'active' : ''}>
                7 - Itinerário da Viagem
              </button>
              <button onClick={() => handleTabChange('negativePoints')} className={activeTab === 'negativePoints' ? 'active' : ''}>
                8 - Pontos Negativos
              </button>
            </div>

            <form onSubmit={(e) => e.preventDefault()}>
              {activeTab === 'generalInfo' && (
                <>
                  <div className="RightPosition">
                    <label>Imagem de Destaque:</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="highlightImage"
                        onChange={handleChange}
                        accept="image/*"
                        id="highlightImageInput"
                        className="image-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="highlightImageInput" className="upload-button">
                        <span role="img" aria-label="câmera">📸</span> Adicionar Foto Principal
                      </label>
                      {imagePreview ? (
                        <div className="image-preview-container">
                          <img
                            src={imagePreview}
                            alt="Preview da imagem"
                            className="image-preview"
                            onError={() => setImagePreview(null)}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setNewTravel((prev) => ({ ...prev, highlightImage: '' }));
                            }}
                            className="remove-preview-button"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <p className="upload-placeholder">Nenhuma imagem selecionada. Adicione uma foto para destacar a sua viagem!</p>
                      )}
                    </div>

                    <div>
                      <label>Fotografias das Informações Gerais:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_generalInformation"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="generalInfoImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="generalInfoImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos das Informações Gerais
                        </label>
                        {generalInfoImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {generalInfoImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto das informações gerais ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = generalInfoImagePreviews.filter((_, i) => i !== index);
                                    setGeneralInfoImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_generalInformation: prev.images_generalInformation.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar as informações gerais!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="LeftPosition">
                    <label>Nome da Viagem:</label>
                    <input
                      type="text"
                      name="name"
                      value={newTravel.name}
                      onChange={handleChange}
                      required
                      placeholder="Ex.: Viagem à cidade de Coimbra "
                    />

                    <br /><br />

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label>🌍 País:</label>
                        <select name="country" value={newTravel.country} onChange={handleChange} required>
                          <option value="">Selecione um país</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Brazil">Brazil</option>
                          <option value="United States">United States</option>
                          <option value="Espanha">Espanha</option>
                          <option value="França">França</option>
                          <option value="Itália">Itália</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
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

                    <br /><br />

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label>📅 Data de Início:</label>
                        <input
                          type="date"
                          name="startDate"
                          value={newTravel.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
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

                    <br /><br />

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label>📅 Data de Marcação / Pagamento da Viagem:</label>
                        <input
                          type="date"
                          name="BookingTripPaymentDate"
                          value={newTravel.BookingTripPaymentDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <br /><br />

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label>Avaliação Geral (1 a 5):</label>
                        <input
                          type="number"
                          name="stars"
                          value={newTravel.stars || ''}
                          min="1"
                          max="5"
                          onChange={(e) => {
                            const value = Math.max(1, Math.min(5, Number(e.target.value)));
                            handleChange({ ...e, target: { ...e.target, name: 'stars', value } });
                          }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <label>Línguas Utilizadas:</label>
                        <input
                          type="text"
                          name="language"
                          value={newTravel.language || ''}
                          onChange={handleChange}
                          placeholder="Ex.: Português, Inglês"
                        />
                      </div>
                    </div>

                    <br /><br />

                    <label>🗂️ Categorias Selecionadas:</label>
                    <p>{newTravel.category.length > 0 ? newTravel.category.join(', ') : 'Nenhuma categoria selecionada'}</p>
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

                    <br /><br />

                    <label>Temperatura (°C):</label>
                    <input
                      type="text"
                      name="climate"
                      value={newTravel.climate}
                      onChange={handleChange}
                      placeholder="Ex.: Média do Clima foi de 30º, apanhamos uma excelente temperatura!"
                    />
                  </div>

                  <div className="LeftPositionY">
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label>📖 Descrição curta da Viagem:</label>
                      <textarea
                        name="description"
                        value={newTravel.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Insira uma descrição curta da viagem"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label>📖 Descrição Longa da Viagem:</label>
                      <textarea
                        name="longDescription"
                        value={newTravel.longDescription}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Insira uma descrição mais detalhada da viagem"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'prices' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <label>💰 Preços da Viagem:</label>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label>💰 Estadia (€):</label>
                      <input
                        type="number"
                        name="priceDetails.hotel"
                        value={newTravel.priceDetails.hotel}
                        onChange={handleChange}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label>💰 Alimentação (€):</label>
                      <input
                        type="number"
                        name="priceDetails.food"
                        value={newTravel.priceDetails.food}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <label>💰 Transportes (€):</label>
                      <input
                        type="number"
                        name="priceDetails.transport"
                        value={newTravel.priceDetails.transport}
                        onChange={handleChange}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
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
                    <label>💰 Preço Total da Viagem (€):</label>
                    <input
                      type="number"
                      name="price"
                      value={newTravel.price}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'accommodation' && (
                <div>
                  <div className="LeftPosition">
                    {Array.isArray(newTravel.accommodations) && newTravel.accommodations.length > 0 ? (
                      newTravel.accommodations.map((accommodation, index) => (
                        <div key={index} className="accommodation-section">
                          <label>Nome do Alojamento:</label>
                          <input
                            type="text"
                            name={`accommodations${index}.name`}
                            value={accommodation.name}
                            onChange={handleChange}
                            placeholder="Ex.: Hotel Pestana"
                            style={{ width: '100%', marginBottom: '10px' }}
                          />

                          <label>Tipo de Alojamento:</label>
                          <select
                            name={`accommodations${index}.type`}
                            value={accommodation.type}
                            onChange={handleChange}
                            style={{ width: '100%', marginBottom: '10px' }}
                          >
                            <option value="">Selecione o tipo</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Hostel">Hostel</option>
                            <option value="Apartamento">Apartamento</option>
                            <option value="Pousada">Pousada</option>
                            <option value="Casa de Férias">Casa de Férias</option>
                          </select>

                          <label>Regime:</label>
                          <select
                            name={`accommodations${index}.regime`}
                            value={accommodation.regime}
                            onChange={handleChange}
                            style={{ width: '100%', marginBottom: '10px' }}
                          >
                            <option value="">Selecione o regime</option>
                            <option value="Tudo Incluído">Tudo Incluído</option>
                            <option value="Meia Pensão">Meia Pensão</option>
                            <option value="Pensão Completa">Pensão Completa</option>
                            <option value="Apenas Alojamento">Apenas Alojamento</option>
                          </select>

                          <label>A sua opinião da Estadia:</label>
                          <textarea
                            name={`accommodations${index}.description`}
                            value={accommodation.description}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Ex.: Hotel 5 estrelas com vista para o mar"
                            style={{ width: '100%', marginBottom: '10px' }}
                          />

                          <label>Avaliação da Estadia (1 a 5):</label>
                          <input
                            type="number"
                            name={`accommodations${index}.rating`}
                            value={accommodation.rating || ''}
                            min="1"
                            max="5"
                            onChange={(e) => {
                              const value = Math.max(1, Math.min(5, Number(e.target.value)));
                              handleChange({ ...e, target: { ...e.target, name: `accommodations${index}.rating`, value } });
                            }}
                          />
                        </div>
                      ))
                    ) : (
                      <p>Nenhum alojamento adicionado ainda.</p>
                    )}
                  </div>

                  <div className="RightPosition">
                    <label>Fotografias da Estadia:</label>
                    <div className="image-upload-container">
                      <input
                        type="file"
                        name="accommodationImages"
                        onChange={handleChange}
                        accept="image/*"
                        multiple
                        id="accommodationImagesInput"
                        className="image-input"
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="accommodationImagesInput" className="upload-button">
                        <span role="img" aria-label="câmera">📸</span> Adicionar Fotos da Estadia
                      </label>
                      {accommodationImagePreviews.length > 0 ? (
                        <div className="general-info-image-previews">
                          {accommodationImagePreviews.map((preview, imgIndex) => (
                            <div key={imgIndex} className="general-info-image-preview-container">
                              <img src={preview} alt={`Preview da foto do alojamento ${imgIndex + 1}`} className="general-info-image-preview" />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPreviews = accommodationImagePreviews.filter((_, i) => i !== imgIndex);
                                  setAccommodationImagePreviews(newPreviews);
                                  setNewTravel((prev) => {
                                    const updatedAccommodations = [...prev.accommodations];
                                    updatedAccommodations[0] = {
                                      ...updatedAccommodations[0],
                                      images: updatedAccommodations[0].images.filter((_, i) => i !== imgIndex)
                                    };
                                    return { ...prev, accommodations: updatedAccommodations };
                                  });
                                }}
                                className="remove-preview-button"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar o alojamento!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'food' && (
                <div>
                  <div className="RightPosition">
                    <h3>Recomendações Alimentares</h3>
                    {Array.isArray(newTravel.foodRecommendations) && newTravel.foodRecommendations.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {newTravel.foodRecommendations.map((recommendation, index) => (
                          <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
                            <strong>{recommendation.name || 'Sem nome'}</strong>: {recommendation.description || 'Sem descrição'}
                            <div style={{ marginTop: '5px' }}>
                              <button
                                onClick={(e) => handleEditFoodRecommendation(e, index)}
                                style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteFoodRecommendation(e, index)}
                                style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhuma recomendação alimentar adicionada ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label>Nome da nova Recomendação:</label>
                      <input
                        type="text"
                        name="name"
                        value={newFoodRecommendation.name}
                        onChange={handleFoodChange}
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                        placeholder="Ex.: Bacalhau à Brás"
                        key={`name-input-${editingFoodIndex}`}
                      />

                      <label>Descrição:</label>
                      <textarea
                        name="description"
                        value={newFoodRecommendation.description}
                        onChange={handleFoodChange}
                        rows="3"
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                        placeholder="Ex.: Prato tradicional português..."
                        key={`desc-input-${editingFoodIndex}`}
                      />

                      <button
                        onClick={(e) => handleAddOrEditFoodRecommendation(e)}
                        style={{ padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '10px' }}
                        disabled={!newFoodRecommendation.name.trim()}
                      >
                        {editingFoodIndex !== null ? 'Guardar Alterações' : 'Adicionar'}
                      </button>
                      {editingFoodIndex !== null && (
                        <button
                          onClick={(e) => handleCancelEditFood(e)}
                          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <label>Fotografias das Recomendações Alimentares:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_foodRecommendations"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="foodRecommendationImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="foodRecommendationImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos das Recomendações Alimentares
                        </label>
                        {foodRecommendationImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {foodRecommendationImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de recomendação alimentar ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = foodRecommendationImagePreviews.filter((_, i) => i !== index);
                                    setFoodRecommendationImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_foodRecommendations: prev.images_foodRecommendations.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar as suas recomendações alimentares!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transport' && (
                <div>
                  <div className="RightPosition">
                    <h3>Métodos de Transporte Utilizados</h3>
                    {newTravel.localTransport.length > 0 ? (
                      <p>{newTravel.localTransport.join(', ')}</p>
                    ) : (
                      <p>Nenhum método de transporte selecionado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label>Métodos de Transporte Selecionados:</label>
                      <p>{newTravel.localTransport.length > 0 ? newTravel.localTransport.join(', ') : 'Nenhum método selecionado'}</p>
                      <button type="button" onClick={() => setIsTransportModalOpen(true)}>
                        Adicionar Métodos de Transporte
                      </button>

                      {isTransportModalOpen && (
                        <div className="modal-overlay" onClick={() => setIsTransportModalOpen(false)}>
                          <div className="modal-content category-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>🚗 Adicionar Métodos de Transporte</h3>
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

                    <div style={{ marginTop: '20px' }}>
                      <label>Fotografias dos Métodos de Transporte:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_localTransport"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="transportImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="transportImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos dos Métodos de Transporte
                        </label>
                        {transportImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {transportImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de transporte ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = transportImagePreviews.filter((_, i) => i !== index);
                                    setTransportImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_localTransport: prev.images_localTransport.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar os métodos de transporte!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pointsOfInterest' && (
                <div>
                  <div className="RightPosition">
                    <h3>Pontos de Referência</h3>
                    {Array.isArray(newTravel.pointsOfInterest) && newTravel.pointsOfInterest.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: '0' }}>
                        {newTravel.pointsOfInterest.map((point, index) => (
                          <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
                            <strong>{point.name || 'Sem nome'}</strong> ({point.type || 'Sem tipo'})
                            <br />
                            <div style={{ marginTop: '5px' }}>
                              <button
                                onClick={(e) => handleEditPointOfInterest(e, index)}
                                style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeletePointOfInterest(e, index)}
                                style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum ponto de referência adicionado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label>Nome do Ponto de Referência:</label>
                      <input
                        type="text"
                        name="name"
                        value={newPointOfInterest.name}
                        onChange={handlePointChange}
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                        placeholder="Ex.: Torre de Belém"
                        key={`name-input-point-${editingPointIndex}`}
                      />

                      <label>Tipo:</label>
                      <select
                        name="type"
                        value={newPointOfInterest.type}
                        onChange={handlePointChange}
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                        key={`type-input-point-${editingPointIndex}`}
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="Monumento histórico">Monumento histórico</option>
                        <option value="Parque">Parque</option>
                        <option value="Museu">Museu</option>
                        <option value="Praia">Praia</option>
                        <option value="Mercado">Mercado</option>
                      </select>

                      <button
                        onClick={(e) => handleAddOrEditPointOfInterest(e)}
                        style={{ padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '10px' }}
                        disabled={!newPointOfInterest.name.trim()}
                      >
                        {editingPointIndex !== null ? 'Guardar Alterações' : 'Adicionar'}
                      </button>
                      {editingPointIndex !== null && (
                        <button
                          onClick={(e) => handleCancelEditPoint(e)}
                          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: '20px' }}>
                      <label>Fotografias dos Pontos de Referência:</label>
                      <div className="general-info-image-upload-container">
                        <input
                          type="file"
                          name="images_referencePoints"
                          onChange={handleChange}
                          accept="image/*"
                          multiple
                          id="referencePointImagesInput"
                          className="image-input"
                          style={{ display: 'none' }}
                        />
                        <label htmlFor="referencePointImagesInput" className="upload-button">
                          <span role="img" aria-label="câmera">📸</span> Adicionar Fotos dos Pontos de Referência
                        </label>
                        {referencePointImagePreviews.length > 0 ? (
                          <div className="general-info-image-previews">
                            {referencePointImagePreviews.map((preview, index) => (
                              <div key={index} className="general-info-image-preview-container">
                                <img src={preview} alt={`Preview da foto de ponto de referência ${index + 1}`} className="general-info-image-preview" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPreviews = referencePointImagePreviews.filter((_, i) => i !== index);
                                    setReferencePointImagePreviews(newPreviews);
                                    setNewTravel((prev) => ({
                                      ...prev,
                                      images_referencePoints: prev.images_referencePoints.filter((_, i) => i !== index),
                                    }));
                                  }}
                                  className="remove-preview-button"
                                >
                                  Remover
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="upload-placeholder">Nenhuma foto selecionada. Adicione fotos para destacar os pontos de referência!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'itinerary' && (
                <div>
                  <div className="RightPosition">
                    <h3>Itinerário da Viagem</h3>
                    <p><strong>Duração Total:</strong> {calculateTripDays()} dias</p>
                    {Array.isArray(newTravel.itinerary) && newTravel.itinerary.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: '0' }}>
                        {newTravel.itinerary.map((item, index) => (
                          <li key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
                            <strong>Dia {item.day}:</strong>
                            <ul style={{ paddingLeft: '20px' }}>
                              {item.activities.map((activity, actIndex) => (
                                <li key={actIndex}>{activity}</li>
                              ))}
                            </ul>
                            <div style={{ marginTop: '5px' }}>
                              <button
                                onClick={(e) => handleEditItineraryDay(e, index)}
                                style={{ marginRight: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Editar
                              </button>
                              <button
                                onClick={(e) => handleDeleteItineraryDay(e, index)}
                                style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}
                              >
                                Remover
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>Nenhum dia adicionado ao itinerário ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label>Dia:</label>
                      <input
                        type="number"
                        name="day"
                        value={newItineraryDay.day}
                        onChange={handleItineraryChange}
                        min="1"
                        max={calculateTripDays()}
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                        placeholder={`Digite um número entre 1 e ${calculateTripDays()}`}
                        key={`day-input-${editingItineraryDay}`}
                      />
                      {itineraryError && (
                        <p style={{ color: 'red', marginBottom: '10px' }}>{itineraryError}</p>
                      )}

                      <label>Atividades:</label>
                      {newItineraryDay.activities.map((activity, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <input
                            type="text"
                            name={`activity-${index}`}
                            value={activity}
                            onChange={(e) => handleItineraryChange(e, index)}
                            style={{ width: '100%', padding: '5px' }}
                            placeholder="Ex.: Visita ao museu"
                          />
                          {newItineraryDay.activities.length > 1 && (
                            <button
                              onClick={(e) => handleRemoveActivityField(e, index)}
                              style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px' }}
                            >
                              -
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddActivityField}
                        style={{ padding: '8px 16px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '10px' }}
                      >
                        + Adicionar Atividade
                      </button>

                      <button
                        onClick={(e) => handleAddOrEditItineraryDay(e)}
                        style={{ padding: '8px 16px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', marginRight: '10px' }}
                        disabled={!newItineraryDay.day || newItineraryDay.activities.every((act) => !act.trim())}
                      >
                        {editingItineraryDay !== null ? 'Guardar Alterações' : 'Adicionar Dia'}
                      </button>
                      {editingItineraryDay !== null && (
                        <button
                          onClick={(e) => handleCancelEditItinerary(e)}
                          style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px' }}
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'negativePoints' && (
                <div>
                  <div className="RightPosition">
                    <h3>Pontos Negativos</h3>
                    {newTravel.negativePoints.trim() ? (
                      <p style={{ padding: '10px', border: '1px solid #e9ecef', borderRadius: '4px' }}>
                        {newTravel.negativePoints}
                      </p>
                    ) : (
                      <p>Nenhum ponto negativo adicionado ainda.</p>
                    )}
                  </div>

                  <div className="LeftPosition">
                    <div>
                      <label>Pontos Negativos da Viagem:</label>
                      <textarea
                        name="negativePoints"
                        value={newTravel.negativePoints}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Ex.: Clima instável, trânsito intenso..."
                        style={{ width: '100%', marginBottom: '10px', padding: '5px' }}
                      />
                      <button
                        onClick={(e) => handleAddOrEditNegativePoints(e)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#007bff',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          marginRight: '10px'
                        }}
                      >
                        {isEditing ? 'Guardar Alterações' : 'Adicionar'}
                      </button>
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewTravel((prev) => ({ ...prev, negativePoints: '' }));
                            setToast({ message: 'Pontos negativos removidos com sucesso!', type: 'success', show: true });
                          }}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px'
                          }}
                        >
                          Remover Pontos Negativos
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="travels-list">
        {travels.length === 0 ? (
          <p>Nenhuma viagem adicionada ainda. Comece adicionando uma nova viagem!</p>
        ) : (
          travels.map((travel) => (
            <div key={travel.id} className="travel-card">
              <Link to={`/travel/${travel.id}`}>
                <div className="travel-content">
                  {travel.highlightImage ? (
                    <img
                      src={
                        travel.highlightImage instanceof File
                          ? URL.createObjectURL(travel.highlightImage)
                          : travel.highlightImage
                      }
                      alt={travel.name}
                      className="highlight-image"
                      onError={(e) => (e.target.src = '/default-image.jpg')} // Imagem padrão em caso de erro
                    />
                  ) : 
                    <div className="no-image-placeholder"></div>
                  }
                  <div className="travel-text">
                    <h2>{travel.name}</h2>
                    <p><b>👤 Utilizador:</b> {travel.user}</p>
                    <p><b>🌍 País:</b> {travel.country}</p>
                    <p><b>🏙️ Cidade:</b> {travel.city}</p>
                    <p><b>🗂️ Categoria:</b> {travel.category.join(', ')}</p>
                    <p><b>📅 Duração da Viagem:</b> {travel.days} dias</p>
                    <p><b>💰 Preço Total da Viagem:</b> {travel.price}€</p>
                    <p><strong>Avaliação Geral:</strong> {renderStars(travel.stars)}</p>
                    <Link to={`/travel/${travel.id}`} className="button">Ver mais detalhes</Link>
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

export default MyTravels;