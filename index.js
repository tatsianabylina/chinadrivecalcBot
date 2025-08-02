const { Telegraf } = require('telegraf');
const express = require('express');

// === ТОКЕН БОТА (из переменной окружения) ===
const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// === НАСТРОЙКИ ===
const COST_PER_KG = 23;        // BYN за 1 кг
const CNY_TO_BYN = 0.62;       // 1 юань = 0.62 BYN

// === /start ===
bot.start((ctx) => {
  ctx.reply(`
👋 Привет! Я — бот-калькулятор доставки из Китая.

Отправьте:
\`вес, сумма в юанях\`

Пример:
\`2.5, 400\`
  `.trim(), { parse_mode: 'Markdown' });
});

// === Обработка: "2.5, 400" ===
bot.hears(/([\d.]+)\s*,\s*([\d.]+)/, (ctx) => {
  const text = ctx.message.text;
  const match = text.match(/([\d.]+)\s*,\s*([\d.]+)/);
  const weight = parseFloat(match[1]);
  const priceCNY = parseFloat(match[2]);

  if (isNaN(weight) || weight <= 0) {
    return ctx.reply('❌ Вес должен быть положительным числом.');
  }
  if (isNaN(priceCNY) || priceCNY < 0) {
    return ctx.reply('❌ Сумма в юанях должна быть числом.');
  }

  const deliveryCost = weight * COST_PER_KG;
  const itemCostBYN = priceCNY * CNY_TO_BYN;
  const total = deliveryCost + itemCostBYN;

  ctx.reply(`
📦 *Результат расчёта:*

• Вес: *${weight} кг*
• Доставка: *${deliveryCost.toFixed(2)} BYN* (по ${COST_PER_KG} BYN/кг)
• Товар: *${priceCNY} CNY* → *${itemCostBYN.toFixed(2)} BYN* (по курсу 1 CNY = ${CNY_TO_BYN} BYN)
• Итого: *${total.toFixed(2)} BYN*

Спасибо! 🚀
  `.trim(), { parse_mode: 'Markdown' });
});

// === Веб-сервер для Render ===
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/'));

app.get('/', (req, res) => {
  res.send('✅ Бот запущен на Render.com');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});

// === Запуск бота ===
bot.launch();
console.log('✅ Бот запущен и готов к работе!');
