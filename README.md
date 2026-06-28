# yt-auth-notification

Forward your YouTube notifications to Discord and browse them on a clean web dashboard.

New notifications are highlighted with a live indicator and can be dismissed with a click.

Filter by channel, toggle browser notifications, and paginate through history.

Never miss a livestream, comment reply, or channel upload again.

## Quick Start

```bash
npm install
cp example/config.yaml config.yaml    # edit with your webhook URLs
cp example/cookies.txt cookies.txt    # add your YouTube cookies
echo "COOKIE_FILE=cookies.txt" > .env
npm run start:dev
```

Open `http://localhost:8080` to see the notification feed.

## Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `COOKIE_FILE` | — | **Yes** | Path to Netscape-format YouTube cookies file |
| `CONFIG_FILE` | `config.yaml` | No | Path to config YAML file |
| `DATA_DIR` | `./data` | No | Data directory (database stored as `{DATA_DIR}/database.sqlite`) |
| `NOTIFICATION_NEXT` | `0` | No | Continuation pages: `0` = single page, `<0` = all pages, `>0` = N extra pages |

## Configuration

See [example/config.yaml](example/config.yaml) for all available options and defaults.

## Docker

See [example/docker-compose.yaml](example/docker-compose.yaml) for a ready-to-run Compose file.

```bash
cp example/docker-compose.yaml docker-compose.yaml
cp example/config.yaml config.yaml         # edit webhook URLs
cp example/cookies.txt cookies.txt         # add your cookies
mkdir data
docker compose up -d
```

## Getting YouTube Cookies

1. Install a browser extension like [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Log into YouTube in your browser
3. Export cookies for `youtube.com` in Netscape format
4. Point `COOKIE_FILE` to the exported file
