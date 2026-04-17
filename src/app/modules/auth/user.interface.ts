export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  contactNumber?: string;
  image?: string;
  role: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IChangePassword {
  oldPassword: string;
  newPassword: string;
}
