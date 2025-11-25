# Telegram News Reader

A web application that aggregates news from Telegram channels and presents them in a user-friendly interface.

## Features

-   **Telegram Integration:** Connects to Telegram using Telethon to fetch messages from specified channels.
-   **News Aggregation:** Collects and stores news articles in a local database.
-   **Web Interface:** A React-based frontend to view and read news.
-   **Scheduling:** Automated background tasks to fetch updates periodically.
-   **Internationalization:** Support for multiple languages.

## Tech Stack

-   **Backend:** Python, FastAPI, SQLAlchemy, Telethon, APScheduler
-   **Frontend:** React, Vite, Bootstrap
-   **Database:** SQLite
-   **Containerization:** Docker, Docker Compose

## Prerequisites

-   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
-   [Python 3.x](https://www.python.org/) (for initial session setup)
-   A Telegram account to obtain API credentials.

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd telegram-news-reader
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying the example:

```bash
cp .env.example .env
```

Open `.env` and fill in your Telegram API credentials:

```env
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
```

> **Note:** You can get your `API_ID` and `API_HASH` from [https://my.telegram.org](https://my.telegram.org).

### 3. Initialize Telegram Session

Before running the application in Docker, you need to authenticate with Telegram to create a session file. This must be done locally because it requires interactive input (phone number and code).

1.  Install backend dependencies (optional, but recommended for the script):
    ```bash
    pip install telethon python-dotenv
    ```
    *Or install all requirements: `pip install -r backend/requirements.txt`*

2.  Run the initialization script:
    ```bash
    python3 backend/init_session.py
    ```

3.  Follow the prompts to enter your phone number and the verification code sent to your Telegram account.
4.  Upon success, a `news_reader_session.session` file will be created in the `backend` directory.

### 4. Run with Docker

Build and start the services:

```bash
docker-compose up --build
```

The application will be available at:

-   **Frontend:** [http://localhost](http://localhost)
-   **Backend API:** [http://localhost:8000/docs](http://localhost:8000/docs)

## Development

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Run the server:
    ```bash
    uvicorn main:app --reload
    ```

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
