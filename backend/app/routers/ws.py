from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel: str):
        await websocket.accept()
        if channel not in self.connections:
            self.connections[channel] = set()
        self.connections[channel].add(websocket)

    def disconnect(self, websocket: WebSocket, channel: str):
        if channel in self.connections:
            self.connections[channel].discard(websocket)

    async def broadcast(self, channel: str, message: dict):
        if channel in self.connections:
            dead = []
            for ws in self.connections[channel]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.connections[channel].discard(ws)


manager = ConnectionManager()


@router.websocket("/ws/turnos")
async def turnos_ws(websocket: WebSocket):
    await manager.connect(websocket, "turnos")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "turnos")
