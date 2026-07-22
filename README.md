# Вселенная — обучающая платформа

Платформа с уроками, гайдами и воркшопами, которая открывается как Telegram
Mini App (внутри Telegram) или как обычный сайт с email/паролем.

Стек: Next.js 16 (App Router) · Prisma 7 + SQLite (dev) · Tailwind CSS ·
собственная сессионная аутентификация (`jose` + httpOnly cookie).

## Запуск

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed   # создаст админа и демо-курс
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

Демо-админ после сида: `admin@vselennaja.local` / `admin12345`. Первый
зарегистрированный пользователь (через `/register` или сид) автоматически
получает роль `ADMIN`, все последующие — `STUDENT`.

## Переменные окружения (`.env`)

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Строка подключения к БД (SQLite для разработки) |
| `SESSION_SECRET` | Секрет для подписи сессионных JWT (сгенерирован при инициализации) |
| `TELEGRAM_BOT_TOKEN` | Токен бота — нужен для проверки Telegram Mini App `initData`. Пока пустой. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Юзернейм бота (для ссылок вида `t.me/<bot>`). Пока пустой. |

## Структура

- `src/app/(pages)` — страницы: `/`, `/login`, `/register`, `/courses`,
  `/courses/[slug]`, `/lessons/[id]`, `/admin`, `/admin/courses/[id]`.
- `src/app/actions` — Server Actions (регистрация/вход, CRUD курсов и
  уроков, отметка прогресса).
- `src/app/api/auth/telegram` — обмен Telegram `initData` на сессию (для
  Mini App).
- `src/lib/session.ts`, `src/lib/dal.ts` — сессии и авторизационные проверки.
- `src/proxy.ts` — защита маршрутов (`/courses`, `/lessons`, `/admin`
  требуют сессию; `/admin/*` — роль `ADMIN`).
- `prisma/schema.prisma` — модели: `User`, `Course`, `Module`, `Lesson`,
  `LessonProgress`.

## Как это работает

- **Обычный сайт**: регистрация/вход по email+паролю, сессия — httpOnly
  cookie с подписанным JWT (30 дней).
- **Telegram Mini App**: при открытии внутри Telegram клиентский компонент
  `TelegramAuthBridge` берёт `window.Telegram.WebApp.initData`, отправляет
  на `/api/auth/telegram`, где подпись проверяется по `TELEGRAM_BOT_TOKEN`
  (HMAC, см. `src/lib/telegram.ts`) и создаётся та же сессия-cookie —
  дальше пользователь работает как в браузере.

## Что дальше (следующий этап)

Платформа сейчас не завязана на бота и оплату — это осознанно, чтобы
сначала обкатать саму платформу. Следующие шаги:

1. Создать Telegram-бота, получить `TELEGRAM_BOT_TOKEN` → заполнить `.env`
   → Mini App авторизация заработает.
2. Подключить платёжный шлюз (ЮKassa/Prodamus/CloudPayments) и модель
   `Subscription`/`Payment`.
3. Автоматическая выдача/отзыв инвайта в закрытый Telegram-канал по
   статусу подписки (через Bot API: `createChatInviteLink`,
   `banChatMember`/`unbanChatMember`).
4. Переезд с SQLite на PostgreSQL перед продакшеном (меняется только
   `datasource.provider` в `prisma/schema.prisma`, `DATABASE_URL` и
   driver adapter в `src/lib/prisma.ts` — с `@prisma/adapter-better-sqlite3`
   на `@prisma/adapter-pg`).

## Известное ограничение

Сессия хранится в cookie. В Telegram-приложениях (десктоп/мобильный клиент)
Mini App открывается в WebView первого лица — cookie работают штатно. В
web.telegram.org Mini App рендерится в iframe (сторонний контекст) — в
некоторых браузерах с жёсткими настройками приватности это может блокировать
cookie. Если это станет проблемой, следующий шаг — токен-сессия
(Authorization-заголовок) для Mini App вместо cookie.
