import { useState, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Image,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  StatusBar,
  SafeAreaView,
  Platform,
} from "react-native";
import { useGallery } from "../store/gallaryContext";

const { width: W, height: H } = Dimensions.get("window");
const NUM_COLS = 3;
const TILE = W / NUM_COLS;

// ─── Full-screen viewer ───────────────────────────────────────────────────────

interface ViewerProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

function PhotoViewer({ photos, initialIndex, onClose }: ViewerProps) {
  const [current, setCurrent] = useState(initialIndex);
  const listRef = useRef<FlatList<string>>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrent(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    const next = Math.min(current + 1, photos.length - 1);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };
  const goPrev = () => {
    const prev = Math.max(current - 1, 0);
    listRef.current?.scrollToIndex({ index: prev, animated: true });
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <View style={viewer.container}>
        {/* Swipeable photo strip */}
        <FlatList
          ref={listRef}
          data={photos}
          keyExtractor={(_, i) => i.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={viewer.slide}>
              <Image source={{ uri: item }} style={viewer.image} resizeMode="contain" />
            </View>
          )}
        />

        {/* Counter */}
        <View style={viewer.counter}>
          <Text style={viewer.counterText}>
            {current + 1} / {photos.length}
          </Text>
        </View>

        {/* Prev / Next tap zones */}
        {current > 0 && (
          <TouchableOpacity style={[viewer.arrow, viewer.arrowLeft]} onPress={goPrev} activeOpacity={0.7}>
            <Text style={viewer.arrowText}>‹</Text>
          </TouchableOpacity>
        )}
        {current < photos.length - 1 && (
          <TouchableOpacity style={[viewer.arrow, viewer.arrowRight]} onPress={goNext} activeOpacity={0.7}>
            <Text style={viewer.arrowText}>›</Text>
          </TouchableOpacity>
        )}

        {/* Back button (top-left) */}
        <TouchableOpacity style={viewer.backBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={viewer.backText}>‹</Text>
          <Text style={viewer.backLabel}>Back</Text>
        </TouchableOpacity>

        {/* Close */}
        <TouchableOpacity style={viewer.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={viewer.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Gallery page ─────────────────────────────────────────────────────────────

export default function Gallery() {
  const { photos } = useGallery();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const openPhoto = useCallback((index: number) => setViewerIndex(index), []);
  const closeViewer = useCallback(() => setViewerIndex(null), []);

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <TouchableOpacity
        style={styles.tile}
        onPress={() => openPhoto(index)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item }} style={styles.tileImage} resizeMode="cover" />
        {/* Subtle index badge */}
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{index + 1}</Text>
        </View>
      </TouchableOpacity>
    ),
    [openPhoto]
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GALLERY</Text>
        <View style={styles.headerPill}>
          <Text style={styles.headerCount}>{photos.length}</Text>
        </View>
      </View>

      {photos.length === 0 ? (
        // Empty state
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptySubtitle}>Photos you take will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(_, i) => i.toString()}
          numColumns={NUM_COLS}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={5}
        />
      )}

      {/* Full-screen viewer */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "android" ? 16 : 8,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },
  headerPill: {
    backgroundColor: "#FFD700",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: "center",
  },
  headerCount: {
    color: "#000",
    fontSize: 11,
    fontWeight: "800",
  },

  // Grid
  grid: {
    gap: 0,
  },
  tile: {
    width: TILE,
    height: TILE,
    position: "relative",
  },
  tileImage: {
    width: "100%",
    height: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#1a1a1a",
  },
  tileBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tileBadgeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    fontWeight: "600",
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  emptySubtitle: {
    color: "#555",
    fontSize: 13,
  },
});

// Viewer styles
const viewer = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: W,
    height: H,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: W,
    height: H,
  },
  counter: {
    position: "absolute",
    top: 54,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  counterText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
  arrow: {
    position: "absolute",
    top: "50%",
    marginTop: -30,
    backgroundColor: "rgba(255,255,255,0.12)",
    width: 48,
    height: 60,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  arrowLeft: { left: 12 },
  arrowRight: { right: 12 },
  arrowText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "300",
    lineHeight: 40,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 28,
    left: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  backText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "300",
    lineHeight: 22,
    marginTop: -1,
  },
  backLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  closeBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 28,
    right: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});