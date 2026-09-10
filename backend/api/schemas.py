from datetime import datetime

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class OrganizationOut(BaseModel):
    id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConnectionCreate(BaseModel):
    organization_id: int
    name: str
    source_type: str
    source_config: dict
    destination_type: str
    destination_config: dict
    schedule_minutes: int = Field(default=60, ge=1)
    sync_mode: str = Field(default="incremental", pattern="^(full|incremental)$")


class ConnectionOut(BaseModel):
    id: int
    organization_id: int
    name: str
    source_type: str
    destination_type: str
    schedule_minutes: int
    sync_mode: str
    state_json: dict

    class Config:
        from_attributes = True


class SyncOut(BaseModel):
    id: int
    connection_id: int
    status: str
    trigger: str
    attempts: int
    rows_synced: int
    message: str | None
    requested_at: datetime
    run_at: datetime
    started_at: datetime | None
    finished_at: datetime | None

    class Config:
        from_attributes = True
