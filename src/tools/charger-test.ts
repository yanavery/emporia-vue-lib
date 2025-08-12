#!/usr/bin/env ts-node

import { EmporiaVue } from '../index';
import * as fs from 'fs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPassword(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    let password = '';
    process.stdin.on('data', (char) => {
      const c = char.toString();
      switch (c) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        default:
          password += c;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function main(): Promise<void> {
  const vue = new EmporiaVue();
  let loggedIn = false;

  try {
    if (!fs.existsSync('keys.json')) {
      const email = await askQuestion('Enter your email: ');
      const password = await askPassword('Enter your password: ');

      loggedIn = await vue.login({
        username: email,
        password: password,
        tokenStorageFile: 'keys.json',
      });
    } else {
      loggedIn = await vue.login({ tokenStorageFile: 'keys.json' });
    }

    console.log('Logged in?', loggedIn);
    if (!loggedIn) {
      throw new Error('Login failed');
    }

    const chargers = await vue.getChargers();

    console.log('Charger data:');
    console.log(JSON.stringify(chargers.map(c => ({
      deviceGid: c.deviceGid,
      chargerOn: c.chargerOn,
      message: c.message,
      status: c.status,
      icon: c.icon,
      iconLabel: c.iconLabel,
      iconDetailText: c.iconDetailText,
      faultText: c.faultText,
      chargingRate: c.chargingRate,
      maxChargingRate: c.maxChargingRate,
      offPeakSchedulesEnabled: c.offPeakSchedulesEnabled,
      loadGid: c.loadGid,
      debugCode: c.debugCode,
      proControlCode: c.proControlCode,
      breakerPin: c.breakerPin,
    })), null, 4));

    await askQuestion('Press enter to turn off the charger and print the charger data again...');

    for (const charger of chargers) {
      await vue.updateCharger(charger, false);
      console.log('Updated charger data:');
      console.log(JSON.stringify({
        deviceGid: charger.deviceGid,
        chargerOn: charger.chargerOn,
        message: charger.message,
        status: charger.status,
        icon: charger.icon,
        iconLabel: charger.iconLabel,
        iconDetailText: charger.iconDetailText,
        faultText: charger.faultText,
        chargingRate: charger.chargingRate,
        maxChargingRate: charger.maxChargingRate,
        offPeakSchedulesEnabled: charger.offPeakSchedulesEnabled,
        loadGid: charger.loadGid,
        debugCode: charger.debugCode,
        proControlCode: charger.proControlCode,
        breakerPin: charger.breakerPin,
      }, null, 4));
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