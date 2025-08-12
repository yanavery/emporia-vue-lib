# Emporia Vue Library

A TypeScript/Node.js library for interacting with the Emporia Vue energy monitoring system. This is a port of the popular [PyEmVue](https://github.com/magico13/PyEmVue) Python library.

## Installation

```bash
npm install emporia-vue-lib
```

## Quick Start

### Basic Usage - Getting Recent Energy Usage

```typescript
import { EmporiaVue, Scale, Unit } from 'emporia-vue-lib';

async function getEnergyUsage() {
  const vue = new EmporiaVue();

  // Login with username/password (tokens will be stored for reuse)
  await vue.login({
    username: 'your-email@example.com',
    password: 'your-password',
    tokenStorageFile: 'keys.json'
  });

  // Get all devices
  const devices = await vue.getDevices();

  // Get energy usage for the last minute
  const deviceGids = devices.map(d => d.deviceGid.toString());
  const usageData = await vue.getDeviceListUsage(
    deviceGids,
    undefined, // current time
    Scale.MINUTE,
    Unit.KWH
  );

  // Display usage data
  for (const [gid, device] of Object.entries(usageData)) {
    for (const [channelNum, channel] of Object.entries(device.channels)) {
      console.log(`${gid} ${channelNum} ${channel.name} ${channel.usage} kwh`);
    }
  }
}

getEnergyUsage().catch(console.error);
```

### Authentication Options

#### Username/Password with Token Storage
```typescript
await vue.login({
  username: 'your-email@example.com',
  password: 'your-password',
  tokenStorageFile: 'keys.json' // Tokens will be saved and reused
});
```

#### Using Existing Tokens
```typescript
await vue.login({
  idToken: 'your-id-token',
  accessToken: 'your-access-token',
  refreshToken: 'your-refresh-token',
  tokenStorageFile: 'keys.json'
});
```

#### Token Storage File (keys.json)
```json
{
  "id_token": "...",
  "access_token": "...",
  "refresh_token": "...",
  "username": "your-email@example.com"
}
```

## API Reference

### Core Methods

#### Device Management
- `getDevices()` - Get all devices under your account
- `populateDeviceProperties(device)` - Get additional device details
- `getCustomerDetails()` - Get customer account information

#### Energy Usage
- `getDeviceListUsage(deviceGids, instant?, scale?, unit?)` - Get current usage for devices
- `getChartUsage(channel, start?, end?, scale?, unit?)` - Get historical usage data

#### Smart Outlets
- `getOutlets()` - Get all smart outlets
- `updateOutlet(outlet, on?)` - Turn outlet on/off
- `getDevicesStatus(deviceList?)` - Get status of outlets and chargers

#### EV Chargers
- `getChargers()` - Get all EV chargers
- `updateCharger(charger, on?, chargeRate?)` - Control EV charger

#### Vehicles
- `getVehicles()` - Get connected vehicles
- `getVehicleStatus(vehicleGid)` - Get vehicle charging status

### Enums

#### Scale (Time Periods)
```typescript
enum Scale {
  SECOND = '1S',
  MINUTE = '1MIN',
  MINUTES_15 = '15MIN',
  HOUR = '1H',
  DAY = '1D',
  WEEK = '1W',
  MONTH = '1MON',
  YEAR = '1Y'
}
```

#### Unit (Measurement Units)
```typescript
enum Unit {
  VOLTS = 'Voltage',
  KWH = 'KilowattHours',
  USD = 'Dollars',
  AMPHOURS = 'AmpHours',
  TREES = 'Trees',
  GAS = 'GallonsOfGas',
  DRIVEN = 'MilesDriven',
  CARBON = 'Carbon'
}
```

## Examples

### Control Smart Outlets
```typescript
const outlets = await vue.getOutlets();
for (const outlet of outlets) {
  // Turn off
  await vue.updateOutlet(outlet, false);

  // Turn on
  await vue.updateOutlet(outlet, true);
}
```

### Control EV Charger
```typescript
const chargers = await vue.getChargers();
for (const charger of chargers) {
  // Set charging rate to 16 amps
  await vue.updateCharger(charger, true, 16);
}
```

### Get Historical Usage
```typescript
import { subDays } from 'date-fns';

const devices = await vue.getDevices();
const channel = devices[0].channels[0]; // First channel of first device

const [usage, startTime] = await vue.getChartUsage(
  channel,
  subDays(new Date(), 7), // 7 days ago
  new Date(),             // now
  Scale.DAY,
  Unit.KWH
);

console.log(`Usage for the last 7 days starting ${startTime?.toISOString()}:`);
usage.forEach((dailyUsage, index) => {
  console.log(`Day ${index + 1}: ${dailyUsage} kWh`);
});
```

## Development

### Build the Library
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Run the Simulator
```bash
npm run simulator
```

The simulator runs on `http://localhost:3000` and provides a mock Emporia API for testing.

### Using with the Simulator
```typescript
const vue = new EmporiaVue();
await vue.loginSimulator('http://localhost:3000', 'test@example.com', 'password');
```

## Error Handling

```typescript
try {
  await vue.login({ username: 'user', password: 'pass' });
  const devices = await vue.getDevices();
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Authentication failed');
  } else {
    console.error('API error:', error.message);
  }
}
```

## TypeScript Support

This library is written in TypeScript and includes complete type definitions. All classes and interfaces are fully typed for the best development experience.

## Requirements

- Node.js 20.0.0 or higher
- TypeScript 5.0+ (for development)

## License

MIT License - see LICENSE file for details

## Disclaimer

This project is not affiliated with or endorsed by Emporia Energy. Use at your own risk.
