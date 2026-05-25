import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const INITIAL_CASH = 200_000_000;

export function useTradeStore() {
  const [portfolio, setPortfolio] = useState({
    cash: INITIAL_CASH,
    positions: [], 
    navHistory: [{ t: new Date().toLocaleTimeString(), nav: INITIAL_CASH }],
  });

  const [securities, setSecurities] = useState({});
  const [orders, setOrders] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [period, setPeriod] = useState({ start: '', end: '' }); // 新增：交易期間

  const currentNAV = useMemo(() => {
    let mv = 0;
    portfolio.positions.forEach(p => {
      const currentPrice = securities[p.symbol]?.price || p.avgPrice;
      mv += currentPrice * p.qty;
    });
    return portfolio.cash + mv;
  }, [portfolio, securities]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase.from('securities').select('*');
        if (error) throw error;
        const secMap = {};
        data.forEach(item => {
          secMap[item.symbol] = { ...item, price: +item.price, changeRate: ((+item.price - +item.base) / +item.base) * 100 };
        });
        setSecurities(secMap);
      } catch (err) {
        setSecurities({
          '0050.TW': { name: '元大台灣50', price: 150.5, changeRate: 1.2, type: 'etf' },
          '2330.TW': { name: '台積電', price: 850.0, changeRate: 2.1, type: 'stock' }
        });
      }
    }
    fetchData();
  }, []);

  const addToast = (msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // 下單並直接成交 (移除風控審核)
  const submitOrder = (orderData) => {
    // 檢查是否在交易期間內
    if (period.start && period.end) {
      const now = new Date();
      const start = new Date(period.start + 'T00:00:00');
      const end = new Date(period.end + 'T23:59:59');
      if (now < start || now > end) {
        return addToast('目前不在設定的模擬交易期間內，無法下單', 'danger');
      }
    }

    const cost = orderData.price * orderData.qty;
    let success = false;

    setPortfolio(prev => {
      const newPositions = [...prev.positions];
      let newCash = prev.cash;

      if (orderData.side === 'buy') {
        if (newCash < cost) {
          addToast('現金不足，無法執行買入', 'danger');
          return prev;
        }
        newCash -= cost;
        const existIdx = newPositions.findIndex(p => p.symbol === orderData.symbol);
        if (existIdx >= 0) {
          const ex = newPositions[existIdx];
          ex.avgPrice = ((ex.avgPrice * ex.qty) + cost) / (ex.qty + orderData.qty);
          ex.qty += orderData.qty;
        } else {
          newPositions.push({ symbol: orderData.symbol, qty: orderData.qty, avgPrice: orderData.price });
        }
        success = true;
      } else if (orderData.side === 'sell') {
        const existIdx = newPositions.findIndex(p => p.symbol === orderData.symbol);
        if (existIdx >= 0 && newPositions[existIdx].qty >= orderData.qty) {
          newCash += cost;
          newPositions[existIdx].qty -= orderData.qty;
          if (newPositions[existIdx].qty === 0) newPositions.splice(existIdx, 1);
          success = true;
        } else {
          addToast('持倉數量不足，無法執行賣出', 'danger');
          return prev;
        }
      }

      if (success) {
        // 更新 NAV 歷史紀錄供圖表使用
        const newNav = newCash + newPositions.reduce((sum, p) => sum + (securities[p.symbol]?.price || p.avgPrice) * p.qty, 0);
        return { 
          ...prev, 
          cash: newCash, 
          positions: newPositions,
          navHistory: [...prev.navHistory, { t: new Date().toLocaleTimeString(), nav: newNav }]
        };
      }
      return prev;
    });

    if (success) {
      const newOrder = { ...orderData, id: Date.now().toString(), status: 'executed', time: new Date().toLocaleString() };
      setOrders(prev => [newOrder, ...prev]);
      addToast(`交易成功：${orderData.symbol} ${orderData.side === 'buy' ? '買入' : '賣出'}`, 'success');
    }
  };

  // 新增：強制重置沙盒
  const resetSandbox = () => {
    if(window.confirm('確定要清除所有交易紀錄與持倉，重新開始嗎？')) {
      setPortfolio({ cash: INITIAL_CASH, positions: [], navHistory: [{ t: new Date().toLocaleTimeString(), nav: INITIAL_CASH }] });
      setOrders([]);
      addToast('系統已重置', 'info');
    }
  };

  return {
    portfolio, currentNAV, securities, orders, toasts, period, 
    setPeriod, submitOrder, addToast, resetSandbox
  };
}