import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

import { envVars } from '../config/env.utils.js';
import { PrismaClient } from '../../generated/prisma/client.js';

const connectionString = envVars.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
