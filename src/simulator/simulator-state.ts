export interface SimulatorCustomer {
  customerGid: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface SimulatorOutlet {
  deviceGid: number;
  outletOn: boolean;
  loadGid: number;
}

export interface SimulatorCharger {
  deviceGid: number;
  loadGid: number;
  message: string;
  status: string;
  icon: string;
  iconLabel: string;
  debugCode: string;
  iconDetailText: string;
  faultText?: string;
  proControlCode?: string;
  breakerPIN?: string;
  chargerOn: boolean;
  chargingRate: number;
  maxChargingRate: number;
  loadManagementEnabled: boolean;
  hideChargeRateSliderText?: string;
}

export interface SimulatorChannel {
  deviceGid: number;
  name?: string;
  channelNum: string;
  channelMultiplier: number;
  channelTypeGid?: number;
  type: string;
  parentChannelNum?: string;
}

export interface SimulatorLocationProperties {
  deviceName: string;
  displayName: string;
  zipCode: string;
  timeZone: string;
  usageCentPerKwHour: number;
  peakDemandDollarPerKw: number;
  billingCycleStartDay: number;
  solar: boolean;
  utilityRateGid?: number;
  locationInformation: {
    airConditioning: string;
    heatSource: string;
    locationSqFt: string;
    numElectricCars: string;
    locationType: string;
    numPeople: string;
    swimmingPool: string;
    hotTub: string;
  };
  latitudeLongitude: {
    latitude: number;
    longitude: number;
  };
}

export interface SimulatorDevice {
  deviceGid: number;
  manufacturerDeviceId: string;
  model: string;
  firmware: string;
  parentDeviceGid?: number;
  parentChannelNum?: string;
  channels: SimulatorChannel[];
  outlet?: SimulatorOutlet;
  evCharger?: SimulatorCharger;
  locationProperties: SimulatorLocationProperties;
}

export interface ChannelType {
  channelTypeGid: number;
  description: string;
  selectable: boolean;
}

export class SimulatorState {
  private customer: SimulatorCustomer;
  private devices: SimulatorDevice[] = [];
  private channelTypes: ChannelType[] = [];
  private channelUsages: { [key: string]: number } = {};

  constructor() {
    this.customer = {
      customerGid: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date().toISOString(),
    };

    this.initializeChannelTypes();
  }

  private initializeChannelTypes(): void {
    this.channelTypes = [
      { channelTypeGid: 1, description: 'Main', selectable: false },
      { channelTypeGid: 2, description: 'Circuit', selectable: true },
      { channelTypeGid: 3, description: 'TED5000', selectable: false },
    ];
  }

  public addVue(deviceGid: number, name: string, channelCount: number): void {
    const channels: SimulatorChannel[] = [
      {
        deviceGid,
        name: 'Main',
        channelNum: '1,2,3',
        channelMultiplier: 1.0,
        channelTypeGid: 1,
        type: 'Main',
      },
    ];

    for (let i = 1; i <= channelCount; i++) {
      channels.push({
        deviceGid,
        name: `Circuit ${i}`,
        channelNum: i.toString(),
        channelMultiplier: 1.0,
        channelTypeGid: 2,
        type: 'Circuit',
      });
    }

    channels.push({
      deviceGid,
      name: 'Balance',
      channelNum: 'Balance',
      channelMultiplier: 1.0,
      type: 'Balance',
    });

    const device: SimulatorDevice = {
      deviceGid,
      manufacturerDeviceId: `VUE-${deviceGid}`,
      model: 'VUE001',
      firmware: '1.4.5',
      channels,
      locationProperties: {
        deviceName: name,
        displayName: name,
        zipCode: '12345',
        timeZone: 'America/New_York',
        usageCentPerKwHour: 0.12,
        peakDemandDollarPerKw: 0.0,
        billingCycleStartDay: 1,
        solar: false,
        locationInformation: {
          airConditioning: 'true',
          heatSource: 'electricFurnace',
          locationSqFt: '2000',
          numElectricCars: '1',
          locationType: 'home',
          numPeople: '4',
          swimmingPool: 'false',
          hotTub: 'false',
        },
        latitudeLongitude: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    };

    this.devices.push(device);
  }

  public addOutlet(
    deviceGid: number,
    name: string,
    on: boolean,
    parentDeviceGid?: number,
    parentChannelNum?: string
  ): void {
    const outlet: SimulatorOutlet = {
      deviceGid,
      outletOn: on,
      loadGid: deviceGid,
    };

    const device: SimulatorDevice = {
      deviceGid,
      manufacturerDeviceId: `OUTLET-${deviceGid}`,
      model: 'SSO001',
      firmware: '1.2.3',
      parentDeviceGid,
      parentChannelNum,
      channels: [
        {
          deviceGid,
          name,
          channelNum: '1,2,3',
          channelMultiplier: 1.0,
          type: 'Outlet',
        },
      ],
      outlet,
      locationProperties: {
        deviceName: name,
        displayName: name,
        zipCode: '12345',
        timeZone: 'America/New_York',
        usageCentPerKwHour: 0.12,
        peakDemandDollarPerKw: 0.0,
        billingCycleStartDay: 1,
        solar: false,
        locationInformation: {
          airConditioning: 'false',
          heatSource: 'none',
          locationSqFt: '0',
          numElectricCars: '0',
          locationType: 'outlet',
          numPeople: '0',
          swimmingPool: 'false',
          hotTub: 'false',
        },
        latitudeLongitude: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    };

    this.devices.push(device);
  }

  public addCharger(
    deviceGid: number,
    name: string,
    on: boolean,
    breakerSize: number,
    parentDeviceGid?: number,
    parentChannelNum?: string
  ): void {
    const charger: SimulatorCharger = {
      deviceGid,
      loadGid: deviceGid,
      message: 'EV is not accepting charge',
      status: 'Standby',
      icon: 'CarConnected',
      iconLabel: 'Offering Charge',
      debugCode: '311',
      iconDetailText: 'Check your vehicle for a scheduled charge time.',
      chargerOn: on,
      chargingRate: breakerSize,
      maxChargingRate: breakerSize,
      loadManagementEnabled: false,
    };

    const device: SimulatorDevice = {
      deviceGid,
      manufacturerDeviceId: `EVSE-${deviceGid}`,
      model: 'EVSE001',
      firmware: '2.1.0',
      parentDeviceGid,
      parentChannelNum,
      channels: [
        {
          deviceGid,
          name,
          channelNum: '1,2,3',
          channelMultiplier: 1.0,
          type: 'EVSE',
        },
      ],
      evCharger: charger,
      locationProperties: {
        deviceName: name,
        displayName: name,
        zipCode: '12345',
        timeZone: 'America/New_York',
        usageCentPerKwHour: 0.12,
        peakDemandDollarPerKw: 0.0,
        billingCycleStartDay: 1,
        solar: false,
        locationInformation: {
          airConditioning: 'false',
          heatSource: 'none',
          locationSqFt: '0',
          numElectricCars: '1',
          locationType: 'evse',
          numPeople: '0',
          swimmingPool: 'false',
          hotTub: 'false',
        },
        latitudeLongitude: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      },
    };

    this.devices.push(device);
  }

  public setChannel1MinWatts(deviceGid: number, channelNum: string, watts: number): void {
    const key = `${deviceGid}:${channelNum}`;
    this.channelUsages[key] = watts / 60000; // Convert to kWh (watts to kW and per minute)
  }

  public setChannelBidirectionality(deviceGid: number, channelNum: string, bidirectional: boolean): void {
    // For now, just update the channel type if needed
    const device = this.devices.find(d => d.deviceGid === deviceGid);
    if (device) {
      const channel = device.channels.find(c => c.channelNum === channelNum);
      if (channel && bidirectional) {
        channel.type = 'Solar';
      }
    }
  }

  public getCustomer(): SimulatorCustomer {
    return this.customer;
  }

  public getDeviceByGid(deviceGid: number): SimulatorDevice | undefined {
    return this.devices.find(d => d.deviceGid === deviceGid);
  }

  public getChannelTypes(): ChannelType[] {
    return this.channelTypes;
  }

  public getCustomersDevices(): { devices: SimulatorDevice[] } {
    return { devices: this.devices };
  }

  public getDevicesStatus(): {
    devicesConnected: Array<{ deviceGid: number; connected: boolean; offlineSince?: string }>;
    outlets: SimulatorOutlet[];
    evChargers: SimulatorCharger[];
  } {
    const outlets = this.devices
      .filter(d => d.outlet)
      .map(d => d.outlet!)
      .filter(Boolean);

    const evChargers = this.devices
      .filter(d => d.evCharger)
      .map(d => d.evCharger!)
      .filter(Boolean);

    const devicesConnected = this.devices.map(d => ({
      deviceGid: d.deviceGid,
      connected: true,
      offlineSince: undefined,
    }));

    return { devicesConnected, outlets, evChargers };
  }

  public getDeviceListUsages(
    deviceGids?: string,
    instant?: string,
    scale?: string,
    energyUnit?: string
  ): any {
    const gids = deviceGids ? deviceGids.split('+').map(Number) : [];
    const timestamp = instant || new Date().toISOString();

    const devices = gids.map(gid => {
      const device = this.getDeviceByGid(gid);
      if (!device) return null;

      const channelUsages = device.channels.map(channel => {
        const key = `${gid}:${channel.channelNum}`;
        const usage = this.channelUsages[key] || 0;

        return {
          name: channel.name,
          deviceGid: gid,
          channelNum: channel.channelNum,
          usage,
          percentage: 0,
        };
      });

      return {
        deviceGid: gid,
        channelUsages,
      };
    }).filter(Boolean);

    return {
      deviceListUsages: {
        instant: timestamp,
        devices,
      },
    };
  }

  public updateOutlet(outletData: any): SimulatorOutlet {
    const device = this.getDeviceByGid(outletData.deviceGid);
    if (device && device.outlet) {
      device.outlet.outletOn = outletData.outletOn;
      return device.outlet;
    }
    throw new Error(`Outlet not found: ${outletData.deviceGid}`);
  }

  public updateCharger(chargerData: any): SimulatorCharger {
    const device = this.getDeviceByGid(chargerData.deviceGid);
    if (device && device.evCharger) {
      device.evCharger.chargerOn = chargerData.chargerOn;
      if (chargerData.chargingRate !== undefined) {
        device.evCharger.chargingRate = chargerData.chargingRate;
      }
      if (chargerData.maxChargingRate !== undefined) {
        device.evCharger.maxChargingRate = chargerData.maxChargingRate;
      }
      return device.evCharger;
    }
    throw new Error(`Charger not found: ${chargerData.deviceGid}`);
  }
}