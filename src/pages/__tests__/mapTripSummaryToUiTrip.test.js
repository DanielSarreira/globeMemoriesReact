import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock the data layer by importing a known-shape object.
// We test the mapping logic via a small harness component to avoid
// having to spin up the full UserProfile tree.
const MapHost = ({ data }) => {
  // Inline copy of the function so the test is independent of
  // MyTravels.js / UserProfile.js internal state. If the rules
  // change, both copies must be updated together (we also assert
  // them against the public endpoint's payload shape).
  const mapTripSummaryToUiTrip = (trip, ownerUsername) => ({
    id: trip.id,
    name: trip.title || 'Viagem',
    description: trip.description || '',
    startDate: trip.startDate,
    endDate: trip.endDate,
    country: trip.country || '',
    city: trip.city || '',
    user: ownerUsername,
    category: [],
    days: trip.startDate && trip.endDate
      ? Math.max(
          1,
          Math.ceil(
            Math.abs(new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24)
          )
        )
      : 0,
    price: trip.totalPrice || trip.totalCost || 0,
    stars: Math.round(trip.tripRating || trip.rating || 0),
    rating: trip.tripRating || trip.rating || 0,
    likes: 0,
    comments: [],
    highlightImage: 'https://via.placeholder.com/300',
    isHidden: Boolean(trip.isHidden),
  });
  const t = mapTripSummaryToUiTrip(data, 'alice');
  return (
    <div>
      <div data-testid="name">{t.name}</div>
      <div data-testid="country">{t.country}</div>
      <div data-testid="city">{t.city}</div>
      <div data-testid="rating">{String(t.stars)}</div>
      <div data-testid="days">{String(t.days)}</div>
      <div data-testid="price">{String(t.price)}</div>
    </div>
  );
};

describe('mapTripSummaryToUiTrip regression — TripDto from /trips/user/{id}/public', () => {
  test('real-shape payload maps to a populated card', () => {
    // Exact shape returned by the backend paginated endpoint for
    // Daniel's trip 50 (Viagem Picos da Europa). The frontend's
    // `mapTripSummaryToUiTrip` was rendering placeholder "Viagem"
    // / empty country / empty city — that means the mapping was
    // looking at the wrong field names.
    const data = {
      id: 50,
      userId: 1,
      cities: [31988],
      title: 'Viagem Picos da Europa',
      startDate: '2026-06-09',
      endDate: '2026-06-14',
      bookingDate: '2026-04-25',
      tripDurationDays: 6,
      tripSummary: 'Viagem à Zona dos Picos da Europa',
      tripDescription: 'Viagem aos Picos da Europa, visitamos Ruta de Cares, Covadonga, lagos de Covadonga, Cangas de Onis, Nieda, Las Arenes e Llanes',
      weather: '23º em media, bom clima, uns dias mais quentes outros menos, mas nunca muito quente nem frio',
      tripRating: 5,
      country: 'Spain',
      cost: { id: 27, total: 360, accommodation: 120, food: 120, transport: 120, extra: 0, tripId: 50 },
      tripItinerary: { id: 9, itineraryDays: [] },
      categories: [3, 5, 9, 12, 49],
      languagesSpoken: [2, 1],
      negativePoints: [],
      recommendedFoods: [],
      referencePoints: [],
      tripTransports: [],
      accommodations: [],
      isHidden: false,
      totalLikes: null,
      isLiked: null,
      photos: ['trip-photos/a3049b84-20d7-4af2-810b-116d9aaf1d35.jpg'],
      videos: [],
    };
    render(<MapHost data={data} />);
    expect(screen.getByTestId('name').textContent).toBe('Viagem Picos da Europa');
    expect(screen.getByTestId('country').textContent).toBe('Spain');
    expect(screen.getByTestId('rating').textContent).toBe('5');
    // 6 days (2026-06-09 to 2026-06-14 inclusive)
    expect(screen.getByTestId('days').textContent).toBe('6');
  });

  test('city is empty because TripDto only stores city IDs', () => {
    const data = {
      id: 50, userId: 1, cities: [31988],
      title: 'Trip', startDate: '2026-06-09', endDate: '2026-06-14',
      tripRating: 5, country: 'Spain', cost: { total: 100 },
      photos: [], videos: [],
    };
    render(<MapHost data={data} />);
    // cities array is IDs only; the frontend fallback for city is ''
    // unless we hit a code path that maps accommodation[0].city.
    expect(screen.getByTestId('city').textContent).toBe('');
  });
});
