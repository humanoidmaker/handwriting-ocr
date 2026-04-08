from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    denoise_level: Optional[int] = 3
    contrast_boost: Optional[float] = 1.2
    deskew_enabled: Optional[bool] = True
    default_enhance: Optional[bool] = True


class PasswordReset(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str


class TokenResponse(BaseModel):
    token: str
    user: dict


class OCRLine(BaseModel):
    text: str
    confidence: float
    bbox: List[int]


class OCRResult(BaseModel):
    text: str
    confidence: float
    lines: List[OCRLine]
    preprocessing_applied: List[str]


class SettingsUpdate(BaseModel):
    denoise_level: Optional[int] = None
    contrast_boost: Optional[float] = None
    deskew_enabled: Optional[bool] = None
    default_enhance: Optional[bool] = None
