// response.helper.ts

import MetadataDto from 'src/dto/metadata.dto';


export class ResponseDto {
  data: any;
  metadata: MetadataDto;

  constructor(data?: any, metadata?: MetadataDto) {
    this.data = data;
    this.metadata = metadata;
  }
}
