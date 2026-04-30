"use client";

import { useEffect, useState } from "react";

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
};

type Servico = {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
};

type Agendamento = {
  id: string;
  data: string;
  status: string;
  cliente: Cliente;
  servicos: {
    servico: Servico;
  }[];
};

const API_URL = "http://localhost:3333";

export default function Home() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");

  async function carregarDados() {
    const [clientesRes, servicosRes, agendamentosRes] = await Promise.all([
      fetch(`${API_URL}/clientes`),
      fetch(`${API_URL}/servicos`),
      fetch(`${API_URL}/agendamentos`),
    ]);

    setClientes(await clientesRes.json());
    setServicos(await servicosRes.json());
    setAgendamentos(await agendamentosRes.json());
  }

  async function criarCliente(e: React.FormEvent) {
    e.preventDefault();

    await fetch(`${API_URL}/clientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nome, email, telefone }),
    });

    setNome("");
    setEmail("");
    setTelefone("");
    carregarDados();
  }

  async function criarAgendamento(e: React.FormEvent) {
    e.preventDefault();

    await fetch(`${API_URL}/agendamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clienteId,
        servicoIds: [servicoId],
        data: new Date(data).toISOString(),
      }),
    });

    setClienteId("");
    setServicoId("");
    setData("");
    carregarDados();
  }

  async function cancelarAgendamento(id: string) {
    await fetch(`${API_URL}/agendamentos/${id}/cancelar`, {
      method: "PATCH",
    });

    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="page">
      <header className="hero">
        <div>
          <span className="tag">Sistema de agendamentos</span>
          <h1>Leila Salão de Beleza</h1>
          <p>
            Controle de clientes, serviços e agendamentos com regras de
            alteração e cancelamento.
          </p>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>Cadastrar Cliente</h2>

          <form onSubmit={criarCliente} className="form">
            <input
              placeholder="Nome do cliente"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              required
            />

            <button type="submit">Cadastrar cliente</button>
          </form>
        </div>

        <div className="card">
          <h2>Novo Agendamento</h2>

          <form onSubmit={criarAgendamento} className="form">
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </option>
              ))}
            </select>

            <select
              value={servicoId}
              onChange={(e) => setServicoId(e.target.value)}
              required
            >
              <option value="">Selecione um serviço</option>
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.nome} - R$ {servico.preco.toFixed(2)}
                </option>
              ))}
            </select>

            <input
              type="datetime-local"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
            />

            <button type="submit">Cadastrar agendamento</button>
          </form>
        </div>
      </section>

      <section className="card full">
        <div className="section-title">
          <h2>Agendamentos</h2>
          <span>{agendamentos.length} registros</span>
        </div>

        <div className="table">
          {agendamentos.map((agendamento) => (
            <div key={agendamento.id} className="row">
              <div>
                <strong>{agendamento.cliente.nome}</strong>
                <p>
                  {agendamento.servicos
                    .map((item) => item.servico.nome)
                    .join(", ")}
                </p>
              </div>

              <div>
                {new Date(agendamento.data).toLocaleString("pt-BR")}
              </div>

              <span className={`status ${agendamento.status.toLowerCase()}`}>
                {agendamento.status}
              </span>

              <button
                className="danger"
                onClick={() => cancelarAgendamento(agendamento.id)}
              >
                Cancelar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card full">
        <div className="section-title">
          <h2>Clientes</h2>
          <span>{clientes.length} cadastrados</span>
        </div>

        <div className="clients">
          {clientes.map((cliente) => (
            <div key={cliente.id} className="client">
              <strong>{cliente.nome}</strong>
              <span>{cliente.email}</span>
              <span>{cliente.telefone}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}