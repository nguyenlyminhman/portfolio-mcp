import { BadRequestException, Body, Controller, Get, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { CmsRepoService } from './cms-repo.service';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';
import { CurrentUser } from 'src/decorator/user.decorator';
import { CreateRepoDto } from './dto/create-repo.dto';
import { UpdateRepoDto } from './dto/update-repo.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Public } from 'src/decorator/public.decorator';

@ApiTags('Cms Repo')
@Controller({ path: EApiPath.CMS_REPO, version: VERSION_1 })
export class CmsRepoController {

  constructor(
    private readonly repoService: CmsRepoService
  ) { }

  @ApiBearerAuth()
  @Get('/fetch')
  async fetchRepo(): Promise<ResponseApi> {
    const rs: ResponseDto = await this.repoService.fetchRepo();
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/create')
  async createRepo(@CurrentUser() user: any, @Body() createRepoDto: CreateRepoDto): Promise<ResponseApi> {
    const { repoName, highlights, description, markdown, githubUrl, liveUrl, techStack, sortOrder } = createRepoDto;
    const { email } = user;
    const rs = await this.repoService.createRepo(repoName, highlights, description, markdown, githubUrl, liveUrl, techStack, sortOrder, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @ApiBearerAuth()
  @Post('/update')
  async updateRepo(@CurrentUser() user: any, @Body() updateRepoDto: UpdateRepoDto): Promise<ResponseApi> {
    const { id, repoName, highlights, description, markdown, githubUrl, liveUrl, techStack, sortOrder, isActive } = updateRepoDto;
    const { email } = user;

    const rs = await this.repoService.updateRepo(id, repoName, highlights, description, markdown, githubUrl, liveUrl, techStack, sortOrder, isActive, email);
    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

  @Public()
  @Post('/import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.endsWith('.json')) {
          return callback(
            new BadRequestException('Only .json file allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async importRepo(@CurrentUser() user: any, @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) { throw new BadRequestException('File is required'); }
    const { email } = user;
    const jsonString = file.buffer.toString('utf-8');

    let payload: any[];

    try {
      payload = JSON.parse(jsonString);
    } catch (error) {
      throw new BadRequestException('Invalid JSON file');
    }

    const rs = this.repoService.importRepo(payload, email);

    return ResponseApi.success(rs, 'Success', HttpStatus.OK);
  }

}
