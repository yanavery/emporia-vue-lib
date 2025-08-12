#!/usr/bin/env ts-node

import { EmporiaVue, Scale, Unit, VueUsageDevice, VueDevice } from '../index';

function printRecursive(
  usageDict: { [key: number]: VueUsageDevice },
  info: { [key: number]: VueDevice },
  depth: number = 0
): void {
  for (const [gid, device] of Object.entries(usageDict)) {
    const deviceGid = parseInt(gid);
    for (const [channelNum, channel] of Object.entries(device.channelUsages)) {
      let name = channel.name;
      if (name === 'Main' && info[deviceGid]) {
        name = info[deviceGid].deviceName;
      }
      console.log('-'.repeat(depth), `${gid} ${channelNum} ${name} ${channel.usage} kwh`);
      if (channel.nestedDevices && Object.keys(channel.nestedDevices).length > 0) {
        printRecursive(channel.nestedDevices, info, depth + 1);
      }
    }
  }
}

async function main(): Promise<void> {
  const vue = new EmporiaVue();

  try {
    await vue.login({
      username: 'put_username_here',
      password: 'put_password_here',
      tokenStorageFile: 'keys.json',
    });

    const devices = await vue.getDevices();
    const deviceGids: number[] = [];
    const deviceInfo: { [key: number]: VueDevice } = {};

    for (const device of devices) {
      if (!deviceGids.includes(device.deviceGid)) {
        deviceGids.push(device.deviceGid);
        deviceInfo[device.deviceGid] = device;
      } else {
        deviceInfo[device.deviceGid].channels.push(...device.channels);
      }
    }

    const deviceUsageDict = await vue.getDeviceListUsage(
      deviceGids.map(String),
      undefined,
      Scale.MINUTE,
      Unit.KWH
    );

    console.log('device_gid channel_num name usage unit');
    printRecursive(deviceUsageDict, deviceInfo);
  } catch (error) {
    console.error('Error:', error);
  }
}

if (require.main === module) {
  main();
}