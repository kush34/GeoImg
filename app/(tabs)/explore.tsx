import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import MapView from "react-native-maps";
import { captureRef } from "react-native-view-shot";
import { useGallery } from "../store/gallaryContext";
import * as MediaLibrary from "expo-media-library";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── Replace with your OpenWeatherMap API key ──────────────────────────────────
const OWM_API_KEY = "YOUR_OPENWEATHERMAP_API_KEY";

// ─── OpenWeatherMap fetch ─────────────────────────────────────────────────────
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  windDirectionLabel: string;
  altitude: number;
  magneticField: number;
}

interface AddressData {
  city: string;
  state: string;
  country: string;
  street: string;
  postalCode: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface OverlayProps {
  location: Location.LocationObjectCoords;
  address: AddressData | null;
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  captureViewRef: React.RefObject<View | null>;
  mapRef: React.RefObject<MapView | null>;
}

const GPSOverlay: React.FC<OverlayProps> = ({
  location,
  address,
  weather,
  isWeatherLoading,
  captureViewRef,
  mapRef,
}) => {
  const now = new Date();
  const { dateStr, timeStr } = formatDateTime(now);
  const lat = location.latitude.toFixed(6);
  const lon = location.longitude.toFixed(6);

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Weather loading indicator — top-left */}
      {isWeatherLoading && (
        <View style={styles.weatherLoader}>
          <ActivityIndicator size="small" color="#FFD700" />
          <Text style={styles.weatherLoaderText}>Fetching weather…</Text>
        </View>
      )}

      {/* Bottom overlay panel */}
      <View style={styles.overlayPanel}>
        {/* Map thumbnail */}
        <View style={styles.mapThumbnail}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          />
          {/* Pin icon */}
          <View style={styles.mapPin}>
            <View style={styles.mapPinCircle} />
          </View>
          <Text style={styles.mapLegal}>Legal</Text>
        </View>

        {/* GPS Info */}
        <View style={styles.gpsInfo}>
          {/* Location title */}
          <Text style={styles.locationTitle}>
            {address
              ? `${address.city}, ${address.state}, ${address.country}`
              : `${lat}°, ${lon}°`}
          </Text>

          {/* Street */}
          {address && (
            <Text style={styles.locationSubtitle}>
              {address.street}
              {address.postalCode ? `, ${address.postalCode}` : ""}
            </Text>
          )}

          {/* Coordinates */}
          <Text style={styles.coordText}>
            Lat {lat}° Long {lon}°
          </Text>

          {/* Date & Time */}
          <Text style={styles.coordText}>
            {dateStr}, {timeStr}
          </Text>

          {/* Weather row 1 */}
          {weather && (
            <View style={styles.weatherRow}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>💨</Text>
                <Text style={styles.weatherText}>{weather.windSpeed.toFixed(1)} km/h</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>💧</Text>
                <Text style={styles.weatherText}>{weather.humidity}%</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>✨</Text>
                <Text style={styles.weatherText}>{weather.magneticField} uT</Text>
              </View>
            </View>
          )}

          {/* Weather row 2 */}
          {weather && (
            <View style={styles.weatherRow}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>🌤</Text>
                <Text style={styles.weatherText}>{weather.temperature}°C</Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>🧭</Text>
                <Text style={styles.weatherText}>
                  {weather.windDirection}° {weather.windDirectionLabel}
                </Text>
              </View>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherIcon}>⛰</Text>
                <Text style={styles.weatherText}>{weather.altitude.toFixed(2)} m</Text>
              </View>
            </View>
          )}

          {/* Branding */}
          <Text style={styles.brandingText}>Tag: GPS Map Camera</Text>
        </View>
      </View>

      {/* Top-right branding badge */}
      <View style={styles.brandingBadge}>
        <Text style={styles.brandingBadgeIcon}>📍</Text>
        <View>
          <Text style={styles.brandingBadgeTitle}>GPS MAP</Text>
          <Text style={styles.brandingBadgeSubtitle}>CAMERA</Text>
        </View>
      </View>
    </View>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Explore() {
  const cameraRef = useRef<CameraView | null>(null);
  const captureViewRef = useRef<View | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  // Compositing: raw camera URI staged here before captureRef
  const [rawPhotoUri, setRawPhotoUri] = useState<string | null>(null);
  const composeViewRef = useRef<View | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();
  const { addPhoto } = useGallery();

  // ── Permissions & Location ──────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      // Request camera + location permissions in parallel
      const [, { status: locStatus }] = await Promise.all([
        requestPermission(),
        Location.requestForegroundPermissionsAsync(),
      ]);
      if (locStatus !== "granted") return;

      // Step 1: Fast coarse fix → camera renders immediately
      const coarseLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(coarseLoc.coords);

      // Step 2: Reverse geocode + weather + high-accuracy fix all in parallel
      setIsWeatherLoading(true);
      await Promise.allSettled([
        // Reverse geocode (uses coarse coords, fast)
        Location.reverseGeocodeAsync({
          latitude: coarseLoc.coords.latitude,
          longitude: coarseLoc.coords.longitude,
        }).then(([geo]) => {
          if (geo) {
            setAddress({
              city: geo.city ?? geo.district ?? "",
              state: geo.region ?? "",
              country: geo.country ?? "",
              street: [geo.streetNumber, geo.street, geo.subregion]
                .filter(Boolean)
                .join(", "),
              postalCode: geo.postalCode ?? "",
            });
          }
        }),
        // Weather fetch (uses coarse coords, fine enough for weather)
        fetchWeather(
          coarseLoc.coords.latitude,
          coarseLoc.coords.longitude,
          coarseLoc.coords.altitude ?? 0,
        ).then((w) => {
          setWeather(w);
          setIsWeatherLoading(false);
        }).catch((e) => {
          console.warn("Weather fetch failed:", e);
          setWeather({
            temperature: 0, humidity: 0, windSpeed: 0,
            windDirection: 0, windDirectionLabel: "N",
            altitude: coarseLoc.coords.altitude ?? 0, magneticField: 50,
          });
          setIsWeatherLoading(false);
        }),
        // High-accuracy GPS fix in background — updates coords when ready
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then((loc) => setLocation(loc.coords))
          .catch(() => {}),
      ]);
    })();
  }, []);

  // ── Capture ─────────────────────────────────────────────────────────────────

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      // Ensure library permission
      if (libraryPermission?.status !== "granted") {
        const { status } = await requestLibraryPermission();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Cannot save photos without gallery permission.");
          setIsCapturing(false);
          return;
        }
      }

      // Step 1: Capture raw camera frame
      const pic = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!pic?.uri) throw new Error("Camera returned no URI");

      // Step 2: Mount in hidden compose view, wait one frame for layout
      setRawPhotoUri(pic.uri);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (!composeViewRef.current) throw new Error("Compose view not ready");

      // Step 3: Capture composed view (photo + overlay)
      const composedUri = await captureRef(composeViewRef, {
        format: "jpg",
        quality: 1,
        result: "tmpfile",
      });

      // Step 4: Save to gallery
      await MediaLibrary.createAssetAsync(composedUri);
      addPhoto(composedUri);
      setPreview(composedUri);
      Alert.alert("Saved!", "Photo saved to gallery.");
    } catch (e) {
      console.error("Capture error:", e);
      Alert.alert("Error", "Failed to capture photo.");
    } finally {
      setRawPhotoUri(null);
      setIsCapturing(false);
    }
  }, [isCapturing, libraryPermission, requestLibraryPermission, addPhoto]);

  // ── Guards ──────────────────────────────────────────────────────────────────

  if (!permission || !location) {
    return <View style={styles.loadingScreen} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Hidden compose view: camera photo + overlay, captured by captureRef */}
      {rawPhotoUri && (
        <View ref={composeViewRef} collapsable={false} style={styles.composeView}>
          <Image
            source={{ uri: rawPhotoUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <GPSOverlay
            location={location}
            address={address}
            weather={weather}
            isWeatherLoading={false}
            captureViewRef={composeViewRef}
            mapRef={mapRef}
          />
        </View>
      )}

      {/* Live camera preview */}
      <View style={styles.captureArea}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} />
        <GPSOverlay
          location={location}
          address={address}
          weather={weather}
          isWeatherLoading={isWeatherLoading}
          captureViewRef={composeViewRef}
          mapRef={mapRef}
        />
      </View>

      {/* Shutter button */}
      <View style={styles.shutterBar}>
        {/* Last photo preview */}
        {preview ? (
          <Image source={{ uri: preview }} style={styles.previewThumb} />
        ) : (
          <View style={styles.previewPlaceholder} />
        )}

        <TouchableOpacity
          style={[styles.shutterButton, isCapturing && styles.shutterButtonDisabled]}
          onPress={takePhoto}
          disabled={isCapturing}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        {/* Spacer to balance the layout */}
        <View style={styles.previewPlaceholder} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#000",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  permissionButton: {
    backgroundColor: "#FFD700",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },

  // ── Hidden compose view (off-screen, used for captureRef)
  composeView: {
    position: "absolute",
    top: -9999,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    overflow: "hidden",
  },

  // ── Capture area
  captureArea: {
    flex: 1,
    overflow: "hidden",
  },

  // ── Overlay
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  overlayPanel: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.72)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "flex-start",
    gap: 10,
  },

  // Map thumbnail
  mapThumbnail: {
    width: 110,
    height: 110,
    borderRadius: 6,
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
  },
  mapPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -10,
    marginLeft: -6,
    alignItems: "center",
  },
  mapPinCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#e53935",
    borderWidth: 2,
    borderColor: "#fff",
  },
  mapLegal: {
    position: "absolute",
    bottom: 2,
    left: 4,
    fontSize: 8,
    color: "rgba(255,255,255,0.7)",
  },

  // GPS Info text block
  gpsInfo: {
    flex: 1,
    gap: 2,
  },
  locationTitle: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  locationSubtitle: {
    color: "#eee",
    fontSize: 10,
    lineHeight: 14,
  },
  coordText: {
    color: "#ccc",
    fontSize: 10,
    lineHeight: 14,
  },
  weatherRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  weatherItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  weatherIcon: {
    fontSize: 10,
  },
  weatherText: {
    color: "#ccc",
    fontSize: 10,
  },
  brandingText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    marginTop: 3,
  },

  // Weather loading indicator (top-left)
  weatherLoader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 32,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  weatherLoaderText: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // GPS Map Camera badge (top-right)
  brandingBadge: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 32,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  brandingBadgeIcon: {
    fontSize: 22,
  },
  brandingBadgeTitle: {
    color: "#FFD700",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  brandingBadgeSubtitle: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 2,
  },

  // ── Shutter bar
  shutterBar: {
    height: 100,
    backgroundColor: "#111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 30,
  },
  previewThumb: {
    width: 54,
    height: 54,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#444",
  },
  previewPlaceholder: {
    width: 54,
    height: 54,
  },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#aaa",
  },
  shutterButtonDisabled: {
    opacity: 0.4,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ddd",
  },
});