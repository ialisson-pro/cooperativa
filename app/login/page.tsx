'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const router = useRouter()

  async function entrar() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) return alert(error.message)

    const user = data.user

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('tipo')
      .eq('id', user?.id)
      .single()

      console.log('USER:', user?.id)
      console.log('PERFIL:', perfil)
      console.log('ERRO PERFIL:', perfilError)

    if (perfilError) return alert('Perfil não encontrado')

    if (perfil.tipo === 'admin') router.push('/admin')
    if (perfil.tipo === 'cuidador') router.push('/cuidadores')
    if (perfil.tipo === 'cliente') router.push('/clientes')
  }

  return (
    <div>
      <h1>Login</h1>
      <div className="cadastro-container">
        <input
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          onChange={e => setSenha(e.target.value)}
        />

        {/* BOTÃO */}
        <button 
          className='bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-7 py-1 rounded-full text-lg transition-all duration-200'
          onClick={entrar}>
            Entrar
        </button>
      </div>
      
      <div className="increva-se-container mt-7">
        {/* INSCREVA-SE */}
        <a
          href='/cadastro'
          className='bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-2 py-1 rounded-full text-lg transition-all duration-200'>
            Inscreva-se
        </a>
      </div>
      

    </div>
  )
}