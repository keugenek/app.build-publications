import { describe, expect, it } from 'bun:test';
import { evaluateTripSuggestion } from '../handlers/evaluate_trip_suggestion';
import { type WeatherForecast } from '../schema';

describe('evaluateTripSuggestion', () => {
  const testCity = 'Paris';

  describe('good weather conditions', () => {
    it('should recommend trip for perfect weather', () => {
      const weather: WeatherForecast = {
        temperature: 20,
        precipitation: 0,
        weather_description: 'Clear sky'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.city).toBe(testCity);
      expect(result.weather).toEqual(weather);
      expect(result.message).toMatch(/Great weather for a trip to Paris!/);
      expect(result.message).toMatch(/20°C/);
      expect(result.message).toMatch(/0mm/);
    });

    it('should recommend trip for minimum good temperature', () => {
      const weather: WeatherForecast = {
        temperature: 10,
        precipitation: 2,
        weather_description: 'Partly cloudy'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.message).toMatch(/Great weather/);
    });

    it('should recommend trip for maximum good temperature', () => {
      const weather: WeatherForecast = {
        temperature: 25,
        precipitation: 4,
        weather_description: 'Light clouds'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.message).toMatch(/Great weather/);
    });

    it('should recommend trip with maximum allowed precipitation', () => {
      const weather: WeatherForecast = {
        temperature: 18,
        precipitation: 4.9,
        weather_description: 'Light drizzle'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.message).toMatch(/Great weather/);
    });
  });

  describe('bad weather conditions - temperature', () => {
    it('should not recommend trip when too cold', () => {
      const weather: WeatherForecast = {
        temperature: 5,
        precipitation: 0,
        weather_description: 'Clear but cold'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.city).toBe(testCity);
      expect(result.weather).toEqual(weather);
      expect(result.message).toMatch(/Not ideal weather/);
      expect(result.message).toMatch(/too cold \(5°C\)/);
    });

    it('should not recommend trip when too hot', () => {
      const weather: WeatherForecast = {
        temperature: 30,
        precipitation: 0,
        weather_description: 'Very hot and sunny'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/Not ideal weather/);
      expect(result.message).toMatch(/too hot \(30°C\)/);
    });

    it('should not recommend trip at temperature boundary (9°C)', () => {
      const weather: WeatherForecast = {
        temperature: 9,
        precipitation: 0,
        weather_description: 'Cool'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/too cold \(9°C\)/);
    });

    it('should not recommend trip at temperature boundary (26°C)', () => {
      const weather: WeatherForecast = {
        temperature: 26,
        precipitation: 0,
        weather_description: 'Hot'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/too hot \(26°C\)/);
    });
  });

  describe('bad weather conditions - precipitation', () => {
    it('should not recommend trip with high precipitation', () => {
      const weather: WeatherForecast = {
        temperature: 20,
        precipitation: 10,
        weather_description: 'Heavy rain'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/Not ideal weather/);
      expect(result.message).toMatch(/significant precipitation expected \(10mm\)/);
    });

    it('should not recommend trip at precipitation boundary (5mm)', () => {
      const weather: WeatherForecast = {
        temperature: 20,
        precipitation: 5,
        weather_description: 'Moderate rain'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/significant precipitation expected \(5mm\)/);
    });
  });

  describe('multiple bad conditions', () => {
    it('should not recommend trip when both temperature and precipitation are bad', () => {
      const weather: WeatherForecast = {
        temperature: 5,
        precipitation: 15,
        weather_description: 'Cold and rainy'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/Not ideal weather/);
      expect(result.message).toMatch(/too cold \(5°C\)/);
      expect(result.message).toMatch(/significant precipitation expected \(15mm\)/);
      expect(result.message).toMatch(/and/);
    });

    it('should handle hot temperature with high precipitation', () => {
      const weather: WeatherForecast = {
        temperature: 35,
        precipitation: 20,
        weather_description: 'Hot thunderstorm'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/too hot \(35°C\)/);
      expect(result.message).toMatch(/significant precipitation expected \(20mm\)/);
    });
  });

  describe('edge cases', () => {
    it('should handle zero precipitation correctly', () => {
      const weather: WeatherForecast = {
        temperature: 15,
        precipitation: 0,
        weather_description: 'Perfect clear day'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.message).toMatch(/0mm/);
    });

    it('should handle decimal temperatures', () => {
      const weather: WeatherForecast = {
        temperature: 15.7,
        precipitation: 2.3,
        weather_description: 'Mild'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(true);
      expect(result.message).toMatch(/15\.7°C/);
      expect(result.message).toMatch(/2\.3mm/);
    });

    it('should work with different city names', () => {
      const weather: WeatherForecast = {
        temperature: 20,
        precipitation: 0,
        weather_description: 'Perfect'
      };

      const result = evaluateTripSuggestion('Tokyo', weather);

      expect(result.city).toBe('Tokyo');
      expect(result.message).toMatch(/Tokyo/);
    });

    it('should handle negative temperatures', () => {
      const weather: WeatherForecast = {
        temperature: -5,
        precipitation: 0,
        weather_description: 'Freezing'
      };

      const result = evaluateTripSuggestion(testCity, weather);

      expect(result.isGoodIdea).toBe(false);
      expect(result.message).toMatch(/too cold \(-5°C\)/);
    });
  });
});
