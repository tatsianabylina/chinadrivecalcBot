const { Telegraf } = require('telegraf');
const express = require('express');

// === ТОКЕН БОТА ===
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error('❌ BOT_TOKEN не задан в Environment Variables!');
}
const bot = new Telegraf(BOT_TOKEN);

// === НАСТРОЙКИ ===
const COST_PER_KG = 32;
const CNY_TO_BYN = 0.64;

const menuButtons = {
  reply_markup: {
    keyboard: [
      ['🧮 Просчитать стоимость товара с доставкой'],
      ['📞 Связаться с менеджером']
    ],
    resize_keyboard: true
  }
};

const userState = {};

// === ОБРАБОТЧИКИ ===
bot.start((ctx) => {
  ctx.reply(
    `👋 Привет! Я — бот-помощник по расчёту стоимости товара с учетом доставки из Китая (при совместном выкупе). Для просчета крупногабаритных товаров (автозапчасти, мебель, техника, др) - выберите в меню: "Связаться с менеджером".

Выберите действие:`,
    menuButtons
  );
});

bot.hears('🧮 Просчитать стоимость товара с доставкой', (ctx) => {
  userState[ctx.from.id] = { step: 'waiting_weight' };
  ctx.reply('📦 Введите вес посылки в килограммах (например: 2.5)');
});

bot.hears('📞 Связаться с менеджером', (ctx) => {
  ctx.reply('📲 Свяжитесь с нашим менеджером: @Tatiana_Bylina\nОн ответит в течение 5 минут!');
});

bot.on('text', (ctx) => {
  const userId = ctx.from.id;
  const state = userState[userId];
  const text = ctx.message.text.trim();

  if (!state) return;

  if (state.step === 'waiting_weight') {
    const weight = parseFloat(text);
    if (isNaN(weight) || weight <= 0) return ctx.reply('❌ Пожалуйста, введите корректный вес (например: 1.5)');
    userState[userId] = { step: 'waiting_price', weight };
    return ctx.reply('💰 Введите стоимость товара в юанях (например: 400)');
  }

  if (state.step === 'waiting_price') {
    const priceCNY = parseFloat(text);
    if (isNaN(priceCNY) || priceCNY < 0) return ctx.reply('❌ Пожалуйста, введите корректную сумму в юанях.');

    const { weight } = state;
    const deliveryCost = weight * COST_PER_KG;
    const itemCostBYN = priceCNY * CNY_TO_BYN;
    const total = deliveryCost + itemCostBYN;

    const resultText = `
📦 *Результат расчёта:*

• Вес: *${weight} кг*
• Доставка: *${deliveryCost.toFixed(2)} BYN* (по ${COST_PER_KG} BYN/кг)
• Товар: *${priceCNY} CNY* → *${itemCostBYN.toFixed(2)} BYN* (по курсу 1 CNY = ${CNY_TO_BYN} BYN)
• Итого к оплате: *${total.toFixed(2)} BYN*

Расчет основан на данных веса, которые вы ввели. Фактический вес может отличаться! 🚀
    `.trim();

    ctx.reply(resultText, { parse_mode: 'Markdown' });
    delete userState[userId];
    setTimeout(() => ctx.reply('Выберите следующее действие:', menuButtons), 1000);
  }
});

// === ВЕБ-СЕРВЕР ===
const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Бот работает! Webhook активен.');
});

app.use(bot.webhookCallback('/' + BOT_TOKEN));

const PORT = process.env.PORT || 3000;

// === УСТАНОВКА ВЕБХУКА (ВАЖНО: ДО app.listen()) ===
const DOMAIN = process.env.RENDER_EXTERNAL_HOSTNAME || 'chinadrivecalcbot.onrender.com';
const WEBHOOK_URL = `https://${DOMAIN}/`;
bot.telegram.setWebhook(WEBHOOK_URL + BOT_TOKEN)
  .then(() => console.log('✅ Вебхук успешно установлен:', WEBHOOK_URL + BOT_TOKEN))
  .catch(err => console.error('🔴 Ошибка установки вебхука:', err));

// === ЗАПУСК СЕРВЕРА (ПОСЛЕ установки вебхука!) ===
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});
