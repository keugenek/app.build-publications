import { type WeatherForecast, type TripSuggestionResponse } from '../schema';

export function evaluateTripSuggestion(city: string, weather: WeatherForecast): TripSuggestionResponse {
    const { temperature, precipitation, weather_description } = weather;
    
    // Good trip conditions: temperature 10-25°C and minimal precipitation
    const isTemperatureGood = temperature >= 10 && temperature <= 25;
    const isPrecipitationLow = precipitation < 5; // Less than 5mm considered minimal
    
    const isGoodIdea = isTemperatureGood && isPrecipitationLow;
    
    let message: string;
    if (isGoodIdea) {
        message = `Great weather for a trip to ${city}! Temperature is comfortable at ${temperature}°C with minimal precipitation (${precipitation}mm).`;
    } else {
        const reasons: string[] = [];
        if (!isTemperatureGood) {
            if (temperature < 10) {
                reasons.push(`it's too cold (${temperature}°C)`);
            } else {
                reasons.push(`it's too hot (${temperature}°C)`);
            }
        }
        if (!isPrecipitationLow) {
            reasons.push(`there's significant precipitation expected (${precipitation}mm)`);
        }
        message = `Not ideal weather for a trip to ${city} - ${reasons.join(' and ')}.`;
    }
    
    return {
        isGoodIdea,
        message,
        city,
        weather
    };
}
