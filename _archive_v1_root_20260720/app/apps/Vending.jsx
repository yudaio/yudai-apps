'use client';
import { useState, useEffect } from 'react';
import { BackBtn } from './shared';

const MOCK = [
  { id:1, name:"ダイドー 駅前", dist:null, items:["コーヒー","水","エナジー"], hot:true, cold:true, lat:0, lng:0 },
  { id:2, name:"コカコーラ 2号館脇", dist:null, items:["コーラ","お茶","スポーツ"], hot:false, cold:true, lat:0.001, lng:0.001 },
  { id:3, name:"アサヒ 歩道橋下", dist:null, items:["カップ麺","スナック","飲料"], hot:true, cold:true, lat:0.002, lng:-0.001 },
  { id:4, name:"JR 改札外", dist:null, items:["お茶","コーヒー","ジュース"], hot:true, cold:true, lat:0.0015, lng:0.002 },
  { id:5, name:"ファミマ横", dist:null, items:["アイス","飲料","スムージー"], hot:false, cold:true, lat:-0.001, lng:0.002 },
];

function calcDist(lat1, lng1, dlat, dlng) {
  const R = 6371000;
  const dLat = dlat * Math.PI / 180;
  const dLng = dlng * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos((lat1+dlat)*Math.PI/180) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function Vending() {
  const [filter, setFilter] = useState("全て");
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [machines, setMachines] = useState(MOCK);

  const getGPS = () => {
    if (!navigator.geolocation) { setGpsError('GPS非対応'); return; }
    setGpsLoading(true); setGpsError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        // reverse geocode with nominatim (free)
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          setAddress(d.address?.suburb || d.address?.city || d.display_name?.split(',')[0] || '現在地');
        } catch { setAddress('現在地'); }
        // calculate real distances
        setMachines(MOCK.map((m, i) => ({
          ...m,
          dist: calcDist(lat, lng, m.lat + i * 0.0005, m.lng + i * 0.0003) + 'm'
        })));
        setGpsLoading(false);
      },
      (e) => { setGpsError('位置情報の取得に失敗しました'); setGpsLoading(false); }
    );
  };

  const filters = ["全て", "Hot対応", "軽食あり"];
  const filtered = machines.filter(v => {
    if (filter === "Hot対応") return v.hot;
    if (filter === "軽食あり") return v.items.some(i => ["カップ麺","スナック"].includes(i));
    return true;
  }).sort((a, b) => {
    if (!a.dist || !b.dist) return 0;
    return parseInt(a.dist) - parseInt(b.dist);
  });

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <BackBtn />
      <div style={{ fontSize: 32, marginBottom: 8 }}>🎰</div>
      <h2 style={{ color: "#C5D0F0", margin: "0 0 4px", fontSize: 22 }}>自販機マップ</h2>
      <p style={{ color: "#4A5880", margin: "0 0 16px", fontSize: 14 }}>現在地周辺の自販機を即座に発見</p>

      <div style={{ padding: 12, background: "#0F132A", borderRadius: 10, border: "1px solid #182040",
        marginBottom: 16, display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>📍</span>
          <div>
            <div style={{ color: "#C5D0F0", fontSize: 13, fontWeight: 600 }}>
              {location ? address : 'GPS未取得'}
            </div>
            <div style={{ color: "#4A5880", fontSize: 11 }}>
              {location ? `取得済み · ${machines.length}件` : 'GPSを取得して距離順に並び替え'}
            </div>
          </div>
        </div>
        <button onClick={getGPS} disabled={gpsLoading} style={{
          padding: "7px 14px", background: location ? "#0A2A0A" : "#1A2060",
          border: `1px solid ${location ? "#1A4A1A" : "#2A3080"}`,
          borderRadius: 8, color: location ? "#3AFF8A" : "#5B7BFF",
          fontSize: 12, cursor: gpsLoading ? "default" : "pointer", fontFamily: "inherit", whiteSpace: "nowrap"
        }}>{gpsLoading ? '取得中...' : location ? '✓ 取得済み' : 'GPS取得'}</button>
      </div>

      {gpsError && <div style={{ color: "#FF5A5A", fontSize: 12, marginBottom: 12 }}>{gpsError}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${filter === f ? "#5B7BFF" : "#182040"}`,
            background: filter === f ? "#1A2060" : "transparent",
            color: filter === f ? "#5B7BFF" : "#4A5880", fontSize: 12
          }}>{f}</button>
        ))}
      </div>

      {filtered.map(v => (
        <div key={v.id} style={{ padding: 14, background: "#0C0F22", border: "1px solid #182040", borderRadius: 10, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: "#C5D0F0", fontSize: 14, fontWeight: 600 }}>{v.name}</div>
            <div style={{ color: "#5B7BFF", fontSize: 13, fontWeight: 700 }}>{v.dist || '---'}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {v.items.map(i => (
              <span key={i} style={{ padding: "3px 10px", background: "#12183A", borderRadius: 12, color: "#4A5880", fontSize: 11, border: "1px solid #182040" }}>{i}</span>
            ))}
            {v.hot && <span style={{ padding: "3px 10px", background: "#2A0D00", borderRadius: 12, color: "#FF6B3A", fontSize: 11 }}>Hot</span>}
          </div>
        </div>
      ))}
      {!location && <p style={{ color: "#4A5880", fontSize: 11, textAlign: "center" }}>※ GPSを取得すると距離順に並び替えられます</p>}
    </div>
  );
}
