import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

const STORAGE_KEY = 'gallery_photos';

interface GalleryContextType {
  photos: string[];
  addPhoto: (uri: string) => void;
  isLoaded: boolean;
}

const GalleryContext = createContext<GalleryContextType>({
  photos: [],
  addPhoto: () => {},
  isLoaded: false,
});

async function fileExists(uri: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch {
    return false;
  }
}

export const GalleryProvider = ({ children }: { children: React.ReactNode }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved: string[] = JSON.parse(raw);

          const existence = await Promise.all(saved.map(fileExists));
          const valid = saved.filter((_, i) => existence[i]);

          if (valid.length !== saved.length) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
          }

          setPhotos(valid);
        }
      } catch (e) {
        console.warn('Failed to load gallery:', e);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, []);

  const addPhoto = useCallback((uri: string) => {
    setPhotos((prev) => {
      const updated = [uri, ...prev];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.warn('Failed to save gallery:', e)
      );
      return updated;
    });
  }, []);

  return (
    <GalleryContext.Provider value={{ photos, addPhoto, isLoaded }}>
      {children}
    </GalleryContext.Provider>
  );
};

export const useGallery = () => useContext(GalleryContext);