from pydantic import BaseModel


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse[T](BaseModel):
    items: list[T]
    meta: PaginationMeta
