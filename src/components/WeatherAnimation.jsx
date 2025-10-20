import React from 'react';

/**
 * WeatherAnimation Component
 * Renders dynamic weather-based animations in the weather current section
 * 
 * Maps weather icon components to animation types
 */
const WeatherAnimation = ({ weatherIconName, isDay }) => {
  const getAnimationType = () => {
    if (!weatherIconName) {
      return isDay ? 'clear' : 'night-clear';
    }
    
    // Direct mapping based on icon name strings
    switch (weatherIconName) {
      // Clear/Sunny
      case 'WiDaySunny':
        return 'clear';
      
      // Night clear
      case 'WiNightClear':
        return 'night-clear';
      
      // Night cloudy
      case 'WiNightCloudy':
        return 'night-cloudy';
      
      // Day cloudy (nublado com sol)
      case 'WiDayCloudy':
        return 'cloudy';
      
      // Cloudy (totalmente nublado, sem sol)
      case 'WiCloudy':
        return 'overcast';
      
      // Rain - TODAS as variações
      case 'WiRain':
        return 'rain';
      case 'WiDayRain':
        return 'rain';
      case 'WiNightRain':
        return 'rain';
      
      // Snow
      case 'WiSnow':
        return 'snow';
      
      // Fog
      case 'WiFog':
        return 'fog';
      
      // Thunderstorm
      case 'WiThunderstorm':
        return 'storm';
      
      // Wind
      case 'WiWindy':
        return 'wind';
      
      // Hail
      case 'WiDayHail':
        return 'hail';
      
      default:
        // Fallback with string matching
        const iconStr = String(weatherIconName).toLowerCase();
        if (iconStr.includes('rain')) return 'rain';
        if (iconStr.includes('sun') && iconStr.includes('day')) return 'clear';
        if (iconStr.includes('nightclear')) return 'night-clear';
        if (iconStr.includes('nightcloudy')) return 'night-cloudy';
        if (iconStr.includes('daycloudy')) return 'cloudy';
        if (iconStr.includes('cloud') && !iconStr.includes('day') && !iconStr.includes('night')) return 'overcast';
        if (iconStr.includes('cloud')) return 'cloudy';
        if (iconStr.includes('snow')) return 'snow';
        if (iconStr.includes('fog')) return 'fog';
        if (iconStr.includes('thunder')) return 'storm';
        if (iconStr.includes('wind')) return 'wind';
        if (iconStr.includes('hail')) return 'hail';
        return isDay ? 'clear' : 'night-clear';
    }
  };

  const animationType = getAnimationType();

  const renderAnimation = () => {
    switch (animationType) {
      case 'clear':
        return (
          <>
            <div className="sun"></div>
          </>
        );

      case 'cloudy':
        return (
          <>
            <div className="sun"></div>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
          </>
        );

      case 'overcast':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="cloud cloud-3"></div>
            <div className="cloud cloud-4"></div>
            <div className="cloud cloud-5"></div>
          </>
        );

      case 'night-cloudy':
        return (
          <>
            <div className="moon"></div>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="star"></div>
            ))}
          </>
        );

      case 'rain':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="rain-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="raindrop"></div>
              ))}
            </div>
          </>
        );

      case 'snow':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            {[...Array(15)].map((_, i) => (
              <div key={i} className="snowflake"></div>
            ))}
          </>
        );

      case 'wind':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="wind-gust"></div>
            ))}
          </>
        );

      case 'storm':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            <div className="lightning"></div>
            <div className="lightning"></div>
            {[...Array(20)].map((_, i) => (
              <div key={i} className="raindrop"></div>
            ))}
          </>
        );

      case 'fog':
        return (
          <>
            <div className="fog-layer"></div>
            <div className="fog-layer"></div>
            <div className="fog-layer"></div>
          </>
        );

      case 'hail':
        return (
          <>
            <div className="cloud cloud-1"></div>
            <div className="cloud cloud-2"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="hailstone"></div>
            ))}
          </>
        );

      case 'night-clear':
        return (
          <>
            <div className="moon"></div>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="star"></div>
            ))}
          </>
        );

      default:
        return <div className="sun"></div>;
    }
  };

  return (
    <div className={`weather-animation-bg weather-bg-${animationType}`}>
      {renderAnimation()}
    </div>
  );
};

export default WeatherAnimation;
