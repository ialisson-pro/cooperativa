'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'

type Cuidador = {
  id: string
  nome: string
  documento: string
}

type Servico = {
  id: string
  data: string
  valor: number
  cliente: {
    nome: string
  }
}

export default function AdminPage() {
  const [cuidadores, setCuidadores] = useState<Cuidador[]>([])
  const [selecionado, setSelecionado] = useState<string>('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [servicos, setServicos] = useState<Servico[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    buscarCuidadores()
  }, [])

  async function buscarCuidadores() {
    const { data, error } = await supabase
      .from('cuidadores')
      .select(`
        id,
        perfis (
          nome,
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
      documento: c.perfis?.documento      
    }))

    setCuidadores(formatado)
  }

  async function buscarServicos() {

    const { data } = await supabase
      .from('servicos')
      .select(`
        id,
        data,
        valor,
        clientes:cliente_id (
          perfis ( nome )
        )
      `)
      .eq('cuidador_id', selecionado)
      .gte('data', inicio)
      .lte('data', fim)
      .order('data', { ascending: true })

      console.log('RAW DATA:', JSON.stringify(data, null, 2))

    if (!data) return

    const formatado = data.map((s: any) => ({
      id: s.id,
      data: s.data,
      valor: s.valor,
      cliente: {
        nome: s.clientes?.perfis?.nome || 'não encontrado'
      }
    }))

    setServicos(formatado)

    const soma = formatado.reduce((acc, s) => acc + Number(s.valor), 0)
    setTotal(soma)
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

  async function gerarPDF() {

    const cuidador = cuidadores.find(c => c.id === selecionado)
    if (!cuidador) return

    const doc = new jsPDF()

    const pageWidth = doc.internal.pageSize.getWidth()

    /* =============================
      HEADER VERDE
    ============================== */

    doc.setFillColor(0, 191, 99)
    doc.rect(0, 0, pageWidth, 40, 'F')

    /* =============================
      FUNDO BRANCO ARREDONDADO LOGO
    ============================== */

    doc.setFillColor(255, 255, 255)
    doc.roundedRect(15, 8, 37, 28, 6, 6, 'F')

    /* =============================
      LOGO
    ============================== */

    const logoBase64 = await getBase64Image('/logo.png')

    doc.addImage(
      logoBase64,
      'PNG',
      8,   // X
      5,   // Y
      50,   // largura
      32    // altura
    )

    /* =============================
      DADOS EMPRESA
    ============================== */

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)

    doc.text('RUA ALEGRE, 123 - MACEIO - AL', pageWidth - 10, 12, { align: 'right' })
    doc.text('WWW.GRANDESITE.COM.BR', pageWidth - 10, 18, { align: 'right' })
    doc.text('(12) 3456-7890', pageWidth - 10, 24, { align: 'right' })

    /* =============================
      TÍTULO
    ============================== */

    doc.setTextColor(60, 60, 60)
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.text('Recibo', pageWidth / 2, 70, { align: 'center' })

    /* =============================
      BLOCO CLIENTE
    ============================== */

    doc.setDrawColor(0, 191, 99)
    doc.setLineWidth(1)

    // círculo avatar
    doc.setFillColor(0, 191, 99)
    doc.circle(40, 95, 12, 'F')

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)

    let startY1 = 90
    const labelX = 70
    const valueX = 110
    const lineHeight = 10

    // CLIENTE
    doc.setFont('helvetica', 'bold')
    doc.text('CUIDADOR:', labelX, startY1)

    doc.setFont('helvetica', 'normal')
    doc.text(cuidador.nome || '', valueX, startY1)

    startY1 += lineHeight

    // DOCUMENTO
    doc.setFont('helvetica', 'bold')
    doc.text('DOCUMENTO:', labelX, startY1)

    doc.setFont('helvetica', 'normal')
    doc.text(cuidador.documento || '', valueX, startY1)

    startY1 += lineHeight

    // PERÍODO
    doc.setFont('helvetica', 'bold')
    doc.text('PERÍODO:', labelX, startY1)

    doc.setFont('helvetica', 'normal')
    doc.text(`${inicio} até ${fim}`, valueX, startY1)

    /* =============================
      TABELA PDF
    ============================== */

    let startY = 135

    doc.setDrawColor(0, 191, 99)
    doc.roundedRect(15, startY - 10, pageWidth - 30, 60, 10, 10)

    doc.setFillColor(0, 191, 99)
    doc.roundedRect(20, startY - 8, pageWidth - 40, 12, 6, 6, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')

    doc.text('DATA', 30, startY)
    doc.text('CLIENTE', 80, startY)
    doc.text('VALOR', 160, startY)

    /* =============================
      DADOS
    ============================== */

    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    let linha = startY + 15

    servicos.forEach(s => {

      doc.text(s.data, 30, linha)
      doc.text(s.cliente?.nome || '', 80, linha)
      doc.text(`R$ ${Number(s.valor).toFixed(2)}`, 160, linha)

      linha += 8
    })

    /* =============================
      TOTAL
    ============================== */

    let linha_total =  linha + 16

    doc.setFillColor(0, 191, 99)
    doc.roundedRect(pageWidth - 80, linha_total + 18, 65, 10, 8, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)

    doc.text(`TOTAL: R$ ${total.toFixed(2)}`, pageWidth - 47, linha_total + 25, {
      align: 'center'
    })

    /* =============================
      DATA PAGAMENTO
    ============================== */

    doc.setTextColor(80, 80, 80)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    const hoje = new Date().toLocaleDateString()

    doc.text(`DATA DE PAGAMENTO: ${hoje}`, 20, linha_total + 25)

    doc.save(`recibo-${cuidador.nome}.pdf`)
  }

  return (
    <h1 className="text-2xl font-bold mb-4">Recibos</h1> <br/>

      <select className="font-semibold" onChange={e => setSelecionado(e.target.value)}>
        <option>Selecione cuidador</option>
        {cuidadores.map(c => (
          <option className="font-semibold" key={c.id} value={c.id}>
            {c.nome}
          </option>
        ))}
      </select>

      <div className="flex items-end gap-8 mt-6">
        {/* INÍCIO */}
        <div className="flex flex-col">
          <label className="text-[#00bf63] font-semibold mb-2 text-lg">
            Início
          </label>
          <input
            type="date"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            className="border-4 border-[#00bf63] rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#00bf63]"
          />
        </div>

        {/* FIM */}
        <div className="flex flex-col">
          <label className="text-[#00bf63] font-semibold mb-2 text-lg">
            Fim
          </label>
          <input
            type="date"
            value={fim}
            onChange={e => setFim(e.target.value)}
            className="border-4 border-[#00bf63] rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#00bf63]"
          />
        </div>

        {/* BOTÃO */}
        <button
          onClick={buscarServicos}
          className="bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-10 py-4 rounded-full text-lg transition-all duration-200"
        >
          BUSCAR
        </button>

      </div>
      
      {servicos.length === 0 && (
        <p className="text-gray-500"><br/>
          Nenhum serviço encontrado no período selecionado.
        </p>
      )}

      {servicos.length > 0 && (
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden mt-6">
          <thead className="bg-[#00bf63] text-white">
            <tr>
              <th className="px-4 py-2 text-left">Data</th>
              <th className="px-4 py-2 text-left">Cliente</th>
              <th className="px-4 py-2 text-left">Valor</th>
            </tr>
          </thead>

          <tbody>
            {servicos.map((s, index) => {
              return (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{s.data}</td>
                  <td className="px-4 py-2">{s.cliente?.nome}</td>
                  <td className="px-4 py-2 font-semibold">
                    R$ {Number(s.valor).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <h3 className="py-6 font-semibold">Total: R$ {total.toFixed(2)}</h3>

      {/* BOTÃO */}
      <button
        onClick={gerarPDF}
        className="bg-[#00bf63] hover:bg-[#218838] text-white font-bold px-7 py-1 rounded-full text-lg transition-all duration-200"
      >
        GERAR PDF
      </button>
    </div>
  )
}