interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windDirectionLabel: string;
    altitude: number;
    magneticField: number;
}


interface OverlayProps {
    location: Location.LocationObjectCoords;
    address: AddressData | null;
    weather: WeatherData | null;
    isWeatherLoading: boolean;
    captureViewRef: React.RefObject<View | null>;
    mapRef: React.RefObject<MapView | null>;
}

interface AddressData {
    city: string;
    state: string;
    country: string;
    street: string;
    postalCode: string;
}

export { OverlayProps, WeatherData, AddressData }