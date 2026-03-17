import { WeatherData } from "@/types";

const OWM_API_KEY = process.env.EXPO_PUBLIC_API_URL;

async function fetchWeather(lat: number, lon: number, altitudeFallback: number): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OWM_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OWM error ${res.status}`);
    const data = await res.json();
    const windDir: number = data.wind?.deg ?? 0;
    return {
        temperature: Math.round(data.main?.temp ?? 0),
        humidity: data.main?.humidity ?? 0,
        windSpeed: parseFloat(((data.wind?.speed ?? 0) * 3.6).toFixed(1)), // m/s -> km/h
        windDirection: windDir,
        windDirectionLabel: degreesToCompass(windDir),
        altitude: altitudeFallback,
        magneticField: 50, // not available via OWM; use expo-sensors Magnetometer if needed
    };
}

const degreesToCompass = (deg: number): string => {
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return dirs[Math.round(deg / 45) % 8];
};

const formatDateTime = (date: Date): { dateStr: string; timeStr: string } => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayName = days[date.getDay()];
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12;
    return {
        dateStr: `${day}/${month}/${year} ${dayName}`,
        timeStr: `${hour12}:${minutes} ${ampm}`,
    };
};

export { fetchWeather, degreesToCompass, formatDateTime };