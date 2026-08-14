# Wound Healing Monitoring System

A research and educational prototype for monitoring wound assessments
over time using a Django REST Framework backend and a React frontend.

The system supports patient records, wound-image upload, experimental
wound segmentation, assessment history, wound-progress comparison, and
clinician review comments.

> **Important:** This project is a software/research prototype. It is
> **not a validated medical device**, is **not intended for clinical
> diagnosis or treatment decisions**, and should not replace
> professional medical judgment.

## Current Features

-   User authentication and protected routes
-   Staff roles and doctor-facing views
-   Patient record management
-   New wound assessment creation
-   Wound image upload
-   Automatic experimental wound-image segmentation
-   Segmentation mask generation
-   Raw segmented wound-area measurement in pixels²
-   Assessment history and progress comparison
-   Doctor review status and clinical comments
-   Django REST API
-   React web interface

## Measurement Status

The current image-analysis workflow can report segmented wound area in
**pixels²**. Pixel measurements are image-space measurements and should
not be interpreted as physical wound area in cm² unless an appropriate
calibration method has been applied.

## Technology Stack

### Backend

-   Python
-   Django
-   Django REST Framework
-   Token authentication
-   SQLite for local development
-   `python-dotenv`
-   Image-analysis/segmentation code

### Frontend

-   React
-   Vite
-   JavaScript
-   CSS

## Project Structure

``` text
wound-healing-monitoring-system/
├── backend/
│   ├── accounts/
│   ├── backend/
│   ├── patients/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Local Development

### Backend

``` bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env` containing:

``` text
DJANGO_SECRET_KEY=your-own-django-secret-key
```

Never commit the `.env` file.

Then run:

``` bash
python manage.py migrate
python manage.py runserver
```

### Frontend

In another terminal:

``` bash
cd frontend
npm install
npm run dev
```

## Security and Privacy

Do not commit or publicly publish:

-   Django secret keys or `.env` files
-   Real patient information
-   Patient-identifiable wound photographs
-   Local databases containing patient records
-   Authentication tokens or passwords

Use appropriately authorized, de-identified, synthetic, or demonstration
data for public demonstrations.

## Research / Prototype Disclaimer

This repository demonstrates software engineering and experimental
computer-vision concepts for wound monitoring. The segmentation output,
wound-area calculations, progress comparisons, and other automated
results have not been established here as clinically validated
measurements.

Real clinical deployment would require further validation, security and
privacy controls, production infrastructure, clinical governance, and
any applicable regulatory review.

## Planned Development

-   Physical wound-area calibration
-   Improved segmentation models
-   Model validation and evaluation
-   Camera-assisted image acquisition
-   Raspberry Pi / Pi Camera integration
-   Standardized image capture
-   Improved progress analytics
-   Production database and storage
-   Deployment hardening
-   Additional privacy and security controls

## Status

**Current status:** Research / educational prototype under active
development.

The current project supports the web-based workflow and image-upload
pipeline. Hardware-assisted camera capture is planned for future
development.

## License

No open-source license has been selected yet. Until a license is added,
normal copyright rules apply to the source code.
