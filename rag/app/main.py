from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()

class Payload(BaseModel):
    postID: str
    userID: str
    title: str
    content: str

@app.get("/health")
def read_root():
    return {"fastAPI backend working"}

@app.post("/ingest")
async def pre(payload:Payload):
    text = payload.content
    title = payload.title
    full_text = f"{title}\n\n{text}"


    return {"success": full_text}