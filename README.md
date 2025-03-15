# Дипломное задание к курсу «Продвинутый JavaScript в браузере».

---

[![Build status](https://ci.appveyor.com/api/projects/status/ov2mwgn37ynfvi92/branch/master?svg=true)](https://ci.appveyor.com/project/MaxKrch/chaos-organizer/branch/master)

[GitHub Pages](https://maxkrch.github.io/Chaos-Organizer/)

[Backend](https://github.com/MaxKrch/Chaos-Organizer-backend)

### Органайзер для записей и файлов

#### Тестовый аккаунт:
Логин: max@demo.com  
Пароль: demO100%

## Основные функции

### 1. Регистрация и авторизация  
  1.1. Проверка email и пароля перед регистрацией  
  
![](https://i.imgur.com/kXpBHxK.png)

  1.2. Автоматический вход в аккаунт по refresh токену при загрузке приложения (на сервере токен верифцируется, в том числе, по хэшу заголовков)  
  
  1.3. Авторизация по access токену  
  
  1.4. Обновление токенов в фоновом режиме каждые 12 минут  
  
  1.5. Одновременный вход в аккаунт максимум с пяти устройств  


### 2. State приложения  
  2.1. Хранение state в памяти приложения (в потоках rxjs) и в IndextedDB  

  2.2. Загрузка state из IndextedDB при запуске приложения  

  2.3. Сохранение новых и редактированных записей в IndextedDB, если сервер недоступен  
  
![](https://i.imgur.com/g8YTcaz.png)   

### 3. Записи и лента  
  3.1. "Интерфейс загрузки" во время запроса новой ленты  
  
![](https://i.imgur.com/mAYRe9N.png)     

  3.2. Ссылки (если начинаются с `http://` или `https://`) преобразуются в активные перед добавлением на страницу  

  3.3. Редактирование и удаление записей  
  
![](https://i.imgur.com/ZUKICyD.png)  

  3.4. Ленивая подгрузка ленты по 10 записей при скролинге. После загрузки новых записей, лента прокручивается к последней из них (нижней)  

  3.5. Закрепление и открепление записей, возможность перейти к закрепленой записи по клику (загрузка, если ее нету в state)  
  
![](https://i.imgur.com/w4LfMxB.png)  

  3.6. Добавление в избранное, удаление из избранного и просмотр "избранных" записей  

  3.7. Изображения и видео в записях выстраиваются мозаикой в зависимости от количество и соотношения сторон  

  3.9. Добавление к записям тегов, просмотр записей по тегам  
  
![](https://i.imgur.com/QhnpxSc.png)   

  3.9. Просмотр файлов по категориям  
  
![](https://i.imgur.com/qIl9ykb.png)   

### 4. Синхронизация  
  4.1. Синхронизация активных клиентов/вкладок через SSE  

  4.2. Переподключение SSE после обновления токенов с новым access токеном  

  4.3. Обновление state при "visibilitychange" документа на visible  

  4.2. При запуске приложения или изменении состояния сети на online  

   - Обновление state с сервера  

   - Отправка на сервер новых и редактированных записей из IndextedDB

### 5. Медиа  
  5.1. Запись и воспроизведение аудио и видео  

  5.2. Прикрепление к записи файлов, в том числе - с помощью Drag and Drop  
  
![](https://i.imgur.com/fILmBJq.png)  

  5.3. Просмотр видео и изображений в полноэкранном режиме, карусель  
  
![](https://i.imgur.com/w0beFzh.png)  

  5.4. Скачивание и удаление файлов  
  
![](https://i.imgur.com/mjZXdXs)    

### 6. Service Worker  
  6.1. Прекэширование статичных файлов.  

  6.2. При старте приложения - загрузка файлов из кэша, фоновое обновление кэша.  

  6.3. Кэширование изображений (Cache First)  
  
![](https://i.imgur.com/oU50bHk.png)  

  6.4. Кэширование полученых с сервера записей (Network First)  
  Повторынй запрос раз в несколько секунд (максимум 10 запросов)  
  В случае успешного ответа - отправка полученных записей в приложение.  

  6.5. При установки новой версии Service Worker - модальное окно с предложением обновить приложение.  
  При подтверждении - активируется новый Service Worker (через skipWaiting), страницы перезагружаются.  
  
![](https://i.imgur.com/9bwrBdW.png)
