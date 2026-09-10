from abc import ABC, abstractmethod


class SourceConnector(ABC):
    @abstractmethod
    def discover_schema(self) -> dict:
        raise NotImplementedError

    @abstractmethod
    def extract(self, mode: str, cursor: str | int | float | None, batch_size: int) -> tuple[list[dict], str | int | float | None]:
        raise NotImplementedError
