import { OverlayProps } from "@/types";
import { formatDateTime } from "@/utils/helpers";
import styles from "@/utils/stylesheet";

import { ActivityIndicator, Text, View, StyleSheet } from "react-native";
import MapView from "react-native-maps";``

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
  const lat = location?.latitude.toFixed(6) ?? "...";;
  const lon = location?.longitude.toFixed(6) ?? "...";;

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

export default GPSOverlay