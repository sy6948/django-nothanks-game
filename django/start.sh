#!/bin/bash
python manage.py migrate --noinput || exit 1
daphne django_project.asgi:application -p 80 -b 0.0.0.0