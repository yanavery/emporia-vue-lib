import { parseISO } from 'date-fns';

export interface VueDeviceData {
  deviceGid?: number;
  manufacturerDeviceId?: string;
  model?: string;
  firmware?: string;
  parentDeviceGid?: number;
  parentChannelNum?: string;
  locationProperties?: any;
  channels?: any[];
  outlet?: any;
  evCharger?: any;
  deviceConnected?: {
    connected?: boolean;
    offlineSince?: string;
  };
}

export class VueDevice {
  public deviceGid: number = 0;
  public manufacturerId: string = '';
  public model: string = '';
  public firmware: string = '';
  public parentDeviceGid: number = 0;
  public parentChannelNum: string = '';
  public channels: VueDeviceChannel[] = [];
  public outlet?: OutletDevice;
  public evCharger?: ChargerDevice;

  public connected: boolean = false;
  public offlineSince: Date = new Date(0);

  // Extra info
  public deviceName: string = '';
  public displayName: string = '';
  public zipCode: string = '00000';
  public timeZone: string = '';
  public usageCentPerKwHour: number = 0.0;
  public peakDemandDollarPerKw: number = 0.0;
  public billingCycleStartDay: number = 0;
  public solar: boolean = false;
  public airConditioning: string = 'false';
  public heatSource: string = '';
  public locationSqft: string = '0';
  public numElectricCars: string = '0';
  public locationType: string = '';
  public numPeople: string = '';
  public swimmingPool: string = 'false';
  public hotTub: string = 'false';
  public latitude: number = 0;
  public longitude: number = 0;
  public utilityRateGid?: number;

  constructor(
    gid: number = 0,
    manId: string = '',
    modelNum: string = '',
    firmwareVersion: string = ''
  ) {
    this.deviceGid = gid;
    this.manufacturerId = manId;
    this.model = modelNum;
    this.firmware = firmwareVersion;
  }

  public fromJsonDictionary(js: VueDeviceData): this {
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.manufacturerDeviceId !== undefined) {
      this.manufacturerId = js.manufacturerDeviceId;
    }
    if (js.model !== undefined) {
      this.model = js.model;
    }
    if (js.firmware !== undefined) {
      this.firmware = js.firmware;
    }
    if (js.parentDeviceGid !== undefined) {
      this.parentDeviceGid = js.parentDeviceGid;
    }
    if (js.parentChannelNum !== undefined) {
      this.parentChannelNum = js.parentChannelNum;
    }
    if (js.locationProperties) {
      this.populateLocationPropertiesFromJson(js.locationProperties);
    }
    if (js.channels) {
      this.channels = [];
      for (const chnl of js.channels) {
        this.channels.push(new VueDeviceChannel().fromJsonDictionary(chnl));
      }
    }
    if (js.outlet) {
      this.outlet = new OutletDevice().fromJsonDictionary(js.outlet);
    }
    if (js.evCharger) {
      this.evCharger = new ChargerDevice().fromJsonDictionary(js.evCharger);
    }

    if (js.deviceConnected) {
      const con = js.deviceConnected;
      if (con.connected !== undefined) {
        this.connected = con.connected;
      }
      try {
        if (con.offlineSince) {
          this.offlineSince = parseISO(con.offlineSince);
        }
      } catch {
        this.offlineSince = new Date(0);
      }
    }
    return this;
  }

  public populateLocationPropertiesFromJson(js: any): void {
    if (js.deviceName !== undefined) {
      this.deviceName = js.deviceName;
    }
    if (js.displayName !== undefined) {
      this.displayName = js.displayName;
    }
    if (js.zipCode !== undefined) {
      this.zipCode = js.zipCode;
    }
    if (js.timeZone !== undefined) {
      this.timeZone = js.timeZone;
    }
    if (js.usageCentPerKwHour !== undefined) {
      this.usageCentPerKwHour = js.usageCentPerKwHour;
    }
    if (js.peakDemandDollarPerKw !== undefined) {
      this.peakDemandDollarPerKw = js.peakDemandDollarPerKw;
    }
    if (js.billingCycleStartDay !== undefined) {
      this.billingCycleStartDay = js.billingCycleStartDay;
    }
    if (js.solar !== undefined) {
      this.solar = js.solar;
    }
    if (js.utilityRateGid !== undefined) {
      this.utilityRateGid = js.utilityRateGid;
    }
    if (js.locationInformation) {
      const li = js.locationInformation;
      if (li.airConditioning !== undefined) {
        this.airConditioning = li.airConditioning;
      }
      if (li.heatSource !== undefined) {
        this.heatSource = li.heatSource;
      }
      if (li.locationSqFt !== undefined) {
        this.locationSqft = li.locationSqFt;
      }
      if (li.numElectricCars !== undefined) {
        this.numElectricCars = li.numElectricCars;
      }
      if (li.locationType !== undefined) {
        this.locationType = li.locationType;
      }
      if (li.numPeople !== undefined) {
        this.numPeople = li.numPeople;
      }
      if (li.swimmingPool !== undefined) {
        this.swimmingPool = li.swimmingPool;
      }
      if (li.hotTub !== undefined) {
        this.hotTub = li.hotTub;
      }
    }
    if (js.latitudeLongitude) {
      if (js.latitudeLongitude.latitude !== undefined) {
        this.latitude = js.latitudeLongitude.latitude;
      }
      if (js.latitudeLongitude.longitude !== undefined) {
        this.longitude = js.latitudeLongitude.longitude;
      }
    }
  }
}

export class VueDeviceChannel {
  public deviceGid: number = 0;
  public name: string = '';
  public channelNum: string = '1,2,3';
  public channelMultiplier: number = 1.0;
  public channelTypeGid: number = 0;
  public nestedDevices: { [key: number]: VueUsageDevice } = {};
  public type: string = '';
  public parentChannelNum?: string;

  constructor(
    gid: number = 0,
    name: string = '',
    channelNum: string = '1,2,3',
    channelMultiplier: number = 1.0,
    channelTypeGid: number = 0
  ) {
    this.deviceGid = gid;
    this.name = name;
    this.channelNum = channelNum;
    this.channelMultiplier = channelMultiplier;
    this.channelTypeGid = channelTypeGid;
  }

  public fromJsonDictionary(js: any): this {
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.name !== undefined) {
      this.name = js.name;
    }
    if (js.channelNum !== undefined) {
      this.channelNum = js.channelNum;
    }
    if (js.channelMultiplier !== undefined) {
      this.channelMultiplier = js.channelMultiplier;
    }
    if (js.channelTypeGid !== undefined) {
      this.channelTypeGid = js.channelTypeGid;
    }
    if (js.type !== undefined) {
      this.type = js.type;
    }
    if (js.parentChannelNum !== undefined) {
      this.parentChannelNum = js.parentChannelNum;
    }
    return this;
  }

  public asDictionary(): any {
    return {
      deviceGid: this.deviceGid,
      name: this.name,
      channelNum: this.channelNum,
      channelMultiplier: this.channelMultiplier,
      channelTypeGid: this.channelTypeGid,
      type: this.type,
      parentChannelNum: this.parentChannelNum,
    };
  }
}

export class VueUsageDevice extends VueDevice {
  public timestamp?: Date;
  public channelUsages: { [key: string]: VueDeviceChannelUsage } = {};

  constructor(gid: number = 0, timestamp?: Date) {
    super(gid);
    this.timestamp = timestamp;
  }

  public fromJsonDictionary(js: any): this {
    if (!js) {
      return this;
    }
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.channelUsages) {
      for (const channel of js.channelUsages) {
        if (channel) {
          const populatedChannel = new VueDeviceChannelUsage(
            0,
            0,
            '1,2,3',
            '',
            this.timestamp
          ).fromJsonDictionary(channel);
          this.channelUsages[populatedChannel.channelNum] = populatedChannel;
        }
      }
    }
    return this;
  }
}

export class VueDeviceChannelUsage extends VueDeviceChannel {
  public usage: number = 0;
  public percentage: number = 0.0;
  public timestamp?: Date;
  public nestedDevices: { [key: number]: VueUsageDevice } = {};

  constructor(
    gid: number = 0,
    usage: number = 0,
    channelNum: string = '1,2,3',
    name: string = '',
    timestamp?: Date
  ) {
    super(gid, name, channelNum);
    this.usage = usage;
    this.timestamp = timestamp;
  }

  public fromJsonDictionary(js: any): this {
    if (!js) {
      return this;
    }
    if (js.channelUsages) {
      js = js.channelUsages;
    }
    if (js.name !== undefined) {
      this.name = js.name;
    }
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.channelNum !== undefined) {
      this.channelNum = js.channelNum;
    }
    if (js.usage !== undefined) {
      this.usage = js.usage;
    }
    if (js.percentage !== undefined) {
      this.percentage = js.percentage;
    }
    if (js.nestedDevices) {
      for (const device of js.nestedDevices) {
        if (device) {
          const populated = new VueUsageDevice(0, this.timestamp).fromJsonDictionary(device);
          this.nestedDevices[populated.deviceGid] = populated;
        }
      }
    }
    return this;
  }
}

export class OutletDevice {
  public deviceGid: number = 0;
  public outletOn: boolean = false;
  public loadGid: number = 0;
  public schedules: any[] = [];

  constructor(gid: number = 0, on: boolean = false) {
    this.deviceGid = gid;
    this.outletOn = on;
  }

  public fromJsonDictionary(js: any): this {
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.outletOn !== undefined) {
      this.outletOn = js.outletOn;
    }
    if (js.loadGid !== undefined) {
      this.loadGid = js.loadGid;
    }
    return this;
  }

  public asDictionary(): any {
    return {
      deviceGid: this.deviceGid,
      outletOn: this.outletOn,
      loadGid: this.loadGid,
    };
  }
}

export class ChargerDevice {
  public deviceGid: number = 0;
  public chargerOn: boolean = false;
  public message: string = '';
  public status: string = '';
  public icon: string = '';
  public iconLabel: string = '';
  public iconDetailText: string = '';
  public faultText: string = '';
  public chargingRate: number = 0;
  public maxChargingRate: number = 0;
  public offPeakSchedulesEnabled: boolean = false;
  public customSchedules: any[] = [];
  public loadGid: number = 0;
  public debugCode: string = '';
  public proControlCode: string = '';
  public breakerPin: string = '';

  constructor(gid: number = 0, on: boolean = false) {
    this.deviceGid = gid;
    this.chargerOn = on;
  }

  public fromJsonDictionary(js: any): this {
    if (js.deviceGid !== undefined) {
      this.deviceGid = js.deviceGid;
    }
    if (js.loadGid !== undefined) {
      this.loadGid = js.loadGid;
    }
    if (js.chargerOn !== undefined) {
      this.chargerOn = js.chargerOn;
    }
    if (js.message !== undefined) {
      this.message = js.message;
    }
    if (js.status !== undefined) {
      this.status = js.status;
    }
    if (js.icon !== undefined) {
      this.icon = js.icon;
    }
    if (js.iconLabel !== undefined) {
      this.iconLabel = js.iconLabel;
    }
    if (js.iconDetailText !== undefined) {
      this.iconDetailText = js.iconDetailText;
    }
    if (js.faultText !== undefined) {
      this.faultText = js.faultText;
    }
    if (js.chargingRate !== undefined) {
      this.chargingRate = js.chargingRate;
    }
    if (js.maxChargingRate !== undefined) {
      this.maxChargingRate = js.maxChargingRate;
    }
    if (js.offPeakSchedulesEnabled !== undefined) {
      this.offPeakSchedulesEnabled = js.offPeakSchedulesEnabled;
    }
    if (js.debugCode !== undefined) {
      this.debugCode = js.debugCode;
    }
    if (js.proControlCode !== undefined) {
      this.proControlCode = js.proControlCode;
    }
    if (js.breakerPIN !== undefined) {
      this.breakerPin = js.breakerPIN;
    }
    return this;
  }

  public asDictionary(): any {
    const d: any = {
      deviceGid: this.deviceGid,
      loadGid: this.loadGid,
      chargerOn: this.chargerOn,
      chargingRate: this.chargingRate,
      maxChargingRate: this.maxChargingRate,
    };
    if (this.breakerPin) {
      d.breakerPIN = this.breakerPin;
    }
    return d;
  }
}

export class ChannelType {
  public channelTypeGid: number = 0;
  public description: string = '';
  public selectable: boolean = false;

  constructor(gid: number = 0, description: string = '', selectable: boolean = false) {
    this.channelTypeGid = gid;
    this.description = description;
    this.selectable = selectable;
  }

  public fromJsonDictionary(js: any): this {
    if (js.channelTypeGid !== undefined) {
      this.channelTypeGid = js.channelTypeGid;
    }
    if (js.description !== undefined) {
      this.description = js.description;
    }
    if (js.selectable !== undefined) {
      this.selectable = js.selectable;
    }
    return this;
  }
}

export class Vehicle {
  public vehicleGid: number = 0;
  public vendor: string = '';
  public apiId: string = '';
  public displayName: string = '';
  public loadGid: string = '';
  public make: string = '';
  public model: string = '';
  public year: number = 0;

  constructor(
    vehicleGid: number = 0,
    vendor: string = '',
    apiId: string = '',
    displayName: string = '',
    loadGid: string = '',
    make: string = '',
    model: string = '',
    year: number = 0
  ) {
    this.vehicleGid = vehicleGid;
    this.vendor = vendor;
    this.apiId = apiId;
    this.displayName = displayName;
    this.loadGid = loadGid;
    this.make = make;
    this.model = model;
    this.year = year;
  }

  public fromJsonDictionary(js: any): this {
    if (js.vehicleGid !== undefined) {
      this.vehicleGid = js.vehicleGid;
    }
    if (js.vendor !== undefined) {
      this.vendor = js.vendor;
    }
    if (js.apiId !== undefined) {
      this.apiId = js.apiId;
    }
    if (js.displayName !== undefined) {
      this.displayName = js.displayName;
    }
    if (js.loadGid !== undefined) {
      this.loadGid = js.loadGid;
    }
    if (js.make !== undefined) {
      this.make = js.make;
    }
    if (js.model !== undefined) {
      this.model = js.model;
    }
    if (js.year !== undefined) {
      this.year = js.year;
    }
    return this;
  }

  public asDictionary(): any {
    return {
      vehicleGid: this.vehicleGid,
      vendor: this.vendor,
      apiId: this.apiId,
      displayName: this.displayName,
      loadGid: this.loadGid,
      make: this.make,
      model: this.model,
      year: this.year,
    };
  }
}

export class VehicleStatus {
  public vehicleGid: number = 0;
  public vehicleState: string = '';
  public batteryLevel: number = 0;
  public batteryRange: number = 0;
  public chargingState: string = '';
  public chargeLimitPercent: number = 0;
  public minutesToFullCharge: number = 0;
  public chargeCurrentRequest: number = 0;
  public chargeCurrentRequestMax: number = 0;

  constructor(
    vehicleGid: number = 0,
    vehicleState: string = '',
    batteryLevel: number = 0,
    batteryRange: number = 0,
    chargingState: string = '',
    chargeLimitPercent: number = 0,
    minutesToFullCharge: number = 0,
    chargeCurrentRequest: number = 0,
    chargeCurrentRequestMax: number = 0
  ) {
    this.vehicleGid = vehicleGid;
    this.vehicleState = vehicleState;
    this.batteryLevel = batteryLevel;
    this.batteryRange = batteryRange;
    this.chargingState = chargingState;
    this.chargeLimitPercent = chargeLimitPercent;
    this.minutesToFullCharge = minutesToFullCharge;
    this.chargeCurrentRequest = chargeCurrentRequest;
    this.chargeCurrentRequestMax = chargeCurrentRequestMax;
  }

  public fromJsonDictionary(js: any): this {
    let jsv = {};
    if (js.settings) {
      jsv = js.settings;
    }

    if ((jsv as any).vehicleGid !== undefined) {
      this.vehicleGid = (jsv as any).vehicleGid;
    }
    if ((jsv as any).vehicleState !== undefined) {
      this.vehicleState = (jsv as any).vehicleState;
    }
    if ((jsv as any).batteryLevel !== undefined) {
      this.batteryLevel = (jsv as any).batteryLevel;
    }
    if ((jsv as any).batteryRange !== undefined) {
      this.batteryRange = (jsv as any).batteryRange;
    }
    if ((jsv as any).chargingState !== undefined) {
      this.chargingState = (jsv as any).chargingState;
    }
    if ((jsv as any).chargeLimitPercent !== undefined) {
      this.chargeLimitPercent = (jsv as any).chargeLimitPercent;
    }
    if ((jsv as any).minutesToFullCharge !== undefined) {
      this.minutesToFullCharge = (jsv as any).minutesToFullCharge;
    }
    if ((jsv as any).chargeCurrentRequest !== undefined) {
      this.chargeCurrentRequest = (jsv as any).chargeCurrentRequest;
    }
    if ((jsv as any).chargeCurrentRequestMax !== undefined) {
      this.chargeCurrentRequestMax = (jsv as any).chargeCurrentRequestMax;
    }

    return this;
  }

  public asDictionary(): any {
    return {
      vehicleGid: this.vehicleGid,
      vehicleState: this.vehicleState,
      batteryLevel: this.batteryLevel,
      batteryRange: this.batteryRange,
      chargingState: this.chargingState,
      chargeLimitPercent: this.chargeLimitPercent,
      minutesToFullCharge: this.minutesToFullCharge,
      chargeCurrentRequest: this.chargeCurrentRequest,
      chargeCurrentRequestMax: this.chargeCurrentRequestMax,
    };
  }
}