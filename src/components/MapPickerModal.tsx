import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchLocation } from '../api/dashboardApi';

declare global {
  interface Window {
    L: any;
  }
}

declare const L: any;

interface MapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat: number | null;
  initialLng: number | null;
  onConfirm: (lat: number, lng: number) => void;
}

const MapPickerModal = ({ isOpen, onClose, initialLat, initialLng, onConfirm }: MapPickerModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);
  
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat || 18.58278680,
    lng: initialLng || 73.98157990
  });
  
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Geocoding states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load Leaflet Script and CSS
  useEffect(() => {
    if (!isOpen) return;

    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // CSS
    const linkId = 'leaflet-css-cdn';
    let link = document.getElementById(linkId) as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // JS
    const scriptId = 'leaflet-js-cdn';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      script.onerror = () => setMapError('Failed to load map library.');
      document.head.appendChild(script);
    } else {
      const checkLoaded = setInterval(() => {
        if (window.L) {
          setLeafletLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      return () => clearInterval(checkLoaded);
    }
  }, [isOpen]);

  // Reset selected coordinates when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCoords({
        lat: initialLat || 18.58278680,
        lng: initialLng || 73.98157990
      });
      setSuggestions([]);
      setSearchQuery('');
    }
  }, [isOpen, initialLat, initialLng]);

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !leafletLoaded || !mapRef.current || !window.L) return;

    try {
      const L = window.L;
      const center: [number, number] = [selectedCoords.lat, selectedCoords.lng];

      // Cleanup previous map instance if it exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false // Hide default zoom controls to customize placement
      }).setView(center, 15);
      
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Custom Zoom Control positioning (bottom right)
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Setup custom marker icon to avoid asset loading issues
      const defaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = L.marker(center, {
        draggable: true,
        icon: defaultIcon
      }).addTo(map);
      
      markerInstanceRef.current = marker;

      // Click event on map to place pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        setSelectedCoords({ lat, lng });
      });

      // Drag event on marker to update coordinates
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        if (position) {
          setSelectedCoords({
            lat: position.lat,
            lng: position.lng
          });
        }
      });

    } catch (err) {
      console.error('Failed to initialize Leaflet map', err);
      setMapError('An error occurred while loading the map.');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, [isOpen, leafletLoaded]);

  // Geolocation trigger
  const handleLocateMe = () => {
    if (navigator.geolocation && mapInstanceRef.current && markerInstanceRef.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const map = mapInstanceRef.current;
          const marker = markerInstanceRef.current;
          
          map.setView([lat, lng], 17);
          marker.setLatLng([lat, lng]);
          setSelectedCoords({ lat, lng });
        },
        () => {
          alert('Error: Geolocation permission denied or unavailable.');
        }
      );
    }
  };

  // Address Search Trigger using backend proxy & fallback
  const handleSearch = async (queryStr: string) => {
    if (!queryStr.trim()) return;
    setIsSearching(true);
    try {
      const data = await searchLocation(queryStr);
      setSuggestions(data);
    } catch (err) {
      console.error('Search request failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (place: any) => {
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    
    if (mapInstanceRef.current && markerInstanceRef.current) {
      const map = mapInstanceRef.current;
      const marker = markerInstanceRef.current;
      
      map.setView([lat, lng], 17);
      marker.setLatLng([lat, lng]);
      setSelectedCoords({ lat, lng });
    }
    
    setSearchQuery(place.display_name);
    setSuggestions([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedCoords.lat, selectedCoords.lng);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-2xl flex flex-col h-[85vh] max-h-[650px]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Select Location Pin</h3>
                  <p className="text-xs font-bold text-slate-400">Drag the marker or click on the map to pin restaurant location</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search Bar & Auto-Suggestions Dropdown */}
              {leafletLoaded && !mapError && (
                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 relative z-30">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search for address or landmark..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.length > 2) {
                          handleSearch(e.target.value);
                        } else {
                          setSuggestions([]);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch(searchQuery);
                        }
                      }}
                      className="w-full rounded-2xl bg-white border border-slate-200 pl-11 pr-12 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all focus:border-slate-300 focus:shadow-sm"
                    />
                    
                    {isSearching && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                      </span>
                    )}
                  </div>

                  {/* Suggestions List Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-6 right-6 mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[220px] overflow-y-auto">
                      {suggestions.map((suggestion) => (
                        <button
                          key={suggestion.place_id}
                          type="button"
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-b-0 transition-colors flex items-start gap-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5 text-slate-400 shrink-0 mt-0.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                          </svg>
                          <span className="text-xs font-bold text-slate-700 line-clamp-2">{suggestion.display_name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Map/Loading State */}
              <div className="flex-1 relative bg-slate-50 min-h-[300px] z-10">
                {mapError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Map Loading Error</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">{mapError}</p>
                  </div>
                ) : !leafletLoaded ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#AD221F] rounded-full animate-spin mb-3"></div>
                    <p className="text-xs font-bold text-slate-400">Loading Map Engine...</p>
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full" />
                )}

                {/* Custom Floating Locate Me Button */}
                {leafletLoaded && !mapError && (
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="absolute right-4 bottom-16 z-20 bg-white hover:bg-slate-50 text-slate-700 w-10 h-10 rounded-full flex items-center justify-center shadow-lg border border-slate-100 transition-all hover:scale-105 active:scale-95"
                    title="Get My Current Location"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Footer / Selected coordinates preview */}
              <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white z-20">
                <div className="flex gap-4 text-xs font-bold text-slate-500">
                  <div>
                    <span className="text-slate-400">Lat:</span>{' '}
                    <span className="text-slate-900 bg-slate-50 px-2 py-1 rounded-md">{selectedCoords.lat.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lng:</span>{' '}
                    <span className="text-slate-900 bg-slate-50 px-2 py-1 rounded-md">{selectedCoords.lng.toFixed(6)}</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!leafletLoaded || !!mapError}
                    className="rounded-2xl bg-[#AD221F] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition-all hover:bg-red-800 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Confirm Location
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MapPickerModal;
