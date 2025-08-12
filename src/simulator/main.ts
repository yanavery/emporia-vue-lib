#!/usr/bin/env ts-node

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SimulatorState } from './simulator-state';

const state = new SimulatorState();

// Set up a default home with an 8 channel Vue, 4 outlets, and 1 EV charger
state.addVue(1000, 'Home', 8);
state.addOutlet(1001, 'plug1', true, 1000, '1');
state.addOutlet(1002, 'plug2', false, 1000, '1');
state.addOutlet(1003, 'plug3', true, 1000, '4');
state.addOutlet(1004, 'plug4', false, 1000, '1,2,3');
state.addCharger(1005, 'EV', true, 50, 1000, '1,2,3');

// Set power usage
state.setChannel1MinWatts(1005, '1,2,3', 40 * 240); // EV charger: 40A at 240V
state.setChannel1MinWatts(1003, '1,2,3', 10 * 120); // plug3: 10A at 120V
state.setChannel1MinWatts(1001, '1,2,3', 5 * 120);  // plug1: 5A at 120V
state.setChannelBidirectionality(1000, '2', true);
state.setChannel1MinWatts(1000, '2', -10 * 120);    // Channel 2 generating power
state.setChannel1MinWatts(1000, '1,2,3', 85 * 240); // Overall house: 85A at 240V
state.setChannel1MinWatts(1000, 'Balance', 42.5 * 240); // Balance

const server: FastifyInstance = Fastify({ logger: true });

// Error handler
server.setErrorHandler((error, request, reply) => {
  console.error(error);
  reply.status(error.statusCode || 500).send({
    message: error.message || 'Internal Server Error'
  });
});

// Routes
server.get('/customers', async (request: FastifyRequest, reply: FastifyReply) => {
  return state.getCustomer();
});

server.get('/customers/devices', async (request: FastifyRequest, reply: FastifyReply) => {
  return state.getCustomersDevices();
});

server.get<{ Params: { deviceGid: string } }>(
  '/devices/:deviceGid/locationProperties',
  async (request: FastifyRequest<{ Params: { deviceGid: string } }>, reply: FastifyReply) => {
    const deviceGid = parseInt(request.params.deviceGid);
    const device = state.getDeviceByGid(deviceGid);
    
    if (!device) {
      reply.status(401).send({
        message: `${state.getCustomer().email} is not authorized on the requested deviceGid ${deviceGid}`
      });
      return;
    }
    
    return device.locationProperties;
  }
);

server.get('/devices/channels/channeltypes', async (request: FastifyRequest, reply: FastifyReply) => {
  return state.getChannelTypes();
});

server.get('/customers/devices/status', async (request: FastifyRequest, reply: FastifyReply) => {
  return state.getDevicesStatus();
});

server.get<{ Querystring: { apiMethod: string; deviceGids?: string; instant?: string; scale?: string; energyUnit?: string } }>(
  '/AppAPI',
  async (request: FastifyRequest<{ Querystring: { apiMethod: string; deviceGids?: string; instant?: string; scale?: string; energyUnit?: string } }>, reply: FastifyReply) => {
    const { apiMethod, deviceGids, instant, scale, energyUnit } = request.query;
    
    if (apiMethod === 'getDeviceListUsages') {
      return state.getDeviceListUsages(deviceGids, instant, scale, energyUnit);
    } else if (apiMethod === 'getChartUsage') {
      // For simplicity, return empty usage data
      return {
        firstUsageInstant: new Date().toISOString(),
        usageList: []
      };
    }
    
    reply.status(400).send({ message: 'Unknown API method' });
  }
);

server.put<{ Body: any }>('/devices/outlet', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
  const outletData = request.body;
  const updated = state.updateOutlet(outletData);
  return updated;
});

server.put<{ Body: any }>('/devices/evcharger', async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
  const chargerData = request.body;
  const updated = state.updateCharger(chargerData);
  return updated;
});

server.get('/customers/vehicles', async (request: FastifyRequest, reply: FastifyReply) => {
  return [];
});

const start = async (): Promise<void> => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Emporia Vue Simulator running on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}