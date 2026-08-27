import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Star } from 'lucide-react';

/**
 * StarRating — interactive star picker.
 *
 * Uses lucide-react Star icons (filled/outlined) instead of react-icons/fa.
 * Controlled component: supply `rating` (0–maxStars) and `onRatingChange`.
 */
const StarRating = ({ rating = 0, onRatingChange, maxStars = 5, size = 32 }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (starValue) => {
    if (onRatingChange) onRatingChange(starValue);
  };

  const handleMouseEnter = (starValue) => {
    setHoverRating(starValue);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div
      className="gm-stars"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        margin: '10px 0',
        width: '100%',
        flexWrap: 'wrap',
      }}
    >
      {[...Array(maxStars)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverRating || rating);
        return (
          <button
            key={index}
            type="button"
            className="gm-stars__btn"
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            aria-label={`${starValue} estrela${starValue > 1 ? 's' : ''}`}
            style={{
              cursor: 'pointer',
              background: 'none',
              border: 0,
              padding: 0,
              lineHeight: 1,
              transition: 'transform 0.15s ease, filter 0.15s ease',
            }}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              fill={isFilled ? '#FFC107' : 'none'}
              color={isFilled ? '#FFC107' : '#D1D5DB'}
              style={{
                display: 'block',
                filter: isFilled
                  ? 'drop-shadow(0 2px 4px rgba(255, 193, 7, 0.5))'
                  : 'none',
                transition: 'color 0.15s ease, fill 0.15s ease',
              }}
            />
          </button>
        );
      })}
    </div>
  );
};

StarRating.propTypes = {
  rating: PropTypes.number,
  onRatingChange: PropTypes.func,
  maxStars: PropTypes.number,
  size: PropTypes.number,
};

export default StarRating;