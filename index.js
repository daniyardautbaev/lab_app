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

// Главная страница
app.get('/', async (req, res) => {
  if (!req.session.userinfo) {
    return res.send(`
      <h1>Lab App</h1>
      <p>Вы не залогинены.</p>
      <a href="/login">Login with Keycloak</a>
    `);
  }

  const userinfo = req.session.userinfo;
  const discipline = userinfo.discipline || '(нет discipline в токене/userinfo)';

  res.send(`
    <h1>Lab App</h1>
    <p>Вы залогинены как: ${userinfo.preferred_username || userinfo.sub}</p>
    <p><strong>Ваш discipline:</strong> ${discipline}</p>
    <pre>${JSON.stringify(userinfo, null, 2)}</pre>
    <a href="/logout">Logout</a>
  `);
});

// Старт логина
app.get('/login', async (req, res) => {
  try {
    const client = await initClient();

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid discipline', // ВАЖНО: запрашиваем discipline
      // Без PKCE: не передаём code_challenge
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

    // Без PKCE — просто callback
    const tokenSet = await client.callback('http://localhost:3000/callback', params);

    // Забираем данные о пользователе
    const userinfo = await client.userinfo(tokenSet.access_token);

    req.session.userinfo = userinfo;
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
