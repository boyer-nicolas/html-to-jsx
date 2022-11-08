#! /bin/bash

if [ -f "package.json" ]; then

    echo "package.json exists, backuping it to package.json.bak"
    mv package.json package.json.bak

else

    echo "package.json does not exist"

fi

if [ -f "package-lock.json" ]; then

    echo "package-lock.json exists, backuping it to package-lock.json.bak"
    mv package-lock.json package-lock.json.bak

else

    echo "package-lock.json does not exist"

fi

if [ -d "node_modules" ]; then

    echo "node_modules exists, backuping it to node_modules.bak"
    mv node_modules node_modules.bak

else

    echo "node_modules does not exist"

fi

npm init -y
# Add type module to package.json
# Remove last line of package.json
# Add "type": "module" to package.json
sed -i '$d' package.json
echo ',"type": "module"}' >>package.json

npm i htmltojsx prettier node-html-parser ora chalk fs-extra
curl -o migration.js https://raw.githubusercontent.com/boyer-nicolas/html-to-jsx/main/migration.js
