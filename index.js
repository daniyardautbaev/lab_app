const express = require('express');
const session = require('express-session');
const { Issuer } = require('openid-client');

const app = express();
const port = 3000;

// -------- Сессии ----------
app.use(session({
  secret: 'some-super-secret',
  resave: false,
  saveUninitialized: false
}));

let clientPromise;

// -------- Инициализация OIDC-клиента ----------
async function initClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const issuer = await Issuer.discover(
        'http://localhost:8080/realms/lab-realm/.well-known/openid-configuration'
      );

      const client = new issuer.Client({
        client_id: 'lab-app',
        client_secret: 'V0lEVALvl9W6ccoWe1n0cep8epUNcvEp',
        token_endpoint_auth_method: 'client_secret_basic',
        redirect_uris: ['http://localhost:3000/callback'],
        response_types: ['code'],
      });

      return client;
    })();
  }
  return clientPromise;
}

// -------- Маршруты ----------

// Главная страница (красивый UI)
app.get('/', (req, res) => {
  if (!req.session.userinfo) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <title>Lab App – Login</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          body {
            min-height: 100vh;
            background: radial-gradient(circle at top left, #3b82f6, #0f172a 55%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f9fafb;
          }
          .card {
            background: rgba(15, 23, 42, 0.92);
            border-radius: 18px;
            padding: 28px 32px;
            width: 420px;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(148, 163, 184, 0.35);
          }
          .title {
            font-size: 26px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 14px;
            color: #9ca3af;
            margin-bottom: 24px;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 10px 18px;
            border-radius: 999px;
            border: none;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            background: linear-gradient(135deg, #3b82f6, #22c55e);
            color: #0b1120;
            text-decoration: none;
            transition: transform 0.12s ease-out, box-shadow 0.12s ease-out, filter 0.12s;
            box-shadow: 0 8px 20px rgba(59, 130, 246, 0.5);
          }
          .btn:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
            box-shadow: 0 12px 28px rgba(59, 130, 246, 0.7);
          }
          .btn:active {
            transform: translateY(0);
            box-shadow: 0 5px 14px rgba(59, 130, 246, 0.6);
          }
          .keycloak-tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(15, 118, 110, 0.18);
            color: #6ee7b7;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 16px;
          }
          .keycloak-dot {
            width: 8px;
            height: 8px;
            border-radius: 999px;
            background: #22c55e;
            box-shadow: 0 0 8px rgba(34, 197, 94, 0.9);
          }
          .hint {
            font-size: 12px;
            color: #9ca3af;
            margin-top: 14px;
            line-height: 1.5;
          }
          .hint code {
            background: rgba(15, 23, 42, 0.9);
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="keycloak-tag">
            <span class="keycloak-dot"></span>
            Keycloak · OIDC Lab
          </div>
          <div class="title">Добро пожаловать в Lab App</div>
          <div class="subtitle">
            Демонстрация авторизации по OAuth 2.0 / OpenID Connect и передачи атрибута
            <strong>discipline</strong> из Keycloak.
          </div>
          <a class="btn" href="/login">
            Войти через Keycloak
          </a>
          <div class="hint">
            Под капотом: <code>Authorization Code Flow</code>,
            realm <code>lab-realm</code>, клиент <code>lab-app</code>.
          </div>
        </div>
      </body>
      </html>
    `);
  }

  const userinfo = req.session.userinfo;
  const discipline = userinfo.discipline || '(нет discipline в токене/userinfo)';

  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8" />
      <title>Lab App – Profile</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        body {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #6366f1, #020617 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #e5e7eb;
        }
        .layout {
          display: flex;
          flex-direction: column;
          gap: 18px;
          width: min(900px, 100% - 40px);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .app-title {
          font-size: 26px;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .app-subtitle {
          font-size: 13px;
          color: #9ca3af;
          margin-top: 4px;
        }
        .tag {
          padding: 4px 10px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid rgba(148, 163, 184, 0.5);
          font-size: 11px;
          color: #9ca3af;
        }
        .content {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(0, 2.8fr);
          gap: 18px;
        }
        .card {
          background: rgba(15, 23, 42, 0.92);
          border-radius: 18px;
          padding: 20px 22px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.75);
        }
        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        .field {
          margin-bottom: 8px;
          font-size: 14px;
        }
        .field span.label {
          color: #9ca3af;
        }
        .discipline-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-top: 10px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(34, 197, 94, 0.12);
          color: #bbf7d0;
          font-size: 13px;
          font-weight: 500;
        }
        .discipline-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.9);
        }
        pre {
          margin-top: 10px;
          padding: 10px 12px;
          background: rgba(15, 23, 42, 0.96);
          border-radius: 12px;
          font-size: 11px;
          line-height: 1.5;
          overflow-x: auto;
          border: 1px solid rgba(55, 65, 81, 0.9);
        }
        .btn-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 14px;
          gap: 10px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 14px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          transition: transform 0.1s ease-out, box-shadow 0.1s ease-out, filter 0.1s;
        }
        .btn-secondary {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.7);
          color: #e5e7eb;
        }
        .btn-danger {
          background: linear-gradient(135deg, #f97316, #ef4444);
          color: #0b1120;
          box-shadow: 0 10px 22px rgba(239, 68, 68, 0.6);
        }
        .btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.05);
        }
        .btn-danger:hover {
          box-shadow: 0 14px 30px rgba(239, 68, 68, 0.75);
        }
        .btn:active {
          transform: translateY(0);
        }
      </style>
    </head>
    <body>
      <div class="layout">
        <div class="header">
          <div>
            <div class="app-title">Lab App · User Profile</div>
            <div class="app-subtitle">
              Данные получены через OpenID Connect ID-токен и endpoint <code>userinfo</code>.
            </div>
          </div>
          <div class="tag">
            Realm: lab-realm · Client: lab-app
          </div>
        </div>

        <div class="content">
          <div class="card">
            <div class="card-title">Профиль пользователя</div>
            <div class="field">
              <span class="label">Username:</span> ${userinfo.preferred_username || userinfo.sub}
            </div>
            <div class="field">
              <span class="label">Имя:</span> ${userinfo.given_name || '-'}
            </div>
            <div class="field">
              <span class="label">Фамилия:</span> ${userinfo.family_name || '-'}
            </div>
            <div class="field">
              <span class="label">E-mail:</span> ${userinfo.email || '-'}
            </div>
            <div class="field">
              <span class="label">Discipline:</span>
            </div>
            <div class="discipline-pill">
              <span class="discipline-dot"></span>
              ${discipline}
            </div>

            <div class="btn-row">
              <a href="/login" class="btn btn-secondary">Обновить токен</a>
              <a href="/logout" class="btn btn-danger">Выйти</a>
            </div>
          </div>

          <div class="card">
            <div class="card-title">Сырые данные токена</div>
            <pre>${JSON.stringify(userinfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Старт логина
app.get('/login', async (req, res) => {
  try {
    const client = await initClient();

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid discipline',   // запрашиваем scope discipline
      prompt: 'login',              // каждый раз показывать логин-форму
    });

    res.redirect(authorizationUrl);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при формировании authorization URL');
  }
});

// Callback от Keycloak
app.get('/callback', async (req, res) => {
  try {
    const client = await initClient();
    const params = client.callbackParams(req);

    const tokenSet = await client.callback('http://localhost:3000/callback', params);

    const claims = tokenSet.claims();
    const userinfo = await client.userinfo(tokenSet.access_token);

    // объединяем клеймы и userinfo
    req.session.userinfo = { ...claims, ...userinfo };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка при обработке callback');
  }
});

// Logout (локальный)
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Lab app listening at http://localhost:${port}`);
});
