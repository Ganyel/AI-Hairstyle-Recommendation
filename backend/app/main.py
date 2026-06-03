from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from app.routes import predict

load_dotenv()

app = FastAPI(
    title="AI Hairstyle Recommendation API",
    version="1.0.0",
)

# Support multiple frontend URLs (local + production)
raw_origins = os.getenv("FRONTEND_URL", "http://localhost:3000")
origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "AI Hairstyle Recommendation API is running"}
