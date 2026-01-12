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


/* -------------------------------------------------------------------------- */
/* Configuration */
/* -------------------------------------------------------------------------- */


const {
USER_ADDRESSES,
TOO_OLD_TIMESTAMP,
RTDS_URL,
MAX_RECONNECT_ATTEMPTS,
RECONNECT_DELAY_MS,
POSITION_UPDATE_INTERVAL_MS,
PROXY_WALLET,
TOP_POSITIONS_USER_COUNT,
TOP_POSITIONS_TRADER_COUNT,
} = ENV;


if (!USER_ADDRESSES?.length) {
throw new Error('USER_ADDRESSES is not defined or empty');
}


/* -------------------------------------------------------------------------- */
/* Types */
/* -------------------------------------------------------------------------- */


type UserModel = {
address: string;
UserActivity: ReturnType<typeof getUserActivityModel>;
UserPosition: ReturnType<typeof getUserPositionModel>;
};


type TradeActivity = {
transactionHash: string;
timestamp: number;
conditionId: string;
proxyWallet: string;
size: number;
price: number;
asset: string;
side: string;
outcomeIndex: number;
title?: string;
slug?: string;
icon?: string;
eventSlug?: string;
outcome?: string;
name?: string;
pseudonym?: string;
bio?: string;
profileImage?: string;
profileImageOptimized?: string;
};