import base64
from typing import Literal
from pydantic import BaseModel, Field, model_validator
from config import MAX_IMAGES, MAX_BYTES

class ImageInput(BaseModel):
    data: str = Field(min_length=1, max_length=16777216)
    mimeType: str

class ReadInput(BaseModel):
    purpose: Literal["certificate", "content"] = "certificate"
    images: list[ImageInput] = Field(default_factory=list, max_length=MAX_IMAGES)
    data: str = Field(default="", max_length=16777216)
    mimeType: str = ""
    rawText: str = Field(default="", max_length=30000)

    @model_validator(mode="after")
    def validate_content(self):
        if not self.images and not self.data and not self.rawText.strip():
            raise ValueError("Certificate content is required.")
        size = 0
        for item in self.images + ([ImageInput(data=self.data, mimeType=self.mimeType)] if self.data else []):
            if item.mimeType not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
                raise ValueError("Unsupported certificate format.")
            try:
                size += len(base64.b64decode(item.data, validate=True))
            except ValueError as error:
                raise ValueError("Invalid encoded certificate content.") from error
        if size > MAX_BYTES:
            raise ValueError("Certificate content exceeds the size limit.")
        return self
