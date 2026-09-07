#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <NewPing.h>

// ─── Configuration ────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// For local LAN: use your PC's local IP e.g. "http://192.168.1.100:3000"
// For cloud:     use your deployed URL e.g. "https://aquaiq.vercel.app"
const char* BACKEND_URL   = "http://192.168.1.100:3000";
const char* API_KEY       = "aq_dev_secret_token_001";
const char* DEVICE_ID     = "ESP32_AQUAIQ_001";

// ─── Pin Definitions ─────────────────────────────────────────────────────────
#define SOIL_MOISTURE_PIN  34   // Analog: capacitive soil moisture sensor
#define FLOW_SENSOR_PIN     5   // Digital: YF-S201 hall-effect pulse
#define HC_SR04_TRIG       18   // HC-SR04 trigger pin
#define HC_SR04_ECHO       19   // HC-SR04 echo pin
#define RELAY_PIN           4   // Relay IN pin (LOW = ON for most relay modules)
#define TANK_HEIGHT_CM     50.0 // Total tank height in centimetres

// ─── Sensor Objects ───────────────────────────────────────────────────────────
NewPing sonar(HC_SR04_TRIG, HC_SR04_ECHO, 200);

// ─── Global State ─────────────────────────────────────────────────────────────
volatile uint32_t flowPulseCount  = 0;
float             cumulativeVolume = 0.0; // litres
bool              pumpActive       = false;
bool              pumpEnabled      = false;  // controlled from dashboard
float             moistureThreshold = 30.0;
uint32_t          pumpStartMs       = 0;
uint32_t          pumpDurationMs    = 60000; // 60s default

// Flow sensor ISR
void IRAM_ATTR onFlowPulse() {
  flowPulseCount++;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);

  // Pin modes
  pinMode(RELAY_PIN,       OUTPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  digitalWrite(RELAY_PIN,  HIGH); // relay OFF (active-low)

  // Flow sensor interrupt
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), onFlowPulse, RISING);

  // WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n✅ Connected. IP: %s\n", WiFi.localIP().toString().c_str());
}

// ─── Read Soil Moisture ───────────────────────────────────────────────────────
float readSoilMoisture() {
  // Capacitive sensor: dry ≈ 4095 ADC, wet ≈ 1200 ADC (calibrate for your sensor)
  const int DRY_VALUE = 3800;
  const int WET_VALUE = 1200;
  int raw = analogRead(SOIL_MOISTURE_PIN);
  float pct = map(raw, DRY_VALUE, WET_VALUE, 0, 100);
  return constrain(pct, 0.0, 100.0);
}

// ─── Read Tank Level ─────────────────────────────────────────────────────────
float readTankLevel() {
  uint32_t distanceCm = sonar.ping_cm();
  if (distanceCm == 0) return -1.0; // no reading
  // Distance from sensor to water surface → fill level
  float waterHeightCm = TANK_HEIGHT_CM - (float)distanceCm;
  float pct = (waterHeightCm / TANK_HEIGHT_CM) * 100.0;
  return constrain(pct, 0.0, 100.0);
}

// ─── Read Flow Rate ───────────────────────────────────────────────────────────
float readFlowRate() {
  // YF-S201: 7.5 pulses per second per litre/min
  noInterrupts();
  uint32_t pulses = flowPulseCount;
  flowPulseCount = 0;
  interrupts();
  // Called every 30s → pulses over 30s window
  float flowLpm = (pulses / 7.5) / 30.0 * 60.0;
  // Add to cumulative volume
  cumulativeVolume += (flowLpm / 60.0) * 30.0; // litres in 30s
  return flowLpm;
}

// ─── Control Pump ─────────────────────────────────────────────────────────────
void controlPump(float moisture) {
  // Auto-trigger if enabled and moisture below threshold
  bool shouldRun = pumpEnabled && (moisture < moistureThreshold);

  if (shouldRun && !pumpActive) {
    pumpActive  = true;
    pumpStartMs = millis();
    digitalWrite(RELAY_PIN, LOW);  // relay ON
    Serial.printf("🚿 Pump ON — moisture=%.1f%% threshold=%.1f%%\n", moisture, moistureThreshold);
  }

  // Auto-off after duration
  if (pumpActive && (millis() - pumpStartMs >= pumpDurationMs)) {
    pumpActive = false;
    digitalWrite(RELAY_PIN, HIGH); // relay OFF
    Serial.println("✅ Pump OFF — duration complete");
  }
}

// ─── Send Data to Backend ─────────────────────────────────────────────────────
void sendData(float moisture, float tankLevel, float flowRate) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/sensor-data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"]                = DEVICE_ID;
  doc["api_key"]                  = API_KEY;
  doc["soil_moisture_pct"]        = moisture;
  doc["tank_level_pct"]           = tankLevel >= 0 ? tankLevel : 0;
  doc["flow_rate_lpm"]            = flowRate;
  doc["cumulative_volume_liters"] = cumulativeVolume;
  doc["pump_active"]              = pumpActive;

  String body;
  serializeJson(doc, body);

  int code = http.POST(body);
  Serial.printf("POST %s → %d\n", url.c_str(), code);

  if (code == 200) {
    String response = http.getString();
    StaticJsonDocument<128> resp;
    if (!deserializeJson(resp, response)) {
      // Update pump settings from server response
      bool newPumpCmd    = resp["pump_command"] | pumpEnabled;
      float newThreshold = resp["moisture_threshold"] | moistureThreshold;
      uint32_t newDur    = (uint32_t)(resp["pump_duration_seconds"] | 60) * 1000;

      pumpEnabled        = newPumpCmd;
      moistureThreshold  = newThreshold;
      pumpDurationMs     = newDur;

      Serial.printf("  → pump_enabled=%d threshold=%.1f dur=%ds\n",
        pumpEnabled, moistureThreshold, newDur / 1000);
    }
  }

  http.end();
}

// ─── Main Loop ────────────────────────────────────────────────────────────────
void loop() {
  float moisture  = readSoilMoisture();
  float tankLevel = readTankLevel();
  float flowRate  = readFlowRate();

  Serial.printf("Moisture=%.1f%% Tank=%.1f%% Flow=%.2fL/min Vol=%.1fL Pump=%s\n",
    moisture, tankLevel, flowRate, cumulativeVolume, pumpActive ? "ON" : "OFF");

  controlPump(moisture);
  sendData(moisture, tankLevel, flowRate);

  delay(30000); // 30-second interval
}
