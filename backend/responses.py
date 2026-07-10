from typing import Optional

from fastapi import HTTPException
from fastapi.responses import JSONResponse


def ok(data, status: int = 200):
    return JSONResponse({"success": True, "data": data}, status_code=status)


def fail(msg: str, status: int = 400, code: Optional[str] = None):
    detail = {"success": False, "error": msg}
    if code:
        detail["code"] = code
    raise HTTPException(status_code=status, detail=detail)
