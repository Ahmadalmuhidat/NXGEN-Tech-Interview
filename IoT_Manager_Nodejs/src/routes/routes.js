const express = require('express');
const router = express.Router();
const DevicesController = require('../controllers/devicesController');
const DataController = require('../controllers/dataController');

// Devices routes
router.get('/devices', DevicesController.getDevices);
router.post('/devices', DevicesController.createDevice);
router.get('/devices/stats', DevicesController.getDevicesStats);

// Data routes
router.get('/devices/:id/data', DataController.getData);
router.post('/devices/:id/data', DataController.createData);
router.get('/devices/data/count/last24h', DataController.getDataCountLast24h);

module.exports = router;