export interface IUserResponse {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  birthdate: Date;
}

export interface IFindUserByEmailOrUsername {
  email?: string;
  username?: string;
}

export interface IS3UpdateOptions {
  newFilename: string;
  oldFilename: string;
  buffer: Buffer;
  mime: string;
}
