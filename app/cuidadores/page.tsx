'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cuidador = {
  id: string
  nome: string
  email: string
  telefone: string
  documento: string
}

export default function Cuidadores() {

  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [editando, setEditando] = useState<Cuidador | null>(null)
  const [loading, setLoading] = useState(false)

  async function carregar() {

    const { data, error } = await supabase
      .from('cuidadores')
      .select(`
        id,
        perfis (
          nome,
          email,
          telefone,
          documento
        )
      `)

    if (error) {
      console.error(error)
      return
    }

    const formatado = data.map((c: any) => ({
      id: c.id,
      nome: c.perfis?.nome,
      email: c.perfis?.email,
      telefone: c.perfis?.telefone,
      documento: c.perfis?.documento
    }))

    setCuidadores(formatado)
  }

  async function salvarEdicao() {
    if (!editando) return
    setLoading(true)

    const { error } = await supabase
      .from('perfis')
      .update({
        nome: editando.nome,
        email: editando.email,
        telefone: editando.telefone,
        documento: editando.documento
      })
      .eq('id', editando.id)

    if (error) {
      alert('Erro ao salvar: ' + error.message)
    } else {
      setEditando(null)
      carregar()
    }

    setLoading(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Cuidadores Cadastrados
      </h1>
      <div className="table-cuidadores-container">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden mt-6">

          <thead className="bg-[#00bf63] text-white">
            <tr>
              <th className="px-4 py-3 text-left">Foto</th>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Documento</th>
              <th className="px-4 py-3 text-center">Ações</th>  
            </tr>
          </thead>

          <tbody>
            {cuidadores.map((c) => (
              <tr key={c.id} className="border-t hover:bg-gray-50">

                {/* FOTO */}
                <td className="px-4 py-3">
                  <div className="w-10 h-10 rounded-full bg-[#00bf63] text-white flex items-center justify-center font-bold">
                    {c.nome?.charAt(0).toUpperCase()}
                  </div>
                </td>

                {/* NOME */}
                <td className="px-4 py-3 font-medium">
                  {c.nome}
                </td>

                {/* EMAIL */}
                <td className="px-4 py-3 text-gray-600">
                  {c.email}
                </td>

                {/* TELEFONE */}
                <td className="px-4 py-3 text-gray-600">
                  {c.telefone}
                </td>

                <td className="px-4 py-3 text-gray-600">{c.documento}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => setEditando(c)}
                    className="bg-[#00bf63] hover:bg-[#218838] text-white text-sm font-semibold px-3 py-1 rounded-full transition-all"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>

      <div className="increva-se-container mt-7">
        {/* INSCREVA-SE */}
        <a
          href='/cadastro'
          className='bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-2 py-1 rounded-full text-lg transition-all duration-200'>
            Novo cadastro
        </a>
      </div>

      {/* MODAL */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">

            <h2 className="text-xl font-bold mb-6 text-[#00bf63]">Editar Cuidador</h2>

            <div className="flex flex-col gap-4">

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Nome</label>
                <input
                  type="text"
                  value={editando.nome}
                  onChange={e => setEditando({ ...editando, nome: e.target.value })}
                  className="border-2 border-gray-200 focus:border-[#00bf63] rounded-lg px-4 py-2 w-full outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Email</label>
                <input
                  type="email"
                  value={editando.email}
                  onChange={e => setEditando({ ...editando, email: e.target.value })}
                  className="border-2 border-gray-200 focus:border-[#00bf63] rounded-lg px-4 py-2 w-full outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Telefone</label>
                <input
                  type="text"
                  value={editando.telefone}
                  onChange={e => setEditando({ ...editando, telefone: e.target.value })}
                  className="border-2 border-gray-200 focus:border-[#00bf63] rounded-lg px-4 py-2 w-full outline-none transition"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Documento</label>
                <input
                  type="text"
                  value={editando.documento}
                  onChange={e => setEditando({ ...editando, documento: e.target.value })}
                  className="border-2 border-gray-200 focus:border-[#00bf63] rounded-lg px-4 py-2 w-full outline-none transition"
                />
              </div>

            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditando(null)}
                className="flex-1 border-2 border-gray-300 text-gray-600 font-semibold py-2 rounded-full hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={loading}
                className="flex-1 bg-[#00bf63] hover:bg-[#218838] text-white font-semibold py-2 rounded-full transition"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}