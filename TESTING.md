# zLyrcis Testing Guide

This document outlines the testing infrastructure for both the zLyrcis backend and frontend, including how to set up the environment, where the tests are located, and how to execute them.

## Setup & Dependencies

Testing dependencies have been added to the project configuration files. Before running tests, ensure your local environment is up to date:

**Backend Setup:**
```bash
cd backend
# Activate your virtual environment if applicable, e.g.: source venv/bin/activate
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
```

---

## Backend Tests

The backend uses `pytest`, `pytest-django`, and `pytest-mock` to test the Django API, Celery pipelines, and core logic. The tests are located in `backend/tests/`.

### Key Test Suites:

- **`test_synchronization.py`**: Unit tests for the `SequenceMatcher` logic. Validates that the system correctly sanitizes hallucinations from Groq Whisper data and perfectly syncs with Musixmatch lyrics.
- **`test_video_pipeline.py`**: Tests for the `.ass` subtitle wrapping and the application of customization parameters (backgrounds, text colors).
- **`test_api_integrations.py`**: Contains mock tests for external services including Musixmatch, Groq Whisper, and Spotify. Relies on mock fixtures defined in `conftest.py`.
- **`test_security_and_dedup.py`**: Includes `@pytest.mark.django_db` tests verifying tenant isolation (ensuring users cannot access others' private chat history/videos) and global video deduplication caching logic.

### Running Backend Tests

Navigate to the backend directory and run:

```bash
cd backend
pytest
```

---

## Frontend Tests

The frontend uses `jest` and `@testing-library/react` to test React components and user interactions. The tests are located in `frontend/src/tests/`.

### Key Test Suites:

- **`ChatInterface.test.tsx`**: Validates the Spotify-style search toggle inside the chat input row, pop-up results overlay, and prompt injection logic.
- **`AuthModals.test.tsx`**: Verifies the Sign-Up/Login flows ("Continue with Email", "Login with Google") and ensures new user accounts are assigned the static default profile avatar.
- **`MobileNav.test.tsx`**: Tests mobile-specific interactions, such as the repositioned mobile sidebar toggle and the profile picture menu toggle.

### Running Frontend Tests

Navigate to the frontend directory and run:

```bash
cd frontend
npm test
```
