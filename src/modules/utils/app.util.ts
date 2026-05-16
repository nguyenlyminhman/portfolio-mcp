import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { HttpStatus, Logger, SetMetadata } from '@nestjs/common';
import PaginationDto from 'src/common/dto/pagination.dto';


const saltRounds = 12;
export class AppUtil {
  static publicKey = '';
  static hash = (password: string, salt = null, digest = null) => {
    salt = salt || crypto.randomBytes(16).toString('base64');
    return crypto
      .createHmac('sha512', salt)
      .update(password)
      .digest(digest || 'base64');
  };

  static generatePassword = (password: string) => {
    return bcrypt.hashSync(password, saltRounds);
  };

  static comparePassword = (password: string, hash: string) => {
    return bcrypt.compareSync(password || '', hash || '');
  };

  static getRefreshToken = (userId: number, jwtSecret: string) => {
    const salt = crypto.randomBytes(16).toString('base64');
    const hash = this.hash(userId + jwtSecret, salt);
    const b = Buffer.from(hash);
    return b.toString('base64');
  };

  static isErrorCode = (code: HttpStatus) => {
    return code >= HttpStatus.BAD_REQUEST;
  };

  static getUserNameFromEmail = (email: string) => {
    let rs: string;
    try {
      rs = email.split('@')[0];
    } catch (e) {
      rs = email;
      Logger.error(e);
    }
    return rs;
  };

  static slash(path: string) {
    const isExtendedLengthPath = path.startsWith('\\\\?\\');

    if (isExtendedLengthPath) {
      return path;
    }

    return path.replace(/\\/g, '/');
  }

  static parseInt(value: string, fallCallback: number) {
    try {
      const number = Number.parseInt(value);
      if (Number.isNaN(number)) return fallCallback;
      else return number;
    } catch (e) {
      return fallCallback;
    }
  }

  static toLowerCaseNonAccentVietnamese(str: string) {
    try {
      str = str.toLowerCase();
      str = str.replace(/–/g, '-');
      str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
      str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
      str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
      str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
      str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
      str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
      str = str.replace(/đ/g, 'd');
      // Some system encode vietnamese combining accent as individual utf-8 characters
      str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // Huyền sắc hỏi ngã nặng
      str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // Â, Ê, Ă, Ơ, Ư
      return str;
    } catch (e) {
      return str;
    }
  }

  static slugEncode = (st: string) => {
    try {
      const value = AppUtil.toLowerCaseNonAccentVietnamese(st)
        .replace(
          /(~|`|!|@|#|$|%|^|&|\*|\(|\)|{|}|\[|\]|;|:|\"|'|<|,|\.|>|\?|\/|\\|\||\+|=|–|“|”)/g,
          '',
        )
        ?.replace(/^[A-Z _]*[A-Z][A-Z _]*$/g, '')
        .replace(/ /g, '-');
      return encodeURIComponent(value);
    } catch (e) {
      console.log(e);
      return st;
    }
  };

  // static getFileName = (file: Express.Multer.File) => {
  //   const originalname = Buffer.from(file.originalname, 'latin1').toString(
  //     'utf8',
  //   );
  //   const fileExtName = extname(originalname);
  //   return originalname.replace(fileExtName, '');
  // };

  static getSkipTake = (pagination: PaginationDto) => {
    const skip = (pagination.page - 1) * pagination.pageSize;
    const take = pagination.pageSize;
    return { skip, take };
  }

  static isVietnamese = (text: string) => {
    if (!text || typeof text !== "string") {
      return false;
    }

    const vietnameseRegex =
          /^[a-zA-Z0-9ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s.,!?;:'"()\-]+$/;

    return vietnameseRegex.test(text.trim());
  };

  //   static canWorkOnPermissions(
  //     user: UserInterface,
  //     permission: UserPermissions[],
  //   ) {
  //     let isAllow = true;
  //     if (user) {
  //       const userRole = get(user, 'role.permission');
  //       isAllow = PermissionUtil.isAllow(userRole, permission);
  //     }
  //     return isAllow;
  //   }
}

// export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
// export const Permission = (...roles: UserPermissions[]) =>
//   SetMetadata(PERMISSION_KEY, roles);

