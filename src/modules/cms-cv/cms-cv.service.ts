import { Injectable } from '@nestjs/common';
import { DbConnectService } from '../db-connect/db-connect.service';
import { ResponseDto } from 'src/common/payload.data';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CmsCvService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

  async createCv(name: string, content: string, email: string): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    const id = uuidv4();
    let rs = null;
    try {
      rs = await this.db.my_cv.create({
        data: {
          id: id,
          cv_content: content,
          name: name,
          created_at: new Date(),
          created_by: email
        },
        select:
          { id: true }
      });
    } catch (err: any) {
      throw new Error('Create CV failed')
    }

    responseDto.data = rs.id;

    return responseDto;
  }

  async updateCv(id: string, name: string, content: string, status: boolean, email: string): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.my_cv.update({
        data: {
          name: name,
          cv_content: content,
          is_active: status,
          updated_by: email,
          updated_at: new Date()
        },
        where: {
          id: id
        },
        select:
        {
          id: true
        }
      })
    } catch (err: any) {
      throw new Error('Update CV failed')
    }

    responseDto.data = rs.id;

    return responseDto;
  }

  async fetchCv(): Promise<ResponseDto> {
    const responseDto = new ResponseDto();
    let rs = null;
    try {
      rs = await this.db.my_cv.findFirst()
    } catch (err: any) {
      throw new Error('Fecth CV failed');
    }
    responseDto.data = rs;
    return responseDto;
  }
}
