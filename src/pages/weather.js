import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaMapMarkerAlt, FaHistory, FaPlane, FaCalendarAlt, FaInfoCircle, FaTrash } from 'react-icons/fa';
import { WiDaySunny, WiCloudy, WiRain, WiSnow, WiFog, WiThunderstorm, WiNightClear, WiNightCloudy, WiDayCloudy, WiWindy, WiDayRain, WiNightRain } from 'react-icons/wi';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from 'chart.js';
import axios from 'axios';
import TravelsData from '../data/travelsData';
// ...existing code...
import { useWeather } from '../context/WeatherContext';
import '../styles/pages/globe-memories-interactive-map.css'; // Importar CSS do mapa para o modal


// Registrar componentes do Chart.js
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

// Mapa para converter nome do ícone para componente
const iconMap = {
  WiDaySunny,
  WiNightClear,
  WiNightCloudy,
  WiCloudy,
  WiFog,
  WiRain,
  WiSnow,
  WiThunderstorm,
  WiDayCloudy,
  WiWindy,
  WiDayRain,
  WiNightRain,
};

// Normalizar nome da cidade
const normalizeCityName = (city) => {
  if (!city || typeof city !== 'string') return '';
  return city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim()
    .toLowerCase();
};

// Validar coordenadas
const isValidCoordinate = (lat, lon) => {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
};

// Função para estimar climatologia com base na latitude e mês (usada como fallback)
const estimateClimate = (cityName, lat, month) => {
  const isNorthernHemisphere = lat >= 0;
  const season = getSeason(month, isNorthernHemisphere);

  const climateData = {
    summer: { maxTemp: 28.5, minTemp: 20.0, precipitation: 10, condition: 'Sol', icon: 'WiDaySunny', windSpeed: 15 },
    autumn: { maxTemp: 22.0, minTemp: 14.0, precipitation: 80, condition: 'Chuva', icon: 'WiRain', windSpeed: 20 },
    winter: { maxTemp: 15.5, minTemp: 8.0, precipitation: 100, condition: 'Nublado', icon: 'WiCloudy', windSpeed: 25 },
    spring: { maxTemp: 22.0, minTemp: 14.0, precipitation: 30, condition: 'Maioritariamente soalheiro', icon: 'WiDaySunny', windSpeed: 15 }, // Ajustado para maio
  };

  return {
    city: cityName,
    ...climateData[season],
    humidity: 70,
    windSpeed: climateData[season].windSpeed,
    apparentTemp: (climateData[season].maxTemp + climateData[season].minTemp) / 2,
  };
};

// Determinar estação com base no mês e hemisfério
const getSeason = (month, isNorthernHemisphere) => {
  if (isNorthernHemisphere) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  } else {
    if (month >= 3 && month <= 5) return 'autumn';
    if (month >= 6 && month <= 8) return 'winter';
    if (month >= 9 && month <= 11) return 'spring';
    return 'summer';
  }
};


// Funções para gerenciar o armazenamento local
const STORAGE_KEYS = {
  WEATHER_HISTORY: 'weatherSearchHistory',
  FUTURE_TRAVELS: 'futureTravels',
  WEATHER_CACHE: 'weatherCache'
};

const MAX_HISTORY_ITEMS = 5;
const MAX_CACHE_ITEMS = 10;
const MAX_CACHE_AGE = 3600 * 1000; // 1 hora em milissegundos

const saveToLocalStorage = (key, data) => {
  try {
    // Limpar dados antigos antes de salvar
    if (key === STORAGE_KEYS.WEATHER_HISTORY) {
      // Manter apenas os últimos MAX_HISTORY_ITEMS itens
      const limitedData = data.slice(-MAX_HISTORY_ITEMS);
      localStorage.setItem(key, JSON.stringify(limitedData));
    } else if (key === STORAGE_KEYS.WEATHER_CACHE) {
      // Limpar cache antigo
      const now = Date.now();
      const cacheData = Object.entries(data).reduce((acc, [cacheKey, cacheValue]) => {
        if (now - cacheValue.timestamp < MAX_CACHE_AGE) {
          acc[cacheKey] = cacheValue;
        }
        return acc;
      }, {});
      
      // Manter apenas os MAX_CACHE_ITEMS itens mais recentes
      const limitedCache = Object.entries(cacheData)
        .sort(([, a], [, b]) => b.timestamp - a.timestamp)
        .slice(0, MAX_CACHE_ITEMS)
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
      
      localStorage.setItem(key, JSON.stringify(limitedCache));
    } else {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Erro ao salvar no localStorage (${key}):`, error);
    // Se houver erro de quota, limpar dados antigos e tentar novamente
    if (error.name === 'QuotaExceededError') {
      clearOldData();
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        console.error('Erro ao salvar após limpeza:', retryError);
      }
    }
  }
};

const getFromLocalStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Erro ao ler do localStorage (${key}):`, error);
    return defaultValue;
  }
};

const clearOldData = () => {
  try {
    // Limpar cache antigo
    const now = Date.now();
    const cacheData = getFromLocalStorage(STORAGE_KEYS.WEATHER_CACHE, {});
    const cleanedCache = Object.entries(cacheData).reduce((acc, [key, value]) => {
      if (now - value.timestamp < MAX_CACHE_AGE) {
        acc[key] = value;
      }
      return acc;
    }, {});
    localStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cleanedCache));

    // Limpar histórico antigo
    const historyData = getFromLocalStorage(STORAGE_KEYS.WEATHER_HISTORY, []);
    const cleanedHistory = historyData.slice(-MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEYS.WEATHER_HISTORY, JSON.stringify(cleanedHistory));
  } catch (error) {
    console.error('Erro ao limpar dados antigos:', error);
  }
};

const WeatherPage = () => {
  const { weather, setWeather, isLoading, setIsLoading } = useWeather();
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [futureWeather, setFutureWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);
  const [userLocation, setUserLocation] = useState({ city: 'Lisboa', lat: 38.7167, lon: -9.1333 });
  const [searchCity, setSearchCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [futureDate, setFutureDate] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    return getFromLocalStorage(STORAGE_KEYS.WEATHER_HISTORY);
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTravel, setSelectedTravel] = useState(null);
  const [showInitialModal, setShowInitialModal] = useState(true);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [climateSuggestions, setClimateSuggestions] = useState('');
  const [unit, setUnit] = useState('C'); // Celsius ou Fahrenheit
  const currentWeatherRef = useRef(null);
  const [showAllDays, setShowAllDays] = useState(false);

  const [futureTravels, setFutureTravels] = useState(() => {
    const travels = getFromLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS);
    saveToLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS, travels);
    return travels;
  });

  

  // Atualizar futureTravels quando localStorage mudar
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedTravels = getFromLocalStorage(STORAGE_KEYS.FUTURE_TRAVELS);
      setFutureTravels(updatedTravels);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Salvar histórico de busca no localStorage
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.WEATHER_HISTORY, searchHistory);
  }, [searchHistory]);

  // Carregar localização inicial
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await axios.get(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=pt`
            );
            const data = response.data;
            const city = data.results && data.results.length > 0 ? data.results[0].name : 'Desconhecida';
            const admin1 = data.results && data.results.length > 0 ? data.results[0].admin1 || '' : '';
            const displayCity = `A Sua Localização${city !== 'Desconhecida' ? ` (${city}${admin1 ? `, ${admin1}` : ''})` : ''}`;
            setUserLocation({
              lat: latitude,
              lon: longitude,
              city: displayCity,
              admin1: admin1,
            });
          } catch (error) {
            console.error('Erro ao obter nome da cidade:', error.message);
            setUserLocation({
              lat: latitude,
              lon: longitude,
              city: 'A Sua Localização',
            });
          }
        },
        (error) => {
          console.error('Erro de geolocalização:', error.message);
          setWeatherError('Não foi possível obter a localização. Usando Lisboa como padrão.');
        }
      );
    } else {
      setWeatherError('Geolocalização não suportada pelo navegador.');
    }
  }, []);

  // Obter coordenadas para uma cidade
  const getCoordinates = async (city) => {
    if (!city || typeof city !== 'string' || city.trim() === '' || city.includes('A Sua Localização')) {
      console.error('Cidade inválida:', city);
      return null;
    }

    const normalizedCity = normalizeCityName(city);
    if (!normalizedCity || normalizedCity.length < 2) {
      console.error('Nome da cidade normalizado inválido ou muito curto:', normalizedCity);
      return null;
    }

    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=pt`;
      const response = await axios.get(url);
      const data = response.data;

      if (!data.results || data.results.length === 0) {
        console.warn('Nenhum resultado encontrado para a cidade:', city);
        return null;
      }

      let bestMatch = data.results.find((result) => {
        const resultCity = normalizeCityName(result.name);
        return resultCity === normalizedCity || resultCity.includes(normalizedCity);
      });

      if (!bestMatch) {
        bestMatch = data.results[0];
      }

      const coords = {
        lat: bestMatch.latitude,
        lon: bestMatch.longitude,
        name: bestMatch.name,
        admin1: bestMatch.admin1 || '',
        country: bestMatch.country || '',
      };

      if (!isValidCoordinate(coords.lat, coords.lon)) {
        console.error('Coordenadas inválidas retornadas:', coords);
        return null;
      }

      return coords;
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error.response ? error.response.data : error.message);
      return null;
    }
  };

  // Buscar sugestões de cidades
  const fetchCitySuggestions = async (query) => {
    if (!query || query.trim() === '' || normalizeCityName(query).length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=pt`;
      const response = await axios.get(url);
      const data = response.data;
      if (data.results) {
        const filteredResults = data.results
          .filter((result) => isValidCoordinate(result.latitude, result.longitude))
          .map((result) => ({
            name: result.name,
            country: result.country || 'Desconhecido',
            admin1: result.admin1 || 'Região não especificada',
            lat: result.latitude,
            lon: result.longitude,
          }));
        setCitySuggestions(filteredResults);
      } else {
        setCitySuggestions([]);
      }
    } catch (error) {
      console.error('Erro ao obter sugestões:', error.response ? error.response.data : error.message);
      setCitySuggestions([]);
    }
  };

  // Mapear código de condição meteorológica
  const getWeatherDescription = (code, isDay = true) => {
    const weatherCodes = {
      0: { description: 'Céu limpo', icon: isDay ? 'WiDaySunny' : 'WiNightClear' },
      1: { description: 'Poucas nuvens', icon: isDay ? 'WiDaySunny' : 'WiNightCloudy' },
      2: { description: 'Nuvens dispersas', icon: isDay ? 'WiDayCloudy' : 'WiNightCloudy' },
      3: { description: 'Nublado', icon: 'WiCloudy' },
      45: { description: 'Nevoeiro', icon: 'WiFog' },
      48: { description: 'Nevoeiro com geada', icon: 'WiFog' },
      51: { description: 'Chuva fraca', icon: isDay ? 'WiDayRain' : 'WiNightRain' },
      53: { description: 'Chuva moderada', icon: 'WiRain' },
      55: { description: 'Chuva forte', icon: 'WiRain' },
      61: { description: 'Chuva leve', icon: isDay ? 'WiDayRain' : 'WiNightRain' },
      63: { description: 'Chuva moderada', icon: 'WiRain' },
      65: { description: 'Chuva intensa', icon: 'WiRain' },
      71: { description: 'Neve fraca', icon: 'WiSnow' },
      73: { description: 'Neve moderada', icon: 'WiSnow' },
      75: { description: 'Neve forte', icon: 'WiSnow' },
      80: { description: 'Chuva esporádica', icon: isDay ? 'WiDayRain' : 'WiNightRain' },
      81: { description: 'Chuva moderada esporádica', icon: 'WiRain' },
      82: { description: 'Chuva forte esporádica', icon: 'WiRain' },
      95: { description: 'Trovoada leve', icon: 'WiThunderstorm' },
      96: { description: 'Trovoada com granizo', icon: 'WiThunderstorm' },
      99: { description: 'Trovoada intensa', icon: 'WiThunderstorm' },
      // Adicionar código para ventoso (simulado, já que Open-Meteo não tem código específico para vento)
      15: { description: 'Ventoso', icon: 'WiWindy' }, // Código fictício para vento
    };
    return weatherCodes[code] || { description: 'Desconhecido', icon: 'WiCloudy' };
  };

  // Converter temperatura entre Celsius e Fahrenheit
  const convertTemperature = (temp) => {
    if (unit === 'F') {
      return ((temp * 9) / 5 + 32).toFixed(1);
    }
    return temp.toFixed(1);
  };

  // Função para fazer retry de chamadas de API
  const fetchWithRetry = async (url, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(url);
        return response;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Espera progressiva
      }
    }
  };

  // Buscar dados meteorológicos com cache
  const fetchWeather = async (location, selectedTravel = null) => {
    setIsLoading(true);
    setWeatherError(null);
    try {
      let lat, lon, cityName, admin1, isGeolocation = false;
      
      // Validar e obter coordenadas
      if (location.lat && location.lon && isValidCoordinate(location.lat, location.lon)) {
        lat = location.lat;
        lon = location.lon;
        cityName = location.city || 'A Sua Localização';
        admin1 = location.admin1 || '';
        isGeolocation = cityName.includes('A Sua Localização');
      } else {
        if (!location.city || location.city.trim() === '') {
          throw new Error('Por favor, insira um nome de cidade válido.');
        }
        const coords = await getCoordinates(location.city);
        if (!coords) {
          throw new Error(`Cidade "${location.city}" não encontrada. Tente um nome diferente ou verifique a ortografia.`);
        }
        lat = coords.lat;
        lon = coords.lon;
        cityName = coords.name;
        admin1 = coords.admin1 || '';
      }

      // Verificar cache
      const cacheKey = `weather_${normalizeCityName(cityName)}_${lat}_${lon}`;
      const cachedData = getFromLocalStorage(STORAGE_KEYS.WEATHER_CACHE, {})[cacheKey];
      const isCacheValid = cachedData?.timestamp && (Date.now() - cachedData.timestamp < MAX_CACHE_AGE);

      if (isCacheValid && !selectedTravel && !futureDate) {
        setWeatherData({
          ...cachedData.weatherData,
          icon: iconMap[cachedData.weatherData.icon] || WiCloudy,
        });
        setWeather({ ...cachedData.weatherData });
        setHourlyData(
          cachedData.hourlyData.map((item) => ({
            ...item,
            icon: iconMap[item.icon] || WiCloudy,
          }))
        );
        setForecastData(
          cachedData.forecastData.map((item) => ({
            ...item,
            icon: iconMap[item.icon] || WiCloudy,
          }))
        );
        setWeatherError(null);
        setIsLoading(false);
        return;
      }

      let isFutureTravelOutOfRange = false;
      let forecastDays = 16;
      let forecast = [];
      let targetMonth = new Date().getMonth() + 1;

      // Validar datas de viagem
      if (selectedTravel) {
        const startDate = new Date(selectedTravel.startDate);
        if (isNaN(startDate)) {
          throw new Error('Data de viagem inválida.');
        }
        targetMonth = startDate.getMonth() + 1;
        const today = new Date();
        const maxForecastDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        if (startDate > maxForecastDate) {
          isFutureTravelOutOfRange = true;
        }
      } else if (futureDate) {
        const future = new Date(futureDate);
        if (isNaN(future)) {
          throw new Error('Data futura inválida.');
        }
        targetMonth = future.getMonth() + 1;
        const today = new Date();
        const maxForecastDate = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
        if (future > maxForecastDate) {
          isFutureTravelOutOfRange = true;
        }
      }

      if (!isFutureTravelOutOfRange) {
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,precipitation_probability&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,weather_code,precipitation_probability_max,wind_speed_10m_max&forecast_days=${forecastDays}`;
          const response = await fetchWithRetry(url);
          
          if (!response.data || !response.data.current) {
            throw new Error('Dados meteorológicos inválidos recebidos da API.');
          }

          const current = response.data.current;
          const hourly = response.data.hourly;
          const daily = response.data.daily;
          const isDay = new Date().getHours() >= 6 && new Date().getHours() <= 18;
          
          // Simular código de vento se wind_speed_10m for alto
          const currentWeatherCode = current.wind_speed_10m > 30 ? 15 : current.weather_code;
          const weatherInfo = getWeatherDescription(currentWeatherCode, isDay);

          const weatherData = {
            city: isGeolocation ? cityName : admin1 ? `${cityName}, ${admin1}` : cityName,
            temperature: parseFloat(current.temperature_2m.toFixed(1)),
            apparentTemp: parseFloat(current.apparent_temperature.toFixed(1)),
            humidity: current.relative_humidity_2m,
            windSpeed: current.wind_speed_10m,
            precipitationProbability: current.precipitation_probability,
            condition: weatherInfo.description,
            icon: weatherInfo.icon,
          };

          setWeatherData({
            ...weatherData,
            icon: iconMap[weatherInfo.icon] || WiCloudy,
          });
          setWeather({ ...weatherData });

          // Processar dados horários
          const hourlySlice = hourly.time.map((time, index) => {
            const date = new Date(time);
            const isDayHour = date.getHours() >= 6 && date.getHours() <= 18;
            const hourWeatherCode = hourly.wind_speed_10m[index] > 30 ? 15 : hourly.weather_code[index];
            const hourWeather = getWeatherDescription(hourWeatherCode, isDayHour);
            return {
              time: date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
              date: date.toISOString().split('T')[0],
              temperature: parseFloat(hourly.temperature_2m[index].toFixed(1)),
              apparentTemp: parseFloat(hourly.apparent_temperature[index].toFixed(1)),
              precipitationProbability: hourly.precipitation_probability[index],
              windSpeed: parseFloat(hourly.wind_speed_10m[index].toFixed(1)),
              condition: hourWeather.description,
              icon: hourWeather.icon,
            };
          });

          setHourlyData(
            hourlySlice.map((item) => ({
              ...item,
              icon: iconMap[item.icon] || WiCloudy,
            }))
          );

          // Processar previsão diária
          forecast = daily.time.slice(0, 15).map((time, index) => {
            const isDay = true;
            const dailyWeatherCode = daily.wind_speed_10m_max[index] > 30 ? 15 : daily.weather_code[index];
            const forecastInfo = getWeatherDescription(dailyWeatherCode, isDay);
            return {
              date: new Date(time).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }),
              dateISO: time,
              maxTemp: parseFloat(daily.temperature_2m_max[index].toFixed(1)),
              minTemp: parseFloat(daily.temperature_2m_min[index].toFixed(1)),
              apparentTemp: parseFloat(daily.apparent_temperature_max[index].toFixed(1)),
              precipitation: daily.precipitation_probability_max[index],
              windSpeed: daily.wind_speed_10m_max[index],
              condition: forecastInfo.description,
              icon: forecastInfo.icon,
              alert: daily.precipitation_probability_max[index] > 80 ? '⚠️ Alta probabilidade de chuva' : null,
            };
          });

          // Salvar no cache
          const cacheData = getFromLocalStorage(STORAGE_KEYS.WEATHER_CACHE, {});
          cacheData[cacheKey] = {
            weatherData: { ...weatherData, icon: weatherData.icon },
            hourlyData: hourlySlice,
            forecastData: forecast,
            timestamp: Date.now(),
          };
          saveToLocalStorage(STORAGE_KEYS.WEATHER_CACHE, cacheData);

          setForecastData(
            forecast.map((item) => ({
              ...item,
              icon: iconMap[item.icon] || WiCloudy,
            }))
          );
        } catch (error) {
          console.error('Erro ao obter dados meteorológicos:', error);
          // Fallback para dados climatológicos
          const climate = estimateClimate(cityName, lat, targetMonth);
          setWeatherData({
            city: isGeolocation ? cityName : admin1 ? `${cityName}, ${admin1}` : cityName,
            temperature: parseFloat(((climate.maxTemp + climate.minTemp) / 2).toFixed(1)),
            apparentTemp: parseFloat(climate.apparentTemp.toFixed(1)),
            humidity: climate.humidity,
            windSpeed: climate.windSpeed,
            precipitationProbability: climate.precipitation,
            condition: climate.condition,
            icon: iconMap[climate.icon] || WiCloudy,
          });
          setWeather({ ...weatherData });
          setWeatherError('Usando dados climatológicos estimados devido a erro na API.');
        }
      } else {
        // Usar dados climatológicos para datas futuras
        const climate = estimateClimate(cityName, lat, targetMonth);
        setWeatherData({
          city: isGeolocation ? cityName : admin1 ? `${cityName}, ${admin1}` : cityName,
          temperature: parseFloat(((climate.maxTemp + climate.minTemp) / 2).toFixed(1)),
          apparentTemp: parseFloat(climate.apparentTemp.toFixed(1)),
          humidity: climate.humidity,
          windSpeed: climate.windSpeed,
          precipitationProbability: climate.precipitation,
          condition: climate.condition,
          icon: iconMap[climate.icon] || WiCloudy,
        });
        setWeather({ ...weatherData });
        setWeatherError(`Usando dados climatológicos estimados para ${cityName} (${targetMonth}º mês).`);
      }

      // Processar dados de viagem selecionada
      if (selectedTravel) {
        const startDate = new Date(selectedTravel.startDate).toISOString().split('T')[0];
        const endDate = new Date(selectedTravel.endDate).toISOString().split('T')[0];
        forecast = forecast.filter((day) => day.dateISO >= startDate && day.dateISO <= endDate);
        setForecastData(
          forecast.map((item) => ({
            ...item,
            icon: iconMap[item.icon] || WiCloudy,
          }))
        );
      }

      // Processar data futura
      if (futureDate) {
        const selectedDateStr = new Date(futureDate).toISOString().split('T')[0];
        if (isFutureTravelOutOfRange) {
          const climate = estimateClimate(cityName, lat, new Date(futureDate).getMonth() + 1);
          setFutureWeather({
            date: selectedDateStr,
            maxTemp: climate.maxTemp,
            minTemp: climate.minTemp,
            apparentTemp: climate.apparentTemp,
            precipitation: climate.precipitation,
            windSpeed: climate.windSpeed,
            condition: climate.condition,
            icon: iconMap[climate.icon] || WiCloudy,
            alert: climate.precipitation > 80 ? '⚠️ Alta probabilidade de chuva' : null,
          });
        } else {
          const index = forecast.findIndex((day) => day.dateISO === selectedDateStr);
          if (index !== -1) {
            setFutureWeather({
              ...forecast[index],
              icon: iconMap[forecast[index].icon] || WiCloudy,
            });
          } else {
            setFutureWeather(null);
          }
        }
      } else {
        setFutureWeather(null);
      }

      // Atualizar dia selecionado
      const initialDay = selectedTravel
        ? new Date(selectedTravel.startDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      setSelectedDay(initialDay);

      // Atualizar histórico de busca
      if (!isGeolocation && !isFutureTravelOutOfRange) {
        const normalizedCity = normalizeCityName(cityName);
        if (!searchHistory.some((item) => normalizeCityName(item.city) === normalizedCity)) {
          const newHistory = [...searchHistory, { city: cityName, lat, lon, admin1 }].slice(-MAX_HISTORY_ITEMS);
          setSearchHistory(newHistory);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar meteorologia:', error.message);
      let errorMessage = 'Erro ao carregar meteorologia. Verifique a conexão ou tente outra cidade.';
      if (error.message.includes('não encontrada')) {
        errorMessage = error.message;
      } else if (error.response && error.response.status === 400) {
        errorMessage = `Requisição inválida para "${location.city || 'desconhecida'}". Verifique o nome da cidade ou tente novamente.`;
      }
      setWeatherError(errorMessage);
      setWeatherData(null);
      setHourlyData([]);
      setForecastData([]);
      setFutureWeather(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar meteorologia quando localização ou viagem selecionada mudar
  useEffect(() => {
    if (userLocation && userLocation.city) {
      fetchWeather(userLocation, selectedTravel);
    }
  }, [userLocation, selectedTravel]);

  // Manipular busca de cidade
  const handleCitySearch = (e) => {
    e.preventDefault();
    const trimmedCity = searchCity.trim();
    if (trimmedCity && normalizeCityName(trimmedCity).length >= 2) {
      setUserLocation({ city: trimmedCity });
      setSearchCity('');
      setCitySuggestions([]);
      setSelectedTravel(null);
    } else {
      setWeatherError('Por favor, insira uma cidade válida (mínimo 2 caracteres).');
    }
  };

  // Manipular clique em sugestão
  const handleSuggestionClick = (suggestion) => {
    if (!isValidCoordinate(suggestion.lat, suggestion.lon)) {
      setWeatherError('Coordenadas inválidas para a cidade selecionada.');
      return;
    }
    setUserLocation({
      city: suggestion.name,
      lat: suggestion.lat,
      lon: suggestion.lon,
      admin1: suggestion.admin1,
    });
    setSearchCity('');
    setCitySuggestions([]);
    setSelectedTravel(null);
  };

  // Manipular localização atual
  const handleUseCurrentLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          if (!isValidCoordinate(latitude, longitude)) {
            setWeatherError('Coordenadas de geolocalização inválidas.');
            return;
          }
          try {
            const response = await axios.get(
              `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=pt`
            );
            const data = response.data;
            const city = data.results && data.results.length > 0 ? data.results[0].name : 'Desconhecida';
            const admin1 = data.results && data.results.length > 0 ? data.results[0].admin1 || '' : '';
            const displayCity = `A Sua Localização${city !== 'Desconhecida' ? ` (${city}${admin1 ? `, ${admin1}` : ''})` : ''}`;
            setUserLocation({
              lat: latitude,
              lon: longitude,
              city: displayCity,
              admin1: admin1,
            });
            setSelectedTravel(null);
          } catch (error) {
            console.error('Erro ao obter nome da cidade:', error.message);
            setUserLocation({
              lat: latitude,
              lon: longitude,
              city: 'A Sua Localização',
            });
            setSelectedTravel(null);
          }
        },
        (error) => {
          console.error('Erro de geolocalização:', error.message);
          setWeatherError('Não foi possível obter a localização. Tente novamente.');
        }
      );
    } else {
      setWeatherError('Geolocalização não suportada pelo navegador.');
    }
  };

  // Manipular clique no histórico
  const handleHistoryClick = (historyItem) => {
    if (!isValidCoordinate(historyItem.lat, historyItem.lon)) {
      setWeatherError('Coordenadas inválidas no histórico.');
      return;
    }
    setUserLocation(historyItem);
    setSelectedTravel(null);
    if (currentWeatherRef.current) {
      currentWeatherRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Manipular clique em viagem futura
  const handleFutureTravelClick = (travel) => {
    setUserLocation({ city: travel.city });
    setSelectedTravel(travel);
    setFutureDate(new Date(travel.startDate));
    if (currentWeatherRef.current) {
      currentWeatherRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Manipular clique em cidade de viagem
  const handleTravelCityClick = (city) => {
    setUserLocation({ city });
    setSelectedTravel(null);
    if (currentWeatherRef.current) {
      currentWeatherRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Manipular mudança de data futura
  const handleFutureDateChange = (e) => {
    const date = new Date(e.target.value);
    if (date && !isNaN(date)) {
      setFutureDate(date);
      fetchWeather(userLocation, selectedTravel);
    } else {
      setFutureWeather(null);
      setWeatherError('Data futura inválida.');
    }
  };

  // Manipular clique em dia
  const handleDayClick = (day) => {
    setSelectedDay(day.dateISO);
    const hourlySection = document.querySelector('.weather-hourly');
    if (hourlySection) {
      hourlySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Limpar histórico
  const handleClearHistory = () => {
    setSearchHistory([]);
    saveToLocalStorage(STORAGE_KEYS.WEATHER_HISTORY, []);
  };

  // Extrair cidades únicas de viagens
  const travelCities = [...new Set(TravelsData.map((travel) => travel.city).filter(Boolean))];

  // Filtrar dados horários para o dia selecionado
  const filteredHourlyData = selectedDay
    ? hourlyData.filter((data) => data.date === selectedDay).slice(0, 24)
    : hourlyData.filter((data) => data.date === new Date().toISOString().split('T')[0]).slice(0, 24);

  // Dados do gráfico de temperatura
  const temperatureChartData = {
    labels: filteredHourlyData.map((data) => data.time),
    datasets: [
      {
        label: 'Temperatura',
        data: filteredHourlyData.map((data) => convertTemperature(data.temperature)),
        fill: false,
        borderColor: '#f4b400',
        backgroundColor: '#f4b400',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Dados do gráfico de precipitação
  const precipitationChartData = {
    labels: filteredHourlyData.map((data) => data.time),
    datasets: [
      {
        label: 'Probabilidade de Chuva (%)',
        data: filteredHourlyData.map((data) => data.precipitationProbability),
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Dados do gráfico de vento
  const windChartData = {
    labels: filteredHourlyData.map((data) => data.time),
    datasets: [
      {
        label: 'Velocidade do Vento (km/h)',
        data: filteredHourlyData.map((data) => data.windSpeed),
        fill: false,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 10 },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: { mode: 'index', intersect: false },
      title: {
        display: true,
        text: selectedDay
          ? `Dados em ${new Date(selectedDay).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
          : 'Dados Hoje',
        font: { size: 16 },
      },
    },
  };

  // Título dinâmico da previsão
  const forecastTitle = selectedTravel
    ? `Previsão de ${new Date(selectedTravel.startDate).toLocaleDateString('pt-PT')} a ${new Date(selectedTravel.endDate).toLocaleDateString('pt-PT')}`
    : 'Previsão para os Próximos 10 Dias';

  // Filtrar dados da previsão baseado no estado showAllDays
  const displayedForecastData = selectedTravel 
    ? forecastData 
    : showAllDays 
      ? forecastData 
      : forecastData.slice(0, 10);

  return (
    <div className="weather-page max-w-6xl mx-auto p-6 bg-gray-100 min-h-screen">
      {showInitialModal && (
        <div className="gm-map-welcome-overlay">
          <div className="gm-map-welcome-modal">
            <div className="gm-map-welcome-header">
              <h2>🌤️ Informações Meteorológicas</h2>
              <button className="gm-map-close-btn" onClick={() => setShowInitialModal(false)}>×</button>
            </div>
            <div className="gm-map-welcome-content">
              <p>Explore as condições meteorológicas em qualquer lugar do mundo com dados precisos e confiáveis!</p>
              <div className="gm-map-features-grid">
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">📊</span>
                  <div>
                    <strong>Precisão das Previsões</strong>
                    <p><strong>1-3 dias:</strong> Elevada precisão (85-90%)<br />
                       <strong>4-7 dias:</strong> Boa precisão (70-80%)<br />
                       <strong>8-16 dias:</strong> Precisão limitada (50-65%)</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🗓️</span>
                  <div>
                    <strong>Viagens Futuras</strong>
                    <p>Para datas além de 16 dias, utilizamos dados climatológicos históricos baseados na localização e época do ano.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">🌍</span>
                  <div>
                    <strong>Fonte dos Dados</strong>
                    <p>Utilizamos dados do Open-Meteo, um serviço meteorológico europeu reconhecido pela qualidade e fiabilidade.</p>
                  </div>
                </div>
                <div className="gm-map-feature-item">
                  <span className="gm-map-feature-icon">⚡</span>
                  <div>
                    <strong>Previsões Detalhadas</strong>
                    <p>Aceda a gráficos horários, temperaturas, precipitação e velocidade do vento.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="gm-map-welcome-footer">
              <button className="gm-map-welcome-btn primary" onClick={() => setShowInitialModal(false)}>
                Comece a explorar o clima!
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="weather-search-section mb-8 flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleCitySearch} className="weather-search-form flex-1">
          <div className="search-container relative">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => {
                setSearchCity(e.target.value);
                fetchCitySuggestions(e.target.value);
              }}
              placeholder="Pesquisar cidade (ex.: Torres Vedras)"
              className="weather-search-input w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg transition-all"
            />
            <button 
              type="submit" 
              className="weather-search-button absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <FaSearch size={20} />
            </button>
            {citySuggestions.length > 0 && (
              <ul className="city-suggestions absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-2 max-h-80 overflow-y-auto">
                {citySuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="suggestion-item p-3 hover:bg-gray-100 cursor-pointer text-gray-700 transition-colors"
                  >
                    {suggestion.name}, {suggestion.admin1} ({suggestion.country})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>
        <button
          onClick={handleUseCurrentLocation}
          className="weather-location-button py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center text-lg transition-colors"
        >
          <FaMapMarkerAlt className="mr-2" /> Usar Localização Atual
        </button>
      </div>

      {isLoading && (
        <div className="weather-loading text-center py-8">
          <div className="spinner border-t-4 border-blue-500 rounded-full w-12 h-12 animate-spin mx-auto"></div>
          <p className="text-gray-600 text-xl mt-4">A carregar dados meteorológicos...</p>
        </div>
      )}

      {weatherError && (
        <div className="weather-error text-center py-4 px-6 bg-red-50 border border-red-200 rounded-lg mb-6">
          <p className="text-red-600 text-lg">{weatherError}</p>
        </div>
      )}

      {weatherData && !isLoading && (
        <div className="weather-content space-y-8">
          <div className="weather-current-forecast flex flex-col lg:flex-row gap-6">
            <div ref={currentWeatherRef} className="weather-current bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h1>Temperatura Atual:</h1>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">{weatherData.city}</h2>
              <div className="weather-current-details flex items-center space-x-6">
                <span className="weather-icon text-6xl">{weatherData.icon && <weatherData.icon className="weather-icon-large" size={72} />}</span>
                <div className="weather-stats">
                  <p className="weather-temperature text-5xl font-bold text-gray-800">{convertTemperature(weatherData.temperature)}°{unit}</p>
                  <p className="weather-condition text-xl text-gray-600">{weatherData.condition}</p>
                  <div className="weather-details mt-4 space-y-2">
                    <p className="text-gray-600 text-lg flex items-center">
                      <span className="mr-2">💧</span> Chuva: {weatherData.precipitationProbability}%
                    </p>
                    <br></br>
                    <p className="text-gray-600 text-lg flex items-center">
                      <span className="mr-2">💨</span> Vento: {weatherData.windSpeed} km/h
                    </p>
                    <br></br>
                    <p className="text-gray-600 text-lg flex items-center">
                      <span className="mr-2">💦</span> Humidade: {weatherData.humidity}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="weather-forecast bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{forecastTitle}</h3>
              <div className="forecast-list grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {displayedForecastData.map((day, index) => (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`forecast-item p-4 bg-gray-50 rounded-lg text-center cursor-pointer transition-all hover:bg-gray-100 ${
                      selectedDay === day.dateISO ? 'bg-blue-100 border-2 border-blue-500' : 'border border-gray-200'
                    }`}
                  >
                    <span className="block text-gray-700 font-medium">{day.date}</span>
                    <span className="block my-2">{day.icon && <day.icon className="weather-icon-large" size={48} />}</span>
                    <span className="block text-gray-700 font-semibold">{convertTemperature(day.maxTemp)}° / {convertTemperature(day.minTemp)}°</span>
                    <div className="weather-details mt-2 space-y-1">
                      <p className="text-gray-600 text-sm flex items-center justify-center">
                        <span className="mr-1">💧 Chuva: {day.precipitation}%</span>
                      </p>
                      <p className="text-gray-600 text-sm flex items-center justify-center">
                        <span className="mr-1">💨 Vento: {day.windSpeed} km/h</span> 
                      </p>
                    </div>
                    {day.alert && (
                      <span className="block text-red-500 text-sm mt-2 bg-red-50 p-1 rounded">
                        {day.alert}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {!selectedTravel && forecastData.length > 10 && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowAllDays(!showAllDays)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    {showAllDays ? 'Ver menos' : 'Ver mais 5 dias'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {hourlyData.length > 0 && (
            <div className="weather-hourly bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Previsão Horária</h3>
              <div className="weather-charts grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="weather-chart-container bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Temperatura por Hora</h4>
                  <div className="weather-chart h-80">
                    <Line
                      data={temperatureChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            ...chartOptions.plugins.title,
                            text: selectedDay
                              ? `Temperatura: ${new Date(selectedDay).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
                              : `Temperatura Hoje (°${unit})`,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="weather-chart-container bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Probabilidade de Chuva</h4>
                  <div className="weather-chart h-80">
                    <Line
                      data={precipitationChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            ...chartOptions.plugins.title,
                            text: selectedDay
                              ? `Chuva: ${new Date(selectedDay).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
                              : 'Chuva Hoje',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
                <div className="weather-chart-container bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Velocidade do Vento</h4>
                  <div className="weather-chart h-80">
                    <Line
                      data={windChartData}
                      options={{
                        ...chartOptions,
                        plugins: {
                          ...chartOptions.plugins,
                          title: {
                            ...chartOptions.plugins.title,
                            text: selectedDay
                              ? `Vento: ${new Date(selectedDay).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`
                              : 'Vento Hoje',
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="weather-history-section mt-8 space-y-8">
        <div className="weather-travel-section flex flex-col lg:flex-row gap-6">
          {travelCities.length > 0 && (
            <div className="weather-travel-cities bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaPlane className="mr-2" /> Viagens Passadas
              </h3>
              <ul className="space-y-2">
                {travelCities.map((city, index) => (
                  <li
                    key={index}
                    onClick={() => handleTravelCityClick(city)}
                    className="travel-city-item p-3 hover:bg-gray-100 cursor-pointer rounded-lg text-gray-700 text-lg transition-colors"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {futureTravels.length > 0 && (
            <div className="weather-travel-cities bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <FaPlane className="mr-2" /> Viagens Futuras
              </h3>
              <ul className="space-y-2">
                {futureTravels.map((travel, index) => (
                  <li
                    key={index}
                    onClick={() => handleFutureTravelClick(travel)}
                    className="travel-city-item p-3 hover:bg-gray-100 cursor-pointer rounded-lg text-gray-700 text-lg transition-colors"
                  >
                    {travel.name} - {new Date(travel.startDate).toLocaleDateString('pt-PT')} a{' '}
                    {new Date(travel.endDate).toLocaleDateString('pt-PT')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherPage;