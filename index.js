const { Telegraf } = require('telegraf');
  if (state.step === 'waiting_weight') {
    const weight = parseFloat(text);

    if (isNaN(weight) || weight <= 0) {
      return ctx.reply('❌ Пожалуйста, введите корректный вес (например: 1.5)');
    }

    userState[userId] = { step: 'waiting_price', weight };
    return ctx.reply('💰 Введите стоимость товара в юанях (например: 400)');
  }

  // Шаг 2: Ввод цены
  if (state.step === 'waiting_price') {
    const priceCNY = parseFloat(text);

    if (isNaN(priceCNY) || priceCNY < 0) {
      return ctx.reply('❌ Пожалуйста, введите корректную сумму в юанях.');
    }

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

Расчет ориентировочный, если у вас остались вопросы - нажмите на кнопку СВЯЗАТЬСЯ С МЕНЕДЖЕРОМ 🚀
    `.trim();

    ctx.reply(resultText, { parse_mode: 'Markdown' });

    // Сброс состояния
    delete userState[userId];

    // Возврат в меню
    setTimeout(() => {
      ctx.reply('Выберите следующее действие:', menuButtons);
    }, 1000);
  }
});

// === ВЕБ-СЕРВЕР ДЛЯ RENDER ===
const app = express();
app.use(express.json());
app.use(bot.webhookCallback('/'));

// Главная страница (для UptimeRobot)
app.get('/', (req, res) => {
  res.send('✅ Бот работает! Webhook активен.');
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на порту ${PORT}`);
});

// === ЗАПУСК БОТА ===
bot.launch()
  .then(() => console.log('✅ Бот запущен и готов к работе!'))
  .catch(err => console.error('🔴 Ошибка запуска бота:', err));
