import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import App from '../App';

// Mock do service worker e geolocation
beforeAll(() => {
  // Mock navigator.geolocation
  global.navigator.geolocation = {
    getCurrentPosition: jest.fn(),
  };
});

describe('App Component', () => {
  it('renderiza sem crashes', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Verifica se não há erro ao renderizar
    expect(screen.queryByText(/erro crítico/i)).not.toBeInTheDocument();
  });

  it('contém elemento principal', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    );

    // Verifica se tem elemento main
    const mainElement = screen.getByRole('main', { hidden: true });
    expect(mainElement).toBeInTheDocument();
  });
});
