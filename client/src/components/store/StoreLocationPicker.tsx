import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./StoreLocationPicker.css";

const PIN_COLOR = "#4f6ef7";

const pinIcon = L.divIcon({
  className: "store-pin-icon",
  html: `<svg width="26" height="38" viewBox="0 0 26 38" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 0C5.8 0 0 5.8 0 13c0 9.75 13 25 13 25s13-15.25 13-25c0-7.2-5.8-13-13-13z" fill="${PIN_COLOR}"/>
    <circle cx="13" cy="13" r="5" fill="#fff"/>
  </svg>`,
  iconSize: [26, 38],
  iconAnchor: [13, 38],
  popupAnchor: [0, -32],
});

type LatLng = [number, number];

const DEFAULT_CENTER: LatLng = [41.7151, 44.8271];
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 15;
const TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function formatPhotonLabel(properties: PhotonFeature["properties"]): string {
  const { name, housenumber, street, city, state, country } = properties;
  return [
    [name, housenumber].filter(Boolean).join(" "),
    street,
    city,
    state,
    country,
  ]
    .filter(Boolean)
    .join(", ");
}

interface Props {
  latitude: number | null;
  longitude: number | null;
  onChange?: (lat: number, lng: number) => void;
  onClear?: () => void;
  readOnly?: boolean;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnChange({ position }: { position: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, PIN_ZOOM);
    }
  }, [position, map]);
  return null;
}

export default function StoreLocationPicker({
  latitude,
  longitude,
  onChange,
  onClear,
  readOnly = false,
}: Props) {
  const position: LatLng | null =
    latitude != null && longitude != null ? [latitude, longitude] : null;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [justPicked, setJustPicked] = useState(false);
  const [flyTarget, setFlyTarget] = useState<LatLng | null>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (readOnly || query.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      setSearchError("");
      try {
        const params = new URLSearchParams({
          q: query.trim(),
          limit: "5",
        });
        const res = await fetch(
          `https://photon.komoot.io/api/?${params.toString()}`,
        );
        if (!res.ok) throw new Error("search failed");
        const data: PhotonResponse = await res.json();
        setResults(data.features);
      } catch {
        setSearchError("Address search failed. Try again.");
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [query, readOnly]);

  function pickResult(result: PhotonFeature) {
    const [lng, lat] = result.geometry.coordinates;
    const label = formatPhotonLabel(result.properties);
    skipSearchRef.current = true;
    setResults([]);
    setSearching(false);
    setJustPicked(true);
    setQuery(label);
    setFlyTarget([lat, lng]);
    onChange?.(lat, lng);
  }

  function handleQueryChange(value: string) {
    setJustPicked(false);
    setQuery(value);
  }

  if (readOnly) {
    if (!position) {
      return <p className="store-location-empty">Location not set.</p>;
    }
    return (
      <div className="store-location-map store-location-map-readonly">
        <MapContainer
          center={position}
          zoom={PIN_ZOOM}
          scrollWheelZoom
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={TILE_URL} />
          <Marker position={position} icon={pinIcon} />
        </MapContainer>
      </div>
    );
  }

  return (
    <div className="store-location-picker">
      <div className="store-location-search">
        <input
          className="dialog-input"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search for an address…"
        />
        {searching && <span className="store-location-search-spinner" />}
        {!justPicked && results.length > 0 && (
          <ul className="store-location-results">
            {results.map((result) => (
              <li key={result.geometry.coordinates.join(",")}>
                <button type="button" onClick={() => pickResult(result)}>
                  {formatPhotonLabel(result.properties)}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!justPicked &&
          !searching &&
          !searchError &&
          results.length === 0 &&
          query.trim().length >= 3 && (
            <ul className="store-location-results">
              <li className="store-location-no-results">No matches found.</li>
            </ul>
          )}
      </div>
      {searchError && <p className="dialog-error">{searchError}</p>}

      <div className="store-location-map">
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? PIN_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          attributionControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url={TILE_URL} />
          <RecenterOnChange position={flyTarget} />
          <ClickHandler onPick={(lat, lng) => onChange?.(lat, lng)} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const { lat, lng } = e.target.getLatLng();
                  onChange?.(lat, lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="store-location-footer">
        {position ? (
          <span className="store-location-coords">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
        ) : (
          <span className="store-location-hint">
            Search an address or click the map to drop a pin.
          </span>
        )}
        {position && onClear && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClear}
          >
            Clear pin
          </button>
        )}
      </div>
    </div>
  );
}
