from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import document, print as print_api

app = FastAPI(title="Mandi Gate Pass Generator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(document.router, prefix="/api/document", tags=["Document"])
app.include_router(print_api.router, prefix="/api/print", tags=["Print"])

@app.get("/")
async def root():
    return {"message": "Mandi Gate Pass Generator API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}