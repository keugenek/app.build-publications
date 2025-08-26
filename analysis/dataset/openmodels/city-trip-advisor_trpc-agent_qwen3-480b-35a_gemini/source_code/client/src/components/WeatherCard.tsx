import type { WeatherForecast } from '../../../server/src/schema';

interface WeatherCardProps {
  forecast: WeatherForecast;
}

export function WeatherCard({ forecast }: WeatherCardProps) {
  const isGoodIdea = forecast.is_good_idea;
  
  // Format date as string to avoid complex TypeScript issues
  const formattedDate = new Date(forecast.date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  return (
    <div className="forecast-card">
      <h3 className="forecast-title">Weather Forecast for {forecast.city}</h3>
      <p className="forecast-date">{formattedDate}</p>
      
      <div className="temperature-display">
        <div className="temperature-value">{forecast.temperature.toFixed(1)}°C</div>
        <div className="precipitation">Precipitation: {forecast.precipitation_probability}%</div>
      </div>
      
      <div className={`recommendation ${isGoodIdea ? 'good-idea' : 'bad-idea'}`}>
        {isGoodIdea ? '✅ Good Idea for a Trip!' : '☔ Not Recommended for a Trip'}
      </div>
      
      <div className="criteria">
        <div className="criteria-title">Evaluation Criteria:</div>
        <div className="criteria-list">
          <div className={`criterion ${forecast.temperature >= 10 && forecast.temperature <= 25 ? 'good' : 'bad'}`}>
            <span>{forecast.temperature >= 10 && forecast.temperature <= 25 ? '✓' : '✗'}</span>
            <span>Temperature: 10°C to 25°C</span>
          </div>
          <div className={`criterion ${forecast.precipitation_probability < 30 ? 'good' : 'bad'}`}>
            <span>{forecast.precipitation_probability < 30 ? '✓' : '✗'}</span>
            <span>Precipitation: {'<'} 30%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
