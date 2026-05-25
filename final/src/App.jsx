import React, { useState } from 'react';
import { useTradeStore } from './hooks/useTradeStore';
import TradePanel from './components/front/TradePanel';
import BackPanel from './components/back/BackPanel';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('trade');
  const store = useTradeStore(); // 提取所有共用狀態

  return (
    <div id="app">
      <header id="header">
        <h1><span>Sim</span>Trade 模擬交易平台</h1>
        <div className="hdr-right">
          <div id="price-pill">
             <div id="price-dot" className="live"></div>
             <span>參考報價連線中</span>
          </div>
        </div>
      </header>

      {/* 底部導覽列改為 2 個分頁 */}
      <nav id="tabbar">
        <div className={`tb ${activeTab === 'trade' ? 'active t-trade' : ''}`} onClick={() => setActiveTab('trade')}>
          📊 前台 (交易看盤)
        </div>
        <div className={`tb ${activeTab === 'back' ? 'active t-risk' : ''}`} onClick={() => setActiveTab('back')}>
          🛡️ 中後台 (風控與紀錄)
        </div>
      </nav>

      <div id="content">
        {activeTab === 'trade' && <TradePanel {...store} />}
        {activeTab === 'back' && <BackPanel {...store} />}
      </div>

      {/* Toasts 提示元件 */}
      <div className="toast-area">
        {store.toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}