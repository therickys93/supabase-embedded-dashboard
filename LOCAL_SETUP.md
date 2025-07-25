# LOCAL SETUP

## Development

```bash
docker run -it --rm -v $PWD:/code -w /code --entrypoint "" -p 3000:3000 node:20-alpine /bin/sh
# npm install (seems not working)
npm install --force
npm run dev
```

## Create and Run Docker image

```bash
docker build -t testing .
docker run -it --rm -p 3000:3000 --env-file .env.local testing
```
