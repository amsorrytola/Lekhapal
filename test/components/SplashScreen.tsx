// components/SplashScreen.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { Video, Audio } from "expo-av";
import * as Asset from "expo-asset";

type Props = {
  onFinish: () => void;
  minDurationMs?: number; // default 1500
  videoAsset?: any; // e.g. require('../assets/video/SplashScreen.mp4')
  poster?: any; // e.g. require('../assets/images/logo.png')
};

export default function SplashScreen({
  onFinish,
  minDurationMs = 1500,
  videoAsset = require("../assets/video/SplashScreen.mp4"),
  poster = require("../assets/images/logo.png"),
}: Props) {
  const videoRef = useRef<Video | null>(null);
  const [assetLoaded, setAssetLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [playbackFinished, setPlaybackFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("[Splash] mount", { minDurationMs, videoAsset });

  // hide native status bar while splash is visible
  useEffect(() => {
    RNStatusBar.setHidden(true, true);
    return () => {
      RNStatusBar.setHidden(false, true);
    };
  }, []);

  // minimum display timer
  useEffect(() => {
    console.log("[Splash] starting minimum timer", minDurationMs);
    const t = setTimeout(() => {
      console.log("[Splash] minimum time elapsed");
      setMinTimeElapsed(true);
    }, minDurationMs);
    return () => clearTimeout(t);
  }, [minDurationMs]);

  // preload asset and enable audio in silent mode on iOS
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        console.log("[Splash] Asset.fromModule ->", videoAsset);
        const asset = Asset.Asset.fromModule(videoAsset);
        await asset.downloadAsync();
        if (!mounted) return;
        console.log("[Splash] asset downloaded ok");
        setAssetLoaded(true);

        // configure audio so it plays in silent mode on iOS
        try {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true, // IMPORTANT for iOS
            staysActiveInBackground: false,
            shouldDuckAndroid: true,
          });
          console.log("[Splash] Audio mode configured (playsInSilentModeIOS=true)");
        } catch (audioErr) {
          console.warn("[Splash] Audio.setAudioModeAsync failed:", audioErr);
        }
      } catch (err: any) {
        console.error("[Splash] asset preload failed:", err);
        setError(`Asset load failed: ${err?.message || String(err)}`);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [videoAsset]);

  // start playback once asset loaded. use replayAsync to ensure start at 0
  useEffect(() => {
    if (!assetLoaded) return;
    (async () => {
      try {
        if (videoRef.current) {
          console.log("[Splash] calling replayAsync()");
          await videoRef.current.replayAsync();
          // ensure audible for debug
          try {
            await videoRef.current.setVolumeAsync(1.0);
            console.log("[Splash] volume set to 1.0");
          } catch (vErr) {
            console.warn("[Splash] setVolumeAsync failed:", vErr);
          }
        } else {
          console.log("[Splash] videoRef not ready yet — waiting for onLoad");
        }
      } catch (playErr) {
        console.error("[Splash] play failed:", playErr);
      }
    })();
  }, [assetLoaded]);

  // finalize when both minTime and playback finish (or if we have error)
  useEffect(() => {
    console.log(
      "[Splash] status check",
      { minTimeElapsed, playbackFinished, videoReady, error }
    );
    if ((playbackFinished || !!error) && minTimeElapsed) {
      console.log("[Splash] conditions met -> onFinish()");
      onFinish();
    }
  }, [minTimeElapsed, playbackFinished, videoReady, error, onFinish]);

  const onPlaybackStatusUpdate = (status: any) => {
    if (!status) return;
    const { isLoaded, isPlaying, didJustFinish, positionMillis, durationMillis, error: sErr } = status;
    console.log("[Splash] playbackStatus:", {
      isLoaded,
      isPlaying,
      didJustFinish,
      positionMillis,
      durationMillis,
      sErr,
    });

    if (!videoReady && isLoaded) setVideoReady(true);
    if (didJustFinish) {
      console.log("[Splash] playback finished");
      setPlaybackFinished(true);
    }
    if (sErr) {
      console.error("[Splash] playback status error:", sErr);
      setError(String(sErr));
    }
  };

  // if error -> show poster until minTimeElapsed then call onFinish
  if (error) {
    console.warn("[Splash] error, showing fallback poster:", error);
    return (
      <View style={styles.container}>
        <Image source={poster} style={styles.fullCover} resizeMode="cover" />
        {!minTimeElapsed && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
      </View>
    );
  }

  return (
  <View style={styles.container}>
    <Video
      ref={(r) => (videoRef.current = r)}
      source={videoAsset}
      style={StyleSheet.absoluteFill} // ✅ fills the entire screen
      resizeMode={Video.RESIZE_MODE_COVER}
      useNativeControls={false}
      shouldPlay={false}
      isLooping={false}
      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      onError={(e) => {
        console.error("[Splash] Video onError:", e);
        setError(String(e?.nativeEvent?.error || JSON.stringify(e)));
      }}
    />

    {!videoReady && <ActivityIndicator style={styles.loadingIndicator} size="large" />}
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loadingIndicator: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
  },
});
