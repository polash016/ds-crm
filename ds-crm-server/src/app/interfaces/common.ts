export type IGenericResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T;
};

export interface IReqUser {
  email: string;
  role: string;
  iat: number;
  exp: number;
}
