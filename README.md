# Convert all HTML files in a folder to React Function or Class Components

## Features

- Converts wow.js to ReactWOW
- Closes unclosed html tags
- Sets page title
- Converts Images
- Creates Folder structure
- Handles assets (css, js)
- Creates React + Vite project
- Handles frontend routing
- Comments out external javascript to make sure the app can work

## Getting started

```bash
npm init -y
rm main.js
curl -o backup.sh https://raw.githubusercontent.com/boyer-nicolas/html-to-jsx/main/backup.sh
chmod +x backup.sh
./backup.sh
npm i htmltojsx prettier node-html-parser ora chalk fs-extra
curl -o main.js https://raw.githubusercontent.com/boyer-nicolas/html-to-jsx/main/migration.js
node main.js <process?function,class>
cd vite
yarn dev
```
