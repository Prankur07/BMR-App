from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class TagColor(str, Enum):
    RED = "Red"
    GREEN = "Green"
    BLUE = "Blue"
    YELLOW = "Yellow"
    ORANGE = "Orange"
    PURPLE = "Purple"
    BLACK = "Black"
    WHITE = "White"


class MandiDocumentRequest(BaseModel):
    mandi_name: str = Field(default="Raisen Mandi")
    variety: str = Field(default="PUSA")
    firm_name: str = Field(default="Babu Lal Manoj Kumar")
    frtc_number: str = Field(default="", description="FRTC Number (Full Name)")
    village: str = Field(default="")
    no_of_bages: int = Field(default=0, ge=0)
    tag_color: TagColor = Field(default=TagColor.RED)


class MandiDocumentResponse(BaseModel):
    success: bool
    message: str
    filename: Optional[str] = None


class ConfigResponse(BaseModel):
    mandi_names: list[str]
    varieties: list[str]
    firm_names: list[str]
    tag_colors: list[str]
    default_mandi: str
    default_variety: str
    default_firm: str
    default_tag_color: str
    bages_per_print: int