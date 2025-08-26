import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tripSuggestionsTable } from '../db/schema';
import { type TripSuggestionInput, type WeatherForecast } from '../schema';
import { createTripSuggestion } from '../handlers/create_trip_suggestion';
import { eq } from 'drizzle-orm';

// Mock the getWeatherForecast function
const mockGetWeatherForecast = mock();

// Replace the import with our mock
mock.module('../handlers/get_weather_forecast', () => ({
    getWeatherForecast: mockGetWeatherForecast,
}));

// Test inputs
const testInput: TripSuggestionInput = {
    city: 'Paris'
};

const goodWeatherForecast: WeatherForecast = {
    temperature_min: 15,
    temperature_max: 22,
    precipitation: 0.5,
    date: '2024-01-15'
};

const coldWeatherForecast: WeatherForecast = {
    temperature_min: 5,
    temperature_max: 8,
    precipitation: 1.0,
    date: '2024-01-15'
};

const hotWeatherForecast: WeatherForecast = {
    temperature_min: 28,
    temperature_max: 35,
    precipitation: 0.1,
    date: '2024-01-15'
};

const rainyWeatherForecast: WeatherForecast = {
    temperature_min: 18,
    temperature_max: 23,
    precipitation: 5.2,
    date: '2024-01-15'
};

describe('createTripSuggestion', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should create a "Yes" trip suggestion for good weather', async () => {
        mockGetWeatherForecast.mockResolvedValue(goodWeatherForecast);

        const result = await createTripSuggestion(testInput);

        // Basic field validation
        expect(result.city).toEqual('Paris');
        expect(result.suggestion).toEqual('Yes');
        expect(result.temperature_min).toEqual(15);
        expect(result.temperature_max).toEqual(22);
        expect(result.precipitation).toEqual(0.5);
        expect(result.forecast_date).toBeInstanceOf(Date);
        expect(result.forecast_date.toISOString()).toMatch('2024-01-15');
        expect(result.reasoning).toMatch(/Good trip conditions/);
        expect(result.reasoning).toMatch(/15°C - 22°C/);
        expect(result.reasoning).toMatch(/0.5mm/);
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should create a "No" trip suggestion for cold weather', async () => {
        mockGetWeatherForecast.mockResolvedValue(coldWeatherForecast);

        const result = await createTripSuggestion(testInput);

        expect(result.city).toEqual('Paris');
        expect(result.suggestion).toEqual('No');
        expect(result.temperature_min).toEqual(5);
        expect(result.temperature_max).toEqual(8);
        expect(result.precipitation).toEqual(1.0);
        expect(result.reasoning).toMatch(/Trip not recommended/);
        expect(result.reasoning).toMatch(/too cold/);
    });

    it('should create a "No" trip suggestion for hot weather', async () => {
        mockGetWeatherForecast.mockResolvedValue(hotWeatherForecast);

        const result = await createTripSuggestion(testInput);

        expect(result.suggestion).toEqual('No');
        expect(result.reasoning).toMatch(/too hot/);
    });

    it('should create a "No" trip suggestion for rainy weather', async () => {
        mockGetWeatherForecast.mockResolvedValue(rainyWeatherForecast);

        const result = await createTripSuggestion(testInput);

        expect(result.suggestion).toEqual('No');
        expect(result.reasoning).toMatch(/significant precipitation expected/);
        expect(result.reasoning).toMatch(/5.2mm/);
    });

    it('should save trip suggestion to database', async () => {
        mockGetWeatherForecast.mockResolvedValue(goodWeatherForecast);

        const result = await createTripSuggestion(testInput);

        // Query using proper drizzle syntax
        const tripSuggestions = await db.select()
            .from(tripSuggestionsTable)
            .where(eq(tripSuggestionsTable.id, result.id))
            .execute();

        expect(tripSuggestions).toHaveLength(1);
        const saved = tripSuggestions[0];
        expect(saved.city).toEqual('Paris');
        expect(saved.suggestion).toEqual('Yes');
        expect(parseFloat(saved.temperature_min)).toEqual(15);
        expect(parseFloat(saved.temperature_max)).toEqual(22);
        expect(parseFloat(saved.precipitation)).toEqual(0.5);
        expect(saved.forecast_date).toBeInstanceOf(Date);
        expect(saved.reasoning).toMatch(/Good trip conditions/);
        expect(saved.created_at).toBeInstanceOf(Date);
    });

    it('should handle numeric type conversions correctly', async () => {
        mockGetWeatherForecast.mockResolvedValue(goodWeatherForecast);

        const result = await createTripSuggestion(testInput);

        // Verify returned types are numbers
        expect(typeof result.temperature_min).toBe('number');
        expect(typeof result.temperature_max).toBe('number');
        expect(typeof result.precipitation).toBe('number');

        // Verify database storage and retrieval
        const saved = await db.select()
            .from(tripSuggestionsTable)
            .where(eq(tripSuggestionsTable.id, result.id))
            .execute();

        // Database stores as strings (numeric columns)
        expect(typeof saved[0].temperature_min).toBe('string');
        expect(typeof saved[0].temperature_max).toBe('string');
        expect(typeof saved[0].precipitation).toBe('string');

        // But values should be correct when parsed
        expect(parseFloat(saved[0].temperature_min)).toEqual(15);
        expect(parseFloat(saved[0].temperature_max)).toEqual(22);
        expect(parseFloat(saved[0].precipitation)).toEqual(0.5);
    });

    it('should generate correct reasoning for multiple weather issues', async () => {
        const badWeatherForecast: WeatherForecast = {
            temperature_min: 2,
            temperature_max: 7,
            precipitation: 8.5,
            date: '2024-01-15'
        };

        mockGetWeatherForecast.mockResolvedValue(badWeatherForecast);

        const result = await createTripSuggestion(testInput);

        expect(result.suggestion).toEqual('No');
        expect(result.reasoning).toMatch(/Trip not recommended due to/);
        expect(result.reasoning).toMatch(/too cold/);
        expect(result.reasoning).toMatch(/significant precipitation expected/);
        expect(result.reasoning).toMatch(/8.5mm/);
    });

    it('should handle edge case temperatures correctly', async () => {
        const edgeCaseWeather: WeatherForecast = {
            temperature_min: 10, // Exactly at the good threshold
            temperature_max: 25, // Exactly at the good threshold
            precipitation: 1.9, // Just under the precipitation threshold
            date: '2024-01-15'
        };

        mockGetWeatherForecast.mockResolvedValue(edgeCaseWeather);

        const result = await createTripSuggestion(testInput);

        expect(result.suggestion).toEqual('Yes');
        expect(result.reasoning).toMatch(/Good trip conditions/);
    });
});
