import z from 'zod';

const createEscrowPayment = z.object({
  body: z.object({
    contractID: z.string(),
    amount: z.number().positive(),
    paymentGatewayData: z.record(z.any()).optional(),
  }),
});

const releasePayment = z.object({
  params: z.object({
    paymentId: z.string(),
  }),
});

export const paymentValidation = {
  createEscrowPayment,
  releasePayment,
};
