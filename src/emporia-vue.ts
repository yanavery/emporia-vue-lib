import axios from 'axios';
import { parseISO, formatISO } from 'date-fns';
import { Auth, SimulatedAuth, TokenSet } from './auth/auth';
import { Scale, Unit } from './types/enums';
import { Customer } from './models/customer';
import {
  VueDevice,
  OutletDevice,
  VueDeviceChannel,
  VueDeviceChannelUsage,
  VueUsageDevice,
  ChannelType,
  Vehicle,
  VehicleStatus,
  ChargerDevice,
} from './models/device';
import * as fs from 'fs';

const API_ROOT = 'https://api.emporiaenergy.com';
const API_CHANNELS = 'devices/{deviceGid}/channels';
const API_CHANNEL_TYPES = 'devices/channels/channeltypes';
const API_CHARGER = 'devices/evcharger';
const API_CHART_USAGE =
  'AppAPI?apiMethod=getChartUsage&deviceGid={deviceGid}&channel={channel}&start={start}&end={end}&scale={scale}&energyUnit={unit}';
const API_CUSTOMER = 'customers';
const API_CUSTOMER_DEVICES = 'customers/devices';
const API_DEVICES_USAGE =
  'AppAPI?apiMethod=getDeviceListUsages&deviceGids={deviceGids}&instant={instant}&scale={scale}&energyUnit={unit}';
const API_DEVICE_PROPERTIES = 'devices/{deviceGid}/locationProperties';
const API_GET_STATUS = 'customers/devices/status';
const API_OUTLET = 'devices/outlet';
const API_VEHICLES = 'customers/vehicles';
const API_VEHICLE_STATUS = 'vehicles/v2/settings?vehicleGid={vehicleGid}';
const API_MAINTENANCE =
  'https://s3.amazonaws.com/com.emporiaenergy.manual.ota/maintenance/maintenance.json';

export interface LoginOptions {
  username?: string;
  password?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenStorageFile?: string;
}

export class EmporiaVue {
  private username?: string;
  private tokenStorageFile?: string;
  private customer?: Customer;
  private connectTimeout: number;
  private readTimeout: number;
  private auth?: Auth;

  constructor(connectTimeout: number = 6.03, readTimeout: number = 10.03) {
    this.connectTimeout = connectTimeout;
    this.readTimeout = readTimeout;
  }

  public async downForMaintenance(): Promise<string | null> {
    try {
      const response = await axios.get(API_MAINTENANCE);
      if (response.status === 404) {
        return null;
      }
      if (response.data && response.data.msg) {
        return response.data.msg;
      }
    } catch {
      return null;
    }
    return null;
  }

  public async getDevices(): Promise<VueDevice[]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_CUSTOMER_DEVICES);
    const devices: VueDevice[] = [];

    if (response.data) {
      const j = response.data;
      if (j.devices) {
        for (const dev of j.devices) {
          devices.push(new VueDevice().fromJsonDictionary(dev));
          if (dev.devices) {
            for (const subdev of dev.devices) {
              devices.push(new VueDevice().fromJsonDictionary(subdev));
            }
          }
        }
      }
    }
    return devices;
  }

  public async populateDeviceProperties(device: VueDevice): Promise<VueDevice> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const url = API_DEVICE_PROPERTIES.replace('{deviceGid}', device.deviceGid.toString());
    const response = await this.auth.request('get', url);

    if (response.data) {
      device.populateLocationPropertiesFromJson(response.data);
    }
    return device;
  }

  public async updateChannel(channel: VueDeviceChannel): Promise<VueDeviceChannel> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const url = API_CHANNELS.replace('{deviceGid}', channel.deviceGid.toString());
    const response = await this.auth.request('put', url, { data: channel.asDictionary() });

    if (response.data) {
      channel.fromJsonDictionary(response.data);
    }
    return channel;
  }

  public async getCustomerDetails(): Promise<Customer | undefined> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_CUSTOMER);

    if (response.data) {
      return new Customer().fromJsonDictionary(response.data);
    }
    return undefined;
  }

  public async getDeviceListUsage(
    deviceGids: string | string[],
    instant?: Date,
    scale: string = Scale.SECOND,
    unit: string = Unit.KWH,
    maxRetryAttempts: number = 5,
    initialRetryDelay: number = 2.0,
    maxRetryDelay: number = 30.0
  ): Promise<{ [key: number]: VueUsageDevice }> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    if (!instant) {
      instant = new Date();
    }

    let gids = deviceGids;
    if (Array.isArray(deviceGids)) {
      gids = deviceGids.join('+');
    }

    const url = API_DEVICES_USAGE
      .replace('{deviceGids}', gids as string)
      .replace('{instant}', formatTime(instant))
      .replace('{scale}', scale)
      .replace('{unit}', unit);

    let attempts = 0;
    let updateFailed = true;
    maxRetryAttempts = Math.max(maxRetryAttempts, 1);
    initialRetryDelay = Math.max(initialRetryDelay, 0.5);
    maxRetryDelay = Math.max(maxRetryDelay, 0);
    const devices: { [key: number]: VueUsageDevice } = {};
    let response: any;

    while (attempts < maxRetryAttempts && updateFailed) {
      updateFailed = false;
      if (attempts > 0) {
        const delay = Math.min(
          initialRetryDelay * Math.pow(2, attempts - 1),
          maxRetryDelay
        );
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
      attempts += 1;
      response = await this.auth.request('get', url);

      if (response.status === 200 && response.data) {
        const j = response.data;
        if (j.deviceListUsages && j.deviceListUsages.devices) {
          const timestamp = parseISO(j.deviceListUsages.instant);
          for (const device of j.deviceListUsages.devices) {
            const populated = new VueUsageDevice(0, timestamp).fromJsonDictionary(device);
            const dataMissing = Object.values(populated.channelUsages).some(
              (channelUsage) => channelUsage.usage === null
            );
            updateFailed = updateFailed || dataMissing;
            if (!dataMissing || attempts >= maxRetryAttempts) {
              devices[populated.deviceGid] = populated;
            }
          }
        } else {
          updateFailed = true;
        }
      } else {
        updateFailed = true;
      }
    }

    return devices;
  }

  public async getChartUsage(
    channel: VueDeviceChannel | VueDeviceChannelUsage,
    start?: Date,
    end?: Date,
    scale: string = Scale.SECOND,
    unit: string = Unit.KWH
  ): Promise<[number[], Date | null]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    if (['MainsFromGrid', 'MainsToGrid'].includes(channel.channelNum)) {
      return [[], start || null];
    }

    if (!start) {
      start = new Date();
    }
    if (!end) {
      end = new Date();
    }

    const url = API_CHART_USAGE
      .replace('{deviceGid}', channel.deviceGid.toString())
      .replace('{channel}', channel.channelNum)
      .replace('{start}', formatTime(start))
      .replace('{end}', formatTime(end))
      .replace('{scale}', scale)
      .replace('{unit}', unit);

    const response = await this.auth.request('get', url);
    let usage: number[] = [];
    let instant: Date | null = start;

    if (response.data) {
      const j = response.data;
      if (j.firstUsageInstant) {
        instant = parseISO(j.firstUsageInstant);
      }
      if (j.usageList) {
        usage = j.usageList;
      }
    }
    return [usage, instant];
  }

  public async getOutlets(): Promise<OutletDevice[]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_GET_STATUS);
    const outlets: OutletDevice[] = [];

    if (response.data) {
      const j = response.data;
      if (j && j.outlets) {
        for (const rawOutlet of j.outlets) {
          outlets.push(new OutletDevice().fromJsonDictionary(rawOutlet));
        }
      }
    }
    return outlets;
  }

  public async updateOutlet(outlet: OutletDevice, on?: boolean): Promise<OutletDevice> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    if (on !== undefined) {
      outlet.outletOn = on;
    }

    const response = await this.auth.request('put', API_OUTLET, { data: outlet.asDictionary() });
    outlet.fromJsonDictionary(response.data);
    return outlet;
  }

  public async getChargers(): Promise<ChargerDevice[]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_GET_STATUS);
    const chargers: ChargerDevice[] = [];

    if (response.data) {
      const j = response.data;
      if (j && j.evChargers) {
        for (const rawCharger of j.evChargers) {
          chargers.push(new ChargerDevice().fromJsonDictionary(rawCharger));
        }
      }
    }
    return chargers;
  }

  public async updateCharger(
    charger: ChargerDevice,
    on?: boolean,
    chargeRate?: number
  ): Promise<ChargerDevice> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    if (on !== undefined) {
      charger.chargerOn = on;
    }
    if (chargeRate !== undefined) {
      charger.chargingRate = chargeRate;
    }

    const response = await this.auth.request('put', API_CHARGER, { data: charger.asDictionary() });
    charger.fromJsonDictionary(response.data);
    return charger;
  }

  public async getDevicesStatus(
    deviceList?: VueDevice[]
  ): Promise<[OutletDevice[], ChargerDevice[]]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_GET_STATUS);
    const chargers: ChargerDevice[] = [];
    const outlets: OutletDevice[] = [];

    if (response.data) {
      const j = response.data;
      if (j && j.evChargers) {
        for (const rawCharger of j.evChargers) {
          chargers.push(new ChargerDevice().fromJsonDictionary(rawCharger));
        }
      }
      if (j && j.outlets) {
        for (const rawOutlet of j.outlets) {
          outlets.push(new OutletDevice().fromJsonDictionary(rawOutlet));
        }
      }
      if (deviceList && j && j.devicesConnected) {
        for (const rawDeviceData of j.devicesConnected) {
          if (rawDeviceData && rawDeviceData.deviceGid) {
            for (const device of deviceList) {
              if (device.deviceGid === rawDeviceData.deviceGid) {
                device.connected = rawDeviceData.connected;
                device.offlineSince = rawDeviceData.offlineSince ? parseISO(rawDeviceData.offlineSince) : new Date(0);
                break;
              }
            }
          }
        }
      }
    }

    return [outlets, chargers];
  }

  public async getChannelTypes(): Promise<ChannelType[]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_CHANNEL_TYPES);
    const channelTypes: ChannelType[] = [];

    if (response.data) {
      for (const rawChannelType of response.data) {
        channelTypes.push(new ChannelType().fromJsonDictionary(rawChannelType));
      }
    }
    return channelTypes;
  }

  public async getVehicles(): Promise<Vehicle[]> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const response = await this.auth.request('get', API_VEHICLES);
    const vehicles: Vehicle[] = [];

    if (response.data) {
      for (const veh of response.data) {
        vehicles.push(new Vehicle().fromJsonDictionary(veh));
      }
    }
    return vehicles;
  }

  public async getVehicleStatus(vehicleGid: number): Promise<VehicleStatus | null> {
    if (!this.auth) {
      throw new Error('Not authenticated');
    }

    const url = API_VEHICLE_STATUS.replace('{vehicleGid}', vehicleGid.toString());
    const response = await this.auth.request('get', url);

    if (response.data) {
      return new VehicleStatus().fromJsonDictionary(response.data);
    }
    return null;
  }

  public async login(options: LoginOptions = {}): Promise<boolean> {
    const {
      username,
      password,
      idToken,
      accessToken,
      refreshToken,
      tokenStorageFile,
    } = options;

    this.username = username?.toLowerCase();
    if (tokenStorageFile) {
      this.tokenStorageFile = tokenStorageFile;
    }

    let finalIdToken = idToken;
    let finalAccessToken = accessToken;
    let finalRefreshToken = refreshToken;
    let finalPassword = password;

    if (!password && !idToken && tokenStorageFile && fs.existsSync(tokenStorageFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(tokenStorageFile, 'utf8'));
        if (data.id_token) {
          finalIdToken = data.id_token;
        }
        if (data.access_token) {
          finalAccessToken = data.access_token;
        }
        if (data.refresh_token) {
          finalRefreshToken = data.refresh_token;
        }
        if (data.username) {
          this.username = data.username;
        }
        if (data.password) {
          finalPassword = data.password;
        }
      } catch (error) {
        // File doesn't exist or is invalid, continue with provided credentials
      }
    }

    this.auth = new Auth({
      host: API_ROOT,
      username: this.username,
      password: finalPassword,
      connectTimeout: this.connectTimeout,
      readTimeout: this.readTimeout,
      tokens: {
        accessToken: finalAccessToken,
        idToken: finalIdToken,
        refreshToken: finalRefreshToken,
      },
      tokenUpdater: (tokens) => this.storeTokens(tokens),
    });

    try {
      await this.auth.refreshTokens();
    } catch (error) {
      return false;
    }

    if (this.auth) {
      this.username = this.auth.getUsername();
      this.customer = await this.getCustomerDetails();
      if (this.customer) {
        this.storeTokens(this.auth.getTokens() || {});
      }
    }
    return this.customer !== null && this.customer !== undefined;
  }

  public async loginSimulator(host: string, username?: string, password?: string): Promise<boolean> {
    this.username = username?.toLowerCase();
    this.auth = new SimulatedAuth(host, this.username, password);
    this.customer = await this.getCustomerDetails();
    return this.customer !== null && this.customer !== undefined;
  }

  private storeTokens(tokens: TokenSet): void {
    if (!this.tokenStorageFile) {
      return;
    }
    const data: any = { ...tokens };
    if (this.username) {
      data.username = this.username;
    }
    fs.writeFileSync(this.tokenStorageFile, JSON.stringify(data, null, 2));
  }
}

function formatTime(time: Date): string {
  // Convert to UTC if not already
  const utcTime = new Date(time.getTime() - time.getTimezoneOffset() * 60000);
  return formatISO(utcTime, { format: 'extended' }).replace(/\.\d{3}/, '') + 'Z';
}