'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CadastroPage() {

  const router = useRouter()

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [tipo, setTipo] = useState<'cliente' | 'cuidador'>('cliente')
  const [documento, setDocumento] = useState('')
  const [loading, setLoading] = useState(false)

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {

      // 1️⃣ Criar no Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
      })

      if (error) throw error

      const userId = data.user?.id
      if (!userId) throw new Error('Usuário não criado')

      // 2️⃣ Inserir em perfis (AGORA COM EMAIL)
      const { error: erroPerfil } = await supabase
        .from('perfis')
        .insert({
          id: userId,
          nome,
          telefone,
          tipo,
          email,
          documento
        })

      if (erroPerfil) throw erroPerfil

      // 3️⃣ Inserir na tabela específica
      if (tipo === 'cliente') {
        const { error } = await supabase
          .from('clientes')
          .insert({
            id: userId
          })

        if (error) throw error
      }

      if (tipo === 'cuidador') {
        const { error } = await supabase
          .from('cuidadores')
          .insert({
            id: userId
          })

        if (error) throw error
      }

      alert('Cadastro realizado com sucesso!')
      router.push('/login')

    } catch (err: any) {
      alert(err.message)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-1 bg-white p-8 shadow rounded-xl">

      <h1 className="text-2xl text-center font-bold mb-6">
        Cadastro
      </h1>

      <form onSubmit={cadastrar} className="flex flex-col gap-4">

        <input
          type="text"
          placeholder="Nome"
          required
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="border p-3 rounded"
        />

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border p-3 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          required
          value={senha}
          onChange={e => setSenha(e.target.value)}
          className="border p-3 rounded"
        />

        <input
          type="text"
          placeholder="Telefone"
          required
          value={telefone}
          onChange={e => setTelefone(e.target.value)}
          className="border p-3 rounded"
        />

        <input
          type="text"
          placeholder="Documento"
          required
          value={documento}
          onChange={e => setDocumento(e.target.value)}
          className="border p-3 rounded"
        />

        <select
          value={tipo}
          onChange={e => setTipo(e.target.value as any)}
          className="border p-3 rounded"
        >
          <option value="cliente">Cliente</option>
          <option value="cuidador">Cuidador</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#00bf63] hover:bg-[#00a653] text-white py-3 rounded font-semibold transition"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>

      </form>
    </div>
  )
}