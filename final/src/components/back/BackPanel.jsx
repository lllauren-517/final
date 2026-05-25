import React from 'react';
// 【新增】引入 BarElement 來支援長條圖
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend } from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// 【新增】記得把 BarElement 註冊進去
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, BarElement, Tooltip, Legend);

// 🛡️ 超級防護牆 ErrorBoundary
class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '20px', borderRadius: '8px', border: '1px dashed #f87171', fontSize: '13px' }}>
          <strong>圖表載入失敗：</strong><br />
          {this.state.errorMsg}<br /><br />
          <span style={{ color: 'var(--text2)' }}>（但不影響其他系統功能運作）</span>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BackPanel({ 
  portfolio, 
  currentNAV, 
  securities, 
  orders, 
  period, 
  setPeriod, 
  resetSandbox 
}) {
  
  // ── 資料安全防護 ──
  const safePositions = portfolio?.positions || [];
  const safeNavHistory = portfolio?.navHistory || [{ t: '開始', nav: 200000000 }];
  const safeOrders = orders || [];
  const safeCash = portfolio?.cash ?? 200000000;
  const safeNAV = typeof currentNAV === 'number' && !isNaN(currentNAV) ? currentNAV : 200000000;
  
  const totalReturn = (((safeNAV - 200_000_000) / 200_000_000) * 100).toFixed(2);
  
  // ── 圖表 1：NAV 走勢圖資料 (Line) ──
  const lineChartData = {
    labels: safeNavHistory.map(h => h?.t || '未知時間'),
    datasets: [{
      label: 'NAV 淨值',
      data: safeNavHistory.map(h => h?.nav || 200000000),
      borderColor: '#60a5fa',
      borderWidth: 2,
      tension: 0.1,
      pointRadius: 3
    }]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { 
      y: { grid: { color: 'rgba(255,255,255,0.05)' } }, 
      x: { grid: { display: false } } 
    },
    plugins: { legend: { display: false } }
  };

  // ── 圖表 2：資產圓餅圖資料 (Doughnut) ──
  const assetLabels = ['現金', ...safePositions.map(p => p?.symbol || '未知')];
  const assetData = [
    safeCash, 
    ...safePositions.map(p => {
      const price = (securities && securities[p?.symbol]?.price) || p?.avgPrice || 0;
      return price * (p?.qty || 0);
    })
  ];
  const bgColors = ['#222839', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];

  const doughnutData = {
    labels: assetLabels,
    datasets: [{ data: assetData, backgroundColor: bgColors, borderColor: '#12151c', borderWidth: 2 }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { color: '#8892a4', font: { size: 10 } } } }
  };

  // ── 圖表 3：各標的成交金額長條圖 (Bar) ──
  const symbolAmounts = {};
  safeOrders.forEach(o => {
    const sym = o?.symbol || '未知';
    const amt = (o?.price || 0) * (o?.qty || 0);
    if (!symbolAmounts[sym]) symbolAmounts[sym] = 0;
    symbolAmounts[sym] += amt;
  });

  const barChartData = {
    labels: Object.keys(symbolAmounts),
    datasets: [{
      label: '累計成交金額 (元)',
      data: Object.values(symbolAmounts),
      backgroundColor: 'rgba(52, 211, 153, 0.7)', // 帶透明度的綠色
      borderColor: '#34d399',
      borderWidth: 1,
      borderRadius: 4 // 讓長條圖頂部圓角，更有質感
    }]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } }, // 隱藏標籤以節省空間
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' } },
      x: { grid: { display: false } }
    }
  };

  // ── 匯出 CSV ──
  const exportCSV = () => {
    if (safeOrders.length === 0) return alert('目前無交易紀錄可匯出');
    const headers = ['時間', '商品代號', '方向', '數量(股)', '成交價', '總金額'];
    const rows = safeOrders.map(o => [
      o?.time || '', o?.symbol || '', o?.side === 'buy' ? '買入' : '賣出', 
      o?.qty || 0, o?.price || 0, Math.round((o?.price || 0) * (o?.qty || 0))
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `SimTrade_Report_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  return (
    <div className="panel active">
      
      {/* 區塊 1：模擬交易期間設定 */}
      <div className="card">
        <div className="card-header"><span className="card-title">📅 模擬交易期間設定</span></div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label className="form-label">開始日期</label>
            <input type="date" value={period?.start || ''} onChange={(e) => setPeriod({...period, start: e.target.value})} />
          </div>
          <div>
            <label className="form-label">結束日期</label>
            <input type="date" value={period?.end || ''} onChange={(e) => setPeriod({...period, end: e.target.value})} />
          </div>
        </div>
      </div>

      {/* 區塊 2：圖表分析區 */}
      <div className="card">
        <div className="card-header"><span className="card-title">📊 投資組合分析</span></div>
        <div className="card-body">
          <div className="metric-row">
            <div className="metric">
              <div className="metric-label">累計報酬率</div>
              <div className="metric-val" style={{ color: safeNAV >= 200000000 ? 'var(--green)' : 'var(--red)' }}>
                {safeNAV >= 200000000 ? '+' : ''}{totalReturn}%
              </div>
            </div>
            <div className="metric">
              <div className="metric-label">總交易筆數</div>
              <div className="metric-val neutral">{safeOrders.length} 筆</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '16px' }}>
            
            {/* 折線圖 */}
            <div style={{ flex: '2 1 300px', background: 'var(--bg3)', padding: '12px', borderRadius: '8px' }}>
              <div className="form-label" style={{ textAlign: 'center', marginBottom: '8px' }}>NAV 淨值走勢</div>
              <div style={{ height: '220px', position: 'relative' }}>
                <ChartErrorBoundary>
                  <Line data={lineChartData} options={lineChartOptions} />
                </ChartErrorBoundary>
              </div>
            </div>
            
            {/* 圓餅圖 */}
            <div style={{ flex: '1 1 200px', background: 'var(--bg3)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="form-label" style={{ textAlign: 'center', marginBottom: '8px' }}>資產配置佔比</div>
              <div style={{ height: '200px', width: '100%', position: 'relative' }}>
                <ChartErrorBoundary>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </ChartErrorBoundary>
              </div>
            </div>

            {/* 【新增】長條圖 */}
            <div style={{ flex: '1 1 100%', background: 'var(--bg3)', padding: '12px', borderRadius: '8px' }}>
              <div className="form-label" style={{ textAlign: 'center', marginBottom: '8px' }}>各標的累計成交金額</div>
              <div style={{ height: '200px', position: 'relative' }}>
                <ChartErrorBoundary>
                  <Bar data={barChartData} options={barChartOptions} />
                </ChartErrorBoundary>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 區塊 3：資料匯出與系統重置 */}
      <div className="card">
        <div className="card-header"><span className="card-title">⚙️ 系統與資料管理</span></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={exportCSV}>📄 匯出 CSV</button>
            <button className="btn btn-danger" style={{ flex: 1 }} onClick={resetSandbox}>⚠ 強制重新開始</button>
          </div>

          <h4 style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>最近交易紀錄</h4>
          {safeOrders.length === 0 ? <div className="empty-state">尚無成交紀錄</div> :
            safeOrders.slice(0, 5).map((o, index) => (
              <div key={o?.id || index} className="order-item" style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '12px' }}>
                <span style={{ color: 'var(--text2)', display: 'block', marginBottom: '4px', fontSize: '11px' }}>{o?.time || ''}</span>
                <span style={{ margin: '0 8px 0 0', color: o?.side === 'buy' ? 'var(--green)' : 'var(--red)' }}>{o?.side === 'buy' ? '買入' : '賣出'}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{o?.symbol || ''}</span>
                <span style={{ float: 'right' }}>{o?.qty || 0} 股 @ {(o?.price || 0).toFixed(2)}</span>
              </div>
            ))
          }
        </div>
      </div>

    </div>
  );
}