import { ethers } from 'ethers';
import { ENV } from '../config/env';
import fetchData from '../utils/fetchData';

const PRIVATE_KEY = ENV.PRIVATE_KEY;
const PROXY_WALLET = ENV.PROXY_WALLET;
const RPC_URL = ENV.RPC_URL;

async function analyzeWallets() {
    console.log('\n🔍 АНАЛИЗ КОШЕЛЬКОВ И АДРЕСОВ\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Получаем EOA адрес из приватного ключа
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const eoaAddress = wallet.address;

    console.log('📋 ШАГ 1: Адрес из приватного ключа (EOA)\n');
    console.log(`   ${eoaAddress}\n`);

    // 2. Показываем PROXY_WALLET из .env
    console.log('📋 ШАГ 2: PROXY_WALLET из .env\n');
    console.log(`   ${PROXY_WALLET}\n`);

    // 3. Сравниваем
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔎 СРАВНЕНИЕ:\n');

    if (eoaAddress.toLowerCase() === PROXY_WALLET.toLowerCase()) {
        console.log('   ⚠️  EOA И PROXY_WALLET - ЭТО ОДИН И ТОТ ЖЕ АДРЕС!\n');
        console.log('   Это значит, что в .env указан EOA адрес, а не proxy wallet.\n');
        console.log('   Polymarket должен был создать отдельный proxy wallet для этого EOA,');
        console.log('   но бот использует сам EOA напрямую.\n');
    } else {
        console.log('   ✅ EOA и PROXY_WALLET - это разные адреса\n');
        console.log('   EOA (владелец):     ', eoaAddress);
        console.log('   PROXY (для торговли):', PROXY_WALLET, '\n');
    }

    // 4. Проверяем является ли PROXY_WALLET смарт-контрактом
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 ШАГ 3: Проверка типа PROXY_WALLET\n');

    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const code = await provider.getCode(PROXY_WALLET);
    const isContract = code !== '0x';

    if (isContract) {
        console.log('   ✅ PROXY_WALLET является смарт-контрактом (Gnosis Safe)\n');
        console.log('   Это правильная конфигурация для Polymarket.\n');
    } else {
        console.log('   ⚠️  PROXY_WALLET НЕ является смарт-контрактом!\n');
        console.log('   Это обычный EOA адрес.\n');
        console.log('   Для Polymarket обычно используется Gnosis Safe proxy.\n');
    }

    // 5. Проверяем активность обоих адресов
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 ШАГ 4: Активность на Polymarket\n');

    try {
        const proxyPositions: any[] = await fetchData(
            `https://data-api.polymarket.com/positions?user=${PROXY_WALLET}`
        );
        console.log(`   PROXY_WALLET (${PROXY_WALLET.slice(0, 10)}...):`);
        console.log(`   • Позиций: ${proxyPositions?.length || 0}\n`);

        if (eoaAddress.toLowerCase() !== PROXY_WALLET.toLowerCase()) {
            const eoaPositions: any[] = await fetchData(
                `https://data-api.polymarket.com/positions?user=${eoaAddress}`
            );
            console.log(`   EOA (${eoaAddress.slice(0, 10)}...):`);
            console.log(`   • Позиций: ${eoaPositions?.length || 0}\n`);
        }
    } catch (error) {
        console.log('   ⚠️  Не удалось получить данные о позициях\n');
    }

    // 6. Проверяем связь через API активности
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 ШАГ 5: Проверка proxyWallet в транзакциях\n');

    try {
        const activities: any[] = await fetchData(
            `https://data-api.polymarket.com/activity?user=${PROXY_WALLET}&type=TRADE`
        );

        if (activities && activities.length > 0) {
            const firstTrade = activities[0];
            const proxyWalletInTrade = firstTrade.proxyWallet;

            console.log(`   Адрес из .env:              ${PROXY_WALLET}`);
            console.log(`   proxyWallet в транзакциях:  ${proxyWalletInTrade}\n`);

            if (proxyWalletInTrade.toLowerCase() === PROXY_WALLET.toLowerCase()) {
                console.log('   ✅ Адреса совпадают!\n');
            } else {
                console.log('   ⚠️  АДРЕСА НЕ СОВПАДАЮТ!\n');
                console.log('   Это может означать, что Polymarket использует другой proxy.\n');
            }
        }
    } catch (error) {
        console.log('   ⚠️  Не удалось проверить транзакции\n');
    }

    // 7. Инструкции
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 КАК ПОЛУЧИТЬ ДОСТУП К ПОЗИЦИЯМ НА ФРОНТЕНДЕ:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🔧 ВАРИАНТ 1: Импортировать приватный ключ в MetaMask\n');
    console.log('   1. Откройте MetaMask');
    console.log('   2. Нажмите на иконку аккаунта -> Import Account');
    console.log('   3. Вставьте ваш PRIVATE_KEY из .env файла');
    console.log('   4. Подключитесь к Polymarket с этим аккаунтом');
    console.log('   5. Polymarket автоматически покажет правильный proxy wallet\n');

    console.log('⚠️  ВНИМАНИЕ: Никогда не делитесь приватным ключом!\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔧 ВАРИАНТ 2: Найти proxy wallet через URL\n');
    console.log(`   Ваши позиции доступны по адресу:\n`);
    console.log(`   https://polymarket.com/profile/${PROXY_WALLET}\n`);
    console.log(`   Откройте эту ссылку в браузере для просмотра.\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔧 ВАРИАНТ 3: Проверить через Polygon Explorer\n');
    console.log(`   https://polygonscan.com/address/${PROXY_WALLET}\n`);
    console.log(`   Здесь можно увидеть все транзакции и токены.\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 8. Дополнительная информация
    console.log('📚 ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ:\n');
    console.log('   • EOA (Externally Owned Account) - ваш основной кошелек');
    console.log('   • Proxy Wallet - смарт-контракт для торговли на Polymarket');
    console.log('   • Один EOA может иметь только один proxy wallet на Polymarket');
    console.log('   • Все позиции хранятся в proxy wallet, не в EOA\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 9. Экспорт информации для подключения
    console.log('📋 ДАННЫЕ ДЛЯ ПОДКЛЮЧЕНИЯ:\n');
    console.log(`   EOA адрес:       ${eoaAddress}`);
    console.log(`   Proxy адрес:     ${PROXY_WALLET}`);
    console.log(
        `   Тип Proxy:       ${isContract ? 'Smart Contract (Gnosis Safe)' : 'EOA (простой адрес)'}\n`
    );

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

analyzeWallets().catch(console.error);
