/**
 * magicDestinations.js — the curated list of "destino surpresa"
 * cities the user can be flown to when they tap the magic button.
 * Kept short (20 entries) on purpose — quality over quantity.
 */
export const MAGIC_DESTINATIONS = Object.freeze([
  { country: "Japão", city: "Tóquio", coordinates: [35.6762, 139.6503] },
  { country: "França", city: "Paris", coordinates: [48.8566, 2.3522] },
  { country: "Tailândia", city: "Banguecoque", coordinates: [13.7563, 100.5018] },
  { country: "Brasil", city: "Rio de Janeiro", coordinates: [-22.9068, -43.1729] },
  { country: "Islândia", city: "Reykjavik", coordinates: [64.1466, -21.9426] },
  { country: "Austrália", city: "Sydney", coordinates: [-33.8688, 151.2093] },
  { country: "Peru", city: "Cusco", coordinates: [-13.5319, -71.9675] },
  { country: "Marrocos", city: "Marraquexe", coordinates: [31.6295, -7.9811] },
  { country: "Indonésia", city: "Bali", coordinates: [-8.3405, 115.092] },
  { country: "Turquia", city: "Istambul", coordinates: [41.0082, 28.9784] },
  { country: "Grécia", city: "Santorini", coordinates: [36.3932, 25.4615] },
  { country: "Egito", city: "Cairo", coordinates: [30.0444, 31.2357] },
  { country: "China", city: "Pequim", coordinates: [39.9042, 116.4074] },
  { country: "Índia", city: "Nova Deli", coordinates: [28.7041, 77.1025] },
  { country: "Canadá", city: "Vancouver", coordinates: [49.2827, -123.1207] },
  { country: "Argentina", city: "Buenos Aires", coordinates: [-34.6118, -58.396] },
  { country: "Coreia do Sul", city: "Seul", coordinates: [37.5665, 126.978] },
  { country: "Vietname", city: "Ho Chi Minh", coordinates: [10.8231, 106.6297] },
  { country: "Nepal", city: "Katmandu", coordinates: [27.7172, 85.324] },
  { country: "Filipinas", city: "Manila", coordinates: [14.5995, 120.9842] },
]);

/** Pick a random destination. Pure (deterministic given a seed). */
export function pickRandomDestination(seed = Math.random()) {
  return MAGIC_DESTINATIONS[
    Math.floor(seed * MAGIC_DESTINATIONS.length) % MAGIC_DESTINATIONS.length
  ];
}
