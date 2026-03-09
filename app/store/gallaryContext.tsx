import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export const GalleryProvider = ({ children }: { children: React.ReactNode }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted photos on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPhotos(JSON.parse(raw));
      })
      .catch((e) => console.warn('Failed to load gallery:', e))
      .finally(() => setIsLoaded(true));
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