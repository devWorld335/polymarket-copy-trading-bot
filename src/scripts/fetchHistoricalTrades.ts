import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

const USER_ADDRESSES = ENV.USER_ADDRESSES;

const HISTORY_DAYS = (() => {
    const raw = process.env.HISTORY_DAYS;
    const value = raw ? Number(raw) : 30;
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 30;
})();

const MAX_TRADES_PER_TRADER = (() => {
    const raw = process.env.HISTORY_MAX_TRADES;
    const value = raw ? Number(raw) : 20000;
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 20000;
})();

const BATCH_SIZE = (() => {
    const raw = process.env.HISTORY_BATCH_SIZE;
    const value = raw ? Number(raw) : 100;
    return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 1000) : 100;
})();

const MAX_PARALLEL = (() => {
    const raw = process.env.HISTORY_MAX_PARALLEL;
    const value = raw ? Number(raw) : 4;
    return Number.isFinite(value) && value > 0 ? Math.min(Math.floor(value), 10) : 4;
})();

interface TradeApiResponse {
    id: string;
    timestamp: number;
    slug?: string;
    market?: string;
    asset: string;
    side: 'BUY' | 'SELL';
    price: number;
    usdcSize: number;
    size: number;
    outcome?: string;
}

interface CachedTrades {
    name: string;
    traderAddress: string;
    fetchedAt: string;
    period: string;
    historyDays: number;
    totalTrades: number;
    trades: TradeApiResponse[];
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchBatch = async (
    address: string,
    offset: number,
    limit: number
): Promise<TradeApiResponse[]> => {
    const response = await axios.get(
        `https://data-api.polymarket.com/activity?user=${address}&type=TRADE&limit=${limit}&offset=${offset}`,
        {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        }
    );

    return Array.isArray(response.data) ? response.data : [];
};

const fetchTradesForTrader = async (address: string): Promise<TradeApiResponse[]> => {
    console.log(`\n🚀 Загрузка истории для ${address} (последние ${HISTORY_DAYS} дн.)`);
    const sinceTimestamp = Math.floor((Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000) / 1000);

    let offset = 0;
    let allTrades: TradeApiResponse[] = [];
    let hasMore = true;

    while (hasMore && allTrades.length < MAX_TRADES_PER_TRADER) {
        const batchLimit = Math.min(BATCH_SIZE, MAX_TRADES_PER_TRADER - allTrades.length);
        const batch = await fetchBatch(address, offset, batchLimit);

        if (batch.length === 0) {
            hasMore = false;
            break;
        }

        const filtered = batch.filter((trade) => trade.timestamp >= sinceTimestamp);
        allTrades = allTrades.concat(filtered);

        if (batch.length < batchLimit || filtered.length < batch.length) {
            hasMore = false;
        }

        offset += batchLimit;

        if (allTrades.length % (BATCH_SIZE * MAX_PARALLEL) === 0) {
            await sleep(150);
        }
    }

    const sorted = allTrades.sort((a, b) => a.timestamp - b.timestamp);
    console.log(`✓ Получено ${sorted.length} сделок`);
    return sorted;
};

const saveTradesToCache = (address: string, trades: TradeApiResponse[]) => {
    const cacheDir = path.join(process.cwd(), 'trader_data_cache');
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
    }

    const today = new Date().toISOString().split('T')[0];
    const cacheFile = path.join(cacheDir, `${address}_${HISTORY_DAYS}d_${today}.json`);

    const payload: CachedTrades = {
        name: `trader_${address.slice(0, 6)}_${HISTORY_DAYS}d_${today}`,
        traderAddress: address,
        fetchedAt: new Date().toISOString(),
        period: `${HISTORY_DAYS}_days`,
        historyDays: HISTORY_DAYS,
        totalTrades: trades.length,
        trades,
    };

    fs.writeFileSync(cacheFile, JSON.stringify(payload, null, 2), 'utf8');
    console.log(`💾 Сохранено в ${cacheFile}`);
};

const chunk = <T>(array: T[], size: number): T[][] => {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
};

const main = async () => {
    if (USER_ADDRESSES.length === 0) {
        console.log('USER_ADDRESSES пуст. Проверь .env');
        return;
    }

    console.log('📥 Старт выгрузки истории сделок');
    console.log(`Трейдеров: ${USER_ADDRESSES.length}`);
    console.log(
        `Период: ${HISTORY_DAYS} дней, максимум ${MAX_TRADES_PER_TRADER} сделок на трейдера`
    );

    const addressChunks = chunk(USER_ADDRESSES, MAX_PARALLEL);

    for (const chunkItem of addressChunks) {
        await Promise.all(
            chunkItem.map(async (address) => {
                try {
                    const trades = await fetchTradesForTrader(address);
                    saveTradesToCache(address, trades);
                } catch (error) {
                    console.error(`✗ Ошибка при загрузке для ${address}:`, error);
                }
            })
        );
    }

    console.log('\n✅ Выгрузка завершена');
};

main();
