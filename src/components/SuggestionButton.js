import React from 'react';
import { FaLightbulb } from 'react-icons/fa';
import '../styles/components/suggestion-button.css';

const SuggestionButton = ({ onClick }) => {
  return (
    <button 
      className="suggestion-button"
      onClick={onClick}
      title="Reportar erro ou sugerir melhoria"
      aria-label="Reportar erro ou sugerir melhoria"
    >
      <FaLightbulb className="suggestion-button-icon" />
      <span className="suggestion-button-tooltip">Feedback</span>
    </button>
  );
};

export default SuggestionButton;
