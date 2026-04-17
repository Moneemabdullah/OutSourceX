import z from 'zod';

const createEscrowPayment = z.object({
  body: z.object({
    contractID: z.string(),
    amount: z.number().positive(),
    paymentGatewayData: z.record(z.any()).optional(),
  }),
});

export const paymentValidation = {
  createEscrowPayment,
};
