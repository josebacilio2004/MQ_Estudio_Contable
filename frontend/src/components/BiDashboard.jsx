import React, { useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  Users,
  Bot,
  Send,
  FileText,
  ArrowUpRight,
  Activity,
  Sparkles,
  Download,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Inbox,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function BiDashboard({
  clients = [],
  items = [],
  onNavigateToClients,
  onNavigateToAgenda,
  onOpenInboxForClient,
  onOpenSunatLogin,
  onScanAllBuzones,
  isScanningAll = false
}) {
  // 1. Cálculos de Inteligencia de Negocios (BI) para Clientes y Buzón
  const clientStats = useMemo(() => {
    const total = clients.length;
    let withAlerts = 0;
    let totalNotifications = 0;
    let withSunatCreds = 0;

    // Conteo por último dígito del RUC (Cronograma SUNAT)
    const rucDigitGroups = {
      '0': [],
      '1': [],
      '2-3': [],
      '4-5': [],
      '6-7': [],
      '8-9': [],
      'buenos': []
    };

    // Clasificación por régimen tributario estimado
    const regimencount = {
      'MYPE Tributario': 0,
      'Régimen General': 0,
      'Régimen Especial (RER)': 0,
      'Nuevo RUS': 0
    };

    // Alertas por origen / tipo
    const alertTypes = {
      'SIRE': 0,
      'CDT / Facturas': 0,
      'Cobranza / Coactiva': 0,
      'Avisos Informativos': 0
    };

    // Clientes que requieren atención prioritaria
    const highRiskClients = [];

    clients.forEach((c) => {
      const pending = parseInt(c.notificaciones_pendientes, 10) || 0;
      if (pending > 0) {
        withAlerts++;
        totalNotifications += pending;
        highRiskClients.push({
          ...c,
          pending
        });

        // Clasificar tipo de alerta según detalle u origen
        const detalle = (c.detalle_notificacion || '').toUpperCase();
        if (detalle.includes('SIRE') || detalle.includes('COMPRAS') || detalle.includes('VENTAS')) {
          alertTypes['SIRE']++;
        } else if (detalle.includes('COMPROBANTE') || detalle.includes('CDT') || detalle.includes('PAGO')) {
          alertTypes['CDT / Facturas']++;
        } else if (detalle.includes('COACTIVA') || detalle.includes('RESOLUCI') || detalle.includes('ORDEN')) {
          alertTypes['Cobranza / Coactiva']++;
        } else {
          alertTypes['Avisos Informativos']++;
        }
      }

      if (c.sunat_usuario && c.sunat_clave) {
        withSunatCreds++;
      }

      // Analizar último dígito de RUC
      const ruc = (c.ruc || '').trim();
      if (ruc.length === 11) {
        const lastDigit = ruc.slice(-1);
        if (lastDigit === '0') rucDigitGroups['0'].push(c);
        else if (lastDigit === '1') rucDigitGroups['1'].push(c);
        else if (lastDigit === '2' || lastDigit === '3') rucDigitGroups['2-3'].push(c);
        else if (lastDigit === '4' || lastDigit === '5') rucDigitGroups['4-5'].push(c);
        else if (lastDigit === '6' || lastDigit === '7') rucDigitGroups['6-7'].push(c);
        else if (lastDigit === '8' || lastDigit === '9') rucDigitGroups['8-9'].push(c);
      }

      // Estimar o leer régimen (por defecto distribuye para analítica si no está explícito)
      const regimen = c.regimen_tributario || 'MYPE Tributario';
      if (regimencount[regimen] !== undefined) {
        regimencount[regimen]++;
      } else {
        regimencount['MYPE Tributario']++;
      }
    });

    const safePercentage = total > 0 ? Math.round(((total - withAlerts) / total) * 100) : 100;
    const credsPercentage = total > 0 ? Math.round((withSunatCreds / total) * 100) : 0;

    // Ordenar clientes prioritarios por mayor número de alertas
    highRiskClients.sort((a, b) => b.pending - a.pending);

    return {
      total,
      withAlerts,
      cleanClients: total - withAlerts,
      totalNotifications,
      withSunatCreds,
      credsPercentage,
      safePercentage,
      rucDigitGroups,
      regimencount,
      alertTypes,
      highRiskClients
    };
  }, [clients]);

  // 2. Cálculos de Inteligencia Operativa para Tareas / Agenda
  const agendaStats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.is_completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Conteo por categorías / espacios
    const categoryCounts = {};
    items.forEach((item) => {
      const cat = item.category || 'General';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    return {
      total,
      completed,
      pending,
      completionRate,
      categoryCounts
    };
  }, [items]);

  // Descargar Resumen Ejecutivo BI en CSV
  const handleExportBiReport = () => {
    const lines = [
      'REPORTE EJECUTIVO DE BUSINESS INTELLIGENCE - MQ ESTUDIO CONTABLE',
      `Fecha de Generación: ${new Date().toLocaleString('es-PE')}`,
      '',
      '--- RESUMEN EJECUTIVO DE CARTERA ---',
      `Total de Clientes Contribuyentes: ${clientStats.total}`,
      `Clientes al Día (Sin Alertas): ${clientStats.cleanClients} (${clientStats.safePercentage}%)`,
      `Clientes con Alertas / Contingencias: ${clientStats.withAlerts}`,
      `Total de Notificaciones Detectadas en Buzón SOL: ${clientStats.totalNotifications}`,
      `Clientes con Credenciales SOL Configuradas: ${clientStats.withSunatCreds} (${clientStats.credsPercentage}%)`,
      '',
      '--- CLIENTES CON ATENCIÓN PRIORITARIA ---',
      'RUC,Razon Social,Alertas Pendientes,Detalle'
    ];

    clientStats.highRiskClients.forEach((c) => {
      lines.push(`"${c.ruc}","${c.razon_social}",${c.pending},"${c.detalle_notificacion || 'Notificación en Buzón SOL'}"`);
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `reporte_bi_mq_estudio_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header Ejecutivo del Dashboard BI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Business Intelligence (BI) Tributario</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">MQ Suite v1.2</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Panel de Control Ejecutivo y Métricas Clave
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Toma decisiones estratégicas en tiempo real: anticipa contingencias tributarias de SUNAT, monitorea el cronograma mensual de vencimientos y optimiza la productividad del estudio.
          </p>
        </div>

        {/* Acciones Rápidas del Dashboard */}
        <div className="flex flex-wrap items-center gap-2 relative z-10">
          {/* Botón Escanear Todos los Buzones */}
          <button
            onClick={onScanAllBuzones}
            disabled={isScanningAll}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition active:scale-95 disabled:opacity-50"
            title="Escanear masivamente todos los clientes con el robot del servidor"
          >
            {isScanningAll ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Bot className="w-4 h-4 text-purple-200" />
            )}
            <span>{isScanningAll ? 'Escaneando...' : 'Escanear Buzones'}</span>
          </button>

          {/* Botón Exportar Reporte BI */}
          <button
            onClick={handleExportBiReport}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 shadow-sm"
            title="Descargar reporte ejecutivo en formato CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar BI (.csv)</span>
          </button>

          {/* Botón Telegram */}
          <a
            href="https://t.me/mqestudioscontables1_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-semibold transition active:scale-95 shadow-sm"
            title="Abrir bot de Telegram para alertas en vivo"
          >
            <Send className="w-4 h-4 text-sky-400" />
            <span>Alertas Push</span>
          </a>
        </div>
      </div>

      {/* 2. Cuadrícula de KPIs Clave (4 Tarjetas Ejecutivas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Cartera de Clientes */}
        <div 
          onClick={onNavigateToClients}
          className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cartera de Clientes</span>
            <div className="p-2 rounded-2xl bg-blue-500/15 text-blue-400 group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{clientStats.total}</span>
              <span className="text-xs text-blue-400 font-semibold font-mono">Contribuyentes</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Claves SOL listas:</span>
              <span className="font-mono font-bold text-emerald-400">{clientStats.withSunatCreds} ({clientStats.credsPercentage}%)</span>
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${clientStats.credsPercentage}%` }} 
            />
          </div>
        </div>

        {/* KPI 2: Salud Tributaria & Buzón SOL */}
        <div 
          onClick={onNavigateToClients}
          className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Buzón SOL & Riesgo</span>
            <div className={`p-2 rounded-2xl transition group-hover:scale-110 ${
              clientStats.withAlerts > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}>
              {clientStats.withAlerts > 0 ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{clientStats.cleanClients}</span>
              <span className="text-xs text-emerald-400 font-semibold">({clientStats.safePercentage}% al día)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Alertas pendientes:</span>
              <span className={`font-mono font-bold ${clientStats.withAlerts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {clientStats.totalNotifications} en {clientStats.withAlerts} clientes
              </span>
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                clientStats.safePercentage > 80 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${clientStats.safePercentage}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: Cumplimiento de Tareas y Obligaciones */}
        <div 
          onClick={onNavigateToAgenda}
          className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer shadow-lg space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cumplimiento Agenda</span>
            <div className="p-2 rounded-2xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">{agendaStats.completionRate}%</span>
              <span className="text-xs text-indigo-400 font-semibold">Efectividad</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Completadas:</span>
              <span className="font-mono font-bold text-emerald-400">
                {agendaStats.completed} de {agendaStats.total}
              </span>
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${agendaStats.completionRate}%` }} 
            />
          </div>
        </div>

        {/* KPI 4: Automatización y Tiempo Ahorrado */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ahorro Operativo (RPA)</span>
            <div className="p-2 rounded-2xl bg-purple-500/15 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white">~{clientStats.total * 4.5}</span>
              <span className="text-xs text-purple-400 font-semibold">Min / Día ahorrados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>AutoLogin en 0.3s:</span>
              <span className="font-mono font-bold text-purple-300">Activo</span>
            </p>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* 3. Sección Central de Inteligencia: 2 Columnas Estratégicas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Radar de Cronograma SUNAT según Último Dígito de RUC */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Radar de Vencimientos SUNAT (Por Último Dígito de RUC)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Planificación semanal de declaraciones mensuales (DJ Mensual / SIRE) según calendario oficial
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono hidden sm:inline-block">
              Período Actual
            </span>
          </div>

          {/* Gráfico y Clasificación por Dígitos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
            {[
              { label: 'Dígito 0', key: '0', dia: 'Día 15', color: 'from-blue-600 to-indigo-600' },
              { label: 'Dígito 1', key: '1', dia: 'Día 16', color: 'from-blue-600 to-cyan-600' },
              { label: 'Dígitos 2-3', key: '2-3', dia: 'Día 17', color: 'from-indigo-600 to-purple-600' },
              { label: 'Dígitos 4-5', key: '4-5', dia: 'Día 18', color: 'from-purple-600 to-pink-600' },
              { label: 'Dígitos 6-7', key: '6-7', dia: 'Día 19', color: 'from-pink-600 to-rose-600' },
              { label: 'Dígitos 8-9', key: '8-9', dia: 'Día 20', color: 'from-amber-600 to-orange-600' }
            ].map((slot) => {
              const clientsInSlot = clientStats.rucDigitGroups[slot.key] || [];
              const count = clientsInSlot.length;

              return (
                <div
                  key={slot.key}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300">{slot.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{slot.dia}</span>
                  </div>
                  <div>
                    <span className="text-2xl font-black text-white">{count}</span>
                    <span className="text-[10px] text-slate-400 ml-1">contrib.</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full bg-gradient-to-r ${slot.color}`}
                      style={{ width: `${Math.min(count * 25, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sugerencia de Toma de Decisiones */}
          <div className="p-3.5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-blue-300">Recomendación Estratégica BI para el Contador:</p>
              <p className="text-[11px] text-blue-200/90 leading-relaxed">
                Prioriza la revisión del SIRE y compras de los contribuyentes con dígitos <strong>0 y 1</strong> al inicio de la segunda quincena para evitar cuellos de botella y multas por presentación extemporánea.
              </p>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1/3): Distribución por Régimen Tributario */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="space-y-1 border-b border-slate-800 pb-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Régimen Tributario</span>
            </h3>
            <p className="text-xs text-slate-400">
              Composición de la cartera de clientes
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(clientStats.regimencount).map(([regimen, count]) => {
              const pct = clientStats.total > 0 ? Math.round((count / clientStats.total) * 100) : 0;
              return (
                <div key={regimen} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{regimen}</span>
                    <span className="font-mono font-bold text-white">
                      {count} <span className="text-slate-400 text-[10px]">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desglose de Alertas del Buzón */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Naturaleza de Alertas en Buzón
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(clientStats.alertTypes).map(([type, count]) => (
                <div key={type} className="p-2 rounded-xl bg-slate-950 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 truncate">{type}</p>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Matriz de Riesgo Tributario: Clientes con Atención Inmediata */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Matriz de Riesgo: Contribuyentes que Requieren Atención Inmediata</span>
            </h3>
            <p className="text-xs text-slate-400">
              Clientes con notificaciones no leídas en el Buzón Electrónico SOL o casillas electrónicas
            </p>
          </div>
          <button
            onClick={onNavigateToClients}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
          >
            <span>Ver todos los clientes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {clientStats.highRiskClients.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">¡Excelente! Toda la cartera está al día</h4>
            <p className="text-xs text-slate-400 mt-1">
              No hay alertas pendientes en los buzones de SUNAT de tus clientes en este momento.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {clientStats.highRiskClients.slice(0, 5).map((client) => (
              <div
                key={client.id}
                className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/20 hover:border-amber-500/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      {client.ruc}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {client.razon_social}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {client.pending} alerta{client.pending > 1 ? 's' : ''}
                    </span>
                  </div>
                  {client.detalle_notificacion && (
                    <p className="text-[11px] text-amber-200/80 truncate max-w-xl">
                      {client.detalle_notificacion}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenInboxForClient(client)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition"
                    title="Ver los correos del buzón de este cliente"
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Ver Buzón</span>
                  </button>

                  <button
                    onClick={() => onOpenSunatLogin(client)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition"
                    title="Abrir portal oficial con AutoLogin"
                  >
                    <span>Abrir SOL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
