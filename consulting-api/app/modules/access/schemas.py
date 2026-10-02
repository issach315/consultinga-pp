from pydantic import BaseModel


class ModuleAccessOut(BaseModel):
    enabled: bool
    sub_modules: dict[str, list[str]]


class EffectiveAccessOut(BaseModel):
    modules: dict[str, ModuleAccessOut]
