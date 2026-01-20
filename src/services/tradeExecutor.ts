import { UserActivityInterface } from '../interfaces/User';
import { ENV } from '../config/env';
import { getUserActivityModel } from '../models/userHistory';
import Logger from '../utils/logger';

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const {
    USER_ADDRESSES,
    TRADE_AGGREGATION_WINDOW_SECONDS,
    TRADE_AGGREGATION_MIN_TOTAL_USD,
} = ENV;

/* -------------------------------------------------------------------------- */
/*                                   MODELS                                   */
/* -------------------------------------------------------------------------- */

const userActivityModels = USER_ADDRESSES.map(address => ({
    address,
    model: getUserActivityModel(address),
}));

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface TradeWithUser extends UserActivityInterface {
    userAddress: string;
}

export interface AggregatedTrade {
    userAddress: string;
    conditionId: string;
    asset: string;
    side: 'BUY' | 'SELL';
    slug?: string;
    eventSlug?: string;
    trades: TradeWithUser[];
    totalUsdcSize: number;
    averagePrice: number;
    firstTradeTime: number;
    lastTradeTime: number;
}

/* -------------------------------------------------------------------------- */
/*                              AGGREGATION STATE                              */
/* -------------------------------------------------------------------------- */

const tradeAggregationBuffer = new Map<string, AggregatedTrade>();

/* -------------------------------------------------------------------------- */
/*                               DB READ HELPERS                               */
/* -------------------------------------------------------------------------- */

export const readTempTrades = async (): Promise<TradeWithUser[]> => {
    const results: TradeWithUser[] = [];

    for (const { address, model } of userActivityModels) {
        const trades = await model.find({
            type: 'TRADE',
            bot: false,
            botExcutedTime: 0,
        });

        results.push(
            ...trades.map(t => ({
                ...(t.toObject() as UserActivityInterface),
                userAddress: address,
            }))
        );
    }

    return results;
};

/* -------------------------------------------------------------------------- */
/*                             AGGREGATION LOGIC                               */
/* -------------------------------------------------------------------------- */

const getAggregationKey = (t: TradeWithUser): string =>
    `${t.userAddress}:${t.conditionId}:${t.asset}:${t.side}`;

export const addToAggregationBuffer = (trade: TradeWithUser): void => {
    const key = getAggregationKey(trade);
    const now = Date.now();
    const existing = tradeAggregationBuffer.get(key);

    if (!existing) {
        tradeAggregationBuffer.set(key, {
            userAddress: trade.userAddress,
            conditionId: trade.conditionId,
            asset: trade.asset,
            side: trade.side ?? 'BUY',
            slug: trade.slug,
            eventSlug: trade.eventSlug,
            trades: [trade],
            totalUsdcSize: trade.usdcSize,
            averagePrice: trade.price,
            firstTradeTime: now,
            lastTradeTime: now,
        });
        return;
    }

    const newTotal = existing.totalUsdcSize + trade.usdcSize;

    existing.averagePrice =
        (existing.averagePrice * existing.totalUsdcSize +
            trade.price * trade.usdcSize) /
        newTotal;

    existing.totalUsdcSize = newTotal;
    existing.trades.push(trade);
    existing.lastTradeTime = now;
};

export const getReadyAggregatedTrades = async (): Promise<AggregatedTrade[]> => {
    const ready: AggregatedTrade[] = [];
    const now = Date.now();
    const windowMs = TRADE_AGGREGATION_WINDOW_SECONDS * 1000;

    for (const [key, agg] of tradeAggregationBuffer.entries()) {
        if (now - agg.firstTradeTime < windowMs) continue;

        if (agg.totalUsdcSize >= TRADE_AGGREGATION_MIN_TOTAL_USD) {
            ready.push(agg);
        } else {
            Logger.info(
                `Skipping aggregation (${agg.trades.length} trades | $${agg.totalUsdcSize.toFixed(
                    2
                )}) below minimum`
            );

            for (const trade of agg.trades) {
                await getUserActivityModel(trade.userAddress).updateOne(
                    { _id: trade._id },
                    { bot: true }
                );
            }
        }

        tradeAggregationBuffer.delete(key);
    }

    return ready;
};
