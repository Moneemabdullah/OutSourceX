import Stripe from "stripe";
import { envVars } from "./env";

export const stripe = new Stripe(envVars.STRIPE_.SECRET_KEY);
