import React from 'react';

/**
 * WeatherAnimation Component
 * Renders dynamic weather-based animations based on weather condition and time of day
 * 
 * All animations have both DAY and NIGHT variants
 */
const WeatherAnimation = ({ weatherIconName, isDay }) => {
  const getAnimationType = () => {
    if (!weatherIconName) {
      return isDay ? 'clear' : 'clear-night';
    }
    
    const iconStr = String(weatherIconName).toLowerCase();
    
    // Mapear para tipo de animação + adicionar sufixo -night se for noite
    let baseType = 'clear';
    
    switch (weatherIconName) {
      case 'WiDaySunny':
      case 'WiNightClear':
        baseType = 'clear';
        break;
      case 'WiDayCloudy':
      case 'WiNightCloudy':
        baseType = 'cloudy';
        break;
      case 'WiCloudy':
        baseType = isDay ? 'cloudy' : 'cloudy';
        break;
      case 'WiRain':
      case 'WiDayRain':
      case 'WiNightRain':
        baseType = 'rain';
        break;
      case 'WiSnow':
        baseType = 'snow';
        break;
      case 'WiFog':
        baseType = 'fog';
        break;
      case 'WiThunderstorm':
        baseType = 'storm';
        break;
      case 'WiWindy':
        baseType = 'wind';
        break;
      case 'WiDayHail':
        baseType = 'hail';
        break;
      default:
        if (iconStr.includes('rain')) baseType = 'rain';
        else if (iconStr.includes('snow')) baseType = 'snow';
        else if (iconStr.includes('fog')) baseType = 'fog';
        else if (iconStr.includes('thunder')) baseType = 'storm';
        else if (iconStr.includes('wind')) baseType = 'wind';
        else if (iconStr.includes('hail')) baseType = 'hail';
        else if (iconStr.includes('cloud')) baseType = 'cloudy';
        else baseType = 'clear';
    }
    
    // Adicionar sufixo -night se for noite
    return isDay ? baseType : `${baseType}-night`;
  };

  const animationType = getAnimationType();

  const renderAnimation = () => {
    // Renderização para DIA
    if (isDay) {
      switch (animationType) {
        case 'clear':
          return <><div className="sun"></div></>;

        case 'cloudy':
          return (
            <>
              <div className="sun"></div>
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>
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

        default:
          return <div className="sun"></div>;
      }
    }

    // Renderização para NOITE
    else {
      switch (animationType) {
        case 'clear-night':
          return (
            <>
              <div className="moon"></div>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="star"></div>
              ))}
            </>
          );

        case 'cloudy-night':
          return (
            <>
              <div className="moon"></div>
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              <div className="cloud cloud-3"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="star"></div>
              ))}
            </>
          );

        case 'rain-night':
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

        case 'snow-night':
          return (
            <>
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              {[...Array(15)].map((_, i) => (
                <div key={i} className="snowflake"></div>
              ))}
            </>
          );

        case 'wind-night':
          return (
            <>
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="wind-gust"></div>
              ))}
            </>
          );

        case 'storm-night':
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

        case 'fog-night':
          return (
            <>
              <div className="fog-layer"></div>
              <div className="fog-layer"></div>
              <div className="fog-layer"></div>
            </>
          );

        case 'hail-night':
          return (
            <>
              <div className="cloud cloud-1"></div>
              <div className="cloud cloud-2"></div>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="hailstone"></div>
              ))}
            </>
          );

        default:
          return (
            <>
              <div className="moon"></div>
              {[...Array(10)].map((_, i) => (
                <div key={i} className="star"></div>
              ))}
            </>
          );
      }
    }
  };

  return (
    <div className={`weather-animation-bg weather-bg-${animationType}`}>
      {renderAnimation()}
    </div>
  );
};

export default WeatherAnimation;
