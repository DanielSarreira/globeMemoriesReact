/**
 * SearchMarkerLayer.jsx — renders the single purple marker that
 * represents the user's current search result. Distinct colour so
 * it never gets confused with regular trip pins.
 */
import React from "react";
import { Marker, Popup } from "react-leaflet";
import { Eye, Navigation, MapPin } from "lucide-react";
import { useTripIcon } from "../markers/useTripIcon";

const SEARCH_COLOR = "#8b5cf6";
const SEARCH_TYPE = "search";

const openStreetView = (lat, lng) => {
  // Open Google Maps at this point in 360° Street View.
  const url = `https://www.google.com/maps/@${lat},${lng},3a,75y,0h,90t/data=!3m7!1e1`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const openGoogleMaps = (lat, lng) => {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const SearchMarkerLayer = ({ searchMarker }) => {
  const icon = useTripIcon(SEARCH_COLOR, SEARCH_TYPE);
  if (!searchMarker || !Array.isArray(searchMarker.coordinates)) return null;
  const [lat, lng] = searchMarker.coordinates;

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <div className="gm-search-popup">
          <div className="gm-search-popup__head">
            <MapPin size={14} strokeWidth={1.75} />
            <strong>{searchMarker.name}</strong>
          </div>
          {searchMarker.city && searchMarker.country && (
            <p className="gm-search-popup__loc">
              {searchMarker.city}, {searchMarker.country}
            </p>
          )}
          <div className="gm-search-popup__actions">
            <button
              type="button"
              className="gm-search-popup__btn gm-search-popup__btn--ghost"
              onClick={() => openStreetView(lat, lng)}
            >
              <Eye size={12} strokeWidth={1.75} /> Street View
            </button>
            <button
              type="button"
              className="gm-search-popup__btn"
              onClick={() => openGoogleMaps(lat, lng)}
            >
              <Navigation size={12} strokeWidth={1.75} /> Google Maps
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default React.memo(SearchMarkerLayer);
