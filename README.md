# Obsidra — сайт

Сайт-визитка Obsidra: статический сайт без сборки — только HTML, CSS и JS.

Опубликован на GitHub Pages: https://neironessensive.github.io/obsidra-site/ — каждый `git push` в `main` обновляет сайт примерно за минуту. Если меняли `styles.css` или `script.js`, увеличьте `?v=` в их подключении в `index.html`, иначе браузеры до 10 минут будут показывать старую версию из кэша.

```
index.html   — вся разметка и тексты
styles.css   — стили (цвета и шрифты — в :root в начале файла)
script.js    — анимации: кристалл в hero, смена слов, подсветка карточек, шаги процесса
favicon.svg  — иконка вкладки
privacy.html — политика обработки персональных данных
robots.txt, sitemap.xml — для поисковиков (robots.txt заработает только на своём домене, см. ниже)
brand/       — avatar.png (аватар Telegram и почты), og-image.png — превью ссылки и его исходник og-image.html
fonts/       — шрифты (Unbounded, Manrope, JetBrains Mono, лицензия OFL) и fonts.css
tools/       — fetch_fonts.py: заново скачивает шрифты с Google Fonts
```

**Content Security Policy.** CSP задана `<meta>`-тегом в `index.html`: скрипты, стили, шрифты и картинки разрешено грузить только с самого сайта. Поэтому:
- атрибуты `style="…"` в разметке не работают: стили пишите в `styles.css`, а динамические значения задавайте из JS через `element.style.setProperty`;
- если меняете inline-скрипт в `<head>`, пересчитайте его хеш в CSP;
- подключаете внешний сервис (аналитику, виджет) — добавьте его домен в соответствующую директиву CSP.

## Перед публикацией

1. **Telegram.** Кнопки «Обсудить проект» ведут в бота-брифера [@obsidra_bot](https://t.me/obsidra_bot), «Написать лично» и ссылка в подвале — на [@obsidra_dev](https://t.me/obsidra_dev). Бот должен быть запущен, иначе клиент с сайта не получит ответа.
2. **Тексты.** Все тексты лежат в `index.html`. Ориентировочные сроки и условия описаны в блоке FAQ (`#faq`), проверьте, что они совпадают с тем, как вы работаете.
3. **Цены.** Блок `#prices`. Две цифры из него (лендинг и бот) повторяются в ответе FAQ «Сколько стоит проект?», а сроки — в ответе «Сколько времени займёт разработка?»: меняйте их вместе.
4. **Название.** Прежде чем покупать домен и заказывать логотип, проверьте «Obsidra» в реестрах товарных знаков [ФИПС](https://www1.fips.ru/registers-web/) и [WIPO Global Brand Database](https://branddb.wipo.int/).

## Локальный запуск

```bash
python -m http.server 5510
```

После запуска откройте http://localhost:5510.

## Публикация на GitHub Pages (бесплатно)

1. Создайте репозиторий и отправьте в него код:

   ```bash
   git init
   git add .
   git commit -m "Сайт-визитка Obsidra"
   gh repo create obsidra-site --public --source=. --push
   ```

2. Включите GitHub Pages: **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`**.
   Через минуту сайт откроется по адресу `https://<ваш-логин>.github.io/obsidra-site/`.

## Домен obsidra.dev

Домены `.dev` продают, например, [REG.RU](https://www.reg.ru/domain/new/DEV) и [Timeweb](https://timeweb.com/ru/services/domains/dev/). Перед покупкой сверьте цену регистрации и продления.

Зона `.dev` работает **только по HTTPS**: браузеры не откроют сайт по `http://`. GitHub Pages выпускает сертификат бесплатно, нужно лишь включить его (шаг 4).

1. В панели регистратора добавьте DNS-записи:

   | Тип   | Имя   | Значение                     |
   |-------|-------|------------------------------|
   | A     | @     | 185.199.108.153              |
   | A     | @     | 185.199.109.153              |
   | A     | @     | 185.199.110.153              |
   | A     | @     | 185.199.111.153              |
   | CNAME | www   | `<ваш-логин>.github.io`      |

2. В репозитории: **Settings → Pages → Custom domain → `obsidra.dev` → Save**. GitHub сам добавит в репозиторий файл `CNAME`.
3. Подождите, пока обновится DNS. Обычно это от нескольких минут до пары часов.
4. Включите **Enforce HTTPS** в тех же настройках Pages.
5. Замените адрес `https://neironessensive.github.io/obsidra-site/` на `https://obsidra.dev/` в `index.html` (`canonical`, `og:url`, `og:image`), `sitemap.xml` и `robots.txt`. Пока сайт живёт в подпапке GitHub Pages, поисковики `robots.txt` не видят: они читают его только из корня домена. До покупки домена добавьте `sitemap.xml` вручную в [Яндекс Вебмастере](https://webmaster.yandex.ru/) и [Google Search Console](https://search.google.com/search-console).
