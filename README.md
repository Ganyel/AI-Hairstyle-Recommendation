# AI Hairstyle Recommendation

AI Hairstyle Recommendation adalah aplikasi berbasis kecerdasan buatan yang membantu pengguna menemukan rekomendasi gaya rambut yang sesuai berdasarkan bentuk wajah. Sistem menganalisis foto wajah pengguna, mengidentifikasi bentuk wajah, kemudian memberikan rekomendasi hairstyle yang paling cocok.

## Features

* Upload foto wajah
* Analisis bentuk wajah menggunakan AI
* Rekomendasi gaya rambut berdasarkan bentuk wajah
* Riwayat hasil rekomendasi
* Dashboard admin
* Antarmuka modern dan responsif
* Progressive Web App (PWA)

## Project Structure

```text
AI-Hairstyle-Recommendation/
├── backend/
├── dataset/
├── frontend/
└── README.md
```

## Technologies Used

### Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS

### Backend

* Python
* Machine Learning
* Computer Vision

### Database

* Supabase

## Installation

### Clone Repository

```bash
git clone https://github.com/Ganyel/AI-Hairstyle-Recommendation.git
cd AI-Hairstyle-Recommendation
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend akan berjalan pada:

```text
http://localhost:3000
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

## Environment Variables

Buat file `.env.local` pada folder frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## Workflow

1. Pengguna mengunggah foto wajah.
2. Sistem melakukan deteksi wajah.
3. AI mengidentifikasi bentuk wajah.
4. Sistem mencocokkan bentuk wajah dengan database hairstyle.
5. Pengguna menerima rekomendasi gaya rambut yang sesuai.

## Future Development

* Real-time webcam detection
* AI hairstyle simulation
* Gender-specific recommendations
* User account system
* Cloud deployment
* Mobile application

## Author

Developed by Ganyel

## License

This project is created for educational and research purposes.
