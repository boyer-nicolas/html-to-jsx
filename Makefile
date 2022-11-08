test:
	cp migration.js ./template/migration.js
	cp install.sh ./template/install.sh
	chmod +x ./template/install.sh
	cd template && ./install.sh
	cd template && node ./migration.js class
	(cd template/vite && yarn dev)

clean:
	rm template/migration.js
	rm template/install.sh
	rm -rf template/node_modules
	rm -rf template/node_modules.bak
	cp template/package.json.bak template/package.json
	cp template/package-lock.json.bak template/package-lock.json
	rm template/package.json.bak
	rm template/package-lock.json.bak