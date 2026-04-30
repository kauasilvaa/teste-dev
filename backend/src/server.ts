import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { prisma } from "./lib/prisma";

const app = Fastify({
  logger: true,
});

app.register(cors, {
  origin: true,
});

function faltamMenosDeDoisDias(data: Date) {
  const agora = new Date();
  const diferencaEmMs = data.getTime() - agora.getTime();
  const diferencaEmDias = diferencaEmMs / (1000 * 60 * 60 * 24);

  return diferencaEmDias < 2;
}

// Health check
app.get("/health", async () => {
  return {
    status: "ok",
    message: "API Leila Salão de Beleza funcionando",
  };
});

// Criar cliente
app.post("/clientes", async (request, reply) => {
  const { nome, email, telefone } = request.body as {
    nome: string;
    email: string;
    telefone: string;
  };

  const cliente = await prisma.cliente.create({
    data: {
      nome,
      email,
      telefone,
    },
  });

  return reply.status(201).send(cliente);
});

// Listar clientes
app.get("/clientes", async () => {
  return prisma.cliente.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
});

// Atualizar cliente
app.put("/clientes/:id", async (request) => {
  const { id } = request.params as { id: string };
  const { nome, email, telefone } = request.body as {
    nome?: string;
    email?: string;
    telefone?: string;
  };

  return prisma.cliente.update({
    where: { id },
    data: {
      nome,
      email,
      telefone,
    },
  });
});

// Deletar cliente
app.delete("/clientes/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  await prisma.cliente.delete({
    where: { id },
  });

  return reply.status(204).send();
});

// Criar serviço
app.post("/servicos", async (request, reply) => {
  const { nome, preco, duracao } = request.body as {
    nome: string;
    preco: number;
    duracao: number;
  };

  const servico = await prisma.servico.create({
    data: {
      nome,
      preco,
      duracao,
    },
  });

  return reply.status(201).send(servico);
});

// Listar serviços
app.get("/servicos", async () => {
  return prisma.servico.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
});

// Criar agendamento
app.post("/agendamentos", async (request, reply) => {
  const { clienteId, servicoIds, data } = request.body as {
    clienteId: string;
    servicoIds: string[];
    data: string;
  };

  const agendamento = await prisma.agendamento.create({
    data: {
      clienteId,
      data: new Date(data),
      servicos: {
        create: servicoIds.map((servicoId) => ({
          servicoId,
        })),
      },
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return reply.status(201).send(agendamento);
});

// Listar agendamentos
app.get("/agendamentos", async () => {
  return prisma.agendamento.findMany({
    orderBy: {
      data: "asc",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });
});

// Alterar data do agendamento com regra dos 2 dias
app.put("/agendamentos/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { data } = request.body as { data: string };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!agendamento) {
    return reply.status(404).send({
      message: "Agendamento não encontrado",
    });
  }

  if (agendamento.status === "CANCELADO") {
    return reply.status(400).send({
      message: "Não é possível alterar um agendamento cancelado",
    });
  }

  if (faltamMenosDeDoisDias(new Date(agendamento.data))) {
    return reply.status(400).send({
      message:
        "Não é possível alterar agendamento com menos de 2 dias de antecedência. Entre em contato por telefone.",
    });
  }

  const agendamentoAtualizado = await prisma.agendamento.update({
    where: { id },
    data: {
      data: new Date(data),
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return agendamentoAtualizado;
});

// Cancelar agendamento com regra dos 2 dias
app.patch("/agendamentos/:id/cancelar", async (request, reply) => {
  const { id } = request.params as { id: string };

  const agendamento = await prisma.agendamento.findUnique({
    where: { id },
  });

  if (!agendamento) {
    return reply.status(404).send({
      message: "Agendamento não encontrado",
    });
  }

  if (agendamento.status === "CANCELADO") {
    return reply.status(400).send({
      message: "Este agendamento já está cancelado",
    });
  }

  if (faltamMenosDeDoisDias(new Date(agendamento.data))) {
    return reply.status(400).send({
      message:
        "Não é possível cancelar agendamento com menos de 2 dias de antecedência. Entre em contato por telefone.",
    });
  }

  const agendamentoCancelado = await prisma.agendamento.update({
    where: { id },
    data: {
      status: "CANCELADO",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });

  return agendamentoCancelado;
});

const port = Number(process.env.PORT) || 3333;

app.listen({ port, host: "0.0.0.0" }).then(() => {
  console.log(`Servidor rodando na porta ${port}`);
});

// Filtrar agendamentos por período
app.get("/agendamentos/filtro", async (request) => {
  const { dataInicio, dataFim } = request.query as {
    dataInicio: string;
    dataFim: string;
  };

  return prisma.agendamento.findMany({
    where: {
      data: {
        gte: new Date(dataInicio),
        lte: new Date(dataFim),
      },
    },
    orderBy: {
      data: "asc",
    },
    include: {
      cliente: true,
      servicos: {
        include: {
          servico: true,
        },
      },
    },
  });
});