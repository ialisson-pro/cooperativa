'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Pessoa = {
  id: string
  nome: string
}

type Servico = {
  id: string
  data: string
  valor_cuidador: number
  valor_cliente: number
  status_cuidador: string
  cliente: { nome: string }
  cuidador: { nome: string }
}

const STATUS_CUIDADOR = ['pendente', 'pago']

const statusStyle: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago:     'bg-green-100  text-green-800',
}

export default function Servicos() {

  const [clientes, setClientes]   = useState<Pessoa[]>([])
  const [cuidadores, setCuidadores] = useState<Pessoa[]>([])
  const [servicos, setServicos]   = useState<Servico[]>([])

  const [clienteId, setClienteId]   = useState('')
  const [cuidadorId, setCuidadorId] = useState('')
  const [data, setData]             = useState('')
  const [valor_cliente, setValorCliente]           = useState('')
  const [valor_cuidador, setValorCuidador]           = useState('')

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: clientesData } = await supabase
      .from('clientes')
      .select(`id, perfis ( nome )`)

    setClientes(clientesData?.map((c: any) => ({
      id: c.id,
      nome: c.perfis?.nome
    })) || [])

    const { data: cuidadoresData } = await supabase
      .from('cuidadores')
      .select(`id, perfis ( nome )`)

    setCuidadores(cuidadoresData?.map((c: any) => ({
      id: c.id,
      nome: c.perfis?.nome
    })) || [])

    await carregarServicos()
  }

  async function carregarServicos() {
    const { data } = await supabase
      .from('servicos')
      .select(`
        id, data, valor_cliente, valor_cuidador, status_cuidador,
        cliente:clientes (
          perfis ( nome )
        ),
        cuidador:cuidadores (
          perfis ( nome )
        )
      `)
      .eq('status_cuidador', 'pendente')
      .order('data', { ascending: false })

    const formatado = data?.map((s: any) => ({
      id:              s.id,
      data:            s.data,
      valor_cliente:           s.valor_cliente,
      valor_cuidador:           s.valor_cuidador,
      status_cuidador: s.status_cuidador || 'pendente',
      cliente:  { nome: s.cliente?.perfis?.nome  || '' },
      cuidador: { nome: s.cuidador?.perfis?.nome || '' },
    })) || []

    setServicos(formatado)
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    // Atualiza localmente de imediato (feedback instantâneo)
    setServicos(prev =>
      prev.map(s => s.id === id ? { ...s, status_cuidador: novoStatus } : s)
    )

    const { error } = await supabase
      .from('servicos')
      .update({ status_cuidador: novoStatus })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
      carregarServicos() // Reverte se der erro
    }
  }

  async function salvar() {
    if (!clienteId || !cuidadorId || !data || !valor_cliente || !valor_cuidador) {
      alert('Preencha todos os campos')
      return
    }

    await supabase.from('servicos').insert([{
      cliente_id:      clienteId,
      cuidador_id:     cuidadorId,
      data,
      valor_cliente:           Number(valor_cliente),
      valor_cuidador:           Number(valor_cuidador),
      status_cuidador: 'pendente',
      status_cliente:  'pendente',
    }])

    setClienteId(''); setCuidadorId(''); setData(''); setValorCliente(''); setValorCuidador('')
    carregarServicos()
  }

  async function excluir(id: string) {
    await supabase.from('servicos').delete().eq('id', id)
    carregarServicos()
  }

  return (
    <div>
      {/* FORM NOVO SERVIÇO */}
      <h1 className="text-2xl font-bold mb-6">Novo Serviço</h1>

      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-[#00bf63] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Cliente</th>
            <th className="px-4 py-2 text-left">Valor Cliente</th>
            <th className="px-4 py-2 text-left">Cuidador</th>
            <th className="px-4 py-2 text-left">Valor Cuidador </th>
            <th className="px-4 py-2 text-left">Data</th>            
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t">
            <td className="px-4 py-2">
              <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="border p-2 rounded w-full">
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </td>
            
            <td className="px-4 py-2">
              <input type="number" placeholder="Valor" value={valor_cliente} onChange={e => setValorCliente(e.target.value)} className="border p-2 rounded w-full" />
            </td>

            <td className="px-4 py-2">
              <select value={cuidadorId} onChange={e => setCuidadorId(e.target.value)} className="border p-2 rounded w-full">
                <option value="">Selecione</option>
                {cuidadores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </td>
            <td className="px-4 py-2">
              <input type="number" placeholder="Valor" value={valor_cuidador} onChange={e => setValorCuidador(e.target.value)} className="border p-2 rounded w-full" />
            </td>
            <td className="px-4 py-2">
              <input type="date" value={data} onChange={e => setData(e.target.value)} className="border p-2 rounded w-full" />
            </td>
            
            <td className="px-4 py-2">
              <button onClick={salvar} className="bg-[#00bf63] text-white px-4 py-2 rounded">
                Salvar
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <h2 className="text-xl font-bold mt-10 mb-4">Serviços em andamento</h2>

      {/* TABELA SERVIÇOS */}
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-[#00bf63] text-white">
          <tr>
            <th className="px-4 py-2 text-left">Cuidador</th>
            <th className="px-4 py-2 text-left">Valor Cuidador</th>
            <th className="px-4 py-2 text-left">Cliente</th>
            <th className="px-4 py-2 text-left">Valor Cliente</th>
            <th className="px-4 py-2 text-left">Data</th>
            <th className="px-4 py-2 text-left">Pagamento</th>
            <th className="px-4 py-2 text-center">X</th>
          </tr>
        </thead>
        <tbody>
          {servicos.map(s => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{s.cuidador?.nome}</td>
              <td className="px-4 py-2 font-semibold">
                R$ {Number(s.valor_cuidador).toFixed(2)}
              </td>
              <td className="px-4 py-2">{s.cliente?.nome}</td>
              <td className="px-4 py-2 font-semibold">
                R$ {Number(s.valor_cliente).toFixed(2)}
              </td>              
              <td className="px-4 py-2">{s.data}</td>
              

              {/* STATUS DROPDOWN */}
              <td className="px-4 py-2">
                <select
                  value={s.status_cuidador}
                  onChange={e => atualizarStatus(s.id, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusStyle[s.status_cuidador]}`}
                >
                  {STATUS_CUIDADOR.map(st => (
                    <option key={st} value={st}>{st.charAt(0).toUpperCase() + st.slice(1)}</option>
                  ))}
                </select>
              </td>

              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => excluir(s.id)}
                  className="text-red-600 font-bold"
                >
                  X
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}