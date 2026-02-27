'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Relatorios() {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    supabase.from('servicos')
      .select('valor_total')
      .then(res => {
        const soma = res.data?.reduce(
          (acc, s: any) => acc + Number(s.valor_total), 0
        )
        setTotal(soma || 0)
      })
  }, [])

  return (
    <div>
      <h1>Relatório Financeiro</h1>
      <h2>Total Faturado: R$ {total}</h2>
    </div>
  )
}