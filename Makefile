test:
	cp migration.js ./template/migration.js
	cp install.sh ./template/install.sh
	chmod +x ./template/install.sh
	cd template && ./install.sh
	cd template && node ./migration.js class
	(cd template/vite && yarn dev)

clean:
	rm template/migration.js || true
	rm template/install.sh || true
	rm -rf template/vite || true
	rm -rf template/jsx || true
	rm -rf template/node_modules || true
	rm -rf template/node_modules.bak || true
	cp template/package.json.bak template/package.json || true
	cp template/package-lock.json.bak template/package-lock.json || true
	rm template/package.json.bak || true
	rm template/package-lock.json.bak || true