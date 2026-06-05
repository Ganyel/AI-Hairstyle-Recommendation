from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from app.routes import predict

load_dotenv()

app = FastAPI(
    title="AI Hairstyle Recommendation API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/{full_path:path}")
async def preflight(full_path: str, request: Request):
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        },
    )


app.include_router(predict.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "AI Hairstyle Recommendation API is running"}
