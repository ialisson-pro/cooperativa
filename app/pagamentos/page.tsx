'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

type Pessoa = {
  id: string
  nome: string
  documento: string
}

type Servico = {
  id: string
  data: string
  valor_cuidador: number
  valor_cliente: number
  nome: string
  status_cuidador: string
  status_cliente: string
}

const STATUS_CUIDADOR = ['pendente', 'pago']
const STATUS_CLIENTE  = ['pendente', 'pago', 'atrasado']

const statusStyleCuidador: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago:     'bg-green-100  text-green-800',
}

const statusStyleCliente: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800',
  pago:     'bg-green-100  text-green-800',
  atrasado: 'bg-red-100    text-red-800',
}

export default function Recibos() {

  const [cuidadores, setCuidadores] = useState<Pessoa[]>([])
  const [clientes, setClientes]     = useState<Pessoa[]>([])

  const [cuidadorSel, setCuidadorSel] = useState<string>('')
  const [clienteSel, setClienteSel]   = useState<string>('')

  const [servicosCuidador, setServicosCuidador] = useState<Servico[]>([])
  const [servicosCliente, setServicosCliente]   = useState<Servico[]>([])

  const [totalCuidador, setTotalCuidador] = useState(0)
  const [totalCliente, setTotalCliente]   = useState(0)

  const [inicio, setInicio] = useState('')
  const [fim, setFim]       = useState('')

  useEffect(() => {
    buscarCuidadores()
    buscarClientes()
  }, [])

  async function buscarCuidadores() {
    const { data } = await supabase
      .from('cuidadores')
      .select(`id, perfis ( nome, documento )`)
    setCuidadores(data?.map((c: any) => ({
      id: c.id, nome: c.perfis?.nome, documento: c.perfis?.documento
    })) || [])
  }

  async function buscarClientes() {
    const { data } = await supabase
      .from('clientes')
      .select(`id, perfis ( nome, documento )`)
    setClientes(data?.map((c: any) => ({
      id: c.id, nome: c.perfis?.nome, documento: c.perfis?.documento
    })) || [])
  }

  async function buscarServicosCuidador() {
    if (!cuidadorSel || !inicio || !fim) return alert('Selecione o cuidador e o período')

    const { data } = await supabase
      .from('servicos')
      .select(`id, data, valor_cuidador, valor_cliente, status_cuidador, clientes:cliente_id ( perfis ( nome ) )`)
      .eq('cuidador_id', cuidadorSel)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true })

    const formatado = (data || []).map((s: any) => ({
      id:              s.id,
      data:            s.data,
      valor_cuidador:  s.valor_cuidador,
      valor_cliente:   s.valor_cliente,
      nome:            s.clientes?.perfis?.nome || '',
      status_cuidador: s.status_cuidador || 'pendente',
      status_cliente:  '',
    }))

    setServicosCuidador(formatado)
    setTotalCuidador(formatado.reduce((acc, s) => acc + Number(s.valor_cuidador), 0))
  }

  async function buscarServicosCliente() {
    if (!clienteSel || !inicio || !fim) return alert('Selecione o cliente e o período')

    const { data } = await supabase
      .from('servicos')
      .select(`id, data, valor_cuidador, valor_cliente, status_cliente, cuidador:cuidador_id ( perfis ( nome ) )`)
      .eq('cliente_id', clienteSel)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true })

    const formatado = (data || []).map((s: any) => ({
      id:              s.id,
      data:            s.data,
      valor_cuidador:  s.valor_cuidador,
      valor_cliente:   s.valor_cliente,
      nome:            s.cuidador?.perfis?.nome || '',
      status_cuidador: '',
      status_cliente:  s.status_cliente || 'pendente',
    }))

    setServicosCliente(formatado)
    setTotalCliente(formatado.reduce((acc, s) => acc + Number(s.valor_cliente), 0))
  }

  async function atualizarStatusCuidador(id: string, novoStatus: string) {
    setServicosCuidador(prev =>
      prev.map(s => s.id === id ? { ...s, status_cuidador: novoStatus } : s)
    )
    await supabase.from('servicos').update({ status_cuidador: novoStatus }).eq('id', id)
  }

  async function atualizarStatusCliente(id: string, novoStatus: string) {
    setServicosCliente(prev =>
      prev.map(s => s.id === id ? { ...s, status_cliente: novoStatus } : s)
    )
    await supabase.from('servicos').update({ status_cliente: novoStatus }).eq('id', id)
  }

  async function marcarTodosCuidadorPago() {
    const ids = servicosCuidador.map(s => s.id)
    if (ids.length === 0) return
    setServicosCuidador(prev => prev.map(s => ({ ...s, status_cuidador: 'pago' })))
    await supabase.from('servicos').update({ status_cuidador: 'pago' }).in('id', ids)
  }

  async function marcarTodosClientePago() {
    const ids = servicosCliente.map(s => s.id)
    if (ids.length === 0) return
    setServicosCliente(prev => prev.map(s => ({ ...s, status_cliente: 'pago' })))
    await supabase.from('servicos').update({ status_cliente: 'pago' }).in('id', ids)
  }

  async function getBase64Image(url: string) {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  }

  async function gerarPDF(tipo: 'cuidador' | 'cliente') {
    const isCuidador = tipo === 'cuidador'

    const pessoa = isCuidador
      ? cuidadores.find(c => c.id === cuidadorSel)
      : clientes.find(c => c.id === clienteSel)

    const servicos = isCuidador ? servicosCuidador : servicosCliente
    const colLabel = isCuidador ? 'CLIENTE' : 'CUIDADOR'
    const titulo   = isCuidador ? 'Recibo de Pagamento' : 'Recibo de Cobrança'

    if (!pessoa) return

    // ✅ FILTRO: apenas pendentes
    const servicosFiltrados = servicos.filter(s => {
      return isCuidador
        ? s.status_cuidador === 'pendente'
        : s.status_cliente === 'pendente'
    })

    // ✅ Evita gerar PDF vazio
    if (servicosFiltrados.length === 0) {
      alert('Não há serviços pendentes para gerar recibo.')
      return
    }

    // ✅ TOTAL apenas dos pendentes
    const totalFiltrado = servicosFiltrados.reduce((acc, s) => {
      const valor = isCuidador ? s.valor_cuidador : s.valor_cliente
      return acc + Number(valor)
    }, 0)

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()

    doc.setFillColor(0, 191, 99)
    doc.rect(0, 0, pageWidth, 40, 'F')
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(15, 8, 37, 28, 6, 6, 'F')

    const logoBase64 = await getBase64Image('/logo.png')
    doc.addImage(logoBase64, 'PNG', 8, 5, 50, 32)

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.text('RUA ALEGRE, 123 - MACEIO - AL', pageWidth - 10, 12, { align: 'right' })
    doc.text('WWW.GRANDESITE.COM.BR', pageWidth - 10, 18, { align: 'right' })
    doc.text('(12) 3456-7890', pageWidth - 10, 24, { align: 'right' })

    doc.setTextColor(60, 60, 60)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text(titulo, pageWidth / 2, 65, { align: 'center' })

    doc.setFillColor(0, 191, 99)
    doc.circle(40, 95, 12, 'F')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    let y = 90
    const lx = 70, vx = 115, lh = 10

    const linhas = [
      [isCuidador ? 'CUIDADOR:' : 'CLIENTE:', pessoa.nome || ''],
      ['DOCUMENTO:', pessoa.documento || ''],
      ['PERÍODO:', `${inicio} até ${fim}`],
    ]

    linhas.forEach(([label, valor]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, lx, y)
      doc.setFont('helvetica', 'normal')
      doc.text(valor, vx, y)
      y += lh
    })

    let tY = 135
    doc.setDrawColor(0, 191, 99)
    doc.roundedRect(15, tY - 10, pageWidth - 30, 60, 10, 10)
    doc.setFillColor(0, 191, 99)
    doc.roundedRect(20, tY - 8, pageWidth - 40, 12, 6, 6, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('DATA', 30, tY)
    doc.text(colLabel, 80, tY)
    doc.text('VALOR', 160, tY)

    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    let linha = tY + 15

    // ✅ USA APENAS OS FILTRADOS
    servicosFiltrados.forEach(s => {
      const valorPDF = isCuidador ? s.valor_cuidador : s.valor_cliente
      doc.text(s.data, 30, linha)
      doc.text(s.nome || '', 80, linha)
      doc.text(`R$ ${Number(valorPDF).toFixed(2)}`, 160, linha)
      linha += 8
    })

    const lT = linha + 16
    doc.setFillColor(0, 191, 99)
    doc.roundedRect(pageWidth - 80, lT + 18, 65, 10, 8, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)

    // ✅ TOTAL CORRETO
    doc.text(`TOTAL: R$ ${totalFiltrado.toFixed(2)}`, pageWidth - 47, lT + 25, { align: 'center' })

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(`DATA DE EMISSÃO: ${new Date().toLocaleDateString('pt-BR')}`, 20, lT + 25)

    doc.save(`recibo-${tipo}-${pessoa.nome}.pdf`)
  }

  function TabelaServicos({
    servicos,
    tipo,
    total,
    onStatusChange,
    onPagarTodos,
    onGerarPDF,
  }: {
    servicos: Servico[]
    tipo: 'cuidador' | 'cliente'
    total: number
    onStatusChange: (id: string, status: string) => void
    onPagarTodos?: () => void
    onGerarPDF: () => void
  }) {
    const isCuidador   = tipo === 'cuidador'
    const statusList   = isCuidador ? STATUS_CUIDADOR : STATUS_CLIENTE
    const statusStyles = isCuidador ? statusStyleCuidador : statusStyleCliente

    return (
      <>
        <table className="min-w-full bg-gray-50 rounded-lg overflow-hidden text-sm">
          <thead className="bg-[#00bf63] text-white">
            <tr>
              <th className="px-3 py-2 text-left">Data</th>
              <th className="px-3 py-2 text-left">{isCuidador ? 'Cliente' : 'Cuidador'}</th>
              <th className="px-3 py-2 text-left">Valor</th>
              <th className="px-3 py-2 text-left">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map((s, i) => {
              const statusAtual = isCuidador ? s.status_cuidador : s.status_cliente
              const valor       = isCuidador ? s.valor_cuidador  : s.valor_cliente
              return (
                <tr key={i} className="border-t hover:bg-gray-100">
                  <td className="px-3 py-2">{s.data}</td>
                  <td className="px-3 py-2">{s.nome}</td>
                  <td className="px-3 py-2 font-semibold">R$ {Number(valor).toFixed(2)}</td>
                  <td className="px-3 py-2">
                    <select
                      value={statusAtual}
                      onChange={e => onStatusChange(s.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${statusStyles[statusAtual]}`}
                    >
                      {statusList.map(st => (
                        <option key={st} value={st}>
                          {st.charAt(0).toUpperCase() + st.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <p className="font-semibold">Total: R$ {total.toFixed(2)}</p>
            {onPagarTodos && (
              <button
                onClick={onPagarTodos}
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full transition"
              >
                Marcar todos como Pago
              </button>
            )}
          </div>
          <button
            onClick={onGerarPDF}
            className="bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-5 py-2 rounded-full transition"
          >
            Gerar PDF
          </button>
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Recibos</h1>

      <div className="flex items-end gap-6 mb-10">
        <div className="flex flex-col">
          <label className="text-[#00bf63] font-semibold mb-2">Início</label>
          <input
            type="date" value={inicio}
            onChange={e => setInicio(e.target.value)}
            className="border-4 border-[#00bf63] rounded-md px-4 py-2 focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[#00bf63] font-semibold mb-2">Fim</label>
          <input
            type="date" value={fim}
            onChange={e => setFim(e.target.value)}
            className="border-4 border-[#00bf63] rounded-md px-4 py-2 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">

        {/* ===== CUIDADOR ===== */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Pagamento — Cuidador</h2>
          <div className="flex gap-4 mb-4 items-end">
            <div className="flex flex-col flex-1">
              <label className="text-sm text-[#00bf63] font-semibold mb-1">Cuidador</label>
              <select
                className="border-2 border-[#00bf63] rounded-lg px-3 py-2"
                onChange={e => setCuidadorSel(e.target.value)}
              >
                <option value="">Selecione</option>
                {cuidadores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <button
              onClick={buscarServicosCuidador}
              className="bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-6 py-2 rounded-full transition"
            >
              Buscar
            </button>
          </div>
          {servicosCuidador.length === 0 && <p className="text-gray-400 text-sm">Nenhum serviço encontrado.</p>}
          {servicosCuidador.length > 0 && (
            <TabelaServicos
              servicos={servicosCuidador}
              tipo="cuidador"
              total={totalCuidador}
              onStatusChange={atualizarStatusCuidador}
              onPagarTodos={marcarTodosCuidadorPago}
              onGerarPDF={() => gerarPDF('cuidador')}
            />
          )}
        </div>

        {/* ===== CLIENTE ===== */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Cobrança — Cliente</h2>
          <div className="flex gap-4 mb-4 items-end">
            <div className="flex flex-col flex-1">
              <label className="text-sm text-[#00bf63] font-semibold mb-1">Cliente</label>
              <select
                className="border-2 border-[#00bf63] rounded-lg px-3 py-2"
                onChange={e => setClienteSel(e.target.value)}
              >
                <option value="">Selecione</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <button
              onClick={buscarServicosCliente}
              className="bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-6 py-2 rounded-full transition"
            >
              Buscar
            </button>
          </div>
          {servicosCliente.length === 0 && <p className="text-gray-400 text-sm">Nenhum serviço encontrado.</p>}
          {servicosCliente.length > 0 && (
            <TabelaServicos
              servicos={servicosCliente}
              tipo="cliente"
              total={totalCliente}
              onStatusChange={atualizarStatusCliente}
              onPagarTodos={marcarTodosClientePago}
              onGerarPDF={() => gerarPDF('cliente')}
            />
          )}
        </div>

      </div>
    </div>
  )
}