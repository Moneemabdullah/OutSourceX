export interface PrismaFindManyArguments {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;

  [key: string]: unknown; // Allow additional properties for dynamic includes and other Prisma options
}

export interface PrismaCountArguments {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, boolean | Record<string, unknown>>;
  orderBy?: Record<string, unknown> | Record<string, unknown>[];
  skip?: number;
  take?: number;
  cursor?: Record<string, unknown>;
  distinct?: string[] | string;
}

export interface PrismaModelDelegate {
  findMany(...args: unknown[]): Promise<unknown[]>;
  count(...args: unknown[]): Promise<number>;
}

export interface IQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string; // Comma-separated list of fields to select
  includes?: string; // Comma-separated list of related models to include
  [key: string]: string | undefined;
}

export interface IQueryConfig {
  searchableFields?: string[]; // Fields that can be searched with the searchTerm
  filterableFields?: string[]; // Fields that can be used for filtering
}

export interface PrismaStringFilter {
  contains?: string;
  equals?: string;
  startsWith?: string;
  endsWith?: string;
  mode?: 'insensitive' | 'default';
  in?: string[];
  lt?: string;
  lte?: string;
  gt?: string;
  gte?: string;
  not?: PrismaStringFilter | string;
}

export interface PrismaNumberFilter {
  equals?: number;
  in?: number[];
  notIn?: number[];
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
  not?: PrismaNumberFilter | number;
}

export type PrismaWhereConditions = {
  OR?: Record<string, unknown>[];
  AND?: Record<string, unknown>[];
  NOT?: Record<string, unknown> | Record<string, unknown>[];
  [key: string]: unknown; // Allow additional properties for dynamic conditions
};

export interface IqueryResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
