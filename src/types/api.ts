/** Consistent response shape for every Route Handler (CLAUDE.md, API standards). */
export interface ApiSuccess<TData> {
  success: true;
  message: string;
  data: TData;
}

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: ApiFieldError[];
}

export type ApiResponse<TData> = ApiSuccess<TData> | ApiFailure;
