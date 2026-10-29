#!/bin/sh

set -eu

if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -Eq '^APP_KEY=base64:.+' .env; then
    php artisan key:generate --force --no-interaction
fi

php artisan config:clear --no-interaction
php artisan migrate --force --no-interaction

if [ ! -L public/storage ]; then
    php artisan storage:link
fi

exec "$@"