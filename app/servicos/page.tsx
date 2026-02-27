'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Servicos() {
  const [clientes, setClientes] = useState([])
  const [cuidadores, setCuidadores] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [cuidadorId, setCuidadorId] = useState('')
  const [entrada, setEntrada] = useState('')
  const [saida, setSaida] = useState('')

  useEffect(() => {
    supabase.from('clientes').select('*').then(r => setClientes(r.data || []))
    supabase.from('cuidadores').select('*').then(r => setCuidadores(r.data || []))
  }, [])

  function calcularHoras(e: string, s: string) {
    const inicio = new Date(`1970-01-01T${e}:00`)
    const fim = new Date(`1970-01-01T${s}:00`)
    const diff = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60)
    return diff
  }

  async function salvar() {
    const horas = calcularHoras(entrada, saida)

    const { data: cuidador } = await supabase
      .from('cuidadores')
      .select('valor_hora')
      .eq('id', cuidadorId)
      .single()

    const valorTotal = horas * cuidador.valor_hora

    await supabase.from('servicos').insert([
      {
        cliente_id: clienteId,
        cuidador_id: cuidadorId,
        data: new Date(),
        hora_entrada: entrada,
        hora_saida: saida,
        total_horas: horas,
        valor_total: valorTotal
      }
    ])

    alert('Serviço salvo')
  }

  return (
    <div>
      <h1>Novo Serviço</h1>

      <select onChange={e => setClienteId(e.target.value)}>
        <option>Cliente</option>
        {clientes.map((c: any) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      <select onChange={e => setCuidadorId(e.target.value)}>
        <option>Cuidador</option>
        {cuidadores.map((c: any) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>

      <input type="time" onChange={e => setEntrada(e.target.value)} />
      <input type="time" onChange={e => setSaida(e.target.value)} />

      <button onClick={salvar}>Salvar</button>
    </div>
  )
}