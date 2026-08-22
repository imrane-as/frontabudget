export type WeatherDay = {
  date: string;
  min: number;
  max: number;
  rainProbability: number;
  code: number;
};

export type WeatherData = {
  city: string;
  country: string;
  temperature: number;
  apparentTemperature: number;
  windSpeed: number;
  rain: number;
  code: number;
  description: string;
  icon: string;
  days: WeatherDay[];
  savingTip: string;
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    country?: string;
    latitude: number;
    longitude: number;
  }>;
};

type ForecastResponse = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    rain: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

const weatherCodes: Record<number, { description: string; icon: string }> = {
  0: { description: "Ciel dégagé", icon: "☀️" },
  1: { description: "Peu nuageux", icon: "🌤️" },
  2: { description: "Partiellement nuageux", icon: "⛅" },
  3: { description: "Couvert", icon: "☁️" },
  45: { description: "Brouillard", icon: "🌫️" },
  48: { description: "Brouillard givrant", icon: "🌫️" },
  51: { description: "Bruine légère", icon: "🌦️" },
  53: { description: "Bruine", icon: "🌦️" },
  55: { description: "Forte bruine", icon: "🌧️" },
  61: { description: "Pluie légère", icon: "🌦️" },
  63: { description: "Pluie", icon: "🌧️" },
  65: { description: "Forte pluie", icon: "🌧️" },
  71: { description: "Neige légère", icon: "🌨️" },
  73: { description: "Neige", icon: "🌨️" },
  75: { description: "Forte neige", icon: "❄️" },
  80: { description: "Averses légères", icon: "🌦️" },
  81: { description: "Averses", icon: "🌧️" },
  82: { description: "Fortes averses", icon: "⛈️" },
  95: { description: "Orage", icon: "⛈️" },
  96: { description: "Orage et grêle", icon: "⛈️" },
  99: { description: "Fort orage et grêle", icon: "⛈️" }
};

export function describeWeather(code: number) {
  return weatherCodes[code] || { description: "Météo variable", icon: "🌤️" };
}

function weatherSavingTip(forecast: ForecastResponse) {
  const rainProbability =
    forecast.daily?.precipitation_probability_max?.[0] || 0;
  const temperature = forecast.current?.temperature_2m || 0;
  const wind = forecast.current?.wind_speed_10m || 0;

  if (rainProbability >= 65) {
    return "Pluie probable : anticipe ton trajet pour éviter taxi et parking de dernière minute.";
  }

  if (temperature >= 12 && temperature <= 26 && wind < 30) {
    return "Temps favorable : marche ou vélo pour les petits trajets et économise du carburant.";
  }

  if (temperature < 8) {
    return "Temps frais : ferme les volets le soir et baisse le chauffage d’un degré en ton absence.";
  }

  return "Regroupe tes déplacements aujourd’hui pour limiter carburant et achats imprévus.";
}

export async function getWeather(city = "Metz"): Promise<WeatherData | null> {
  const normalizedCity = city.trim().slice(0, 80) || "Metz";

  try {
    const geocodingUrl = new URL(
      "https://geocoding-api.open-meteo.com/v1/search"
    );
    geocodingUrl.searchParams.set("name", normalizedCity);
    geocodingUrl.searchParams.set("count", "1");
    geocodingUrl.searchParams.set("language", "fr");
    geocodingUrl.searchParams.set("format", "json");

    const geocodingResponse = await fetch(geocodingUrl, {
      next: { revalidate: 60 * 60 }
    });

    if (!geocodingResponse.ok) return null;
    const geocoding = (await geocodingResponse.json()) as GeocodingResponse;
    const place = geocoding.results?.[0];
    if (!place) return null;

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.searchParams.set("latitude", String(place.latitude));
    forecastUrl.searchParams.set("longitude", String(place.longitude));
    forecastUrl.searchParams.set(
      "current",
      "temperature_2m,apparent_temperature,weather_code,wind_speed_10m,rain"
    );
    forecastUrl.searchParams.set(
      "daily",
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max"
    );
    forecastUrl.searchParams.set("forecast_days", "4");
    forecastUrl.searchParams.set("timezone", "auto");

    const forecastResponse = await fetch(forecastUrl, {
      next: { revalidate: 30 * 60 }
    });

    if (!forecastResponse.ok) return null;
    const forecast = (await forecastResponse.json()) as ForecastResponse;
    if (!forecast.current || !forecast.daily) return null;

    const condition = describeWeather(forecast.current.weather_code);

    return {
      city: place.name,
      country: place.country || "",
      temperature: forecast.current.temperature_2m,
      apparentTemperature: forecast.current.apparent_temperature,
      windSpeed: forecast.current.wind_speed_10m,
      rain: forecast.current.rain,
      code: forecast.current.weather_code,
      description: condition.description,
      icon: condition.icon,
      days: forecast.daily.time.map((date, index) => ({
        date,
        min: forecast.daily!.temperature_2m_min[index],
        max: forecast.daily!.temperature_2m_max[index],
        rainProbability:
          forecast.daily!.precipitation_probability_max[index] || 0,
        code: forecast.daily!.weather_code[index]
      })),
      savingTip: weatherSavingTip(forecast)
    };
  } catch {
    return null;
  }
}
