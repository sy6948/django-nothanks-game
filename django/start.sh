#!/bin/bash
python manage.py migrate --noinput || exit 1
# For development:
# python manage.py runserver 0.0.0.0:80
# For production:
daphne django_project.asgi:application -p 80 -b 0.0.0.0