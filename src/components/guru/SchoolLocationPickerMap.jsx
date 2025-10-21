// src/components/guru/SchoolLocationPickerMap.jsx (KODE LENGKAP DENGAN PERBAIKAN LOOP)
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Search, Crosshair, MapPin, Loader2, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ========================================
// PRESET LOKASI - HARUS DIUPDATE DENGAN KOORDINAT SMAN 1 PABEDILAN
// ========================================
const SCHOOL_LOCATION = {
  id: "sman1pabedilan",
  name: "SMAN 1 Pabedilan",
  icon: "🏫",
  // **PERHATIAN:** GANTI DENGAN KOORDINAT AKURAT SMAN 1 PABEDILAN!
  latitude: -6.728, // Placeholder Latitude
  longitude: 108.48, // Placeholder Longitude
  radiusMeters: 50, // Default radius yang akan dikirim
  color: "green",
};

// Lokasi tambahan jika ada, misalnya ruang guru, lapangan, dll.
const PRESET_LOCATIONS = [
  SCHOOL_LOCATION,
  {
    id: 2,
    name: "Ruang Guru",
    icon: "🧑‍🏫",
    latitude: SCHOOL_LOCATION.latitude + 0.0001,
    longitude: SCHOOL_LOCATION.longitude - 0.0001,
    radiusMeters: 20,
    color: "yellow",
  },
];
// ========================================

function LocationMarker({ position, onLocationChange }) {
  const map = useMapEvents({
    click(e) {
      // Memungkinkan klik pada peta untuk memilih lokasi
      onLocationChange({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? (
    <Marker position={[position.latitude, position.longitude]} />
  ) : null;
}

export default function SchoolLocationPickerMap({
  onLocationSelect,
  initialLocation,
  initialRadius, // Tambahkan prop untuk radius awal
}) {
  const defaultCenter = {
    latitude: SCHOOL_LOCATION.latitude,
    longitude: SCHOOL_LOCATION.longitude,
  };

  const [position, setPosition] = useState(initialLocation || defaultCenter);
  const [radius, setRadius] = useState(
    initialLocation ? initialRadius : SCHOOL_LOCATION.radiusMeters
  ); // State untuk radius
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Gunakan ref untuk menyimpan nilai terakhir yang diteruskan ke onLocationSelect
  const lastEmittedLocationRef = useRef(null);

  // Efek inisialisasi (initialLocation diproses di sini)
  useEffect(() => {
    if (initialLocation) {
      setPosition(initialLocation);
    } else {
      setPosition(defaultCenter);
      setRadius(SCHOOL_LOCATION.radiusMeters);
    }
  }, [initialLocation]); // Hanya run saat initialLocation berubah

  // **FIX**: Logika ini akan memicu loop jika `onLocationSelect` memicu state di parent
  // Kita perlu memastikan pemanggilan terjadi HANYA jika ada perubahan nilai yang signifikan.
  useEffect(() => {
    const currentLocationKey = `${position.latitude.toFixed(
      5
    )}-${position.longitude.toFixed(5)}-${radius}`;

    if (
      onLocationSelect &&
      lastEmittedLocationRef.current !== currentLocationKey
    ) {
      onLocationSelect({
        latitude: position.latitude,
        longitude: position.longitude,
        radiusMeters: radius,
      });
      lastEmittedLocationRef.current = currentLocationKey;
    }
  }, [position, radius, onLocationSelect]);

  const handleGetCurrentLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setPosition(newPos);
        setRadius(SCHOOL_LOCATION.radiusMeters); // Reset radius
        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.");
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Multi-provider search (Sama seperti sebelumnya)
  const searchMultiProvider = async (query) => {
    // ... (Logika searchMultiProvider sama seperti sebelumnya) ...
    const results = [];

    try {
      const photonResponse = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${
          defaultCenter.latitude
        }&lon=${defaultCenter.longitude}&limit=5`
      );
      const photonData = await photonResponse.json();

      if (photonData.features) {
        photonData.features.forEach((feature) => {
          results.push({
            provider: "photon",
            lat: feature.geometry.coordinates[1],
            lon: feature.geometry.coordinates[0],
            display_name:
              feature.properties.name || feature.properties.street || "Lokasi",
            address: [
              feature.properties.street,
              feature.properties.city || feature.properties.county,
              feature.properties.state,
              feature.properties.country,
            ]
              .filter(Boolean)
              .join(", "),
            type: feature.properties.type,
            importance: 1,
          });
        });
      }
    } catch (error) {
      console.warn("Photon search failed:", error);
    }

    try {
      const nominatimResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=id&limit=5&addressdetails=1`
      );
      const nominatimData = await nominatimResponse.json();

      nominatimData.forEach((item) => {
        results.push({
          provider: "nominatim",
          lat: item.lat,
          lon: item.lon,
          display_name: item.display_name,
          address: item.display_name,
          type: item.type,
          importance: item.importance || 0.5,
        });
      });
    } catch (error) {
      console.warn("Nominatim search failed:", error);
    }

    // 3. Deduplikasi
    const uniqueResults = [];
    results.forEach((result) => {
      const isDuplicate = uniqueResults.some((existing) => {
        const distance = Math.sqrt(
          Math.pow(
            (parseFloat(result.lat) - parseFloat(existing.lat)) * 111000,
            2
          ) +
            Math.pow(
              (parseFloat(result.lon) - parseFloat(existing.lon)) * 111000,
              2
            )
        );
        return distance < 50; // 50 meter threshold
      });

      if (!isDuplicate) {
        uniqueResults.push(result);
      }
    });

    return uniqueResults
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8);
  };

  // Debounced autocomplete search
  const handleAutocompleteSearch = useCallback(
    async (query) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);

      try {
        const results = await searchMultiProvider(query);
        setSearchResults(results);
        setShowResults(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Error searching location:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [defaultCenter.latitude, defaultCenter.longitude]
  );

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for autocomplete
    searchTimeoutRef.current = setTimeout(() => {
      handleAutocompleteSearch(value);
    }, 500); // 500ms debounce
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Clear timeout if user clicks search button
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);

    try {
      const results = await searchMultiProvider(searchQuery);

      if (results.length > 0) {
        setSearchResults(results);
        setShowResults(true);
        setSelectedIndex(-1);
      } else {
        alert(
          "Lokasi tidak ditemukan. Coba kata kunci lain atau gunakan lokasi saat ini."
        );
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Gagal mencari lokasi. Silakan coba lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  // **FIX**: Memastikan semua state diupdate secara bersamaan (position, radius, searchQuery)
  const handleSelectSearchResult = (result) => {
    const newPos = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
    setPosition(newPos);
    setRadius(SCHOOL_LOCATION.radiusMeters); // Set radius default sekolah saat memilih hasil pencarian
    setSearchQuery(result.display_name);
    setShowResults(false);
    inputRef.current?.focus();
  };

  // **FIX**: Handle Preset juga perlu update radius
  const handleSelectPresetLocation = (preset) => {
    const newPos = {
      latitude: preset.latitude,
      longitude: preset.longitude,
    };
    setPosition(newPos);
    setRadius(preset.radiusMeters || SCHOOL_LOCATION.radiusMeters); // Set radius dari preset atau default
    setSearchQuery(preset.name);
    setShowResults(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleSelectSearchResult(searchResults[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowResults(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Preset Lokasi - Quick Select (UX Improvement) */}
      <div className="card p-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-lg">{SCHOOL_LOCATION.icon}</span>
          </div>
          <span className="font-semibold text-gray-900">
            Lokasi Favorit (SMAN 1 Pabedilan)
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {PRESET_LOCATIONS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPresetLocation(preset)}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-[1.02] active:scale-95 text-left ${
                position.latitude === preset.latitude &&
                position.longitude === preset.longitude
                  ? "border-green-500 bg-green-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{preset.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 line-clamp-1">
                    {preset.name}
                  </p>
                  <p className="text-xs text-gray-600 font-mono mt-0.5">
                    Lat: {preset.latitude.toFixed(4)}, Lon:{" "}
                    {preset.longitude.toFixed(4)}
                  </p>
                </div>
                <div className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 flex-shrink-0">
                  Radius: {preset.radiusMeters}m
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar with Autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Cari lokasi lain (minimal 3 huruf)..."
              className="input-field pl-10"
              autoComplete="off"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-10 top-1/2 -translate-y-1/2 z-10">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              </div>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="btn-primary px-5 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            Cari
          </button>
        </div>

        {/* Autocomplete Results Dropdown (UX Improvement) */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 card max-h-80 overflow-y-auto z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-semibold text-gray-500">
                {searchResults.length} hasil ditemukan
              </p>
            </div>
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSearchResult(result)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 ${
                  selectedIndex === idx ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedIndex === idx ? "bg-blue-100" : "bg-blue-50"
                    }`}
                  >
                    <MapPin
                      className={`w-5 h-5 ${
                        selectedIndex === idx
                          ? "text-blue-600"
                          : "text-blue-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                      {result.display_name}
                    </p>
                    {result.address && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {result.address}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          result.provider === "photon"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {result.provider === "photon" ? "🎯 Akurat" : "📍 OSM"}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {parseFloat(result.lat).toFixed(5)},{" "}
                        {parseFloat(result.lon).toFixed(5)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Gunakan ↑↓ untuk navigasi keyboard, Enter untuk pilih, Esc untuk
                tutup
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={handleGetCurrentLocation}
          disabled={isGettingLocation}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span>Mendapatkan Lokasi...</span>
            </>
          ) : (
            <>
              <Crosshair className="w-5 h-5 text-blue-600" />
              <span>Gunakan Lokasi Saat Ini</span>
            </>
          )}
        </button>

        <button
          onClick={() => setShowResults(false)}
          disabled={!showResults}
          className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Tutup Hasil Cari
        </button>
      </div>

      {/* Selected Coordinates Display & Radius Control (UX Improvement) */}
      <div className="card p-4 bg-indigo-50/50 border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-semibold text-gray-900">
            Lokasi & Radius Sesi
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium">Latitude</p>
            <p className="font-mono text-sm font-bold text-gray-900">
              {position.latitude.toFixed(6)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1 font-medium">Longitude</p>
            <p className="font-mono text-sm font-bold text-gray-900">
              {position.longitude.toFixed(6)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="text-xs text-gray-500 mb-1 block font-medium">
              Radius (m)
            </label>
            <input
              type="number"
              min="10"
              max="500"
              value={radius}
              onChange={(e) =>
                setRadius(Math.max(10, Math.min(500, Number(e.target.value))))
              }
              className="input-field w-full p-0 h-auto text-sm font-bold text-gray-900 border-none focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border-2 border-gray-300 shadow-xl">
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-600 flex items-center gap-2">
            <MapPin className="w-3 h-3 text-red-500" />
            <span>Klik peta untuk mengatur titik GPS secara manual.</span>
          </p>
        </div>

        <MapContainer
          center={[position.latitude, position.longitude]}
          zoom={16}
          style={{ height: "400px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} onLocationChange={setPosition} />
        </MapContainer>
      </div>
    </div>
  );
}
