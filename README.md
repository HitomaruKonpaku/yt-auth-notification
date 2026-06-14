# yt-auth-notification

Forward your YouTube notifications to Discord and browse them on a clean web dashboard. Never miss a livestream, comment reply, or channel upload again.

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
| `NOTIFICATION_NEXT` | `0` | No | Continuation pages: `0` = single page, `-1` = all pages, `>0` = N extra pages |

## Configuration (`config.yaml`)

```yaml
interval: 60  # polling interval in seconds

webhooks:
  discord:
    - url: https://discord.com/api/webhooks/...
      msg: "<@123123123>"  # optional role ping
```

Both `interval` and `webhooks.discord` are optional — defaults to 60s polling with no relay.

## API

### `GET /api/notifications?limit=50&offset=0`

```json
{
  "total": 420,
  "limit": 50,
  "offset": 0,
  "items": [
    {
      "id": "1781444560063061",
      "created_at": 1750000000000,
      "sent_at": 1781444560063,
      "video_id": "vxMFIDwTVZM",
      "linked_comment_id": null,
      "endpoint_url": "/watch?v=vxMFIDwTVZM",
      "short_message": { "text": "👍 Someone liked your comment", "rtl": false },
      "thumbnail_url": "https://..."
    }
  ]
}
```

## Getting YouTube Cookies

1. Install a browser extension like [Get cookies.txt LOCALLY](https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Log into YouTube in your browser
3. Export cookies for `youtube.com` in Netscape format
4. Point `COOKIE_FILE` to the exported file
