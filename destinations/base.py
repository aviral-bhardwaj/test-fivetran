from abc import ABC, abstractmethod


class DestinationConnector(ABC):
    @abstractmethod
    def load(self, rows: list[dict], metadata: dict) -> int:
        raise NotImplementedError
