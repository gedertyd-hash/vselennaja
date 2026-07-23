# ИИшница — закрытый клуб про ИИ

Платформа с гайдами, курсами, юзкейсами и воркшопами, которая открывается
как Telegram Mini App (внутри Telegram) или как обычный сайт с email/паролем.

Стек: Next.js 16 (App Router) · Prisma 7 + PostgreSQL · Tailwind CSS ·
собственная сессионная аутентификация (`jose` + httpOnly cookie).

## Запуск (локально)

Нужна доступная PostgreSQL-база (например, бесплатная на [neon.tech](https://neon.tech)).

```bash
npm install
# положить строку подключения в .env как DATABASE_URL (см. .env.example)
npx prisma generate
npx prisma db push
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000), зарегистрироваться —
первый зарегистрированный пользователь автоматически получает роль `ADMIN`.
Затем в `/admin` нажать **«Заполнить демо-материалами»** — загрузит стартовый
набор гайдов и курс «Первая неделя с ИИ» из `src/lib/demo-content.ts`.

## Деплой на Vercel

1. Завести бесплатную Postgres (neon.tech, Supabase, или через Vercel → Storage
   → Postgres прямо в проекте) и скопировать connection string.
2. На vercel.com → **Add New Project** → импортировать репозиторий.
3. В **Environment Variables** добавить:
   - `DATABASE_URL` — строка подключения из шага 1
   - `SESSION_SECRET` — любая случайная строка (`openssl rand -base64 32`)
4. В **Build & Development Settings** → Build Command указать:
   `prisma generate && prisma db push --accept-data-loss && next build`
5. Deploy. После первого успешного деплоя — зарегистрироваться на живом сайте
   (станете админом автоматически) и нажать **«Заполнить демо-материалами»** в `/admin`.

Дальше каждый `git push` в ветку деплоя обновляет сайт и синхронизирует схему
автоматически — никаких ручных миграций руками не нужно.

## Переменные окружения (`.env`)

| Переменная | Назначение |
|---|---|
| `DATABASE_URL` | Строка подключения к PostgreSQL |
| `SESSION_SECRET` | Секрет для подписи сессионных JWT |
| `TELEGRAM_BOT_TOKEN` | Токен бота — нужен для проверки Telegram Mini App `initData`. Пока пустой. |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | Юзернейм бота (для ссылок вида `t.me/<bot>`). Пока пустой. |

## Структура

- `src/app/page.tsx`, `/login`, `/register` — публичные страницы (без сайдбара).
- `src/app/home` — Главная (дашборд): «Продолжить» + «Новое».
- `src/app/start` — Старт (краткое приветствие для новых участников).
- `src/app/materials` — хаб материалов + `/materials/guides`,
  `/materials/courses`, `/materials/cases`, `/materials/workshops`
  (карточки, фильтры по тегам) и `/materials/[slug]` (детальная
  страница — модули/уроки для курсов, контент сразу для гайдов/юзкейсов/воркшопов).
- `src/app/lessons/[id]` — отдельный урок внутри курса.
- `src/app/favorites`, `src/app/profile` — избранное и профиль.
- `src/app/admin` — создание/публикация материалов + кнопка загрузки демо-контента,
  `src/app/admin/courses/[id]` — управление модулями/уроками курса или
  контентом одностраничного материала.
- `src/lib/demo-content.ts` — источник правды для стартового набора материалов
  (используется и `prisma db seed`, и кнопкой в админке).
- `src/app/actions` — Server Actions (auth, CRUD материалов, избранное, прогресс).
- `src/app/api/auth/telegram` — обмен Telegram `initData` на сессию (Mini App).
- `src/lib/session.ts`, `src/lib/dal.ts` — сессии и авторизационные проверки.
- `src/proxy.ts` — защита маршрутов (всё кроме `/`, `/login`, `/register`
  требует сессию; `/admin/*` — роль `ADMIN`).
- `src/components/Sidebar.tsx`, `AppShell.tsx` — навигация приложения.
- `prisma/schema.prisma` — модели: `User`, `Course` (= материал: `type`
  COURSE/GUIDE/CASE/WORKSHOP, `level`, `tag`), `Module`, `Lesson`,
  `LessonProgress`, `Favorite`.

## Дизайн

Тёмная тема, каламбур в названии («ИИшница» ~ «яичница») отражён в айдентике:
тёплая палитра (жёлток/сливки на почти чёрном), акцентный шрифт **Unbounded**
(кириллица «из коробки») для заголовков, **Manrope** для текста. Токены — в
`src/app/globals.css`.

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
сначала обкатать саму платформу и наполнение. Следующие шаги:

1. Создать Telegram-бота, получить `TELEGRAM_BOT_TOKEN` → заполнить `.env`
   → Mini App авторизация заработает.
2. Подключить платёжный шлюз (ЮKassa/Prodamus/CloudPayments) и модель
   `Subscription`/`Payment`.
3. Автоматическая выдача/отзыв инвайта в закрытый Telegram-канал по
   статусу подписки (через Bot API: `createChatInviteLink`,
   `banChatMember`/`unbanChatMember`).
4. Загрузка обложек материалов (сейчас `coverImage` в схеме есть, но карточки
   рисуют цветной градиент вместо картинки — можно добавить загрузку файла).
5. Формальные Prisma-миграции вместо `db push`, когда схема стабилизируется.

## Известное ограничение

Сессия хранится в cookie. В Telegram-приложениях (десктоп/мобильный клиент)
Mini App открывается в WebView первого лица — cookie работают штатно. В
web.telegram.org Mini App рендерится в iframe (сторонний контекст) — в
некоторых браузерах с жёсткими настройками приватности это может блокировать
cookie. Если это станет проблемой, следующий шаг — токен-сессия
(Authorization-заголовок) для Mini App вместо cookie.
