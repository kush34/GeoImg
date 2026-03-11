import { Dimensions, Platform, StyleSheet } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

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

    // ── Photo viewer modal
    viewerContainer: {
        flex: 1,
        backgroundColor: "#000",
    },
    viewerSlide: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    viewerImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },
    viewerCounter: {
        position: "absolute",
        bottom: 48,
        alignSelf: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 20,
    },
    viewerCounterText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 1,
    },
    viewerBackBtn: {
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
    viewerBackText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "300",
        lineHeight: 22,
        marginTop: -1,
    },
    viewerBackLabel: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "600",
    },
});

export default styles;