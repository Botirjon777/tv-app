/* Fetch weather from OpenWeatherMap with 15-minute Redis/DB cache */
import type { FastifyInstance } from 'fastify';

const TTL_MS = 15 * 60 * 1000;

interface WeatherData {
  tempC:     number;
  condition: string;
  iconCode:  string;
  humidity:  number;
  fetchedAt: string;
}

export async function getWeather(
  server: FastifyInstance,
  city: string,
  countryCode: string,
): Promise<WeatherData | null> {
  const cityKey = `${city.toLowerCase()},${countryCode.toLowerCase()}`;

  // Try DB cache first
  const cached = await server.prisma.weatherCache.findUnique({ where: { cityKey } });
  if (cached) {
    const age = Date.now() - cached.fetchedAt.getTime();
    if (age < TTL_MS) {
      return cached.data as unknown as WeatherData;
    }
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather` +
      `?q=${encodeURIComponent(city)},${countryCode}&units=metric&appid=${apiKey}`;

    const res  = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;

    const weather = (json.weather as Array<{ main: string; icon: string }>)?.[0];
    const main    = json.main as { temp: number; humidity: number };

    const data: WeatherData = {
      tempC:     Math.round(main?.temp ?? 0),
      condition: weather?.main ?? '',
      iconCode:  weather?.icon ?? '',
      humidity:  main?.humidity ?? 0,
      fetchedAt: new Date().toISOString(),
    };

    await server.prisma.weatherCache.upsert({
      where:  { cityKey },
      update: { data: data as object, fetchedAt: new Date() },
      create: { cityKey, data: data as object, fetchedAt: new Date() },
    });

    return data;
  } catch {
    return cached ? (cached.data as unknown as WeatherData) : null;
  }
}
