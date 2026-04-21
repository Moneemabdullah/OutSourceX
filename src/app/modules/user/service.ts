import httpStatus from 'http-status';
import { UserRole } from '../../../generated/prisma/enums';
import AppError from '../../errorHelpers/AppError';
import { IQueryParams } from '../../interfaces/Query.interface';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import { QueryBuilder } from '../../utils/QueryBuilder';

const getMyAccount = async (user: IRequestUser) => {
  const account = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return account;
};

const updateMyAccount = async (
  user: IRequestUser,
  payload: { name?: string; image?: string; contactNumber?: string }
) => {
  const account = await prisma.user.update({
    where: { id: user.userId },
    data: payload,
  });

  return account;
};

const getAllUsers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, query, {
    searchableFields: ['name', 'email', 'contactNumber'],
    filterableFields: ['role', 'status', 'emailVerified'],
  });

  return queryBuilder.search().filter().sort().paginate().execute();
};

const getFreelancers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.freelancer, query, {
    searchableFields: ['user.name', 'user.email', 'bio', 'expertise.title'],
    filterableFields: ['expertiseID', 'hourlyRate'],
  });

  return queryBuilder
    .where({
      isDeleted: false,
      user: {
        isDeleted: false,
        role: UserRole.FREELANCER,
      },
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      user: true,
      expertise: true,
      reviews: true,
    })
    .execute();
};

const getFreelancerById = async (freelancerId: string) => {
  const freelancer = await prisma.freelancer.findUnique({
    where: { id: freelancerId },
    include: {
      user: true,
      expertise: true,
      reviews: true,
    },
  });

  if (!freelancer || freelancer.isDeleted || freelancer.user.isDeleted) {
    throw new AppError(httpStatus.NOT_FOUND, 'Freelancer not found');
  }

  return freelancer;
};

const getMonthlyChartData = <
  T extends {
    createdAt: Date;
  },
>(
  records: T[],
  valueSelector: (record: T) => number
) => {
  const chartMap = new Map<string, number>();

  records.forEach((record) => {
    const label = `${record.createdAt.getFullYear()}-${String(
      record.createdAt.getMonth() + 1
    ).padStart(2, '0')}`;

    chartMap.set(label, (chartMap.get(label) ?? 0) + valueSelector(record));
  });

  return Array.from(chartMap.entries()).map(([label, value]) => ({
    label,
    value,
  }));
};

const getClientDashboard = async (userId: string) => {
  const client = await prisma.client.findFirst({
    where: { userID: userId },
  });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
  }

  const [jobs, contracts, payments] = await Promise.all([
    prisma.job.findMany({
      where: { ownerID: client.id },
      include: {
        category: true,
      },
    }),
    prisma.contract.findMany({
      where: { clientID: client.id },
    }),
    prisma.payment.findMany({
      where: {
        status: 'RELEASED',
        contract: {
          clientID: client.id,
        },
      },
    }),
  ]);

  return {
    role: UserRole.CLIENT,
    totals: {
      totalJobs: jobs.length,
      activeContracts: contracts.length,
      totalSpent: payments.reduce((sum, payment) => sum + payment.amount, 0),
    },
    stats: {
      jobsByCategory: jobs.reduce<Record<string, number>>((acc, job) => {
        const key = job.category.title;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    },
    chartData: {
      spending: getMonthlyChartData(payments, (payment) => payment.amount),
      jobs: getMonthlyChartData(jobs, () => 1),
    },
  };
};

const getFreelancerDashboard = async (userId: string) => {
  const freelancer = await prisma.freelancer.findFirst({
    where: { userID: userId },
  });

  if (!freelancer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Freelancer profile not found');
  }

  const [contracts, payments, proposals] = await Promise.all([
    prisma.contract.findMany({
      where: { freelancerID: freelancer.id },
    }),
    prisma.payment.findMany({
      where: {
        status: 'RELEASED',
        contract: {
          freelancerID: freelancer.id,
        },
      },
    }),
    prisma.proposal.findMany({
      where: { freelancerID: freelancer.id },
    }),
  ]);

  return {
    role: UserRole.FREELANCER,
    totals: {
      totalEarnings: payments.reduce((sum, payment) => sum + payment.amount, 0),
      completedJobs: payments.length,
    },
    stats: {
      totalContracts: contracts.length,
      acceptedProposals: proposals.filter((proposal) => proposal.status === 'ACCEPTED').length,
    },
    chartData: {
      earnings: getMonthlyChartData(payments, (payment) => payment.amount),
      proposals: getMonthlyChartData(proposals, () => 1),
    },
  };
};

const getAdminDashboard = async () => {
  const [users, jobs, categories] = await Promise.all([
    prisma.user.findMany(),
    prisma.job.findMany(),
    prisma.jobCategory.findMany({
      include: {
        jobs: true,
      },
    }),
  ]);

  return {
    role: UserRole.ADMIN,
    totals: {
      totalUsers: users.length,
      totalJobs: jobs.length,
    },
    stats: {
      usersByRole: users.reduce<Record<string, number>>((acc, user) => {
        acc[user.role] = (acc[user.role] ?? 0) + 1;
        return acc;
      }, {}),
    },
    chartData: {
      users: getMonthlyChartData(users, () => 1),
      jobsByCategory: categories.map((category) => ({
        label: category.title,
        value: category.jobs.length,
      })),
    },
  };
};

const getSuperAdminDashboard = async () => {
  const [users, payments] = await Promise.all([
    prisma.user.findMany(),
    prisma.payment.findMany({
      where: {
        status: 'RELEASED',
      },
    }),
  ]);

  return {
    role: UserRole.SUPER_ADMIN,
    totals: {
      totalUsers: users.length,
      totalSystemRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalTransactions: payments.length,
    },
    stats: {
      allUsersBreakdown: users.reduce<Record<string, number>>((acc, user) => {
        acc[user.role] = (acc[user.role] ?? 0) + 1;
        return acc;
      }, {}),
    },
    chartData: {
      revenue: getMonthlyChartData(payments, (payment) => payment.amount),
      users: getMonthlyChartData(users, () => 1),
    },
  };
};

const getDashboard = async (user: IRequestUser) => {
  if (user.role === UserRole.CLIENT) {
    return getClientDashboard(user.userId);
  }

  if (user.role === UserRole.FREELANCER) {
    return getFreelancerDashboard(user.userId);
  }

  if (user.role === UserRole.ADMIN) {
    return getAdminDashboard();
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    return getSuperAdminDashboard();
  }

  throw new AppError(httpStatus.FORBIDDEN, 'No dashboard available for this role');
};

const promoteAdmin = async (payload: { userId: string }) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Super admin role cannot be changed here');
  }

  if (user.role === UserRole.ADMIN) {
    throw new AppError(httpStatus.CONFLICT, 'User is already an admin');
  }

  return prisma.user.update({
    where: { id: payload.userId },
    data: {
      role: UserRole.ADMIN,
    },
  });
};

const demoteAdmin = async (userId: string, payload: { role: 'CLIENT' | 'FREELANCER' }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.role !== UserRole.ADMIN) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only admins can be demoted with this action');
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      role: payload.role,
    },
  });
};

const getTransactions = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.payment, query, {
    searchableFields: ['transactionId', 'contract.title'],
    filterableFields: ['status', 'contractID', 'amount'],
  });

  return queryBuilder
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      contract: {
        include: {
          client: {
            include: {
              user: true,
            },
          },
          freelancer: {
            include: {
              user: true,
            },
          },
        },
      },
    })
    .execute();
};

const getDisputes = async () => {
  return {
    summary: {
      openDisputes: 0,
      resolvedDisputes: 0,
    },
    chartData: {
      disputes: [],
    },
    data: [],
    note: 'Dispute handling placeholder is ready for future implementation.',
  };
};

export const userService = {
  getFreelancers,
  getFreelancerById,
  getMyAccount,
  updateMyAccount,
  getAllUsers,
  getDashboard,
  promoteAdmin,
  demoteAdmin,
  getTransactions,
  getDisputes,
};
