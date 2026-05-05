import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/objects/constant';

export const Roles = (...roles: ERoles []) => SetMetadata(ROLES_KEY, roles);

