# Backend Categories - Emoji Mapping Update

**Date:** May 9, 2026  
**Purpose:** Update all category icons to return emojis directly instead of emoji codes

---

## Complete Category to Emoji Mapping

### Request to Backend Team:
Update the `/categories`, `/trips/public-feed`, `/trips/following-feed`, and `/trips/{id}` endpoints to return the `icon` field with emojis instead of emoji codes.

---

## Category List with Emoji Mapping

| # | Category Name (Portuguese) | Emoji | Icon Code (Current) | Note |
|---|---------------------------|-------|-------------------|------|
| 1 | Natureza | 🌿 | `:herb:` | Nature/Hiking |
| 2 | Praia | 🏖️ | `:beach:` | Beach Tourism |
| 3 | Aventura | 🧗 | `:person_climbing:` | Adventure Sports |
| 4 | Cultural | 🏛️ | `:classical_building:` | Cultural Sites |
| 5 | Histórico | 🏰 | `:castle:` | Historical Places |
| 6 | Cidade | 🌆 | `:city_dusk:` | Urban Tourism |
| 7 | Gastronomia | 🍽️ | `:fork_and_knife:` | Food & Culinary |
| 8 | Cruzeiros | 🚢 | `:ship:` | Cruises |
| 9 | Campismo | ⛺ | `:tent:` | Camping |
| 10 | Montanha | 🏔️ | `:mountain:` | Mountain Trips |
| 11 | Praias Paradisiacas | 🏝️ | `:desert_island:` | Paradise Beaches |
| 12 | Praias Fluviais | 🏞️ | `:national_park:` | River/Lake Beaches |
| 13 | Relaxamento | 🌞 | `:sun_with_face:` | Relaxation |
| 14 | Safari | 🦁 | `:lion:` | Safari Tours |
| 15 | Road Trips | 🚗 | `:motor_car:` | Road Trips |
| 16 | Ilhas | 🏝️ | `:desert_island:` | Island Hopping |
| 17 | Família | 👨‍👩‍👧‍👦 | `:family:` | Family Travel |
| 18 | Viagens de Luxo | 💎 | `:gem:` | Luxury Travel |
| 19 | Viagens a Solo | 🧑 | `:person:` | Solo Travel |
| 20 | Viagens de Bem-Estar | 🧘 | `:person_in_lotus_position:` | Wellness Travel |
| 21 | Exótica | 🦜 | `:parrot:` | Exotic Destinations |
| 22 | Turismo Sustentável | 🌱 | `:seedling:` | Sustainable Tourism |
| 23 | Turismo de Aventura | 🧗 | `:person_climbing:` | Adventure Tourism |
| 24 | Retiros Espirituais | ⛪ | `:church:` | Spiritual Retreats |
| 25 | Eco-turismo | 🌿 | `:herb:` | Eco-Tourism |
| 26 | Aventura ao Ar Livre | 🏕️ | `:camping:` | Outdoor Adventure |
| 27 | Fotografia | 📷 | `:camera:` | Photography Tours |
| 28 | Zona Rural | 🚜 | `:tractor:` | Rural Tourism |
| 29 | Voluntariado | 💪 | `:flexed_biceps:` | Volunteer Work |
| 30 | Turismo Religioso | 🙏 | `:prayer_beads:` | Religious Tourism |
| 31 | Caminhadas | 🥾 | `:hiking_boot:` | Hiking |
| 32 | Festivais | 🎉 | `:partying_face:` | Festivals & Events |
| 33 | Locais Históricos | 🏛️ | `:classical_building:` | Historical Sites |
| 34 | Aventura Extrema | 🪂 | `:parachute:` | Extreme Sports |
| 35 | Desertos | 🏜️ | `:desert:` | Desert Tourism |
| 36 | Aventuras Urbanas | 🏙️ | `:cityscape:` | Urban Adventures |
| 37 | Românticas | 💕 | `:two_hearts:` | Romantic Getaways |
| 38 | Mobilidade Reduzida | ♿ | `:wheelchair:` | Accessible Travel |
| 39 | Viagens a Dois | 👫 | `:couple_with_heart:` | Couple Travel |
| 40 | Experiências Gastronômicas | 🍷 | `:wine_glass:` | Gastronomy Experience |
| 41 | Turismo Subaquático | 🤿 | `:diving_mask:` | Underwater Tourism |
| 42 | Festas e Eventos | 🎊 | `:confetti_ball:` | Parties & Events |
| 43 | Viagens Personalizadas | 🎁 | `:gift:` | Customized Travel |
| 44 | Viagens de Compras | 🛍️ | `:shopping_bags:` | Shopping Trips |

---

## SQL UPDATE Script (Optional - if backend uses database)

```sql
UPDATE categories SET icon = '🌿' WHERE name = 'Natureza';
UPDATE categories SET icon = '🏖️' WHERE name = 'Praia';
UPDATE categories SET icon = '🧗' WHERE name = 'Aventura';
UPDATE categories SET icon = '🏛️' WHERE name = 'Cultural';
UPDATE categories SET icon = '🏰' WHERE name = 'Histórico';
UPDATE categories SET icon = '🌆' WHERE name = 'Cidade';
UPDATE categories SET icon = '🍽️' WHERE name = 'Gastronomia';
UPDATE categories SET icon = '🚢' WHERE name = 'Cruzeiros';
UPDATE categories SET icon = '⛺' WHERE name = 'Campismo';
UPDATE categories SET icon = '🏔️' WHERE name = 'Montanha';
UPDATE categories SET icon = '🏝️' WHERE name = 'Praias Paradisiacas';
UPDATE categories SET icon = '🏞️' WHERE name = 'Praias Fluviais';
UPDATE categories SET icon = '🌞' WHERE name = 'Relaxamento';
UPDATE categories SET icon = '🦁' WHERE name = 'Safari';
UPDATE categories SET icon = '🚗' WHERE name = 'Road Trips';
UPDATE categories SET icon = '🏝️' WHERE name = 'Ilhas';
UPDATE categories SET icon = '👨‍👩‍👧‍👦' WHERE name = 'Família';
UPDATE categories SET icon = '💎' WHERE name = 'Viagens de Luxo';
UPDATE categories SET icon = '🧑' WHERE name = 'Viagens a Solo';
UPDATE categories SET icon = '🧘' WHERE name = 'Viagens de Bem-Estar';
UPDATE categories SET icon = '🦜' WHERE name = 'Exótica';
UPDATE categories SET icon = '🌱' WHERE name = 'Turismo Sustentável';
UPDATE categories SET icon = '🧗' WHERE name = 'Turismo de Aventura';
UPDATE categories SET icon = '⛪' WHERE name = 'Retiros Espirituais';
UPDATE categories SET icon = '🌿' WHERE name = 'Eco-turismo';
UPDATE categories SET icon = '🏕️' WHERE name = 'Aventura ao Ar Livre';
UPDATE categories SET icon = '📷' WHERE name = 'Fotografia';
UPDATE categories SET icon = '🚜' WHERE name = 'Zona Rural';
UPDATE categories SET icon = '💪' WHERE name = 'Voluntariado';
UPDATE categories SET icon = '🙏' WHERE name = 'Turismo Religioso';
UPDATE categories SET icon = '🥾' WHERE name = 'Caminhadas';
UPDATE categories SET icon = '🎉' WHERE name = 'Festivais';
UPDATE categories SET icon = '🏛️' WHERE name = 'Locais Históricos';
UPDATE categories SET icon = '🪂' WHERE name = 'Aventura Extrema';
UPDATE categories SET icon = '🏜️' WHERE name = 'Desertos';
UPDATE categories SET icon = '🏙️' WHERE name = 'Aventuras Urbanas';
UPDATE categories SET icon = '💕' WHERE name = 'Românticas';
UPDATE categories SET icon = '♿' WHERE name = 'Mobilidade Reduzida';
UPDATE categories SET icon = '👫' WHERE name = 'Viagens a Dois';
UPDATE categories SET icon = '🍷' WHERE name = 'Experiências Gastronômicas';
UPDATE categories SET icon = '🤿' WHERE name = 'Turismo Subaquático';
UPDATE categories SET icon = '🎊' WHERE name = 'Festas e Eventos';
UPDATE categories SET icon = '🎁' WHERE name = 'Viagens Personalizadas';
UPDATE categories SET icon = '🛍️' WHERE name = 'Viagens de Compras';
```

---

## JSON Format Example

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Natureza",
      "icon": "🌿"
    },
    {
      "id": 2,
      "name": "Praia",
      "icon": "🏖️"
    },
    {
      "id": 3,
      "name": "Aventura",
      "icon": "🧗"
    }
  ]
}
```

---

## Endpoints to Update

1. **GET `/categories`**
   - Returns all categories with emojis

2. **GET `/trips/public-feed`**
   - Categories inside trip objects should have emojis

3. **GET `/trips/following-feed`**
   - Categories inside trip objects should have emojis

4. **GET `/trips/{id}`**
   - Categories inside trip object should have emojis

---

## Implementation Notes

- ✅ All emoji codes are Unicode standard emojis
- ✅ Compatible with all modern browsers
- ✅ No external library needed on backend
- ✅ Simplifies frontend code (no mapping needed)
- ✅ Works across all platforms (Web, Mobile, etc.)

**Send this file to your backend team for implementation!**
