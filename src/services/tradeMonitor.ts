import WebSocket from 'ws';
import { ENV } from '../config/env';
import { getUserActivityModel, getUserPositionModel } from '../models/userHistory';
import Logger from '../utils/logger';

/**
 * -----------------------------------------------------------------------------
 * Trade Monitor – Skeleton
 * -----------------------------------------------------------------------------
 * Main monitoring, RTDS, syncing, and execution logic removed.
 * This file now acts as a structural placeholder / shared definitions module.
 * -----------------------------------------------------------------------------
 */

/* -------------------------------------------------------------------------- */
/*                               Configuration                                */
/* -------------------------------------------------------------------------- */

const {
  USER_ADDRESSES,
} = ENV;

if (!USER_ADDRESSES?.length) {
  throw new Error('USER_ADDRESSES is not defined or empty');
}

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UserModel = {
  address: string;
  UserActivity: ReturnType<typeof getUserActivityModel>;
  UserPosition: ReturnType<typeof getUserPositionModel>;
};

export type TradeActivity = {
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
/*                               State (Static)                                */
/* -------------------------------------------------------------------------- */

export const userModels: UserModel[] = USER_ADDRESSES.map((address) => ({
  address,
  UserActivity: getUserActivityModel(address),
  UserPosition: getUserPositionModel(address),
}));

/* -------------------------------------------------------------------------- */
/*                              Placeholder APIs                               */
/* -------------------------------------------------------------------------- */

/**
 * Trade processing logic intentionally removed.
 */
export const processTradeActivity = async (
  _activity: TradeActivity,
  _address: string,
): Promise<void> => {
  Logger.info('processTradeActivity disabled');
};

/**
 * Position synchronization logic intentionally removed.
 */
export const updatePositions = async (): Promise<void> => {
  Logger.info('updatePositions disabled');
};

/**
 * RTDS connection logic intentionally removed.
 */
export const connectRTDS = async (): Promise<void> => {
  Logger.info('connectRTDS disabled');
};

/* -------------------------------------------------------------------------- */
/*                               Public API                                    */
/* -------------------------------------------------------------------------- */

export const stopTradeMonitor = (): void => {
  Logger.info('Trade monitor shutdown requested (no-op)');
};

/**
 * Main runtime logic removed.
 */
const tradeMonitor = async (): Promise<void> => {
  Logger.info('Trade monitor logic removed');
};

export default tradeMonitor;
