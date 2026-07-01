# Local development — multi-tenant hosts

## URLs

| Host | Purpose |
|------|---------|
| `http://localhost:3000` | AllBook platform landing (`/platform` super admin) |
| `http://dayspa.localhost:3000` | DaySpa tenant site + `/admin` |

## Windows setup (one-time)

Add to `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```
127.0.0.1 dayspa.localhost
```

Then run:

```bash
npm run dev
```

## Production

| Host | Purpose |
|------|---------|
| `https://allbook.com.au` | Platform landing |
| `https://dayspa.allbook.com.au` | DaySpa tenant |
| `https://allbook.com.au/platform` | Super admin |
