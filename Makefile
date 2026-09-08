.PHONY: install web test e2e lint gen build

install:
	npm install --legacy-peer-deps

web:
	npx ng serve --port 4200

build:
	npx ng build

test:
	npx ng test --no-watch

e2e:
	npx playwright test

lint:
	npx ng lint

gen:
	npm run gen:api
