from typing import Annotated

from fastapi import Depends

from src.core.config import Settings, get_settings

SettingsDependency = Annotated[Settings, Depends(get_settings)]
