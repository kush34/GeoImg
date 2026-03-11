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
  FlatList,
  Modal,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import MapView from "react-native-maps";
import { captureRef } from "react-native-view-shot";
import { useGallery } from "../store/gallaryContext";
import * as MediaLibrary from "expo-media-library";
import { AddressData, WeatherData } from "../types";
import styles from "../utils/stylesheet";
import GPSOverlay from "@/components/gps-overlay";
import { fetchWeather } from "../utils/helpers";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");





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
  const [viewerOpen, setViewerOpen] = useState(false);
  const viewerListRef = useRef<FlatList<string>>(null);
  const { photos } = useGallery();
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
          .catch(() => { }),
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

      {/* Photo viewer modal */}
      <Modal visible={viewerOpen} animationType="fade" statusBarTranslucent onRequestClose={() => setViewerOpen(false)}>
        <StatusBar hidden />
        <View style={styles.viewerContainer}>
          <FlatList
            ref={viewerListRef}
            data={photos}
            keyExtractor={(_, i) => i.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={photos.indexOf(preview ?? "") >= 0 ? photos.indexOf(preview ?? "") : 0}
            getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
            renderItem={({ item, index }) => (
              <View style={styles.viewerSlide}>
                <Image source={{ uri: item }} style={styles.viewerImage} resizeMode="contain" />
                <View style={styles.viewerCounter}>
                  <Text style={styles.viewerCounterText}>{index + 1} / {photos.length}</Text>
                </View>
              </View>
            )}
          />
          {/* Back button */}
          <TouchableOpacity style={styles.viewerBackBtn} onPress={() => setViewerOpen(false)} activeOpacity={0.8}>
            <Text style={styles.viewerBackText}>‹</Text>
            <Text style={styles.viewerBackLabel}>Back</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Shutter button */}
      <View style={styles.shutterBar}>
        {/* Last photo preview — tap to open viewer */}
        {photos[0] ? (
          <TouchableOpacity onPress={() => setViewerOpen(true)} activeOpacity={0.8}>
            <Image source={{ uri: photos[0] }} style={styles.previewThumb} />
          </TouchableOpacity>
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

