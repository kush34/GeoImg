import { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  Dimensions, Alert, FlatList, Modal, StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions, CameraType } from "expo-camera";
import * as Location from "expo-location";
import MapView from "react-native-maps";
import { captureRef } from "react-native-view-shot";
import { useGallery } from "@/store/gallaryContext";
import * as MediaLibrary from "expo-media-library";
import { AddressData, WeatherData } from "@/types";
import styles from "@/utils/stylesheet";
import GPSOverlay from "@/components/gps-overlay";
import { fetchWeather } from "@/utils/helpers";
import Toast from "react-native-toast-message";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type AspectRatio = "4:3" | "16:9" | "1:1";
const ASPECT_RATIOS: AspectRatio[] = ["4:3", "16:9", "1:1"];

const aspectRatioToStyle: Record<AspectRatio, { width: number; height: number }> = {
  "4:3": { width: SCREEN_WIDTH, height: (SCREEN_WIDTH * 4) / 3 },
  "16:9": { width: SCREEN_WIDTH, height: (SCREEN_WIDTH * 16) / 9 },
  "1:1": { width: SCREEN_WIDTH, height: SCREEN_WIDTH },
};

export default function Explore() {
  const cameraRef = useRef<CameraView | null>(null);
  const mapRef = useRef<MapView | null>(null);
  const composeViewRef = useRef<View | null>(null);
  const viewerListRef = useRef<FlatList<string>>(null);
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [address, setAddress] = useState<AddressData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [rawPhotoUri, setRawPhotoUri] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [facing, setFacing] = useState<CameraType>("back");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:3");

  const { photos, addPhoto } = useGallery();
  const [permission, requestPermission] = useCameraPermissions();
  const [libraryPermission, requestLibraryPermission] = MediaLibrary.usePermissions();

  useEffect(() => {
    (async () => {
      const [, { status: locStatus }] = await Promise.all([
        requestPermission(),
        Location.requestForegroundPermissionsAsync(),
      ]);
      if (locStatus !== "granted") return;

      const coarseLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(coarseLoc.coords);
      setIsWeatherLoading(true);

      await Promise.allSettled([
        Location.reverseGeocodeAsync({
          latitude: coarseLoc.coords.latitude,
          longitude: coarseLoc.coords.longitude,
        }).then(([geo]) => {
          if (geo) {
            setAddress({
              city: geo.city ?? geo.district ?? "",
              state: geo.region ?? "",
              country: geo.country ?? "",
              street: [geo.streetNumber, geo.street, geo.subregion].filter(Boolean).join(", "),
              postalCode: geo.postalCode ?? "",
            });
          }
        }),
        fetchWeather(
          coarseLoc.coords.latitude,
          coarseLoc.coords.longitude,
          coarseLoc.coords.altitude ?? 0,
        ).then((w) => {
          setWeather(w);
          setIsWeatherLoading(false);
        }).catch(() => {
          setWeather({
            temperature: 0, humidity: 0, windSpeed: 0,
            windDirection: 0, windDirectionLabel: "N",
            altitude: coarseLoc.coords.altitude ?? 0, magneticField: 50,
          });
          setIsWeatherLoading(false);
        }),
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then((loc) => setLocation(loc.coords))
          .catch(() => { }),
      ]);
    })();
  }, []);

  const flipCamera = useCallback(() => {
    setFacing((prev) => (prev === "back" ? "front" : "back"));
  }, []);

  const cycleAspectRatio = useCallback(() => {
    setAspectRatio((prev) => {
      const idx = ASPECT_RATIOS.indexOf(prev);
      return ASPECT_RATIOS[(idx + 1) % ASPECT_RATIOS.length];
    });
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;
    setIsCapturing(true);

    try {
      if (libraryPermission?.status !== "granted") {
        const { status } = await requestLibraryPermission();
        if (status !== "granted") {
          Toast.show({ type: "error", text1: "Permission Denied", text2: "Cannot save photos without gallery permission." });
          setIsCapturing(false);
          return;
        }
      }

      const pic = await cameraRef.current.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!pic?.uri) throw new Error("Camera returned no URI");

      setRawPhotoUri(pic.uri);
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      if (!composeViewRef.current) throw new Error("Compose view not ready");

      const composedUri = await captureRef(composeViewRef, {
        format: "jpg",
        quality: 1,
        result: "tmpfile",
      });

      await MediaLibrary.createAssetAsync(composedUri);
      addPhoto(composedUri);
      setPreview(composedUri);
      Toast.show({ type: "success", text1: "Saved!", text2: "Photo saved to gallery." });
    } catch (e) {
      console.error("Capture error:", e);
      Toast.show({ type: "error", text1: "Error", text2: "Failed to capture photo." });
    } finally {
      setRawPhotoUri(null);
      setIsCapturing(false);
    }
  }, [isCapturing, libraryPermission, requestLibraryPermission, addPhoto]);

  if (!permission || !location) return <View style={styles.loadingScreen} />;

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cameraSize = aspectRatioToStyle[aspectRatio];

  return (
    <View style={styles.container}>
      {rawPhotoUri && (
        <View ref={composeViewRef} collapsable={false} style={[styles.composeView, cameraSize]}>
          <Image source={{ uri: rawPhotoUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <GPSOverlay
            location={location} address={address} weather={weather}
            isWeatherLoading={false} captureViewRef={composeViewRef} mapRef={mapRef}
          />
        </View>
      )}
      <View style={[styles.captureArea, cameraSize]}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} />
        <GPSOverlay
          location={location} address={address} weather={weather}
          isWeatherLoading={isWeatherLoading} captureViewRef={composeViewRef} mapRef={mapRef}
        />
      </View>

      {/* Settings bar: flip + aspect ratio */}



      <Modal visible={viewerOpen} animationType="fade" statusBarTranslucent onRequestClose={() => setViewerOpen(false)}>
        <StatusBar hidden />
        <View style={styles.viewerContainer}>
          <FlatList
            ref={viewerListRef}
            data={photos}
            keyExtractor={(_, i) => i.toString()}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
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
          <TouchableOpacity style={styles.viewerBackBtn} onPress={() => setViewerOpen(false)} activeOpacity={0.8}>
            <Text style={styles.viewerBackText}>‹</Text>
            <Text style={styles.viewerBackLabel}>Back</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.shutterBar}>
        {photos[0] ? (
          <TouchableOpacity onPress={() => setViewerOpen(true)} activeOpacity={0.8}>
            <Image source={{ uri: photos[0] }} style={styles.previewThumb} />
          </TouchableOpacity>
        ) : (
          <View style={styles.previewPlaceholder} />
        )}
        <TouchableOpacity
          style={[styles.shutterButton, isCapturing && styles.shutterButtonDisabled]}
          onPress={takePhoto} disabled={isCapturing} activeOpacity={0.8}
        >
        </TouchableOpacity>
        <View style={settingStyles.settingsBar}>
          <TouchableOpacity onPress={flipCamera} style={settingStyles.settingBtn}>
            <Text style={settingStyles.settingIcon}>⟳</Text>
            <Text style={settingStyles.settingLabel}>Flip</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={cycleAspectRatio} style={settingStyles.settingBtn}>
            <Text style={settingStyles.settingIcon}>⊞</Text>
            <Text style={settingStyles.settingLabel}>{aspectRatio}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const settingStyles = StyleSheet.create({
  settingsBar: {
    flexDirection: "row",
    justifyContent: "center",
    // gap: 12,
    // paddingHorizontal: 16,
    paddingVertical: 8,
    // backgroundColor: "rgba(0,0,0,0.4)",
    margin: 10
  },
  settingBtn: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    // backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
  },
  settingIcon: { fontSize: 18, color: "#fff" },
  settingLabel: { fontSize: 11, color: "#fff", marginTop: 2 },
});