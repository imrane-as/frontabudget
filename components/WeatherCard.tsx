import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CloudSun, Droplets, Wind } from "lucide-react";
import Link from "next/link";
import { describeWeather, type WeatherData } from "@/lib/weather";

export default function WeatherCard({
  weather,
  city = "Metz"
}: {
  weather: WeatherData | null;
  city?: string;
}) {
  if (!weather) {
    return (
      <div className="card weather-card">
        <div className="card-title-row">
          <div>
            <span className="eyebrow">Météo générale · {city}</span>
            <h3>Prévisions momentanément indisponibles</h3>
          </div>
          <CloudSun aria-hidden="true" />
        </div>
        <p className="muted">Vérifie la ville enregistrée ou réessaie dans quelques minutes.</p>
        <Link href="/settings" className="weather-settings-link">Vérifier ma ville</Link>
      </div>
    );
  }

  return (
    <div className="card weather-card">
      <div className="card-title-row">
        <div>
          <span className="eyebrow">Météo générale · {weather.city}</span>
          <h3>{weather.description}</h3>
        </div>
        <span className="weather-icon" aria-hidden="true">
          {weather.icon}
        </span>
      </div>

      <div className="weather-current">
        <strong>{Math.round(weather.temperature)}°</strong>
        <div className="weather-details muted">
          <span><Wind size={15} /> {Math.round(weather.windSpeed)} km/h</span>
          <span><Droplets size={15} /> {weather.days[0]?.rainProbability || 0} %</span>
          <span>Ressenti {Math.round(weather.apparentTemperature)}°</span>
        </div>
      </div>

      <div className="weather-days">
        {weather.days.slice(1).map((day) => (
          <div key={day.date}>
            <span>{format(new Date(`${day.date}T12:00:00`), "EEE", { locale: fr })}</span>
            <strong>{describeWeather(day.code).icon}</strong>
            <small>{Math.round(day.min)}° / {Math.round(day.max)}°</small>
          </div>
        ))}
      </div>

      <div className="eco-tip">💡 {weather.savingTip}</div>
      <small className="weather-source">Données météo : Open-Meteo</small>
    </div>
  );
}
