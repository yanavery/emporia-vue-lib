// Main exports
export { EmporiaVue } from './emporia-vue';

// Type exports
export { Scale, Unit } from './types/enums';
export { Customer } from './models/customer';
export {
  VueDevice,
  VueDeviceChannel,
  VueDeviceChannelUsage,
  VueUsageDevice,
  OutletDevice,
  ChargerDevice,
  ChannelType,
  Vehicle,
  VehicleStatus,
} from './models/device';

// Auth exports
export { Auth, SimulatedAuth, TokenSet, AuthConfig } from './auth/auth';

// Re-export the login options interface
export { LoginOptions } from './emporia-vue';