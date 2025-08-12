#!/usr/bin/env ts-node

import { EmporiaVue } from '../index';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main(): Promise<void> {
  const vue = new EmporiaVue();
  
  try {
    const loggedIn = await vue.login({ tokenStorageFile: 'keys.json' });
    console.log('Logged in?', loggedIn);
    console.log();

    if (!loggedIn) {
      throw new Error('Login failed');
    }

    const devices = await vue.getDevices();
    const [outlets, chargers] = await vue.getDevicesStatus();

    for (const device of devices) {
      console.log(device.deviceGid, device.manufacturerId, device.model, device.firmware);
      if (device.outlet) {
        console.log('Found an outlet! On?', device.outlet.outletOn);
      }
      if (device.evCharger) {
        console.log(
          `Found an EV Charger! On? ${device.evCharger.chargerOn} Charge rate: ${device.evCharger.chargingRate}A/${device.evCharger.maxChargingRate}A`
        );
      }
      for (const chan of device.channels) {
        console.log('\t', chan.deviceGid, chan.name, chan.channelNum, chan.channelMultiplier);
      }
    }

    if (outlets.length > 0) {
      console.log(`Discovered ${outlets.length} outlets. Press enter to turn them all off.`);
      await askQuestion('');
      
      for (const outlet of outlets) {
        console.log(`Turning off ${outlet.deviceGid}`);
        await vue.updateOutlet(outlet, false);
      }
      
      console.log('Outlets turned off. Press enter to turn them on.');
      await askQuestion('');
      
      for (const outlet of outlets) {
        console.log(`Turning on ${outlet.deviceGid}`);
        await vue.updateOutlet(outlet, true);
      }
    } else {
      console.log('No outlets discovered.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
}

if (require.main === module) {
  main();
}