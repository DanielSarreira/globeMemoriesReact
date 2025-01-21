const travels = [
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
    highlightImage: require('../images/highlightImage/lacortinada.jpg'),
    views:100,
    images: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
    
    
  },
  
  
  {
    id: 2,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },

 {
    id: 3,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },

  

  {
    id: 4,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },


  {
    id: 5,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },

  {
    id: 6,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },

  {
    id: 7,
    name: "Viagem a Torres Vedras",
    user: "Daniel",
    category: ["Aventura", "Natureza"],
    country: "Portugal",
    city: "Lisboa",
    price: 50,
    days: 1,
    transport: "Carro, Avião",
    startDate: "2024-12-01",
    endDate: "2024-12-03",
    highlightImage: require('../images/highlightImage/praia.jpg'),
    images: [
      require('../images/highlightImage/praia.jpg'),
      require('../images/highlightImage/praia.jpg'),
      require('../images/banners/home.jpg')
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências únicas.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": "Hotel XYZ", "type": "Hotel", "priceRange": "€€€", "link": "https://hotelxyz.com" }
    ],
    foodRecommendations: [
      { "dish": "Bacalhau à Brás", "restaurant": "Restaurante ABC", "link": "https://restauranteabc.com" }
    ],
    climate: {
      "averageTemperature": "15°C",
      "bestTimeToVisit": "Primavera e Outono"
    },
    pointsOfInterest: [
      { "name": "Torre de Belém", "type": "Monumento histórico", "link": "https://torrebelém.com" },
      { "name": "Parque das Nações", "type": "Parque", "link": "https://parquedasnacoes.com" }
    ],
    safety: {
      "tips": ["Evitar zonas desertas à noite", "Manter objetos de valor no hotel"],
      "vaccinations": ["Vacina contra hepatite A e B"]
    },
    itinerary: [
      { "day": 1, "activities": ["Chegada a Lisboa", "Visita ao Castelo de São Jorge", "Jantar em restaurante local"] },
      { "day": 2, "activities": ["Passeio de barco no rio Tejo", "Almoço na Praça do Comércio"] }
    ],
    localTransport: [
      { "type": "Metrô", "station": "Estação Baixa-Chiado", "link": "https://metrolisboa.pt" },
      { "type": "Ônibus", "line": "Linha 28", "link": "https://carris.pt" }
    ],
    languageAndCulture: {
      "language": "Português",
      "usefulPhrases": ["Bom dia", "Onde fica a estação de metrô?", "Quanto custa?"]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ]
  },


];

export default travels;
