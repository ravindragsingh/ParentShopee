import { useState } from 'react'
import { formatMoney } from './financeMath.js'

// Price is set in 25-cent steps, so formatMoney's whole-dollar rounding
// would show "$3" for a chosen $2.75 -- show cents here specifically.
function formatPrice(n) {
  return '$' + n.toFixed(2)
}

// Two sliders (price, units sold) against a fixed per-item cost -- revenue,
// cost, and profit update live. Makes "price - cost = profit" tangible
// instead of just stated.
export default function ProfitCalculatorWidget({ config }) {
  const { productEmoji = '🍋', productName = 'item', costPerItem, priceMin, priceMax, defaultPrice, maxUnits, defaultUnits } = config
  const [price, setPrice] = useState(defaultPrice)
  const [units, setUnits] = useState(defaultUnits)

  const revenue = price * units
  const cost = costPerItem * units
  const profit = revenue - cost

  return (
    <div style={{ marginTop: 18, textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 16px 18px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f766e', marginBottom: 12, textAlign: 'center' }}>
        🧪 {productEmoji} Price your {productName}
      </div>

      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
        <span>Price per {productName}</span>
        <span style={{ color: '#0d9488' }}>{formatPrice(price)}</span>
      </label>
      <input
        type="range" min={priceMin} max={priceMax} step={0.25} value={price}
        onChange={e => setPrice(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488', marginBottom: 14 }}
      />

      <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
        <span>Sold today</span>
        <span style={{ color: '#0d9488' }}>{units}</span>
      </label>
      <input
        type="range" min={0} max={maxUnits} value={units}
        onChange={e => setUnits(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#0d9488' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 8 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Revenue</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>{formatMoney(revenue)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Cost</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626' }}>-{formatMoney(cost)}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>Profit</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: profit >= 0 ? '#16a34a' : '#dc2626' }}>{formatMoney(profit)}</div>
        </div>
      </div>

      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 10, textAlign: 'center' }}>
        Price too low and you lose money on costs. Price too high and fewer people may buy.
      </div>
    </div>
  )
}
