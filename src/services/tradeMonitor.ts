import WebSocket from 'ws';
import { ENV } from '../config/env';
import { getUserActivityModel, getUserPositionModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';
import Logger from '../utils/logger';


/**
* -----------------------------------------------------------------------------
* Trade Monitor – RTDS
* -----------------------------------------------------------------------------
* Responsibilities:
* - Initialize DB state and log summaries
* - Connect to Polymarket RTDS (WebSocket)
* - Persist new trade activity (idempotent)
* - Periodically refresh positions via HTTP fallback
* - Graceful shutdown & reconnection handling
* -----------------------------------------------------------------------------
*/