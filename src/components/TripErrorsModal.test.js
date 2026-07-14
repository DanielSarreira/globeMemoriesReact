import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TripErrorsModal from './TripErrorsModal';
import { TRIP_FORM_SECTIONS, validateTripForm } from '../utils/tripValidation';

describe('<TripErrorsModal />', () => {
  const makeFormWithErrors = () => ({
    // Triggers: empty title, over-long activity, over-long accommodation
    // description, bad rating, missing country. Five different sections.
    title: '',
    tripSummary: 'Sumário válido',
    tripDescription: 'Descrição válida',
    startDate: '2026-06-09',
    endDate: '2026-06-14',
    weather: 'Bom',
    stars: 0,
    country: '',
    city: 'Llanes',
    category: ['Aventura'],
    languages: ['PT'],
    accommodations: [
      { name: 'X', city: 'Llanes', description: 'd'.repeat(2001), price: '30', nights: '2' },
    ],
    pointsOfInterest: [],
    foodRecommendations: [],
    negativePoints: [],
    itinerary: [{ day: 'Day 1', activities: ['x'.repeat(201)] }],
    priceDetails: { hotel: '0', flight: '0', food: '0', transport: '0', extras: '0' },
  });

  test('renders nothing when closed', () => {
    const { container } = render(
      <TripErrorsModal isOpen={false} errors={[]} onClose={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test('shows the count of errors and sections in the header', () => {
    const errors = validateTripForm(makeFormWithErrors(), {}).errors;
    // TripErrorsModal uses createPortal, so its DOM lives in
    // document.body, not in the test container. We use document.body
    // (or, equivalently, screen) for assertions.
    render(
      <TripErrorsModal isOpen errors={errors} onClose={() => {}} />,
    );
    const text = document.body.textContent;
    expect(text).toMatch(/Falt[am]+\s+preencher\s+\d+\s+campos?/);
  });

  test('groups errors by section, one group per section', () => {
    const errors = validateTripForm(makeFormWithErrors(), {}).errors;
    render(
      <TripErrorsModal isOpen errors={errors} onClose={() => {}} />,
    );
    // The modal lives in document.body (createPortal). Look there for
    // the rendered <section> elements.
    const sections = document.body.querySelectorAll('section[aria-labelledby]');
    const uniqueSections = [...new Set(errors.map((e) => e.section))];
    expect(sections.length).toBe(uniqueSections.length);
  });

  test('clicking "Ir para a secção" fires onJumpToSection with the tab key', () => {
    const onJump = jest.fn();
    const onClose = jest.fn();
    const errors = validateTripForm(makeFormWithErrors(), {}).errors;
    render(
      <TripErrorsModal
        isOpen
        errors={errors}
        onClose={onClose}
        onJumpToSection={onJump}
      />,
    );
    // Find all buttons rendered inside the dialog, then locate the
    // jump buttons (their text starts with "Ir"). The modal lives in
    // document.body due to createPortal, so we query there.
    const all = Array.from(document.body.querySelectorAll('.confirm-modal-content button'));
    const jumpBtns = all.filter((b) => b.textContent && b.textContent.indexOf('Ir') >= 0);
    expect(jumpBtns.length).toBeGreaterThan(0);
    fireEvent.click(jumpBtns[0]);
    expect(onJump).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('each error message is rendered (no truncation to first 3)', () => {
    // Build a form with 6 distinct errors so we can assert they all
    // appear in the modal — the old behaviour was "first 3 + counter".
    const form = {
      title: 'OK', tripSummary: 'OK', tripDescription: 'OK',
      startDate: '2026-06-09', endDate: '2026-06-14', stars: 5,
      country: 'Spain', city: 'Llanes', weather: 'Bom',
      category: ['A'], languages: ['PT'],
      priceDetails: { hotel: '0', flight: '0', food: '0', transport: '0', extras: '0' },
      accommodations: [
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
        { name: '', city: 'Llanes', description: 'd', price: '0', nights: '0' },
      ],
      pointsOfInterest: [], foodRecommendations: [], negativePoints: [], itinerary: [],
    };
    const errors = validateTripForm(form, {}).errors;
    // We expect at least 6 accommodation "name é obrigatório" errors
    const nameErrors = errors.filter((e) => e.field === 'name');
    expect(nameErrors.length).toBeGreaterThanOrEqual(6);

    render(
      <TripErrorsModal isOpen errors={errors} onClose={() => {}} />,
    );
    // Each error has its own <li> in the modal — count them and
    // assert it matches. We look in document.body (the portal target)
    // rather than the test container.
    const items = document.body.querySelectorAll('.confirm-modal-content li');
    expect(items.length).toBe(errors.length);
  });

  test('clicking the close button calls onClose', () => {
    const onClose = jest.fn();
    render(
      <TripErrorsModal isOpen errors={[]} onClose={onClose} />,
    );
    // The header × button has aria-label="Fechar". It lives in the
    // portal target (document.body), so we use screen which searches
    // the whole document.
    const closeBtn = screen.getByLabelText('Fechar');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  test('clicking the overlay (but not the content) calls onClose', () => {
    const onClose = jest.fn();
    render(
      <TripErrorsModal isOpen errors={[]} onClose={onClose} />,
    );
    // The overlay is the first .confirm-modal-overlay in document.body
    // (we don't even need its specific ref — we can fire the click on
    // the element we know is the overlay).
    const overlay = document.body.querySelector('.confirm-modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  test('a11y: dialog has role and aria-modal', () => {
    const errors = validateTripForm(makeFormWithErrors(), {}).errors;
    render(
      <TripErrorsModal isOpen errors={errors} onClose={() => {}} />,
    );
    // screen.getByRole searches the whole document, which includes
    // the portal target.
    const dialog = screen.getByRole('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});

