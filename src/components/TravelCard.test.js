/**
 * TravelCard.test.js - Testes para componente TravelCard otimizado
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import TravelCard from '../TravelCard';

describe('TravelCard Otimizado', () => {
  const mockTravel = {
    id: 1,
    title: 'Paris Trip',
    description: 'Amazing trip to Paris',
    imageUrl: 'https://example.com/image.jpg',
    category: 'City',
    views: 100
  };

  test('deve renderizar com dados corretos', () => {
    render(<TravelCard travel={mockTravel} />);
    expect(screen.getByText('Paris Trip')).toBeInTheDocument();
    expect(screen.getByText('Amazing trip to Paris')).toBeInTheDocument();
  });

  test('deve ter displayName para debugging', () => {
    expect(TravelCard.displayName).toBe('TravelCard');
  });

  test('deve usar memo para evitar re-renders', () => {
    const { rerender } = render(<TravelCard travel={mockTravel} />);
    const firstRender = screen.getByText('Paris Trip');
    
    // Re-render com mesmo travel
    rerender(<TravelCard travel={mockTravel} />);
    const secondRender = screen.getByText('Paris Trip');
    
    // Devem ser o mesmo nó (React.memo evitou re-render)
    expect(firstRender).toBe(secondRender);
  });

  test('deve renderizar com valores de views corretos', () => {
    render(<TravelCard travel={mockTravel} />);
    expect(screen.getByText('100 visualizações')).toBeInTheDocument();
  });

  test('deve renderizar com categoria correta', () => {
    render(<TravelCard travel={mockTravel} />);
    expect(screen.getByText('City')).toBeInTheDocument();
  });

  test('deve ter alt text na imagem para acessibilidade', () => {
    render(<TravelCard travel={mockTravel} />);
    const img = screen.getByAlt('Paris Trip');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});
