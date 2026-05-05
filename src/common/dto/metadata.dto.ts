import PaginationDto from "./pagination.dto";

export default class MetadataDto {
  page: number = 1;
  pageSize: number = 10;
  totalPage: number = 0;

  constructor(pagination?: Partial<PaginationDto>, totalRecord?: number) {
    this.page = pagination?.page ?? this.page;
    this.pageSize = pagination?.pageSize ?? this.pageSize;
    this.totalPage = Math.ceil(totalRecord / pagination.pageSize);
  }
}
