import { ClobClient } from '@polymarket/clob-client';
import { UserActivityInterface, UserPositionInterface } from '../interfaces/User';
import { ENV } from '../config/env';
import { getUserActivityModel } from '../models/userHistory';
import fetchData from '../utils/fetchData';
import getMyBalance from '../utils/getMyBalance';
import postOrder from '../utils/postOrder';
import Logger from '../utils/logger';

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const {
    USER_ADDRESSES,
    PROXY_WALLET,
    TRADE_AGGREGATION_ENABLED,
    TRADE_AGGREGATION_WINDOW_SECONDS,
    TRADE_AGGREGATION_MIN_TOTAL_USD,
    EXECUTOR_LOOP_DELAY_MS,
    WAITING_MESSAGE_INTERVAL_MS,
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

interface AggregatedTrade {
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

const readTempTrades = async (): Promise<TradeWithUser[]> => {
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

const addToAggregationBuffer = (trade: TradeWithUser): void => {
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

const getReadyAggregatedTrades = async (): Promise<AggregatedTrade[]> => {
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

/* -------------------------------------------------------------------------- */
/*                              EXECUTION LOGIC                                */
/* -------------------------------------------------------------------------- */

const executeAggregatedTrades = async (
    clobClient: ClobClient,
    batches: AggregatedTrade[]
) => {
    for (const batch of batches) {
        Logger.header(`📊 AGGREGATED TRADE`);
        Logger.info(`${batch.slug || batch.asset} | ${batch.side}`);
        Logger.info(
            `Trades: ${batch.trades.length} | Volume: $${batch.totalUsdcSize.toFixed(
                2
            )}`
        );

        for (const trade of batch.trades) {
            await getUserActivityModel(trade.userAddress).updateOne(
                { _id: trade._id },
                { $set: { botExcutedTime: Date.now() } }
            );
        }

        const [myPositions, userPositions] = await Promise.all([
            fetchData(`https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`),
            fetchData(
                `https://data-api.polymarket.com/positions?user=${batch.userAddress}`
            ),
        ]);

        const myBalance = await getMyBalance(PROXY_WALLET);
        const userBalance = userPositions.reduce(
            (sum: number, p: UserPositionInterface) =>
                sum + (p.currentValue ?? 0),
            0
        );

        const syntheticTrade: UserActivityInterface = {
            ...batch.trades[0],
            usdcSize: batch.totalUsdcSize,
            price: batch.averagePrice,
            side: batch.side,
        };

        await postOrder(
            clobClient,
            batch.side === 'BUY' ? 'buy' : 'sell',
            myPositions.find(p => p.conditionId === batch.conditionId),
            userPositions.find(p => p.conditionId === batch.conditionId),
            syntheticTrade,
            myBalance,
            userBalance,
            batch.userAddress
        );

        Logger.separator();
    }
};

/* -------------------------------------------------------------------------- */
/*                             EXECUTOR LIFECYCLE                              */
/* -------------------------------------------------------------------------- */

let isRunning = true;

export const stopTradeExecutor = () => {
    isRunning = false;
    Logger.info('Trade executor shutdown requested');
};

const tradeExecutor = async (clobClient: ClobClient) => {
    Logger.success(`Trade executor running for ${USER_ADDRESSES.length} trader(s)`);

    let lastCheck = Date.now();

    while (isRunning) {
        const trades = await readTempTrades();

        if (TRADE_AGGREGATION_ENABLED && trades.length) {
            Logger.info(`📥 ${trades.length} trade(s) detected`);
            trades.forEach(addToAggregationBuffer);
        }

        const ready = TRADE_AGGREGATION_ENABLED
            ? await getReadyAggregatedTrades()
            : [];

        if (ready.length) {
            await executeAggregatedTrades(clobClient, ready);
            lastCheck = Date.now();
        }

        if (
            Date.now() - lastCheck >
            WAITING_MESSAGE_INTERVAL_MS
        ) {
            Logger.waiting(USER_ADDRESSES.length);
            lastCheck = Date.now();
        }

        await new Promise(res =>
            setTimeout(res, EXECUTOR_LOOP_DELAY_MS)
        );
    }

    Logger.info('Trade executor stopped');
};

export default tradeExecutor;
