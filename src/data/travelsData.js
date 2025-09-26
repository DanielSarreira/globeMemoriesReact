const travels = [
  {
    id: 1,
    name: "Viagem Teste",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Castelo Branco",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-03-01",
    endDate: "2025-03-06",
    BookingTripPaymentDate:"2025-01-01",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    travelVideos: [require('../videos/sintra.mp4'), require('../videos/suica.mp4'), require('../videos/lisboa.mp4')], // Array de vídeos
    views: 100,
    price: 70,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
      require('../images/travels/aveiro4.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    images_accommodations: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
      require('../images/travels/aveiro8.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
      require('../images/travels/aveiro12.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
      require('../images/travels/aveiro16.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    images_localTransport: [
      require('../images/travels/aveiro13.jpg'),
    ],
    stars: 1,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 50, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 2,
    name: "Viagem a Lisboa Tiago",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Beja",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-08-23",
    endDate: "2025-02-05",
    BookingTripPaymentDate:"2025-01-01",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    travelVideos: [require('../videos/sintra.mp4'), require('../videos/suica.mp4'), require('../videos/lisboa.mp4')], // Array de vídeos
    views: 100,
    price: 70,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 30, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 3,
    name: "Viagem a Lisboa",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Aveiro",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-05",
    BookingTripPaymentDate:"2025-01-01",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 70,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 60, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 4,
    name: "Viagem a Lisboa",
    user: "SofiaRamos",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Aveiro",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-05",
    BookingTripPaymentDate:"2025-01-01",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 50.32,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 10, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 5,
    name: "Viagem ao Chile",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Torres Vedras",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-05",
    BookingTripPaymentDate:"2025-02-20",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 1000,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 10, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 6,
    name: "Viagem a Madrid",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Espanha",
    city: "Madrid",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-10",
    BookingTripPaymentDate:"2025-10-10",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 10,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 10, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  {
    id: 7,
    name: "Viagem a Madrid",
    user: "tiago",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Gerês",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-10",
    BookingTripPaymentDate:"2025-10-10",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 5200,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 10, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },

  {
    id: 8,
    name: "Viagem a Lisboa",
    user: "SofiaRamos",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Portimão",
    days: 2,
    language: "Português",
    climate: "Média do Clima foi de 30º, apanhamos uma excelente temperatura!",
    localTransport: ["Carro"],
    startDate: "2025-02-02",
    endDate: "2025-02-05",
    BookingTripPaymentDate:"2025-01-01",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views: 100,
    price: 50.32,
    priceDetails: {
      hotel: 30,
      transport: 10,
      food: 30,
      extras: 10,
    },
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    accommodationImagePreviews: [
      require('../images/travels/aveiro5.jpg'),
      require('../images/travels/aveiro6.jpg'),
      require('../images/travels/aveiro7.jpg'),
      require('../images/travels/aveiro8.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/travels/aveiro9.jpg'),
      require('../images/travels/aveiro10.jpg'),
      require('../images/travels/aveiro11.jpg'),
      require('../images/travels/aveiro12.jpg'),
    ],
    images_referencePoints: [
      require('../images/travels/aveiro13.jpg'),
      require('../images/travels/aveiro14.jpg'),
      require('../images/travels/aveiro15.jpg'),
      require('../images/travels/aveiro16.jpg'),
    ],
    stars: 4,
    description: "Aveiro é uma cidade portuguesa e capital da sub-região da Região de Aveiro, pertencendo à região do Centro e ao distrito de Aveiro e ainda à antiga província da Beira Litoral. A cidade possui 62.653 habitantes (2021) e é sede do Município de Aveiro que tem uma área total de 197,58 km2, 80 978 habitantes em 2021 e uma densidade populacional de 410 hab./km2, subdividido em 10 freguesias.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      {
        name: "Hotel Pestana",
        type: "Hotel",
        description: "Hotel 5 estrelas com vista para o mar",
        rating: 4.5,
        checkInDate: "2025-02-01",
        checkOutDate: "2025-02-05",
        regime: "Tudo Incluído",
      },
    ],
    foodRecommendations: [
      { name: "Bacalhau à Brás", description: "teste" },
    ],
    pointsOfInterest: [
      { name: "Torre de Belém", type: "Monumento histórico", link: "https://torrebelém.com" },
      { name: "Parque das Nações", type: "Parque", link: "https://parquedasnacoes.com" },
    ],
    safety: {
      tips: ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      vaccinations: ["Vacina contra hepatite A e B"],
    },
    itinerary: [
      { day: 1, activities: ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { day: 2, activities: ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] },
    ],
    reviews: [
      { user: "João", rating: 5, comment: "Viagem fantástica, recomendo muito a Lisboa!" },
      { user: "Maria", rating: 4, comment: "Excelente cidade, mas um pouco cara." },
    ],
    negativePoints: "Lorem Ipsun",

    // Campos adicionados para compatibilidade com Home.js
    likes: 10, // Valor inicial de curtidas
    comments: [], // Array inicial de comentários (vazio por padrão)
    privacy: 'public', // Privacidade padrão
    userProfilePicture: 'https://randomuser.me/api/portraits/men/1.jpg', // Foto de perfil placeholder
  },


  
];

export default travels;