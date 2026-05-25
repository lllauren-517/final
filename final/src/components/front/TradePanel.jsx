// src/components/front/TradePanel.jsx
import React, { useState } from 'react';

export default function TradePanel({ portfolio, currentNAV, securities, submitOrder }) {
  const [side, setSide] = useState('buy');
  const [selectedSymbol, setSelectedSymbol] = useState('');
  const [qty, setQty] = useState(1000);

  const handleOrderSubmit = () => {
    if (!selectedSymbol || qty <= 0) return alert('請選擇商品並輸入有效數量');
    
    const price = securities[selectedSymbol].price;
    submitOrder({
      symbol: selectedSymbol,
      qty: Number(qty),
      side,
      price,
      amount: price * qty
    });
    
    setSelectedSymbol(''); // 送出後重置
  };

  const currentPrice = selectedSymbol ? securities[selectedSymbol]?.price : null;
  const estAmount = currentPrice ? currentPrice * qty : 0;

  return (
    <div className="panel active">
      {/* NAV 概況區塊 */}
      <div className="metric-row">
        <div className="metric">
          <div className="metric-label">投資組合 NAV</div>
          <div className="metric-val neutral">${currentNAV.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="metric-sub" style={{ color: currentNAV >= 200000000 ? 'var(--green)' : 'var(--red)' }}>
            {(((currentNAV - 200_000_000) / 200_000_000) * 100).toFixed(2)}%
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">現金剩餘</div>
          <div className="metric-val neutral">${portfolio.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="metric-sub">可用購買力</div>
        </div>
      </div>

      {/* 報價清單 */}
      <div className="card">
        <div className="card-header"><span className="card-title">市場報價</span></div>
        <div>
          {Object.entries(securities).map(([sym, data]) => {
            const isUp = data.changeRate >= 0;
            return (
              <div key={sym} className="ticker-row" onClick={() => setSelectedSymbol(sym)}>
                <div className="ticker-left">
                  <div className="ticker-sym">{sym} <span className="badge" style={{fontSize:'9px', padding:'2px 4px'}}>{data.type==='etf'?'ETF':'個股'}</span></div>
                  <div className="ticker-name">{data.name}</div>
                </div>
                <div className="ticker-right">
                  <div className="ticker-price" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>{data.price.toFixed(2)}</div>
                  <div className="ticker-chg" style={{ color: isUp ? 'var(--green)' : 'var(--red)' }}>
                    {isUp ? '▲' : '▼'} {Math.abs(data.changeRate).toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 下單表單 */}
      <div className="card">
        <div className="card-header"><span className="card-title">建立交易計畫書 (下單)</span></div>
        <div className="card-body">
          <div className="dir-toggle">
            <div className={`dir-btn ${side === 'buy' ? 'active-buy' : ''}`} onClick={() => setSide('buy')}>▲ 買入</div>
            <div className={`dir-btn ${side === 'sell' ? 'active-sell' : ''}`} onClick={() => setSide('sell')}>▼ 賣出</div>
          </div>

          <div className="form-row">
            <label className="form-label">選擇商品</label>
            <select value={selectedSymbol} onChange={(e) => setSelectedSymbol(e.target.value)}>
              <option value="">— 請選擇 —</option>
              {Object.entries(securities).map(([sym, data]) => (
                <option key={sym} value={sym}>{sym} - {data.name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label">數量 (股)</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div className="form-label">參考報價</div>
              <input type="text" readOnly value={currentPrice ? currentPrice.toFixed(2) : '—'} />
            </div>
            <div>
              <div className="form-label">預估金額</div>
              <input type="text" readOnly style={{ color: 'var(--teal)', fontFamily: 'var(--mono)' }} 
                     value={estAmount > 0 ? `$${estAmount.toLocaleString()}` : '—'} />
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={handleOrderSubmit}>確認下單並結算 →</button>
        </div>
      </div>
    </div>
  );
}