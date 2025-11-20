# 🔐 OAuth 2.0 / OpenID Connect Lab — Keycloak + Node.js

Этот проект — демонстрационное веб-приложение, показывающее интеграцию  
**OAuth 2.0 + OpenID Connect** с использованием **Keycloak** как Identity Provider.

Приложение выполняет вход через Keycloak, получает **ID Token**, **UserInfo**  
и отображает кастомный пользовательский атрибут **`discipline`**.

---

## 🚀 Возможности

- 🔑 Авторизация через Keycloak (Authorization Code Flow)  
- 🆔 Получение ID Token + UserInfo  
- 🧩 Поддержка custom-атрибута **discipline**  
- 📄 Просмотр «сырых» данных токена  

---

## 🧩 Используемые технологии

- **Node.js + Express**
- **openid-client**
- **Keycloak**  
  - Realm: `lab-realm`  
  - Client: `lab-app`

---
  
