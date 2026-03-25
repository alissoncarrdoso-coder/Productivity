import React, { useState, useEffect } from 'react'

const ACCENT = '#F5A623'
const GREEN  = '#4ADE80'
const RED    = '#F87171'
const BLUE   = '#60A5FA'
const PURPLE = '#A78BFA'

const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function pad2(n) { return String(n).padStart(2,'0') }
function todayKey() { return new Date().toISOString().slice(0,10) }
function weekLabel(d) { const dt = new Date(d); return dt.getDate()+'/'+(dt.getMonth()+1) }

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def } catch(e) { return def }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch(e) {}
}

const DEFAULT_HABITS = [
  { id: 'h1', name: 'Exercício',  icon: '🏋️', color: GREEN   },
  { id: 'h2', name: 'Leitura',    icon: '📚', color: BLUE    },
  { id: 'h3', name: 'Meditação',  icon: '🧘', color: PURPLE  },
  { id: 'h4', name: 'Hidratação', icon: '💧', color: '#38BDF8' },
]
const DEFAULT_TASKS = [
  { id: 't1', title: 'Revisar metas da semana', priority: 'alta',  date: todayKey() },
  { id: 't2', title: 'Responder e-mails',       priority: 'media', date: todayKey() },
  { id: 't3', title: 'Planejamento mensal',      priority: 'alta',  date: todayKey() },
]

function CircleProgress({ pct, size, stroke, color, label, sub }) {
  size = size || 82; stroke = stroke || 7; color = color || ACCENT
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    React.createElement('div', { style: { display:'flex', flexDirection:'column', alignItems:'center', gap:0 } },
      React.createElement('div', { style: { position:'relative', width:size, height:size } },
        React.createElement('svg', { width:size, height:size, style: { transform:'rotate(-90deg)', position:'absolute' } },
          React.createElement('circle', { cx:size/2, cy:size/2, r:r, fill:'none', stroke:'#1e293b', strokeWidth:stroke }),
          React.createElement('circle', { cx:size/2, cy:size/2, r:r, fill:'none', stroke:color, strokeWidth:stroke,
            strokeDasharray: dash+' '+circ, strokeLinecap:'round',
            style: { transition:'stroke-dasharray .6s ease' } })
        ),
        React.createElement('div', { style: { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' } },
          React.createElement('span', { style: { fontSize:size*.21, fontWeight:800, color:'#f1f5f9', fontFamily:"'DM Serif Display',serif", lineHeight:1 } }, pct+'%')
        )
      ),
      label && React.createElement('div', { style: { fontSize:10, color:'#94a3b8', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginTop:6 } }, label),
      sub   && React.createElement('div', { style: { fontSize:10, color:'#475569', marginTop:1 } }, sub)
    )
  )
}

export default function App() {
  const [tab,      setTab]      = useState('hoje')
  const [habits,   setHabits]   = useState(() => load('prd_habits', DEFAULT_HABITS))
  const [tasks,    setTasks]    = useState(() => load('prd_tasks',  DEFAULT_TASKS))
  const [logs,     setLogs]     = useState(() => load('prd_logs',   {}))
  const [taskLogs, setTaskLogs] = useState(() => load('prd_tlogs',  {}))
  const [newTask,  setNewTask]  = useState({ title:'', priority:'media' })
  const [newHabit, setNewHabit] = useState({ name:'', icon:'⭐' })
  const [showAddTask,  setSAT]  = useState(false)
  const [showAddHabit, setSAH]  = useState(false)
  const [clock, setClock]       = useState(new Date())

  const today = todayKey()
  const now   = new Date()

  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { save('prd_habits', habits)   }, [habits])
  useEffect(() => { save('prd_tasks',  tasks)    }, [tasks])
  useEffect(() => { save('prd_logs',   logs)     }, [logs])
  useEffect(() => { save('prd_tlogs',  taskLogs) }, [taskLogs])

  const todayLog    = logs[today] || {}
  const toggleHabit = (id) => setLogs(p => ({ ...p, [today]: { ...(p[today]||{}), [id]: !(p[today]||{})[id] } }))

  const todayTasks   = tasks.filter(t => t.date === today || !t.date)
  const doneTodayIds = taskLogs[today] || []
  const toggleTask   = (id) => setTaskLogs(p => {
    const arr = p[today] || []
    return { ...p, [today]: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id] }
  })
  const addTask = () => {
    if (!newTask.title.trim()) return
    setTasks(p => [...p, { id:'t'+Date.now(), title:newTask.title.trim(), priority:newTask.priority, date:today }])
    setNewTask({ title:'', priority:'media' })
    setSAT(false)
  }
  const deleteTask  = (id) => setTasks(p => p.filter(t => t.id !== id))
  const addHabit = () => {
    if (!newHabit.name.trim()) return
    const cols = [GREEN, BLUE, PURPLE, ACCENT, RED]
    setHabits(p => [...p, { id:'h'+Date.now(), name:newHabit.name.trim(), icon:newHabit.icon||'⭐', color:cols[p.length%cols.length] }])
    setNewHabit({ name:'', icon:'⭐' })
    setSAH(false)
  }
  const deleteHabit = (id) => setHabits(p => p.filter(h => h.id !== id))

  const habitPctToday = habits.length ? Math.round(habits.filter(h => todayLog[h.id]).length / habits.length * 100) : 0
  const taskPctToday  = todayTasks.length ? Math.round(doneTodayIds.filter(id => todayTasks.find(t => t.id===id)).length / todayTasks.length * 100) : 0
  const dailyPct      = Math.round((habitPctToday + taskPctToday) / 2)

  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate()-(6-i)); return d.toISOString().slice(0,10)
  })
  const weeklyScores = last7.map(date => {
    const hLog = logs[date] || {}; const tLog = taskLogs[date] || []
    const dayT = tasks.filter(t => t.date === date)
    const hP = habits.length ? habits.filter(h => hLog[h.id]).length / habits.length : 0
    const tP = dayT.length   ? tLog.filter(id => dayT.find(t => t.id===id)).length / dayT.length : 0
    return { date, score: Math.round((hP+tP)/2*100) }
  })
  const weeklyAvg = weeklyScores.length ? Math.round(weeklyScores.reduce((a,s) => a+s.score, 0) / weeklyScores.length) : 0

  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate()
  const thisMonth   = now.getFullYear()+'-'+pad2(now.getMonth()+1)
  const monthDays   = Array.from({length:daysInMonth}, (_,i) => {
    const d = thisMonth+'-'+pad2(i+1)
    const hLog = logs[d]||{}; const tLog = taskLogs[d]||[]
    const dayT = tasks.filter(t => t.date === d)
    const hP = habits.length ? habits.filter(h => hLog[h.id]).length / habits.length * 100 : 0
    const tP = dayT.length   ? tLog.filter(id => dayT.find(t => t.id===id)).length / dayT.length * 100 : 0
    return { day:i+1, date:d, score:Math.round((hP+tP)/2) }
  })
  const activeDays  = monthDays.filter(d => d.score > 0).length
  const monthAvg    = activeDays ? Math.round(monthDays.filter(d => d.score>0).reduce((a,d) => a+d.score, 0) / activeDays) : 0
  const bestStreak  = (() => { let max=0,cur=0; monthDays.forEach(d => { if(d.score>=50){cur++;max=Math.max(max,cur)}else cur=0 }); return max })()
  const currentStreak = (() => {
    let s=0
    for(let i=0;i<60;i++){
      const d=new Date(); d.setDate(d.getDate()-i)
      const dk=d.toISOString().slice(0,10)
      const hP=habits.length?habits.filter(h=>(logs[dk]||{})[h.id]).length/habits.length:0
      if(hP>=0.5)s++; else if(i>0)break
    }
    return s
  })()

  const h = clock.getHours()
  const greeting = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'

  const S = {
    root:        { minHeight:'100vh', background:'#020817', color:'#e2e8f0', fontFamily:"'DM Sans','Segoe UI',sans-serif", maxWidth:480, margin:'0 auto', padding:'0 0 40px', position:'relative' },
    bgMesh:      { position:'fixed', inset:0, zIndex:0, pointerEvents:'none', background:'radial-gradient(ellipse 80% 60% at 20% -10%,#F5A62320,transparent),radial-gradient(ellipse 60% 50% at 80% 100%,#60A5FA18,transparent)' },
    bgDot:       { position:'fixed', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:'radial-gradient(#ffffff06 1px,transparent 1px)', backgroundSize:'28px 28px' },
    header:      { position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'28px 18px 16px' },
    progressRow: { position:'relative', zIndex:1, display:'flex', gap:6, justifyContent:'center', padding:'4px 14px 18px', flexWrap:'wrap' },
    progressCard:{ background:'rgba(15,23,42,.8)', backdropFilter:'blur(12px)', border:'1px solid #1e293b', borderRadius:14, padding:'14px 10px', display:'flex', flexDirection:'column', alignItems:'center' },
    weekChart:   { position:'relative', zIndex:1, margin:'0 14px 18px', background:'rgba(15,23,42,.8)', backdropFilter:'blur(12px)', border:'1px solid #1e293b', borderRadius:14, padding:'14px' },
    tabs:        { position:'relative', zIndex:1, display:'flex', gap:4, padding:'0 14px', marginBottom:14 },
    tabBtn:      { flex:1, padding:'9px 4px', borderRadius:11, border:'1px solid #1e293b', background:'transparent', color:'#64748b', fontSize:11, fontWeight:600, cursor:'pointer', letterSpacing:.3 },
    section:     { position:'relative', zIndex:1, margin:'0 14px' },
    secTitle:    { fontSize:10, fontWeight:700, color:'#64748b', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 },
    taskRow:     { display:'flex', alignItems:'center', gap:9, background:'rgba(15,23,42,.85)', border:'1px solid #1e293b', borderRadius:11, padding:'11px 12px', marginBottom:7 },
    check:       { width:22, height:22, borderRadius:6, border:'1.5px solid #334155', background:'transparent', color:GREEN, cursor:'pointer', fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 },
    checkDone:   { background:GREEN+'33', border:'1.5px solid '+GREEN },
    delBtn:      { background:'transparent', border:'none', color:'#475569', fontSize:17, cursor:'pointer', lineHeight:1, padding:'0 2px', flexShrink:0 },
    habitChip:   { padding:'7px 12px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', letterSpacing:.2 },
    habitRow:    { display:'flex', alignItems:'center', gap:11, background:'rgba(15,23,42,.85)', border:'1px solid #1e293b', borderRadius:13, padding:'13px', marginBottom:9 },
    addBtn:      { background:ACCENT+'22', border:'1px solid '+ACCENT+'55', color:ACCENT, fontSize:10, fontWeight:700, padding:'5px 11px', borderRadius:20, cursor:'pointer', letterSpacing:.5, flexShrink:0 },
    addForm:     { background:'#0f172a', border:'1px solid #1e293b', borderRadius:12, padding:12, marginBottom:12, display:'flex', flexWrap:'wrap', gap:7, alignItems:'center' },
    input:       { background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#e2e8f0', padding:'8px 11px', fontSize:13, outline:'none' },
    select:      { background:'#1e293b', border:'1px solid #334155', borderRadius:8, color:'#e2e8f0', padding:'8px 9px', fontSize:12, outline:'none' },
    confirmBtn:  { background:'linear-gradient(135deg,'+ACCENT+',#F97316)', border:'none', borderRadius:8, color:'#000', fontWeight:700, fontSize:13, padding:'8px 14px', cursor:'pointer', flexShrink:0 },
    empty:       { color:'#475569', fontSize:13, textAlign:'center', padding:'18px 0' },
  }

  const tabActive = { background:'linear-gradient(135deg,#F5A62322,#60A5FA11)', border:'1px solid '+ACCENT+'55', color:'#f1f5f9' }

  return (
    <div style={S.root}>
      <div style={S.bgMesh} />
      <div style={S.bgDot}  />

      {/* Header */}
      <header style={S.header}>
        <div>
          <div style={{ fontSize:21, fontWeight:700, color:'#f1f5f9', fontFamily:"'DM Serif Display',serif" }}>{greeting} 👋</div>
          <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
            {DAYS_PT[now.getDay()]}, {now.getDate()} de {MONTHS_PT[now.getMonth()]} · {pad2(clock.getHours())}:{pad2(clock.getMinutes())}:{pad2(clock.getSeconds())}
          </div>
        </div>
        <div style={{ background:'linear-gradient(135deg,#f59e0b22,#f5a62344)', border:'1px solid #f5a62355', color:ACCENT, fontSize:11, fontWeight:700, padding:'6px 12px', borderRadius:20 }}>
          🔥 {currentStreak} dias
        </div>
      </header>

      {/* Progress Circles */}
      <div style={S.progressRow}>
        {[
          { pct:dailyPct,      color:ACCENT,  label:'Hoje',    sub:'geral'  },
          { pct:habitPctToday, color:GREEN,   label:'Hábitos', sub:'hoje'   },
          { pct:taskPctToday,  color:BLUE,    label:'Tarefas', sub:'hoje'   },
          { pct:weeklyAvg,     color:PURPLE,  label:'Semana',  sub:'média'  },
        ].map(p => (
          <div key={p.label} style={S.progressCard}>
            <CircleProgress {...p} size={82} />
          </div>
        ))}
      </div>

      {/* Weekly Bar Chart */}
      <div style={S.weekChart}>
        <div style={S.secTitle}>Progresso Semanal</div>
        <div style={{ display:'flex', gap:5, alignItems:'flex-end', height:60 }}>
          {weeklyScores.map(({date, score}) => (
            <div key={date} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
              <div style={{ fontSize:9, color:score>0?ACCENT:'#475569', fontWeight:700 }}>{score>0?score+'%':''}</div>
              <div style={{
                width:'100%', borderRadius:4,
                height:Math.max(4, score*.52),
                background: date===today ? 'linear-gradient(to top,'+ACCENT+','+ACCENT+'88)'
                  : score>=70 ? 'linear-gradient(to top,'+GREEN+'99,'+GREEN+'44)'
                  : score>=40 ? 'linear-gradient(to top,'+BLUE+'88,'+BLUE+'33)'
                  : '#1e293b',
                transition:'height .4s ease'
              }} />
              <div style={{ fontSize:9, color:date===today?'#f1f5f9':'#64748b', fontWeight:date===today?700:400 }}>
                {weekLabel(date)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={S.tabs}>
        {[['hoje','📋 Hoje'],['habitos','🔄 Hábitos'],['relatorio','📊 Mês']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{...S.tabBtn,...(tab===k?tabActive:{})}}>{l}</button>
        ))}
      </div>

      {/* TAB: HOJE */}
      {tab==='hoje' && (
        <div style={S.section}>
          <div style={{...S.secTitle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>Tarefas de Hoje</span>
            <button onClick={() => setSAT(v => !v)} style={S.addBtn}>+ Adicionar</button>
          </div>
          {showAddTask && (
            <div style={S.addForm}>
              <input placeholder="Título da tarefa..." value={newTask.title}
                onChange={e => setNewTask(p => ({...p, title:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && addTask()}
                style={{...S.input, flex:1}} autoFocus />
              <select value={newTask.priority} onChange={e => setNewTask(p => ({...p, priority:e.target.value}))} style={S.select}>
                <option value="alta">🔴 Alta</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
              <button onClick={addTask} style={S.confirmBtn}>✓</button>
            </div>
          )}
          {todayTasks.length===0 && <div style={S.empty}>Nenhuma tarefa. Adicione uma! 🎯</div>}
          {todayTasks.map(task => {
            const done = doneTodayIds.includes(task.id)
            const pColor = task.priority==='alta'?RED:task.priority==='media'?ACCENT:GREEN
            return (
              <div key={task.id} style={{...S.taskRow, opacity:done?.5:1}}>
                <button onClick={() => toggleTask(task.id)} style={{...S.check,...(done?S.checkDone:{})}}>{done&&'✓'}</button>
                <span style={{ flex:1, textDecoration:done?'line-through':'none', color:done?'#64748b':'#e2e8f0', fontSize:13 }}>{task.title}</span>
                <span style={{ width:7, height:7, borderRadius:'50%', background:pColor, display:'inline-block', flexShrink:0 }} />
                <span style={{ background:pColor+'22', color:pColor, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:20, textTransform:'uppercase', flexShrink:0 }}>{task.priority}</span>
                <button onClick={() => deleteTask(task.id)} style={S.delBtn}>×</button>
              </div>
            )
          })}

          <div style={{...S.secTitle, marginTop:22}}>Hábitos de Hoje</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {habits.map(h => {
              const done = !!todayLog[h.id]
              return (
                <button key={h.id} onClick={() => toggleHabit(h.id)} style={{
                  ...S.habitChip,
                  background:done?h.color+'33':'#0f172a',
                  border:'1.5px solid '+(done?h.color:'#334155'),
                  color:done?h.color:'#94a3b8',
                  boxShadow:done?'0 0 10px '+h.color+'44':'none'
                }}>
                  {h.icon} {h.name} {done&&'✓'}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB: HÁBITOS */}
      {tab==='habitos' && (
        <div style={S.section}>
          <div style={{...S.secTitle, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <span>Gerenciar Hábitos</span>
            <button onClick={() => setSAH(v => !v)} style={S.addBtn}>+ Novo</button>
          </div>
          {showAddHabit && (
            <div style={S.addForm}>
              <input placeholder="Nome do hábito..." value={newHabit.name}
                onChange={e => setNewHabit(p => ({...p, name:e.target.value}))}
                onKeyDown={e => e.key==='Enter' && addHabit()}
                style={{...S.input, flex:1}} autoFocus />
              <input placeholder="Emoji" value={newHabit.icon}
                onChange={e => setNewHabit(p => ({...p, icon:e.target.value}))}
                style={{...S.input, width:56}} maxLength={4} />
              <button onClick={addHabit} style={S.confirmBtn}>✓</button>
            </div>
          )}
          {habits.map(h => {
            const streak7 = last7.filter(d => (logs[d]||{})[h.id]).length
            const pct7 = Math.round(streak7/7*100)
            return (
              <div key={h.id} style={S.habitRow}>
                <div style={{ fontSize:22, flexShrink:0 }}>{h.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#f1f5f9', fontWeight:600, fontSize:14 }}>{h.name}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                    <div style={{ flex:1, height:4, borderRadius:2, background:'#1e293b', overflow:'hidden' }}>
                      <div style={{ width:pct7+'%', height:'100%', background:h.color, borderRadius:2, transition:'width .5s' }} />
                    </div>
                    <span style={{ fontSize:10, color:h.color, fontWeight:700 }}>{pct7}%</span>
                  </div>
                  <div style={{ display:'flex', gap:3, marginTop:6 }}>
                    {last7.map(d => (
                      <div key={d} style={{
                        width:20, height:20, borderRadius:4,
                        background:(logs[d]||{})[h.id]?h.color:'#1e293b',
                        border:'1px solid '+((logs[d]||{})[h.id]?h.color:'#334155'),
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:8, color:'#94a3b8'
                      }}>{weekLabel(d).split('/')[0]}</div>
                    ))}
                  </div>
                </div>
                <button onClick={() => toggleHabit(h.id)} style={{...S.check,...(todayLog[h.id]?S.checkDone:{}),flexShrink:0}}>
                  {todayLog[h.id]&&'✓'}
                </button>
                <button onClick={() => deleteHabit(h.id)} style={S.delBtn}>×</button>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB: RELATÓRIO */}
      {tab==='relatorio' && (
        <div style={S.section}>
          <div style={S.secTitle}>{MONTHS_PT[now.getMonth()]} {now.getFullYear()}</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
            {[
              { label:'Dias ativos',      value:activeDays,     unit:'dias',         color:GREEN  },
              { label:'Média geral',      value:monthAvg+'%',   unit:'este mês',     color:ACCENT },
              { label:'Melhor sequência', value:bestStreak+'d', unit:'seguidos',     color:PURPLE },
              { label:'Hábitos',          value:habits.length,  unit:'cadastrados',  color:BLUE   },
            ].map(({label,value,unit,color}) => (
              <div key={label} style={{ background:'#0f172a', border:'1px solid '+color+'33', borderRadius:14, padding:'14px' }}>
                <div style={{ fontSize:24, fontWeight:800, color, fontFamily:"'DM Serif Display',serif" }}>{value}</div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>{label}</div>
                <div style={{ fontSize:10, color:'#475569' }}>{unit}</div>
              </div>
            ))}
          </div>

          <div style={S.secTitle}>Mapa do Mês</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3, marginBottom:16 }}>
            {DAYS_PT.map(d => <div key={d} style={{ fontSize:8, color:'#475569', textAlign:'center', paddingBottom:2 }}>{d}</div>)}
            {Array.from({length:new Date(now.getFullYear(),now.getMonth(),1).getDay()}, (_,i) => <div key={'off'+i} />)}
            {monthDays.map(({day,date,score}) => {
              const fut = date > today
              const bg  = fut?'#0f172a':score>=80?GREEN:score>=50?ACCENT:score>=20?BLUE+'99':score>0?RED+'88':'#1e293b'
              return (
                <div key={day} title={day+': '+score+'%'} style={{
                  aspectRatio:'1', borderRadius:5, background:bg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:8, color:fut?'#334155':'#0f172a', fontWeight:700,
                  opacity:fut?.3:1,
                  border:date===today?'2px solid '+ACCENT:'none'
                }}>{day}</div>
              )
            })}
          </div>

          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
            {[[GREEN,'≥80%'],[ACCENT,'50–79%'],[BLUE+'99','20–49%'],[RED+'88','<20%'],['#1e293b','Sem dados']].map(([c,l]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:10, height:10, borderRadius:2, background:c }} />
                <span style={{ fontSize:10, color:'#64748b' }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={S.secTitle}>Hábitos no Mês</div>
          {habits.map(h => {
            const completed = monthDays.filter(({date}) => (logs[date]||{})[h.id]).length
            const pct = Math.round(completed/daysInMonth*100)
            return (
              <div key={h.id} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, color:'#cbd5e1' }}>{h.icon} {h.name}</span>
                  <span style={{ fontSize:11, color:h.color, fontWeight:700 }}>{completed}/{daysInMonth}d · {pct}%</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'#1e293b', overflow:'hidden' }}>
                  <div style={{ width:pct+'%', height:'100%', background:'linear-gradient(to right,'+h.color+'88,'+h.color+')', transition:'width .6s', borderRadius:3 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ height:40 }} />
    </div>
  )
}
