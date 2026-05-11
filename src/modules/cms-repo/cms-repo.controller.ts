import { Body, Controller, Get, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EApiPath, VERSION_1 } from 'src/objects/enum/EApiPath.enum';
import { CmsRepoService } from './cms-repo.service';
import { ResponseApi } from 'src/common/response.helper';
import { ResponseDto } from 'src/common/payload.data';
import { CurrentUser } from 'src/decorator/user.decorator';
import { CreateRepoDto } from './dto/create-repo.dto';
import { UpdateRepoDto } from './dto/update-repo.dto';

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
}
