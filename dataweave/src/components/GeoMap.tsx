'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { X, MapPin, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import('react-leaflet').then((mod) => mod.CircleMarker),
    { ssr: false }
);

interface GeoMapProps {
    data: Record<string, unknown>[];
    columns: { name: string; type: string }[];
    onClose: () => void;
}

interface GeoPoint {
    lat: number;
    lng: number;
    value: number;
    label: string;
}

// Common country coordinates
const COUNTRY_COORDS: Record<string, [number, number]> = {
    'usa': [39.8283, -98.5795], 'united states': [39.8283, -98.5795],
    'uk': [55.3781, -3.4360], 'united kingdom': [55.3781, -3.4360], 'britain': [55.3781, -3.4360],
    'canada': [56.1304, -106.3468], 'australia': [-25.2744, 133.7751],
    'germany': [51.1657, 10.4515], 'france': [46.2276, 2.2137],
    'italy': [41.8719, 12.5674], 'spain': [40.4637, -3.7492],
    'japan': [36.2048, 138.2529], 'china': [35.8617, 104.1954],
    'india': [20.5937, 78.9629], 'brazil': [-14.2350, -51.9253],
    'russia': [61.5240, 105.3188], 'mexico': [23.6345, -102.5528],
    'south korea': [35.9078, 127.7669], 'korea': [35.9078, 127.7669],
    'netherlands': [52.1326, 5.2913], 'belgium': [50.5039, 4.4699],
    'switzerland': [46.8182, 8.2275], 'austria': [47.5162, 14.5501],
    'sweden': [60.1282, 18.6435], 'norway': [60.4720, 8.4689],
    'denmark': [56.2639, 9.5018], 'finland': [61.9241, 25.7482],
    'poland': [51.9194, 19.1451], 'portugal': [39.3999, -8.2245],
    'ireland': [53.1424, -7.6921], 'new zealand': [-40.9006, 174.8860],
    'singapore': [1.3521, 103.8198], 'hong kong': [22.3193, 114.1694],
    'argentina': [-38.4161, -63.6167], 'chile': [-35.6751, -71.5430],
    'south africa': [-30.5595, 22.9375], 'egypt': [26.8206, 30.8025],
    'nigeria': [9.0820, 8.6753], 'kenya': [-0.0236, 37.9062],
    'pakistan': [30.3753, 69.3451], 'indonesia': [-0.7893, 113.9213],
    'thailand': [15.8700, 100.9925], 'vietnam': [14.0583, 108.2772],
    'malaysia': [4.2105, 101.9758], 'philippines': [12.8797, 121.7740],
    'turkey': [38.9637, 35.2433], 'greece': [39.0742, 21.8243],
    'czech': [49.8175, 15.4730], 'czechia': [49.8175, 15.4730],
    'hungary': [47.1625, 19.5033], 'romania': [45.9432, 24.9668],
    'ukraine': [48.3794, 31.1656], 'israel': [31.0461, 34.8516],
    'uae': [23.4241, 53.8478], 'saudi arabia': [23.8859, 45.0792],
};

// US State coordinates
const US_STATE_COORDS: Record<string, [number, number]> = {
    'alabama': [32.3182, -86.9023], 'alaska': [64.2008, -152.4937],
    'arizona': [34.0489, -111.0937], 'arkansas': [34.7465, -92.2896],
    'california': [36.7783, -119.4179], 'colorado': [39.5501, -105.7821],
    'connecticut': [41.6032, -73.0877], 'delaware': [38.9108, -75.5277],
    'florida': [27.6648, -81.5158], 'georgia': [32.1656, -82.9001],
    'hawaii': [19.8968, -155.5828], 'idaho': [44.0682, -114.7420],
    'illinois': [40.6331, -89.3985], 'indiana': [40.2672, -86.1349],
    'iowa': [41.8780, -93.0977], 'kansas': [39.0119, -98.4842],
    'kentucky': [37.8393, -84.2700], 'louisiana': [30.9843, -91.9623],
    'maine': [45.2538, -69.4455], 'maryland': [39.0458, -76.6413],
    'massachusetts': [42.4072, -71.3824], 'michigan': [44.3148, -85.6024],
    'minnesota': [46.7296, -94.6859], 'mississippi': [32.3547, -89.3985],
    'missouri': [37.9643, -91.8318], 'montana': [46.8797, -110.3626],
    'nebraska': [41.4925, -99.9018], 'nevada': [38.8026, -116.4194],
    'new hampshire': [43.1939, -71.5724], 'new jersey': [40.0583, -74.4057],
    'new mexico': [34.5199, -105.8701], 'new york': [40.7128, -74.0060],
    'north carolina': [35.7596, -79.0193], 'north dakota': [47.5515, -101.0020],
    'ohio': [40.4173, -82.9071], 'oklahoma': [35.0078, -97.0929],
    'oregon': [43.8041, -120.5542], 'pennsylvania': [41.2033, -77.1945],
    'rhode island': [41.5801, -71.4774], 'south carolina': [33.8361, -81.1637],
    'south dakota': [43.9695, -99.9018], 'tennessee': [35.5175, -86.5804],
    'texas': [31.9686, -99.9018], 'utah': [39.3210, -111.0937],
    'vermont': [44.5588, -72.5778], 'virginia': [37.4316, -78.6569],
    'washington': [47.7511, -120.7401], 'west virginia': [38.5976, -80.4549],
    'wisconsin': [43.7844, -88.7879], 'wyoming': [43.0760, -107.2903],
    'dc': [38.9072, -77.0369], 'washington dc': [38.9072, -77.0369],
};

export function GeoMap({ data, columns, onClose }: GeoMapProps) {
    const [latColumn, setLatColumn] = useState('');
    const [lngColumn, setLngColumn] = useState('');
    const [locationColumn, setLocationColumn] = useState('');
    const [valueColumn, setValueColumn] = useState('');
    const [mapReady, setMapReady] = useState(false);

    useEffect(() => {
        // Auto-detect columns
        const lowerCols = columns.map((c) => ({ ...c, lower: c.name.toLowerCase() }));

        const latCol = lowerCols.find((c) => c.lower.includes('lat') || c.lower === 'latitude');
        const lngCol = lowerCols.find((c) => c.lower.includes('lng') || c.lower.includes('lon') || c.lower === 'longitude');
        const locCol = lowerCols.find((c) =>
            c.lower.includes('country') || c.lower.includes('state') || c.lower.includes('city') ||
            c.lower.includes('location') || c.lower.includes('region')
        );
        const valCol = lowerCols.find((c) => c.type === 'numeric');

        if (latCol) setLatColumn(latCol.name);
        if (lngCol) setLngColumn(lngCol.name);
        if (locCol) setLocationColumn(locCol.name);
        if (valCol) setValueColumn(valCol.name);

        // Delay to let dynamic components load
        setTimeout(() => setMapReady(true), 100);
    }, [columns]);

    const geoPoints = useMemo((): GeoPoint[] => {
        const points: GeoPoint[] = [];

        data.forEach((row) => {
            let lat: number | null = null;
            let lng: number | null = null;

            // Try lat/lng columns first
            if (latColumn && lngColumn) {
                const latVal = row[latColumn];
                const lngVal = row[lngColumn];
                if (typeof latVal === 'number' && typeof lngVal === 'number') {
                    lat = latVal;
                    lng = lngVal;
                }
            }

            // Try location name lookup
            if (lat === null && locationColumn) {
                const locVal = String(row[locationColumn] ?? '').toLowerCase().trim();
                const coords = COUNTRY_COORDS[locVal] || US_STATE_COORDS[locVal];
                if (coords) {
                    [lat, lng] = coords;
                }
            }

            if (lat !== null && lng !== null) {
                const value = valueColumn ? (typeof row[valueColumn] === 'number' ? row[valueColumn] as number : 1) : 1;
                const label = locationColumn ? String(row[locationColumn]) : `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
                points.push({ lat, lng, value, label });
            }
        });

        return points;
    }, [data, latColumn, lngColumn, locationColumn, valueColumn]);

    // Calculate center and max value
    const center = useMemo(() => {
        if (geoPoints.length === 0) return [20, 0] as [number, number];
        const avgLat = geoPoints.reduce((sum, p) => sum + p.lat, 0) / geoPoints.length;
        const avgLng = geoPoints.reduce((sum, p) => sum + p.lng, 0) / geoPoints.length;
        return [avgLat, avgLng] as [number, number];
    }, [geoPoints]);

    const maxValue = useMemo(() => Math.max(...geoPoints.map((p) => p.value), 1), [geoPoints]);

    const numericColumns = columns.filter((c) => c.type === 'numeric');
    const textColumns = columns.filter((c) => c.type !== 'numeric');

    return (
        <div className="modal-overlay animate-fade-in" onClick={onClose}>
            <div className="modal-content w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-color))]">
                    <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-[rgb(var(--accent))]" />
                        <h3 className="font-semibold text-[rgb(var(--text-primary))]">Geographic Map</h3>
                    </div>
                    <button onClick={onClose} className="btn-icon">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Config */}
                <div className="p-4 border-b border-[rgb(var(--border-color))] bg-[rgb(var(--bg-secondary))]">
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                                Latitude Column
                            </label>
                            <select value={latColumn} onChange={(e) => setLatColumn(e.target.value)} className="text-sm">
                                <option value="">None</option>
                                {numericColumns.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                                Longitude Column
                            </label>
                            <select value={lngColumn} onChange={(e) => setLngColumn(e.target.value)} className="text-sm">
                                <option value="">None</option>
                                {numericColumns.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                                Location Name
                            </label>
                            <select value={locationColumn} onChange={(e) => setLocationColumn(e.target.value)} className="text-sm">
                                <option value="">None</option>
                                {textColumns.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                                Value Column
                            </label>
                            <select value={valueColumn} onChange={(e) => setValueColumn(e.target.value)} className="text-sm">
                                <option value="">Count</option>
                                {numericColumns.map((c) => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="h-96 relative">
                    {!mapReady ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--bg-secondary))]">
                            <p className="text-[rgb(var(--text-secondary))]">Loading map...</p>
                        </div>
                    ) : geoPoints.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[rgb(var(--bg-secondary))]">
                            <Info className="w-12 h-12 text-[rgb(var(--text-secondary))] mb-4" />
                            <p className="text-[rgb(var(--text-secondary))]">No geographic data found</p>
                            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                                Select lat/lng columns or a location column with country/state names
                            </p>
                        </div>
                    ) : (
                        <MapContainer
                            center={center}
                            zoom={2}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {geoPoints.map((point, i) => (
                                <CircleMarker
                                    key={i}
                                    center={[point.lat, point.lng]}
                                    radius={5 + (point.value / maxValue) * 15}
                                    fillColor="#6366f1"
                                    color="#4f46e5"
                                    weight={1}
                                    opacity={0.8}
                                    fillOpacity={0.6}
                                >
                                    <Popup>
                                        <strong>{point.label}</strong>
                                        <br />
                                        Value: {point.value.toLocaleString()}
                                    </Popup>
                                </CircleMarker>
                            ))}
                        </MapContainer>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-[rgb(var(--border-color))] bg-[rgb(var(--bg-secondary))] text-sm text-[rgb(var(--text-secondary))]">
                    Showing {geoPoints.length} locations • Bubble size represents value
                </div>
            </div>
        </div>
    );
}
