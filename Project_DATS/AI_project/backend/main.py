"""
StudyAI - FastAPI Backend Server
Handles WebSocket connections and routes requests through ADK study agents.
"""

import json
import os
import uuid
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types
from pydantic import BaseModel

load_dotenv()

# Import orchestrator agent
from study_orchestrator.agent import study_orchestrator

# ─── App Setup ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="StudyAI API",
    description="AI-powered study assistant — flashcards, practice questions, and exams",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── ADK Session Service ───────────────────────────────────────────────────────

session_service = InMemorySessionService()
APP_NAME = "studyai"


# ─── Models ───────────────────────────────────────────────────────────────────

class StudyRequest(BaseModel):
    """Request model for REST endpoint."""
    message: str
    session_id: str | None = None


# ─── REST Endpoints ───────────────────────────────────────────────────────────

@app.get("/")
async def root() -> dict[str, str]:
    """API root — returns info about the StudyAI service."""
    return {
        "service": "StudyAI API",
        "version": "1.0.0",
        "modes": "flashcards | practice | exam",
        "websocket": "/ws/{user_id}",
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "agent": "study_orchestrator"}


# ─── WebSocket Handler ────────────────────────────────────────────────────────

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str) -> None:
    """
    Real-time WebSocket endpoint for study content generation.

    Args:
        websocket: The WebSocket connection.
        user_id: Unique identifier for the student session.
    """
    await websocket.accept()
    session_id = str(uuid.uuid4())

    # Create ADK session
    session = await session_service.create_session(
        app_name=APP_NAME,
        user_id=user_id,
        session_id=session_id,
    )

    runner = Runner(
        agent=study_orchestrator,
        app_name=APP_NAME,
        session_service=session_service,
    )

    # Send connection confirmation
    await websocket.send_json({
        "type": "connected",
        "session_id": session_id,
        "message": "Connected to StudyAI! Ask me to create flashcards, practice questions, or a full exam.",
    })

    try:
        while True:
            # Receive message from frontend
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "")

            if not user_message.strip():
                continue

            # Send "thinking" status
            await websocket.send_json({
                "type": "status",
                "message": "Generating your study content...",
            })

            # Run through ADK agent
            content = types.Content(
                role="user",
                parts=[types.Part(text=user_message)],
            )

            full_response = ""
            async for event in runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content,
            ):
                if event.is_final_response():
                    if event.content and event.content.parts:
                        full_response = event.content.parts[0].text

            # Parse and send the study content
            try:
                study_content = json.loads(full_response)
                await websocket.send_json({
                    "type": "study_content",
                    "data": study_content,
                })
            except json.JSONDecodeError:
                # If response is not JSON, send as plain message
                await websocket.send_json({
                    "type": "message",
                    "data": {"message": full_response},
                })

    except WebSocketDisconnect:
        print(f"User {user_id} disconnected (session: {session_id})")
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": f"An error occurred: {str(e)}",
        })


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
