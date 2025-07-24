# LOCAL SETUP

## 

```bash
docker run -it --rm -v $PWD:/code -w /code --entrypoint "" -p 3000:3000 node:20-alpine /bin/sh
# npm install (seems not working)
npm install --force
npm run dev
```
