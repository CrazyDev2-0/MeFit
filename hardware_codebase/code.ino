#include <Wire.h>
#include <SPI.h>
#include "MAX30105.h"
#include "spo2_algorithm.h"
#include <DS3231.h>
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>

#define sosPin 14
const String hardwareID = "56565465";
const String url = "https://stratathonapi.tanmoy.codes";

// Define global variables
#define SSID_NAME "Tanmoy_Home_2.4G"
#define SSID_PASS "15072002"

// WIFI Setup
ESP8266WiFiMulti WiFiMulti;


// ADXL345
float xavg = 0, yavg = 0, zavg = 0;
float xcur = 0, ycur = 0, zcur = 0;
float xnxt = 0, ynxt = 0, znxt = 0;

// MAX30105

MAX30105 particleSensor;

#define MAX_BRIGHTNESS 255

#if defined(__AVR_ATmega328P__) || defined(__AVR_ATmega168__)
//Arduino Uno doesn't have enough SRAM to store 100 samples of IR led data and red led data in 32-bit format
//To solve this problem, 16-bit MSB of the sampled data will be truncated. Samples become 16-bit data.
uint16_t irBuffer[100]; //infrared LED sensor data
uint16_t redBuffer[100];  //red LED sensor data
#else
uint32_t irBuffer[100]; //infrared LED sensor data
uint32_t redBuffer[100];  //red LED sensor data
#endif

int32_t bufferLength; //data length
int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
int8_t validHeartRate; //indicator to show if the heart rate calculation is valid
int32_t spo2; //SPO2 value
int32_t heartRate; //heart rate value

// RTC Clock
RTClib myRTC;


// Vitals Stats
int steps = 0;
float temperature = 0;
int spo2Latest = 0;
int heartRateLatest = 0;
long latestUnixTimestamp = 0;
float calorieBurnt = 0;
int sleepSeconds  = 0;


bool isSOS = false;

// Data
String data = "";
int count = 0;

void setup() {
  Serial.begin(9600);
  pinMode(sosPin, INPUT);
  Wire.begin();

  // Connect to WIFI
  if (WiFi.getMode() & WIFI_AP) WiFi.softAPdisconnect(true);
  WiFiMulti.addAP(SSID_NAME, SSID_PASS);

  while (WiFiMulti.run() != WL_CONNECTED)
  {
    Serial.print(" . ");
    delay(100);
  }
  
  // MAX30102
  particleSensor.begin(Wire, I2C_SPEED_FAST);
  byte ledBrightness = 60; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  byte sampleRate = 100; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 4096; //Options: 2048, 4096, 8192, 16384
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); //Configure sensor with these settings
  initHeartRateSpo2();

  // ADXL345
  adxl345_init();
  read_av_acc();
}

void loop() {
  readSOS();
  calulateSleep();
  countSteps();
  calculateCalories();
  readSOS();
  readBodyTemperature();
  readSOS();
  readHeartRateSpo2();
  readUnixTimestamp();
  concatenateResult();
  sendLog();
  sendSOS();
  delay(500);
}

// Function related to API call

void sendSOS(){
   if (isSOS) {
    Serial.println("SOS");
    std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
    client->setInsecure();
    HTTPClient https;
    if(https.begin(*client, url+"/device/sos/"+hardwareID)){
      int httpCode = https.GET();
      if (httpCode > 0) {
        if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
          String payload = https.getString();
          Serial.println("SOS : "+payload);
        }
      }
    }else{
      Serial.println("SOS : failed default");
    }
    isSOS = false;
  }
}

void sendLog(){
    count++;
  if(count >= 10){
      std::unique_ptr<BearSSL::WiFiClientSecure>client(new BearSSL::WiFiClientSecure);
      client->setInsecure();
      HTTPClient https;
      if(https.begin(*client, url+"/device/log")){
        https.addHeader("Content-Type", "text/plain");
        int httpCode = https.POST(data);
        if (httpCode > 0) {
          if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_MOVED_PERMANENTLY) {
            String payload = https.getString();
            
            Serial.println("Log : "+payload);
            data = "";
            count = 0;
          }
        }
      }else{
        Serial.println("Log : failed default");
      }
  }
}

// Functions realted to data collection

void concatenateResult(){
  if (data == "") {
    data = hardwareID + "\n";
  }
  //  hr|hrv|spo2|temperature|steps_walked|sleep|calories_burned|timestamp
  //int steps = 0;
  //float temperature = 0;
  //int spo2Latest = 0;
  //int heartRateLatest = 0;
  //long latestUnixTimestamp = 0;
  //float calorieBurnt = 0;


  if (heartRateLatest <= 0) data = data + "-1|";
  else data = data + String(heartRateLatest) + "|";

  data = data + "-1|";

  if (spo2Latest <= 0) data = data + "-1|";
  else data = data + String(spo2Latest) + "|";

  if (temperature <= 0) data = data + "-1|";
  else data = data + String(temperature) + "|";

  if (steps <= 0) data = data + "-1|";
  else data = data + String(steps) + "|";

  if(sleepSeconds <= 60) data = data + "-1|";
  else data = data + String(sleepSeconds/60) + "|";


  if (calorieBurnt <= 0) data = data + "-1|";
  else data = data + String(calorieBurnt) + "|";

  steps = 0;
  calorieBurnt = 0;
  if(sleepSeconds > 60) sleepSeconds = 0;

  data = data + String(latestUnixTimestamp) + "\n";
}

// #### Sleep related
void calulateSleep(){
  if(heartRateLatest > 0 && heartRateLatest < 50) sleepSeconds = sleepSeconds +1;
}

// #### Pedometer related
void countSteps() {
  for (int i = 0; i < 50; i++) {
    Wire.beginTransmission(0x53);
    Wire.write(0x32);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x33);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x1 = Wire.read();
    x1 = x1 & 0x03;

    uint16_t x = (x1 << 8) + x0;
    int16_t xf = x;
    if (xf > 511)
    {
      xf = xf - 1024;
    }
    float xa = xf * 0.004;
    xcur = xcur + xa;


    Wire.beginTransmission(0x53);
    Wire.write(0x34);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x35);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y1 = Wire.read();
    y1 = y1 & 0x03;

    uint16_t y = (y1 << 8) + y0;
    int16_t yf = y;
    if (yf > 511)
    {
      yf = yf - 1024;
    }
    float ya = yf * 0.004;
    ycur = ycur + ya;


    Wire.beginTransmission(0x53);
    Wire.write(0x36);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x37);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z1 = Wire.read();
    z1 = z1 & 0x03;

    uint16_t z = (z1 << 8) + z0;
    int16_t zf = z;
    if (zf > 511)
    {
      zf = zf - 1024;
    }
    float za = zf * 0.004;
    zcur = zcur + za;
  }
  xcur = xcur / 50;
  ycur = ycur / 50;
  zcur = zcur / 50;

  float acc = sqrt(((xcur - xavg) * (xcur - xavg)) +
                   ((ycur - yavg) * (ycur - yavg)) +
                   ((zcur - zavg) * (zcur - zavg)));
  delay(250);

  //Next Acceleration
  for (int i = 0; i < 50; i++) {
    Wire.beginTransmission(0x53);
    Wire.write(0x32);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x33);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x1 = Wire.read();
    x1 = x1 & 0x03;

    uint16_t x = (x1 << 8) + x0;
    int16_t xf = x;
    if (xf > 511)
    {
      xf = xf - 1024;
    }
    float xa = xf * 0.004;
    xnxt = xnxt + xa;


    Wire.beginTransmission(0x53);
    Wire.write(0x34);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x35);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y1 = Wire.read();
    y1 = y1 & 0x03;

    uint16_t y = (y1 << 8) + y0;
    int16_t yf = y;
    if (yf > 511)
    {
      yf = yf - 1024;
    }
    float ya = yf * 0.004;
    ynxt = ynxt + ya;


    Wire.beginTransmission(0x53);
    Wire.write(0x36);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x37);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z1 = Wire.read();
    z1 = z1 & 0x03;

    uint16_t z = (z1 << 8) + z0;
    int16_t zf = z;
    if (zf > 511)
    {
      zf = zf - 1024;
    }
    float za = zf * 0.004;
    znxt = znxt + za;
  }
  xnxt = xnxt / 50;
  ynxt = ynxt / 50;
  znxt = znxt / 50;

  float acc2 = sqrt(((xnxt - xavg) * (xnxt - xavg)) +
                    ((ynxt - yavg) * (ynxt - yavg)) +
                    ((znxt - zavg) * (znxt - zavg)));

  if (acc2 - acc > 0.05)
  {
    steps = steps + 1;
  }
}

void calculateCalories(){
  calorieBurnt = steps * 0.04;
}

void adxl345_init() {
  Wire.begin();

  Wire.beginTransmission(0x53);
  Wire.write(0x2C);
  Wire.write(0x08);
  Wire.endTransmission();

  Wire.beginTransmission(0x53);
  Wire.write(0x31);
  Wire.write(0x08);
  Wire.endTransmission();

  Wire.beginTransmission(0x53);
  Wire.write(0x2D);
  Wire.write(0x08);
  Wire.endTransmission();

}

float read_av_acc() {
  for (int i = 0; i < 50; i++) {
    Wire.beginTransmission(0x53);
    Wire.write(0x32);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x33);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte x1 = Wire.read();
    x1 = x1 & 0x03;

    uint16_t x = (x1 << 8) + x0;
    int16_t xf = x;
    if (xf > 511)
    {
      xf = xf - 1024;
    }
    float xa = xf * 0.004;
    xavg = xavg + xa;


    Wire.beginTransmission(0x53);
    Wire.write(0x34);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x35);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte y1 = Wire.read();
    y1 = y1 & 0x03;

    uint16_t y = (y1 << 8) + y0;
    int16_t yf = y;
    if (yf > 511)
    {
      yf = yf - 1024;
    }
    float ya = yf * 0.004;
    yavg = yavg + ya;


    Wire.beginTransmission(0x53);
    Wire.write(0x36);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z0 = Wire.read();

    Wire.beginTransmission(0x53);
    Wire.write(0x37);
    Wire.endTransmission();
    Wire.requestFrom(0x53, 1);
    byte z1 = Wire.read();
    z1 = z1 & 0x03;

    uint16_t z = (z1 << 8) + z0;
    int16_t zf = z;
    if (zf > 511)
    {
      zf = zf - 1024;
    }
    float za = zf * 0.004;
    zavg = zavg + za;
  }
  xavg = xavg / 50;
  yavg = yavg / 50;
  zavg = zavg / 50;
}

// #### Temperature related
void readBodyTemperature() {
  int analogValue = analogRead(A0);
  float millivolts = (analogValue / 1024.0) * 3300; //3300 is the voltage provided by NodeMCU
  float celsius = millivolts / 10;
  temperature = ((celsius * 9) / 5 + 32); // convert to farhenite and store
}

// #### Read SOS signal
void readSOS() {
  if (isSOS) return;
  if (digitalRead(sosPin) == 1) {
    isSOS = true;
  } else {
    isSOS = false;
  }
}

// #### Read heart rate and spo2
void initHeartRateSpo2() {
  bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

  //read the first 100 samples, and determine the signal range
  for (byte i = 0 ; i < bufferLength ; i++)
  {
    while (particleSensor.available() == false) //do we have new data?
      particleSensor.check(); //Check the sensor for new data

    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
}

void readHeartRateSpo2() {
  //dumping the first 25 sets of samples in the memory and shift the last 75 sets of samples to the top
  for (byte i = 25; i < 100; i++)
  {
    redBuffer[i - 25] = redBuffer[i];
    irBuffer[i - 25] = irBuffer[i];
  }

  //take 25 sets of samples before calculating the heart rate.
  for (byte i = 75; i < 100; i++)
  {
    while (particleSensor.available() == false) //do we have new data?
      particleSensor.check(); //Check the sensor for new data


    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample(); //We're finished with this sample so move to next sample

    if (validHeartRate) {
      heartRateLatest = heartRate;
    }

    if (validSPO2) {
      spo2Latest = spo2;
    }
  }

  //After gathering 25 new samples recalculate HR and SP02
  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
}

void readUnixTimestamp(){
  DateTime now = myRTC.now();
  latestUnixTimestamp = now.second()*1000;
}
