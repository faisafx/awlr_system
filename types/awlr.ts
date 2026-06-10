// ─────────────────────────────────────────────────────────────────────────────
// types/awlr.ts — Core domain types for the AWLR Command Center
// ─────────────────────────────────────────────────────────────────────────────

/** Four-level Early Warning System status as defined by BNPB/BPBD Indonesia */
export type EWSStatus = 'AMAN' | 'WASPADA' | 'SIAGA' | 'AWAS';

/** Sensor payload emitted by a single AWLR node every telemetry cycle */
export interface SensorPayload {
  timestamp:          string;   // ISO 8601
  nodeId:             string;   // e.g. "NODE-WGG-01"
  nodeName:           string;   // Human-readable station name
  waterLevelQDY:      number;   // QDY30A hydrostatic depth sensor (meters)
  waterLevelUltrasonic: number; // A02YYUW ultrasonic distance (meters)
  rainfall:           number;   // Ombrometer reading (mm/hr)
  weatherStatus:      WeatherCondition;
  batteryVoltage:     number;   // Solar-charged battery (V)
  rssi:               number;   // GSM signal strength (dBm)
  temperature:        number;   // Ambient temperature (°C)
  humidity:           number;   // Relative humidity (%)
  ewsStatus:          EWSStatus;
}

export type WeatherCondition = 'Sunny' | 'Partly Cloudy' | 'Cloudy' | 'Rain' | 'Heavy Rain' | 'Thunderstorm';

/** Historical reading stored in the time-series chart buffer */
export interface HistoricalReading {
  timestamp: string;
  waterLevel: number;
  rainfall: number;
}

/** AWLR node device registry entry */
export interface AWLRNode {
  id:           string;
  name:         string;
  riverName:    string;
  coordinates:  [number, number]; // [lat, lng]
  isOnline:     boolean;
  lastSeen:     string;
  firmwareVer:  string;
  installDate:  string;
  sensors:      ('QDY30A' | 'A02YYUW' | 'Ombrometer')[];
}

/** EWS threshold configuration for the rule engine */
export interface EWSThresholds {
  waspada: { waterLevel: number; rainfall: number };
  siaga:   { waterLevel: number; rainfall: number };
  awas:    { waterLevel: number; rainfall: number };
}

/** Calibration record for a sensor */
export interface CalibrationRecord {
  sensorId:   string;
  sensorType: 'QDY30A' | 'A02YYUW' | 'Ombrometer';
  offset:     number;
  gain:       number;
  calibratedAt: string;
  calibratedBy: string;
  notes:      string;
}

/** Navigation route definition for the sidebar */
export interface NavRoute {
  href:    string;
  label:   string;
  icon:    string; // Lucide icon name
  badge?:  string; // Optional notification badge
  group?:  string; // Group heading
}