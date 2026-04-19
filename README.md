# 🚨 Vigil – Full-stack Uptime Monitoring System

[![Status](https://img.shields.io/badge/status-production%20architecture%20demo-blue)](#)

[![Django](https://img.shields.io/badge/Django-6.0-092E20?logo=django)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-a30000?logo=django)](https://www.django-rest-framework.org/)
[![Celery](https://img.shields.io/badge/Celery-5.3-37814A?logo=celery)](https://docs.celeryq.dev/)
[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular)](https://angular.io/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Vigil** is a full‑stack, self‑hosted uptime monitor that checks your HTTP endpoints, sends email alerts on outages, and visualises response times. Built with **Django REST Framework**, **Celery** (async tasks + beat scheduler), **Redis**, and **Angular 18** (standalone components).

> 🎯 *The project demonstrates: background task queues, dead‑letter email retries, alert cooldown logic, token authentication, and a reactive SPA – all in < 1000 lines of code.*

---

## ✨ Features

- 🔍 **Scheduled checks** – Celery Beat runs every 5 minutes, each endpoint check is an independent Celery task.
- 📧 **Smart alerts** – Emails on DOWN and UP events with configurable cooldown (prevents alert storms).
- 🗃️ **Dead‑letter email queue** – Failed emails are stored and retried automatically.
- 📊 **Live dashboard** – Angular Material table, summary cards, and real‑time response time chart (Chart.js).
- 🔐 **Token authentication** – Secure API with `django-rest-framework` tokens.
- 📄 **Auto‑generated API docs** – Swagger UI available at `/api/docs/`.
- 🐳 **Docker Compose ready** – Spin up Django, Celery worker, Celery Beat, Redis, Postgres, and nginx with one command.

---

## 🧱 Tech Stack

| Layer          | Technology                                                                 |
|----------------|----------------------------------------------------------------------------|
| **Backend**    | Django 6.0, Django REST Framework, Celery, Redis, PostgreSQL (or SQLite)   |
| **Frontend**   | Angular 18 (standalone), Angular Material, Chart.js                        |
| **Async**      | Celery (workers + beat), Redis as broker/result backend                   |
| **Deployment** | Docker Compose, Gunicorn, nginx                                            |

---

## 🚀 Quick Start (Development)

### Prerequisites
- Python 3.12+
- Node.js 20+
- Redis (or use `docker run -p 6379:6379 redis`)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

In separate terminals:
```bash
celery -A config worker -l info
celery -A config beat -l info
```

### Frontend
```bash
cd frontend
npm install
ng serve
```

Visit `http://localhost:4200`, register, add an endpoint, and watch the checks roll in!

---

## 🐳 Production with Docker Compose

```bash
docker-compose up --build
```

Services:
- `nginx` – serves Angular static files + proxies `/api` to Django
- `django` – Gunicorn + Django
- `celery_worker`
- `celery_beat`
- `redis`
- `postgres`

---

## 📸 Screenshots

*Dashboard – endpoints, status, response time chart*  
![Dashboard](docs/screenshot-dashboard.png)

*Add / Edit endpoint dialog*  
![Endpoint form](docs/screenshot-form.png)

*(Placeholder – replace with actual screenshots after deployment)*

---

## 🧪 Why This Project Stands Out

- **No generic CRUD** – solves a real monitoring problem.
- **Production patterns** – idempotent tasks, rate limiting, exponential backoff, dead‑letter queues.
- **Full‑stack signal** – shows you can wire OAuth, async workers, and a modern SPA.
- **Clean Git history** – atomic commits, feature branches, CI ready.
- **Recruiter‑friendly** – the tech stack matches what enterprises use (Django + Celery + Angular).

---

## 📁 Project Structure (Simplified)

```
backend/
├── apps/
│   ├── accounts/       # custom user + registration
│   └── monitors/       # endpoints, checks, incidents, Celery tasks
├── config/             # Django settings (split: base, dev, prod)
├── requirements/       # environment‑specific dependencies
└── manage.py

frontend/
├── src/app/
│   ├── core/           # auth service, interceptor, guards
│   ├── features/       # dashboard, endpoints, incidents
│   └── shared/         # chart component, loading spinner
└── proxy.conf.json     # dev proxy to Django
```

---

## 🛣️ Roadmap

- [x] Backend API + Celery checks
- [x] Email alerts (console backend)
- [x] Angular dashboard with chart
- [ ] Incident history page
- [ ] User settings (cooldown, digest)
- [ ] Webhook alerts (Slack / Teams)

---

## 📄 License

MIT © [Clifford](https://github.com/Cliffy1337)

---

## 📬 Contact

**Portfolio project** – built to demonstrate full‑stack proficiency.  
[Live Demo](#) *(coming soon)* | [GitHub](https://github.com/Cliffy1337/vigil)
