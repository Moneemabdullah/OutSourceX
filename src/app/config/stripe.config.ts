import Stripe from 'stripe';
import { envVars } from './env.utils';

export const stripe = new Stripe(envVars.STRIPE_.SECRET_KEY);
