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

/* -------------------------------------------------------------------------- */


for (const pos of myPositions) {
const value = pos.currentValue ?? 0;
const initial = pos.initialValue ?? 0;
const pnl = pos.percentPnl ?? 0;


totalValue += value;
initialValue += initial;
weightedPnl += value * pnl;
}


const overallPnl = totalValue > 0 ? weightedPnl / totalValue : 0;


const topPositions = [...myPositions]
.sort((a, b) => (b.percentPnl ?? 0) - (a.percentPnl ?? 0))
.slice(0, TOP_POSITIONS_USER_COUNT);


Logger.myPositions(
PROXY_WALLET,
myPositions.length,
topPositions,
overallPnl,
totalValue,
initialValue,
currentBalance,
);
} catch (err) {
Logger.error(`Failed to fetch own positions: ${err}`);
}
};


const logTrackedTraderPositions = async (): Promise<void> => {
const counts: number[] = [];
const details: any[][] = [];
const pnls: number[] = [];


for (const { UserPosition } of userModels) {
const positions = await UserPosition.find().exec();


counts.push(positions.length);


let totalValue = 0;
let weightedPnl = 0;


for (const p of positions) {
const value = p.currentValue ?? 0;
const pnl = p.percentPnl ?? 0;


totalValue += value;
weightedPnl += value * pnl;
}


pnls.push(totalValue > 0 ? weightedPnl / totalValue : 0);


details.push(
[...positions]
.sort((a, b) => (b.percentPnl ?? 0) - (a.percentPnl ?? 0))
.slice(0, TOP_POSITIONS_TRADER_COUNT)
.map((p) => p.toObject()),
);
}


Logger.tradersPositions(USER_ADDRESSES, counts, details, pnls);
};

/* -------------------------------------------------------------------------- */
await new UserActivity({
...activity,
type: 'TRADE',
usdcSize: activity.price * activity.size,
bot: false,
botExcutedTime: 0,
}).save();


Logger.info(`New trade | ${address.slice(0, 6)}…${address.slice(-4)}`);
} catch (err) {
Logger.error(`Trade processing failed (${address}): ${err}`);
}
};


/* -------------------------------------------------------------------------- */
/* Position Synchronizer */
/* -------------------------------------------------------------------------- */


const updatePositions = async (): Promise<void> => {
for (const { address, UserPosition } of userModels) {
try {
const url = `https://data-api.polymarket.com/positions?user=${address}`;
const positions = await fetchData(url);


if (!Array.isArray(positions)) continue;


for (const p of positions) {
await UserPosition.findOneAndUpdate(
{ asset: p.asset, conditionId: p.conditionId },
p,
{ upsert: true },
);
}
} catch (err) {
Logger.error(`Position sync failed (${address}): ${err}`);
}
}
};