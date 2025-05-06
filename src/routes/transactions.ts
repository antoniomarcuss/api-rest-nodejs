import { z } from "zod";
import { knex } from "../database";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { error } from "node:console";
import { checkSessionIdExist } from "../middlewares/check-session-id-exist";

// unitários: unidade da sua aplicação
// integração: comunicação entre duas ou mais unidades
// e2e: Simulan um usuário operando na nossa aplicação

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, res) => {
    console.log(`[${req.method}] ${req.url}`);
  });
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExist],
    },
    async (req, res) => {
      const { sessionId } = req.cookies;
      const transactions = await knex("transactions")
        .where("session_id", sessionId)
        .select();
      return { transactions };
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = getTransactionParamsSchema.parse(req.params);
      const { sessionId } = req.cookies;

      const transactions = await knex("transactions")
        .where({
          id,
          session_id: sessionId,
        })
        .first();

      return { transactions };
    }
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExist],
    },
    async (req) => {
      const { sessionId } = req.cookies;
      const summary = await knex("transactions")
        .where("session_id", sessionId)
        .sum("amount", { as: "amount" })
        .first();

      return { summary };
    }
  );

  app.post("/", async (req, res) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });
    const { title, amount, type } = createTransactionBodySchema.parse(req.body);

    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();
      res.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    return res.status(201).send();
  });
}
