'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Cuidadores() {
  const [cuidadores, setCuidadores] = useState([])
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  async function carregar() {
    const { data } = await supabase.from('cuidadores').select('*')
    setCuidadores(data || [])
  }

  async function criar() {
    await supabase.from('cuidadores').insert([
      { nome, valor_hora: Number(valor) }
    ])
    setNome('')
    setValor('')
    carregar()
  }

  async function deletar(id: string) {
    await supabase.from('cuidadores').delete().eq('id', id)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  return (
    <div>
      <h1>Cuidadores</h1>

      <input placeholder="Nome"
        value={nome}
        onChange={e => setNome(e.target.value)} />

      <input placeholder="Valor Hora"
        value={valor}
        onChange={e => setValor(e.target.value)} />

      <button onClick={criar}>Criar</button>

      <ul>
        {cuidadores.map((c: any) => (
          <li key={c.id}>
            {c.nome} - R$ {c.valor_hora}
            <button onClick={() => deletar(c.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}