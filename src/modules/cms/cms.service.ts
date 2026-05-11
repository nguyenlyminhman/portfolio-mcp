import { Injectable } from "@nestjs/common";
import { DbConnectService } from "../db-connect/db-connect.service";

@Injectable()
export class CmsService {
  constructor(
    private readonly db: DbConnectService,
  ) { }

}
