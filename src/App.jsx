import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

const C = {
  bg: "#0D0D0F", surface: "#141417", card: "#1A1A1F",
  border: "#2A2A32", borderLight: "#333340", text: "#F0F0F5",
  muted: "#6B6B7A", dim: "#3A3A45", green: "#00D68F",
  blue: "#3B82F6", purple: "#8B5CF6", gold: "#F59E0B",
  red: "#EF4444", orange: "#F97316",
};

const TIER_COLOR = (rank) => rank <= 10 ? C.green : rank <= 30 ? C.blue : C.purple;
const GRADE_COLOR = (grade) => {
  if (!grade) return C.muted;
  if (grade.startsWith("A")) return C.green;
  if (grade.startsWith("B")) return C.blue;
  if (grade.startsWith("C")) return C.gold;
  return C.red;
};
const scoreToGrade = (score) => {
  if (score >= 90) return { label: "A+", color: C.green };
  if (score >= 80) return { label: "A",  color: C.green };
  if (score >= 70) return { label: "A-", color: C.green };
  if (score >= 60) return { label: "B+", color: C.blue };
  if (score >= 50) return { label: "B",  color: C.blue };
  if (score >= 40) return { label: "B-", color: C.blue };
  if (score >= 30) return { label: "C+", color: C.gold };
  if (score >= 20) return { label: "C",  color: C.gold };
  if (score >= 10) return { label: "D",  color: C.orange };
  return { label: "F", color: C.red };
};

const StatBar = ({ label, value, max = 100, color }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
      <span style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{value ?? "—"}</span>
    </div>
    <div style={{ height: 4, background: C.dim, borderRadius: 2 }}>
      <div style={{ height: "100%", borderRadius: 2, background: color || C.green, width: `${Math.min(((value ?? 0) / max) * 100, 100)}%`, transition: "width 0.4s ease" }} />
    </div>
  </div>
);

const GradeTag = ({ label, grade }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 8px", textAlign: "center", flex: 1 }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 900, color: grade?.color || C.muted, fontFamily: "monospace" }}>{grade?.label || "—"}</div>
  </div>
);

const StatCell = ({ label, value, highlight }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 700, color: highlight || C.text }}>{value ?? "—"}</div>
  </div>
);

const RAPMBar = ({ label, value }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
    <span style={{ fontSize: 10, color: C.muted, width: 80, textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, height: 5, background: C.dim, borderRadius: 3 }}>
      <div style={{ height: "100%", borderRadius: 3, background: value >= 70 ? C.green : value >= 50 ? C.blue : value >= 30 ? C.gold : C.red, width: `${value ?? 0}%`, transition: "width 0.4s ease" }} />
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, width: 28, textAlign: "right", color: value >= 70 ? C.green : value >= 50 ? C.blue : value >= 30 ? C.gold : C.red }}>{value ?? "—"}</span>
  </div>
);

const ShotBar = ({ label, value, color }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
    <div style={{ height: 60, background: C.dim, borderRadius: 4, display: "flex", alignItems: "flex-end" }}>
      <div style={{ width: "100%", background: color, borderRadius: 4, height: `${(value ?? 0) * 100}%`, transition: "height 0.4s ease", minHeight: 2 }} />
    </div>
    <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginTop: 5 }}>
      {value != null ? `${(value * 100).toFixed(0)}%` : "—"}
    </div>
  </div>
);

const TabBtn = ({ active, onClick, children, color }) => (
  <button onClick={onClick} style={{
    padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    background: active ? (color || C.green) : C.card,
    color: active ? C.bg : C.muted,
    fontWeight: 600, fontSize: 11, transition: "all 0.15s"
  }}>{children}</button>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const rank = d.nd_rank || d.mock_rank || 99;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.borderLight}`, borderRadius: 10, padding: "12px 16px", minWidth: 200, boxShadow: "0 16px 32px rgba(0,0,0,0.6)" }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 2 }}>{d.name}</div>
      <div style={{ fontSize: 11, color: TIER_COLOR(rank), marginBottom: 6 }}>#{rank} · {d.role} · {d.team}</div>
      <div style={{ fontSize: 10, color: C.purple, marginBottom: 8, fontWeight: 600 }}>{d.archetype}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
        {[["Gravity", d.scores?.gravity?.toFixed(1)], ["Engine", d.scores?.engine?.toFixed(1)], ["Defense", d.scores?.defense?.toFixed(1)], ["OBPM", d.college_stats?.obpm?.toFixed(1)]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{v ?? "—"}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: C.muted }}>Click to view full profile →</div>
    </div>
  );
};

// ── Prospect Profile Modal ────────────────────────────────────────────
const ProspectProfile = ({ player, prospects, onClose, onSelectPlayer }) => {
  const [statsTab, setStatsTab] = useState("box");
  const rank = player.nd_rank || player.mock_rank || 99;
  const similar = [...prospects]
    .filter(p => p.name !== player.name)
    .map(p => {
      const b1 = player.box_stats || {}, b2 = p.box_stats || {};
      const m1 = player.measurements || {}, m2 = p.measurements || {};
      // archetype match bonus
      const archBonus = p.archetype === player.archetype ? 0 : 15;
      // role match bonus
      const roleBonus = p.role === player.role ? 0 : 10;
      // stat distance
      const statDist = Math.sqrt(
        Math.pow((b2.ppg||0)-(b1.ppg||0),2) * 1.5 +
        Math.pow((b2.rpg||0)-(b1.rpg||0),2) +
        Math.pow((b2.apg||0)-(b1.apg||0),2) +
        Math.pow((b2.spg||0)-(b1.spg||0),2) * 2 +
        Math.pow((b2.bpg||0)-(b1.bpg||0),2) * 2 +
        Math.pow((b2.obpm||0)-(b1.obpm||0),2) * 1.5 +
        Math.pow((b2.ts||0)-(b1.ts||0),2) * 0.1 +
        Math.pow((b2.usg||0)-(b1.usg||0),2) * 0.1
      );
      // measurables distance
      const measDist = Math.sqrt(
        Math.pow(((m2.wingspan_in||78)-(m1.wingspan_in||78))/2, 2) +
        Math.pow(((m2.wingspan_ratio||1.03)-(m1.wingspan_ratio||1.03))*20, 2)
      );
      return { ...p, dist: statDist + measDist + archBonus + roleBonus };
    })
    .sort((a, b) => a.dist - b.dist).slice(0, 4);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", overflowY: "auto", padding: "40px 20px" }} onClick={onClose}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 960, padding: 32, position: "relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", color: C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕ Close</button>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{player.name}</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{player.team} · {player.class} · {player.height} · {player.conf}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <div style={{ background: `${C.purple}15`, border: `1px solid ${C.purple}30`, borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 700, color: C.purple }}>{player.archetype}</div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.muted }}>{player.role}</div>
              {player.measurements?.length_grade && player.measurements.length_grade !== "Unknown" && (
                <div style={{ background: `${C.blue}15`, border: `1px solid ${C.blue}30`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.blue }}>{player.measurements.length_grade} Length</div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {player.nd_rank && (
              <div style={{ background: `${TIER_COLOR(rank)}15`, border: `1px solid ${TIER_COLOR(rank)}40`, color: TIER_COLOR(rank), borderRadius: 10, padding: "10px 16px", fontSize: 18, fontWeight: 900, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>ND RANK</div>#{player.nd_rank}
              </div>
            )}
            {player.nba_threat_prob != null && (
              <div style={{ background: `${C.green}10`, border: `1px solid ${C.green}30`, borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 2 }}>SPACING THREAT</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: C.green }}>{player.nba_threat_prob}%</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* 5 Scores */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Model Scores</div>
              {[["Gravity", player.scores?.gravity, C.green], ["Engine", player.scores?.engine, C.blue], ["Defense", player.scores?.defense, C.red], ["Rebounding", player.scores?.rebounding, C.gold], ["Playmaking", player.scores?.playmaking, C.purple]].map(([label, val, color]) => (
                <StatBar key={label} label={label} value={val?.toFixed(1)} max={100} color={color} />
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                {[["G", player.scores?.gravity], ["E", player.scores?.engine], ["D", player.scores?.defense], ["R", player.scores?.rebounding], ["P", player.scores?.playmaking]].map(([label, val]) => (
                  <GradeTag key={label} label={label} grade={scoreToGrade(val || 0)} />
                ))}
              </div>
            </div>

            {/* Stats Tabs */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <TabBtn active={statsTab === "box"} onClick={() => setStatsTab("box")}>Box Stats</TabBtn>
                <TabBtn active={statsTab === "advanced"} onClick={() => setStatsTab("advanced")} color={C.purple}>Advanced</TabBtn>
              </div>

              {statsTab === "box" && (() => {
                const b = player.box_stats || {};
                const efg = b.efg_pct ?? b.efg;
                const ts  = b.ts;
                return (
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Per Game</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      <StatCell label="PPG"   value={b.ppg?.toFixed(1)}  highlight={b.ppg > 18 ? C.green : C.text} />
                      <StatCell label="RPG"   value={b.rpg?.toFixed(1)} />
                      <StatCell label="APG"   value={b.apg?.toFixed(1)} />
                      <StatCell label="MPG"   value={b.mpg?.toFixed(1)} />
                      <StatCell label="SPG"   value={b.spg?.toFixed(1)}  highlight={b.spg > 1.5 ? C.green : C.text} />
                      <StatCell label="BPG"   value={b.bpg?.toFixed(1)}  highlight={b.bpg > 1.5 ? C.green : C.text} />
                      <StatCell label="TOV"   value={b.topg?.toFixed(1)} />
                      <StatCell label="Games" value={b.games} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Shooting</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                      <StatCell label="FG%"     value={b.fg_pct    != null ? `${b.fg_pct}%`    : null} highlight={b.fg_pct > 50 ? C.green : C.text} />
                      <StatCell label="3P%"     value={b.three_pct != null ? `${b.three_pct}%` : null} highlight={b.three_pct > 37 ? C.green : C.text} />
                      <StatCell label="2P%"     value={b.two_pct   != null ? `${b.two_pct}%`   : null} highlight={b.two_pct > 55 ? C.green : C.text} />
                      <StatCell label="FT%"     value={b.ft_pct    != null ? `${b.ft_pct}%`    : null} highlight={b.ft_pct > 80 ? C.green : C.text} />
                      <StatCell label="eFG%"    value={efg         != null ? `${efg}%`          : null} highlight={efg > 55 ? C.green : C.text} />
                      <StatCell label="TS%"     value={ts          != null ? `${ts}%`           : null} highlight={ts > 58 ? C.green : C.text} />
                      <StatCell label="FT Rate" value={b.ftr       != null ? b.ftr.toFixed(1)   : null} />
                      <StatCell label="OReb%"   value={b.oreb_pct  != null ? b.oreb_pct.toFixed(1) : b.orpg?.toFixed(1)} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Miscellaneous</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                      <StatCell label="ORtg"  value={b.ortg  != null ? b.ortg.toFixed(1)  : null} highlight={b.ortg > 115 ? C.green : C.text} />
                      <StatCell label="DRtg"  value={b.drtg  != null ? b.drtg.toFixed(1)  : null} />
                      <StatCell label="OReb%" value={b.oreb_pct != null ? `${b.oreb_pct.toFixed(1)}%` : null} />
                      <StatCell label="DReb%" value={b.dreb_pct != null ? `${b.dreb_pct.toFixed(1)}%` : null} />
                    </div>
                  </div>
                );
              })()}

              {statsTab === "advanced" && (() => {
                const b = player.box_stats || {};
                return (
                  <div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Box Plus/Minus</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                      <StatCell label="OBPM" value={b.obpm != null ? b.obpm.toFixed(1) : null} highlight={b.obpm > 6 ? C.green : C.text} />
                      <StatCell label="DBPM" value={b.dbpm != null ? b.dbpm.toFixed(1) : null} highlight={b.dbpm > 2 ? C.green : C.text} />
                      <StatCell label="BPM"  value={b.bpm  != null ? b.bpm.toFixed(1)  : null} highlight={b.bpm > 8 ? C.green : C.text} />
                      <StatCell label="PRPG" value={b.prpg != null ? b.prpg.toFixed(1) : null} highlight={C.blue} />
                    </div>
                    <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Playmaking & Defense</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                      <StatCell label="Ast%"  value={b.ast_pct != null ? b.ast_pct.toFixed(1) : null} />
                      <StatCell label="TO%"   value={b.to_pct  != null ? b.to_pct.toFixed(1)  : null} />
                      <StatCell label="A/TO"  value={b.ato     != null ? b.ato.toFixed(2)     : null} highlight={b.ato > 2 ? C.green : C.text} />
                      <StatCell label="Usg%"  value={b.usg     != null ? b.usg.toFixed(1)     : null} />
                      <StatCell label="Blk%"  value={b.blk_pct != null ? b.blk_pct.toFixed(1) : null} highlight={b.blk_pct > 4 ? C.green : C.text} />
                      <StatCell label="Stl%"  value={b.stl_pct != null ? b.stl_pct.toFixed(1) : null} highlight={b.stl_pct > 2.5 ? C.green : C.text} />
                      <StatCell label="NBA Threat" value={player.nba_threat_prob != null ? `${player.nba_threat_prob}%` : null} highlight={C.green} />
                      <StatCell label="Conference" value={player.conf} />
                    </div>
                    {player.rapm?.offensive != null && (
                      <>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>RAPM Percentiles — vs NBA players last college season</div>
                        {[["O-RAPM", player.rapm?.offensive], ["D-RAPM", player.rapm?.defensive], ["Creation", player.rapm?.creation], ["Efficiency", player.rapm?.efficiency], ["Spacing", player.rapm?.spacing], ["Steals", player.rapm?.steals], ["Blocks", player.rapm?.blocks]].filter(([, v]) => v != null).map(([label, val]) => (
                          <RAPMBar key={label} label={label} value={val} />
                        ))}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Scoring Profile */}
            {player.scoring_profile && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Scoring Profile</div>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 14 }}>Estimated play type tendencies from statistical proxies</div>
                {[
                  ["PnR Ball Handler", player.scoring_profile?.pnr,        C.green],
                  ["Transition",       player.scoring_profile?.transition,  C.blue],
                  ["Spot-Up",          player.scoring_profile?.spot_up,     C.purple],
                  ["Post-Up",          player.scoring_profile?.post,        C.gold],
                  ["Isolation",        player.scoring_profile?.iso,         C.orange],
                  ["Cut / Off-Ball",   player.scoring_profile?.cut,         C.red],
                ].filter(([, v]) => v != null).map(([label, val, color]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: C.muted, width: 120, textTransform: "uppercase", letterSpacing: 0.6, flexShrink: 0 }}>{label}</span>
                    <div style={{ flex: 1, height: 6, background: C.dim, borderRadius: 3 }}>
                      <div style={{ height: "100%", borderRadius: 3, background: color, width: `${val}%`, transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, width: 36, textAlign: "right", color }}>{val}%</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Shot Zone Frequency</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {[
                      ["Rim", player.scoring_profile?.rim_freq, C.red],
                      ["Mid-Range", player.scoring_profile?.mid_freq, C.gold],
                      ["3-Point", player.scoring_profile?.three_freq, C.green],
                    ].map(([label, val, color]) => (
                      <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
                        <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color }}>{val != null ? `${val}%` : "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Shot Profile bars */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Shot Profile</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                <ShotBar label="Rim" value={player.shot_profile?.rim_freq} color={C.red} />
                <ShotBar label="Midrange" value={player.shot_profile?.midrange_freq} color={C.gold} />
                <ShotBar label="3-Point" value={player.shot_profile?.three_freq} color={C.green} />
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Physical */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>Physical Profile</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                <StatCell label="Height" value={player.height} />
                <StatCell label="Wingspan" value={player.measurements?.wingspan_in ? `${Math.floor(player.measurements.wingspan_in/12)}'${player.measurements.wingspan_in%12}"` : null} highlight={C.blue} />
                <StatCell label="Weight" value={player.measurements?.weight ? `${player.measurements.weight} lbs` : null} />
                <StatCell label="Standing Reach" value={player.measurements?.standing_reach ? `${player.measurements.standing_reach}"` : null} />
                <StatCell label="Max Vertical" value={player.measurements?.max_vert ? `${player.measurements.max_vert}"` : null} highlight={C.green} />
                <StatCell label="Sprint 3/4" value={player.measurements?.sprint ? `${player.measurements.sprint}s` : null} />
              </div>
              {player.measurements?.wingspan_ratio && (
                <div style={{ marginTop: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>Wingspan/Height Ratio</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: player.measurements.wingspan_ratio >= 1.06 ? C.green : player.measurements.wingspan_ratio >= 1.03 ? C.blue : C.gold }}>{player.measurements.wingspan_ratio?.toFixed(3)}</span>
                </div>
              )}
            </div>

            {/* System Fits */}
            {player.system_fits?.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>System Fit</div>
                {player.system_fits.map((fit, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: i < player.system_fits.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ background: `${GRADE_COLOR(fit.fit_grade)}20`, border: `1px solid ${GRADE_COLOR(fit.fit_grade)}40`, color: GRADE_COLOR(fit.fit_grade), borderRadius: 6, padding: "4px 10px", fontSize: 16, fontWeight: 900, fontFamily: "monospace", minWidth: 40, textAlign: "center", flexShrink: 0 }}>{fit.fit_grade}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{fit.team}</div>
                      <div style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>Pick #{fit.pick} · Round {fit.round}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {fit.fit_reasons?.split(" | ").map((r, j) => (
                          <span key={j} style={{ fontSize: 9, background: C.card, border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 6px", color: C.muted }}>{r}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NBA Comps */}
            {player.nba_comps?.length > 0 && (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>NBA Player Comps</div>
                <div style={{ fontSize: 9, color: C.dim, marginBottom: 12 }}>Sources: NBADraft.net · Bleacher Report · ESPN · CBS Sports</div>
                {player.nba_comps.map((comp, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 0", borderBottom: i < player.nba_comps.length - 1 ? `1px solid ${C.border}` : "none"
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${C.green}30, ${C.blue}30)`,
                      border: `1px solid ${C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, flexShrink: 0
                    }}>🏀</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{comp.player}</div>
                      {comp.reason && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{comp.reason}</div>}
                      <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{comp.source}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Similar Prospects */}
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Similar Prospects</div>
              <div style={{ fontSize: 9, color: C.dim, marginBottom: 12 }}>Matched by archetype, stats & measurables</div>
              {similar.map((p, i) => (
                <div key={p.name} onClick={() => onSelectPlayer(p.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < similar.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{p.team} · #{p.nd_rank || p.mock_rank}</div>
                    <div style={{ fontSize: 10, color: C.purple }}>{p.archetype}</div>
                    {p.nba_comps?.[0] && <div style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>Comps to: {p.nba_comps[0].player}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    {[["G", p.scores?.gravity, C.green], ["E", p.scores?.engine, C.blue], ["D", p.scores?.defense, C.red]].map(([k, v, c]) => (
                      <div key={k} style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 9, color: C.muted }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v?.toFixed(0)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Prospect Card with mini stats toggle ─────────────────────────────
const ProspectCard = ({ p, onSelect }) => {
  const [cardTab, setCardTab] = useState("scores");
  const rank = p.nd_rank || p.mock_rank || 99;
  const tier = TIER_COLOR(rank);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = tier; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Card Header */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }} onClick={() => onSelect(p.name)}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
          <div style={{ fontSize: 10, color: C.muted }}>{p.team} · {p.height} · {p.class}</div>
        </div>
        <div style={{ background: `${tier}15`, color: tier, borderRadius: 5, padding: "3px 7px", fontSize: 11, fontWeight: 800, height: "fit-content" }}>#{rank}</div>
      </div>
      <div style={{ fontSize: 9, color: C.purple, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }} onClick={() => onSelect(p.name)}>{p.archetype}</div>

      {/* Mini Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {[["scores", "Scores"], ["stats", "Stats"]].map(([t, l]) => (
          <button key={t} onClick={(e) => { e.stopPropagation(); setCardTab(t); }} style={{
            padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer",
            background: cardTab === t ? C.green : C.dim,
            color: cardTab === t ? C.bg : C.muted,
            fontSize: 9, fontWeight: 600
          }}>{l}</button>
        ))}
      </div>

      {/* Scores view */}
      {cardTab === "scores" && (
        <div onClick={() => onSelect(p.name)}>
          {[["G", p.scores?.gravity, C.green], ["E", p.scores?.engine, C.blue], ["D", p.scores?.defense, C.red], ["R", p.scores?.rebounding, C.gold], ["P", p.scores?.playmaking, C.purple]].map(([k, v, c]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: C.muted, width: 10 }}>{k}</span>
              <div style={{ flex: 1, height: 3, background: C.dim, borderRadius: 2 }}>
                <div style={{ height: "100%", borderRadius: 2, background: c, width: `${v || 0}%` }} />
              </div>
              <span style={{ fontSize: 9, color: c, width: 24, textAlign: "right" }}>{v?.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats view */}
      {cardTab === "stats" && (() => {
        const b = p.box_stats || {};
        return (
          <div onClick={() => onSelect(p.name)} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              ["PPG", b.ppg?.toFixed(1), b.ppg > 18 ? C.green : C.text],
              ["RPG", b.rpg?.toFixed(1), C.text],
              ["APG", b.apg?.toFixed(1), C.text],
              ["FG%", b.fg_pct != null ? `${b.fg_pct}%` : null, C.text],
              ["3P%", b.three_pct != null ? `${b.three_pct}%` : null, b.three_pct > 37 ? C.green : C.text],
              ["BPM", b.bpm?.toFixed(1), b.bpm > 8 ? C.green : C.text],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: C.card, borderRadius: 6, padding: "6px 8px" }}>
                <div style={{ fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: color || C.text }}>{val ?? "—"}</div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Tags */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }} onClick={() => onSelect(p.name)}>
        {p.measurements?.length_grade && p.measurements.length_grade !== "Unknown" && (
          <div style={{ fontSize: 8, background: `${C.blue}15`, color: C.blue, borderRadius: 3, padding: "2px 5px" }}>{p.measurements.length_grade}</div>
        )}
        {p.nba_threat_prob != null && (
          <div style={{ fontSize: 8, background: `${C.green}15`, color: C.green, borderRadius: 3, padding: "2px 5px" }}>{p.nba_threat_prob}% threat</div>
        )}
        {p.system_fits?.[0]?.fit_grade && (
          <div style={{ fontSize: 8, background: `${GRADE_COLOR(p.system_fits[0].fit_grade)}15`, color: GRADE_COLOR(p.system_fits[0].fit_grade), borderRadius: 3, padding: "2px 5px" }}>{p.system_fits[0].fit_grade} fit</div>
        )}
      </div>
    </div>
  );
};

// ── Main App ──────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("home");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [xAxis, setXAxis] = useState("gravity");
  const [yAxis, setYAxis] = useState("engine");

  useEffect(() => {
    fetch("/data/gravity_scouting_2026.json")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setSelectedTeam(d.teams?.find(t => t.first_pick === 1)?.name || d.teams?.[0]?.name);
      });
  }, []);

  const prospects = data?.prospects || [];
  const teams = data?.teams || [];

  const filtered = useMemo(() => prospects.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase());
    const rank = p.nd_rank || p.mock_rank || 99;
    const mt = tierFilter === "all" || (tierFilter === "top10" && rank <= 10) || (tierFilter === "top30" && rank > 10 && rank <= 30) || (tierFilter === "pick60" && rank > 30);
    return ms && mt;
  }), [prospects, search, tierFilter]);

  const player = selectedPlayer ? prospects.find(p => p.name === selectedPlayer) : null;
  const teamObj = teams.find(t => t.name === selectedTeam);
  const teamFits = (teamObj?.best_fits || []).map(f => ({ ...f, prospect: prospects.find(p => p.name_clean === f.name_clean) || {} })).filter(f => f.prospect?.name);

  const axisKeys = { gravity: p => p.scores?.gravity, engine: p => p.scores?.engine, defense: p => p.scores?.defense, rebounding: p => p.scores?.rebounding, playmaking: p => p.scores?.playmaking };
  const axisLabels = { gravity: "Gravity Score", engine: "Engine Score", defense: "Defense Score", rebounding: "Rebounding Score", playmaking: "Playmaking Score" };

  if (!data) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: C.muted, fontSize: 14 }}>Loading Gravity Scouting...</div>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {player && <ProspectProfile player={player} prospects={prospects} onClose={() => setSelectedPlayer(null)} onSelectPlayer={name => setSelectedPlayer(name)} />}

      {/* Nav */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => setTab("home")}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: `linear-gradient(135deg, ${C.green}, ${C.blue})` }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>GRAVITY SCOUTING</span>
          <span style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 8px", fontSize: 10, color: C.muted, fontWeight: 600, letterSpacing: 1 }}>2026 DRAFT</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["home","Home"],["matrix","Matrix"],["leaderboard","Leaderboard"],["prospects","Big Board"],["systemfit","System Fit ★"]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", background: tab===t?(t==="systemfit"?C.purple:t==="home"?C.card:C.green):"transparent", color: tab===t?(t==="home"?C.text:C.bg):C.muted, fontWeight: 600, fontSize: 12, transition: "all 0.15s", border: tab===t&&t==="home"?`1px solid ${C.border}`:"1px solid transparent" }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input placeholder="Search prospect or school..." value={search} onChange={e => { setSearch(e.target.value); if(tab==="home") setTab("prospects"); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 12px", color: C.text, fontSize: 12, width: 200, outline: "none" }} />
          {[["all","All"],["top10","Lottery"],["top30","1st Rd"],["pick60","2nd Rd"]].map(([f,l]) => (
            <button key={f} onClick={() => setTierFilter(f)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${tierFilter===f?C.green:C.border}`, background: tierFilter===f?`${C.green}15`:"transparent", color: tierFilter===f?C.green:C.muted, fontWeight: 600, fontSize: 11, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: tab==="home"?0:"24px 32px", maxWidth: tab==="home"?"100%":1600, margin: "0 auto" }}>

        {/* HOME */}
        {tab === "home" && (
          <div>
            <div style={{ padding: "80px 32px 60px", background: `linear-gradient(180deg, ${C.surface} 0%, ${C.bg} 100%)`, borderBottom: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `linear-gradient(135deg, ${C.green}, ${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>◎</div>
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1, marginBottom: 12 }}>Gravity Scouting</div>
              <div style={{ fontSize: 16, color: C.muted, maxWidth: 500, margin: "0 auto 8px" }}>College-to-NBA spacing threat projection. ML-powered draft intelligence for the 2026 class.</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                {[[`AUC ${data.meta?.model_auc}`, C.green], [`${data.meta?.prospects} Prospects`, C.blue], ["5 Model Scores", C.purple], ["30 Team Profiles", C.gold]].map(([label, color]) => (
                  <div key={label} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 20, padding: "6px 16px", fontSize: 12, color, fontWeight: 600 }}>{label}</div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
                <button onClick={() => setTab("matrix")} style={{ background: C.green, color: C.bg, border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Explore Matrix →</button>
                <button onClick={() => setTab("systemfit")} style={{ background: C.card, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>System Fit ★</button>
              </div>
            </div>

            <div style={{ padding: "48px 32px" }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 2, textAlign: "center", marginBottom: 32 }}>Features</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 1200, margin: "0 auto 48px" }}>
                {[{icon:"◉",label:"Matrix",tab:"matrix",color:C.green,desc:"Interactive scatter plot mapping any two of our 5 model scores. Click any prospect to load their full profile."},{icon:"≡",label:"Leaderboard",tab:"leaderboard",color:C.blue,desc:"Ranked leaderboards for Gravity, Engine, and Defense scores across the entire 2026 draft class."},{icon:"⊞",label:"Big Board",tab:"prospects",color:C.purple,desc:"Full draft class browser with 5-score bars, archetype labels, combine measurements, box stats and advanced tabs."},{icon:"★",label:"System Fit",tab:"systemfit",color:C.gold,desc:"Pick any NBA team. See which 2026 prospects fit their system best with A+ to F grades and fit reasoning."}].map(f => (
                  <div key={f.tab} onClick={() => setTab(f.tab)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor=f.color; e.currentTarget.style.transform="translateY(-2px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.transform="translateY(0)"; }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: f.color, marginBottom: 14 }}>{f.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>{f.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ maxWidth: 1200, margin: "0 auto 48px" }}>
                <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 2, textAlign: "center", marginBottom: 32 }}>What Makes This Different</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {[{color:C.green,icon:"🎯",title:"ML Translation Model",desc:`Trained on 345 drafted players matched to NBA outcomes. 0.717 AUC. Predicts probability of becoming a perimeter spacing threat.`},{color:C.purple,icon:"🏀",title:"NBA System Fit Matrix",desc:"Matches prospects to specific NBA team systems using pace, 3PR, rim frequency, assisted rate, positional need, and roster quality."},{color:C.blue,icon:"📐",title:"Confidence Intervals",desc:"Combine wingspan acts as evidence, not override. A 70 defense score with elite wingspan is flagged differently than one with short arms."}].map(f => (
                    <div key={f.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24 }}>
                      <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: f.color, marginBottom: 8 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 2 }}>Top Lottery Prospects</div>
                  <button onClick={() => setTab("prospects")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 14px", color: C.muted, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>View All →</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {[...prospects].sort((a,b) => (a.nd_rank||99)-(b.nd_rank||99)).slice(0,5).map(p => (
                    <ProspectCard key={p.name} p={p} onSelect={name => setSelectedPlayer(name)} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MATRIX */}
        {tab === "matrix" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Prospect Matrix</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Click any dot to open full scouting profile</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["X", xAxis, setXAxis], ["Y", yAxis, setYAxis]].map(([axis, val, setter]) => (
                    <div key={axis} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: C.muted }}>{axis}:</span>
                      <select value={val} onChange={e => setter(e.target.value)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 8px", color: C.text, fontSize: 11, outline: "none", cursor: "pointer" }}>
                        {Object.keys(axisKeys).map(k => <option key={k} value={k}>{axisLabels[k]}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={520}>
                <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 40 }}>
                  <CartesianGrid stroke={C.dim} strokeDasharray="2 4" />
                  <XAxis type="number" dataKey="x" domain={[0,100]} tick={{ fill: C.muted, fontSize: 11 }} label={{ value: axisLabels[xAxis], position: "insideBottom", offset: -30, fill: C.muted, fontSize: 11 }} />
                  <YAxis type="number" dataKey="y" domain={[0,100]} tick={{ fill: C.muted, fontSize: 11 }} label={{ value: axisLabels[yAxis], angle: -90, position: "insideLeft", offset: 15, fill: C.muted, fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} cursor={false} />
                  <Scatter data={filtered.map(p => ({ ...p, x: axisKeys[xAxis](p)||0, y: axisKeys[yAxis](p)||0 }))} onClick={d => setSelectedPlayer(d.name)} cursor="pointer" isAnimationActive={false}>
                    {filtered.map((p, i) => <Cell key={i} fill={TIER_COLOR(p.nd_rank||p.mock_rank||99)} opacity={0.85} r={6} />)}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
                {[["Lottery (1-10)", C.green], ["1st Round (11-30)", C.blue], ["2nd Round (31+)", C.purple]].map(([l,c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                    <span style={{ fontSize: 10, color: C.muted }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, overflowY: "auto", maxHeight: 640 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>2026 Draft Class</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Click any prospect to open profile</div>
              {[...filtered].sort((a,b) => (a.nd_rank||a.mock_rank||99)-(b.nd_rank||b.mock_rank||99)).map(p => {
                const rank = p.nd_rank||p.mock_rank||99;
                return (
                  <div key={p.name} onClick={() => setSelectedPlayer(p.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background=C.card} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: TIER_COLOR(rank), background: `${TIER_COLOR(rank)}15`, borderRadius: 4, padding: "2px 6px", minWidth: 28, textAlign: "center", flexShrink: 0 }}>#{rank}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                      <div style={{ fontSize: 9, color: C.muted }}>{p.team} · {p.archetype}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[["G", p.scores?.gravity, C.green], ["E", p.scores?.engine, C.blue]].map(([k,v,c]) => (
                        <div key={k} style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 8, color: C.muted }}>{k}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: c }}>{v?.toFixed(0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {tab === "leaderboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[["Gravity Leaderboard","gravity","Spacing Threat",C.green],["Engine Leaderboard","engine","Offensive Creator",C.blue],["Defense Leaderboard","defense","Defensive Impact",C.red]].map(([title,key,sub,color]) => (
              <div key={key} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 20 }}>{sub} Rankings</div>
                {[...filtered].sort((a,b) => (b.scores?.[key]||0)-(a.scores?.[key]||0)).slice(0,20).map((p,i) => {
                  const max = Math.max(...filtered.map(x => x.scores?.[key]||0));
                  const rank = p.nd_rank||p.mock_rank||99;
                  return (
                    <div key={p.name} onClick={() => setSelectedPlayer(p.name)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}`, cursor: "pointer" }}>
                      <div style={{ width: 18, fontSize: 10, color: C.muted, textAlign: "center" }}>{i+1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ fontSize: 9, color: C.muted }}>{p.team} · {p.archetype}</div>
                        <div style={{ marginTop: 4, height: 3, background: C.dim, borderRadius: 2 }}>
                          <div style={{ height: "100%", borderRadius: 2, background: color, width: `${((p.scores?.[key]||0)/max)*100}%` }} />
                        </div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color, minWidth: 32, textAlign: "right" }}>{(p.scores?.[key]||0).toFixed(1)}</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: TIER_COLOR(rank), background: `${TIER_COLOR(rank)}15`, borderRadius: 4, padding: "2px 5px", minWidth: 26, textAlign: "center" }}>#{rank}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* BIG BOARD */}
        {tab === "prospects" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[...filtered].sort((a,b) => (a.nd_rank||a.mock_rank||99)-(b.nd_rank||b.mock_rank||99)).map(p => (
              <ProspectCard key={p.name} p={p} onSelect={name => setSelectedPlayer(name)} />
            ))}
          </div>
        )}

        {/* SYSTEM FIT */}
        {tab === "systemfit" && (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Select Team</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>View best fits for each pick</div>
              <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 280px)" }}>
                {[...teams].sort((a,b) => (a.first_pick||99)-(b.first_pick||99)).map(t => (
                  <div key={t.name} onClick={() => setSelectedTeam(t.name)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 8, marginBottom: 4, cursor: "pointer", background: selectedTeam===t.name?`${C.purple}15`:"transparent", border: `1px solid ${selectedTeam===t.name?C.purple:"transparent"}`, transition: "all 0.15s" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: selectedTeam===t.name?C.text:C.muted }}>{t.name}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{t.style_tags?.slice(0,1).join("")}</div>
                    </div>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: 70 }}>
                      {(t.picks||[]).filter(p => p<=30).map(pick => (
                        <div key={pick} style={{ background: `${TIER_COLOR(pick)}20`, color: TIER_COLOR(pick), borderRadius: 4, padding: "1px 5px", fontSize: 9, fontWeight: 700 }}>#{pick}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {teamObj && (
                <>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{teamObj.name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                          {(teamObj.style_tags||[]).map(tag => (
                            <span key={tag} style={{ background: `${C.blue}15`, border: `1px solid ${C.blue}30`, borderRadius: 4, padding: "3px 8px", fontSize: 10, color: C.blue }}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        {[["PACE",teamObj.stats?.pace?.toFixed(1),C.blue],["OFF RTG",teamObj.stats?.off_rating?.toFixed(1),C.green],["DEF RTG",teamObj.stats?.def_rating?.toFixed(1),C.red],["3PR",teamObj.stats?.three_rate!=null?`${(teamObj.stats.three_rate*100).toFixed(0)}%`:"—",C.gold]].map(([label,val,color]) => (
                          <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
                      {[["Guard Need",teamObj.needs?.guard,C.blue],["Wing Need",teamObj.needs?.wing,C.green],["Big Need",teamObj.needs?.big,C.gold]].map(([label,val,color]) => (
                        <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
                          <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>{label}</div>
                          <div style={{ height: 4, background: C.dim, borderRadius: 2, marginBottom: 4 }}>
                            <div style={{ height: "100%", borderRadius: 2, background: color, width: `${val||0}%` }} />
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color }}>{val?.toFixed(0)||"—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Best Available Fits</div>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>Picks: {(teamObj.picks||[]).join(", ")} · Ranked by system fit + BPA · Cohort graded</div>
                    {teamFits.length === 0 ? (
                      <div style={{ color: C.muted, fontSize: 12, textAlign: "center", padding: 40 }}>No fit data for this team's picks</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {teamFits.map((fit, i) => {
                          const p = fit.prospect;
                          const rank = p.nd_rank||p.mock_rank||99;
                          return (
                            <div key={i} onClick={() => setSelectedPlayer(p.name)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, cursor: "pointer", transition: "border-color 0.15s" }} onMouseEnter={e => e.currentTarget.style.borderColor=GRADE_COLOR(fit.fit_grade)} onMouseLeave={e => e.currentTarget.style.borderColor=C.border}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name||fit.Name}</div>
                                  <div style={{ fontSize: 10, color: C.muted }}>{p.team||""} · {fit.Role} · #{rank}</div>
                                  <div style={{ fontSize: 10, color: C.purple, marginTop: 2 }}>{fit.archetype}</div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                  <div style={{ background: `${GRADE_COLOR(fit.fit_grade)}20`, border: `1px solid ${GRADE_COLOR(fit.fit_grade)}40`, color: GRADE_COLOR(fit.fit_grade), borderRadius: 6, padding: "4px 10px", fontSize: 16, fontWeight: 900, fontFamily: "monospace" }}>{fit.fit_grade}</div>
                                  <div style={{ fontSize: 9, color: TIER_COLOR(fit.pick), background: `${TIER_COLOR(fit.pick)}15`, borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>Pick #{fit.pick}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                {[["G",p.scores?.gravity,C.green],["E",p.scores?.engine,C.blue],["D",p.scores?.defense,C.red]].map(([k,v,c]) => (
                                  <div key={k} style={{ textAlign: "center" }}>
                                    <div style={{ fontSize: 8, color: C.muted }}>{k}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{v?.toFixed(0)}</div>
                                  </div>
                                ))}
                                {p.rapm?.offensive != null && (
                                  <>
                                    <div style={{ width: 1, background: C.border }} />
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: 8, color: C.muted }}>OFF</div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: p.rapm.offensive>=70?C.green:C.muted }}>{p.rapm.offensive}</div>
                                    </div>
                                    <div style={{ textAlign: "center" }}>
                                      <div style={{ fontSize: 8, color: C.muted }}>DEF</div>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: p.rapm.defensive>=70?C.green:C.muted }}>{p.rapm.defensive}</div>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {fit.fit_reasons?.split(" | ").map((r,j) => (
                                  <span key={j} style={{ fontSize: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, padding: "2px 5px", color: C.muted }}>{r}</span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {tab !== "home" && (
          <div style={{ marginTop: 40, textAlign: "center", color: C.muted, fontSize: 11, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
            Gravity Scouting · Built by Jesse · Data: Barttorvik + NBADraft.net + DraftBallr + PBPStats · ML Model AUC {data.meta?.model_auc} · 2026 NBA Draft Class
          </div>
        )}
      </div>
    </div>
  );
}
