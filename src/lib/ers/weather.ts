/**
 * OpenWeatherMap Temperature Service for ERS adjustments
 * SRS §8.3: Outdoor temperature > 35°C (+12 penalty), > 40°C (+20 penalty)
 */

interface CachedWeather {
  tempCelsius: number;
  fetchedAt: number;
}

// In-memory weather cache: key = "lat:lng" (rounded to 1 decimal place), TTL 1 hour
const weatherCache = new Map<string, CachedWeather>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getOutdoorTemperature(
  latitude: number,
  longitude: number
): Promise<number | null> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    return null;
  }

  // Cache key rounded to ~10km grid
  const cacheKey = `${latitude.toFixed(1)}:${longitude.toFixed(1)}`;
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.tempCelsius;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Weather API] OpenWeatherMap responded with status ${res.status}`);
      return null;
    }

    const data = (await res.json()) as { main?: { temp?: number } };
    const tempCelsius = data.main?.temp;

    if (typeof tempCelsius === "number") {
      weatherCache.set(cacheKey, { tempCelsius, fetchedAt: Date.now() });
      return tempCelsius;
    }

    return null;
  } catch (error) {
    console.warn(
      "[Weather API] Failed to fetch temperature from OpenWeatherMap:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  }
}
