'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  Tooltip, Legend
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend)

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const COLORS = ['#1D9E75','#7F77DD','#D85A30','#378ADD','#BA7517','#993556']

type Servico = {
  data: string
  valor_cuidador: number
  valor_cliente: number
  cuidador: { nome: string }
  cliente:  { nome: string }
}

export default function Dashboard() {
  const [mesSel, setMesSel]               = useState<string>('all')
  const [anoSel, setAnoSel]               = useState<string>(new Date().getFullYear().toString())
  const [anos, setAnos]                   = useState<string[]>([])
  const [servicos, setServicos]           = useState<Servico[]>([])
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalCuidadores, setTotalCuidadores] = useState(0)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const [{ data: servData }, { count: cliCount }, { count: cuidCount }] = await Promise.all([
      supabase.from('servicos').select(`
        data, valor_cuidador, valor_cliente,
        cuidador:cuidador_id ( perfis ( nome ) ),
        cliente:cliente_id  ( perfis ( nome ) )
      `),
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('cuidadores').select('*', { count: 'exact', head: true }),
    ])

    const formatado = (servData || []).map((s: any) => ({
      data:     s.data,
      valor_cuidador:    Number(s.valor_cuidador),
      valor_cliente:    Number(s.valor_cliente),
      cuidador: { nome: s.cuidador?.perfis?.nome || '' },
      cliente:  { nome: s.cliente?.perfis?.nome  || '' },
    }))

    // Gera lista de anos únicos a partir dos dados
    const anosUnicos = [...new Set(
      formatado.map(s => new Date(s.data).getFullYear().toString())
    )].sort((a, b) => Number(b) - Number(a))

    setServicos(formatado)
    setAnos(anosUnicos)
    setTotalClientes(cliCount || 0)
    setTotalCuidadores(cuidCount || 0)
  }

  // --- Filtragem combinada de ano + mês ---
  const dados = servicos.filter(s => {
    const d = new Date(s.data)
    const anoOk = anoSel === 'all' || d.getFullYear().toString() === anoSel
    const mesOk = mesSel === 'all' || d.getMonth() === parseInt(mesSel)
    return anoOk && mesOk
  })

  const totalValorSaidas = dados.reduce((a, s) => a + s.valor_cuidador, 0)
  const totalValorEntradas = dados.reduce((a, s) => a + s.valor_cliente, 0)
  const Lucro = totalValorEntradas - totalValorSaidas

  // --- Gráfico mensal (respeita filtro de ano) ---
  const servicosFiltradosAno = anoSel === 'all'
    ? servicos
    : servicos.filter(s => new Date(s.data).getFullYear().toString() === anoSel)

  const servsPorMes = Array(12).fill(0)
  const valsPorMes  = Array(12).fill(0)
  servicosFiltradosAno.forEach(s => {
    const m = new Date(s.data).getMonth()
    servsPorMes[m]++
    valsPorMes[m] += s.valor_cuidador
  })

  // --- Agrupamentos filtrados ---
  function agrupar(arr: Servico[], campo: 'cuidador' | 'cliente') {
    const map: Record<string, number> = {}
    arr.forEach(s => {
      const nome = s[campo].nome || 'Desconhecido'
      map[nome] = (map[nome] || 0) + 1
    })
    return map
  }

  const grpCuid = agrupar(dados, 'cuidador')
  const grpCli  = agrupar(dados, 'cliente')

  const tickOpts = { font: { size: 10 }, color: '#888780' }
  const gridOpts = { color: 'rgba(0,0,0,0.05)' }
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: false,
  } as const

  const subLabel = [
    anoSel !== 'all' ? anoSel : null,
    mesSel !== 'all' ? MESES_FULL[+mesSel] : null,
  ].filter(Boolean).join(' · ') || 'total geral'

  return (
    <div>

      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          < select
            value={anoSel}
            onChange={e => setAnoSel(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5"
          >
            <option value="all">Todos os anos</option>
            {anos.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          
          <select
            value={mesSel}
            onChange={e => setMesSel(e.target.value)}
            className="text-xs border rounded-lg px-3 py-1.5"
          >
            <option value="all">Todos os meses</option>
            {MESES_FULL.map((m, i) => (
              <option key={i} value={String(i)}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-6 gap-2 mb-3">
        {[
          { label: 'Clientes',   value: totalClientes,   sub: '' },
          { label: 'Cuidadores', value: totalCuidadores, sub: '' },
          { label: 'Serviços',   value: dados.length,                               sub: subLabel },
          { label: 'Saídas',     value: 'R$ ' + totalValorSaidas.toLocaleString('pt-BR'), sub: subLabel },
          { label: 'Entradas',     value: 'R$ ' + totalValorEntradas.toLocaleString('pt-BR'), sub: subLabel },
          { label: 'Lucro',     value: 'R$ ' + Lucro.toLocaleString('pt-BR'), sub: subLabel },
          
        ].map((m, i) => (
          <div key={i} className="bg-gray-100 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-xl font-semibold">{m.value}</p>
            {m.sub && <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* GRÁFICOS */}
      <div className="grid gap-2" style={{ gridTemplateColumns: '3fr 2fr 2fr' }}>

        {/* MENSAL */}
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">
            Serviços e saídas por mês
            {anoSel !== 'all' && <span className="text-gray-400 font-normal"> · {anoSel}</span>}
          </p>
          <div className="flex gap-3 mb-2 text-xs text-gray-400">
            <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#1D9E75' }}/>Serviços</span>
            <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#7F77DD' }}/>Saídas (R$)</span>
          </div>
          <div style={{ height: 300 }}>
            <Bar
              data={{
                labels: MESES,
                datasets: [
                  {
                    type: 'bar' as const,
                    label: 'Serviços',
                    data: servsPorMes,
                    backgroundColor: '#1D9E75',
                    yAxisID: 'y',
                    borderRadius: 3,
                    barPercentage: 0.6,
                  },
                  {
                    type: 'bar' as const,
                    label: 'Saídas (R$)',
                    data: valsPorMes,
                    backgroundColor: '#7F77DD',
                    yAxisID: 'y2',
                    borderRadius: 3,
                    barPercentage: 0.6,
                  }
                ]
              }}
              options={{
                ...baseOpts,
                scales: {
                  x: { ticks: { ...tickOpts, autoSkip: false, maxRotation: 0 }, grid: { display: false } },
                  y: { beginAtZero: true, ticks: { ...tickOpts, stepSize: 1 }, grid: gridOpts },
                  y2: { position: 'right', beginAtZero: true, ticks: { ...tickOpts, callback: (v) => 'R$' + v }, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* POR CUIDADOR */}
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Por cuidador</p>
          <div style={{ height: 300 }}>
            <Bar
              data={{
                labels: Object.keys(grpCuid),
                datasets: [{ data: Object.values(grpCuid), backgroundColor: COLORS, borderRadius: 3, barPercentage: 0.55 }]
              }}
              options={{
                ...baseOpts,
                indexAxis: 'y' as const,
                scales: {
                  x: { beginAtZero: true, ticks: { ...tickOpts, stepSize: 1 }, grid: gridOpts },
                  y: { ticks: tickOpts, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* POR CLIENTE */}
        <div className="bg-white border rounded-xl p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Por cliente</p>
          <div style={{ height: 300 }}>
            <Bar
              data={{
                labels: Object.keys(grpCli),
                datasets: [{ data: Object.values(grpCli), backgroundColor: COLORS.slice().reverse(), borderRadius: 3, barPercentage: 0.55 }]
              }}
              options={{
                ...baseOpts,
                indexAxis: 'y' as const,
                scales: {
                  x: { beginAtZero: true, ticks: { ...tickOpts, stepSize: 1 }, grid: gridOpts },
                  y: { ticks: tickOpts, grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  )
}