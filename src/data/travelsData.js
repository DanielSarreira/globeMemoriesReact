const travels = [
  {
    id: 1,
    name: "Viagem a Andorra",
    user: "Tiago",
    category: ["Cidade", "Natureza"],
    country: "Andorra",
    city: "La Cortinada",
    price: 550,
    days: 20,
    transport: "Avião",
    startDate: "05-05-2025",
    endDate: "20-06-2025",
    highlightImage: require('../images/highlightImage/lacortinada.jpg'),
    views:100,
    priceDetails: {
      hotel: 100,  // Exemplo de preço do hotel
      flight: 300, // Exemplo de preço do voo
      food: 150,   // Exemplo de preço de alimentação
    },
    images: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg')
    ],
    images_generalInformation: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
    ],
    images_accommodations: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
    ],
    images_foodRecommendations: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
    ],
    images_referencePoints: [
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
      require('../images/highlightImage/lacortinada.jpg'),
    ],
    stars: 4,
    description: "Uma viagem incrível para explorar as montanhas de Portugal.",
    longDescription: "Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.Descrição longa da viagem A, com detalhes sobre os pontos turísticos visitados, comidas típicas e experiências única.",
    activities: ["Caminhada nas montanhas", "Passeio de barco", "Visita ao Castelo de São Jorge"],
    accommodations: [
      { "name": " Hotel Pestana", "type": "Hotel", "priceRange": "€€€", "link": "" }
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
      "usefulPhrases": ["Bom dia | ", "Obrigado | ", "Boa tarde? "]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ],
    negativePoints: "Lorem Ipsun",
  
  },
  
  
  {
    id: 2,
    name: "Viagem a Lisboa",
    user: "Daniel",
    category: ["Cidade", "Cultural"],
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


  {
    id: 8,
    name: "Viagem a Aveiro",
    user: "Luis07",
    category: ["Cidade", "Cultural"],
    country: "Portugal",
    city: "Aveiro",
    price: 70,
    days: 2,
    transport: "Carro",
    startDate: "15-02-2025",
    endDate: "16-02-2025",
    highlightImage: require('../images/highlightImage/aveiro.jpg'),
    views:100,
    priceDetails: {
      hotel: 30,  // Exemplo de preço do hotel
      flight: 10, // Exemplo de preço do voo
      food: 30,   // Exemplo de preço de alimentação
    },
  
    images_generalInformation: [
      require('../images/travels/aveiro1.jpg'),
      require('../images/travels/aveiro2.jpg'),
      require('../images/travels/aveiro3.jpg'),
      require('../images/travels/aveiro4.jpg'),
    ],
    images_accommodations: [
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
      { "name": " Hotel Pestana", "type": "Hotel", "priceRange": "€€€", "link": "" }
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
      "usefulPhrases": ["Bom dia | ", "Obrigado | ", "Boa tarde? "]
    },
    reviews: [
      { "user": "João", "rating": 5, "comment": "Viagem fantástica, recomendo muito a Lisboa!" },
      { "user": "Maria", "rating": 4, "comment": "Excelente cidade, mas um pouco cara." }
    ],
    negativePoints: "Lorem Ipsun",
  
  },


];

export default travels;
