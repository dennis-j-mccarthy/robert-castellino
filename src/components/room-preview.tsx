"use client";

import { useState } from "react";

/**
 * To-scale "view on a wall" preview.
 *
 * The trick: each room declares the real-world size (in inches) of the wall
 * it shows, and a reference object at its true size (an 84" sofa, etc.). The
 * scene is a container-query context, so 1 inch === (100 / room.realW) cqw.
 * Everything — the print, its frame, the furniture — is sized in those units,
 * which means the print is rendered at an accurate fraction of the room and
 * scales correctly on any screen, no JS measurement needed.
 */

type Room = {
  key: string;
  label: string;
  realW: number; // inches of wall shown, horizontally
  realH: number; // inches shown, vertically
  wall: string; // CSS background for the wall
  floor: string; // CSS background for the floor band
  floorIn: number; // height of the floor band, in inches
  artFromFloor: number; // inches from floor to the CENTER of the artwork
  ref: { kind: "sofa" | "console" | "bench"; wIn: number; hIn: number; tint: string };
};

const ROOMS: Room[] = [
  {
    key: "living",
    label: "Living room",
    realW: 156,
    realH: 100,
    wall: "radial-gradient(120% 90% at 50% 18%, #under, #shade), linear-gradient(180deg, #e9e2d4, #d8cfbd)"
      .replace("#under", "rgba(255,250,240,0.55)")
      .replace("#shade", "rgba(120,108,90,0.18)"),
    floor: "linear-gradient(180deg, #b08a5e, #8a6a44)",
    floorIn: 15,
    artFromFloor: 62,
    ref: { kind: "sofa", wIn: 84, hIn: 31, tint: "#6f7a72" },
  },
  {
    key: "hall",
    label: "Hallway",
    realW: 116,
    realH: 110,
    wall: "radial-gradient(120% 80% at 50% 14%, rgba(245,247,250,0.5), rgba(70,78,90,0.20)), linear-gradient(180deg, #cfd4da, #b9c0c8)",
    floor: "linear-gradient(180deg, #4d4540, #36302c)",
    floorIn: 12,
    artFromFloor: 64,
    ref: { kind: "console", wIn: 48, hIn: 31, tint: "#2c2723" },
  },
  {
    key: "gallery",
    label: "Gallery",
    realW: 170,
    realH: 108,
    wall: "radial-gradient(110% 85% at 50% 16%, rgba(255,255,255,0.7), rgba(200,198,193,0.25)), linear-gradient(180deg, #f1efea, #e3e0d9)",
    floor: "linear-gradient(180deg, #cfcabf, #b7b1a4)",
    floorIn: 16,
    artFromFloor: 60,
    ref: { kind: "bench", wIn: 56, hIn: 17, tint: "#3a352f" },
  },
];

type Frame = {
  key: string;
  label: string;
  color: string;
  frameIn: number;
  matIn: number;
  matColor?: string;
};

const FRAMES: Frame[] = [
  { key: "black", label: "Black", color: "#14110d", frameIn: 2, matIn: 0 },
  { key: "oak", label: "Oak", color: "#b88a4e", frameIn: 2, matIn: 0 },
  { key: "white", label: "White", color: "#edeae3", frameIn: 2, matIn: 0 },
  { key: "mat", label: "Mat", color: "#16130f", frameIn: 1.2, matIn: 3, matColor: "#f4f2ec" },
];

function Furniture({ room, u }: { room: Room; u: number }) {
  const { ref } = room;
  const common: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: `${room.floorIn * u}cqw`,
    width: `${ref.wIn * u}cqw`,
    height: `${ref.hIn * u}cqw`,
    "--tint": ref.tint,
  } as React.CSSProperties;

  return <div className={`rp-furn rp-furn--${ref.kind}`} style={common} aria-hidden="true" />;
}

export function RoomPreview({
  img,
  alt,
  wIn,
  hIn,
}: {
  img: string;
  alt: string;
  wIn: number;
  hIn: number;
}) {
  const [roomKey, setRoomKey] = useState(ROOMS[0].key);
  const [frameKey, setFrameKey] = useState(FRAMES[0].key);

  const room = ROOMS.find((r) => r.key === roomKey) ?? ROOMS[0];
  const frame = FRAMES.find((f) => f.key === frameKey) ?? FRAMES[0];
  const u = 100 / room.realW; // cqw per inch

  const pad = frame.frameIn + frame.matIn;
  const totalW = wIn + 2 * pad;
  const totalH = hIn + 2 * pad;

  return (
    <div className="rp">
      <div
        className="rp-scene"
        style={{
          aspectRatio: `${room.realW} / ${room.realH}`,
          background: room.wall,
        }}
      >
        {/* floor band */}
        <div
          className="rp-floor"
          style={{ height: `${room.floorIn * u}cqw`, background: room.floor }}
        />
        {/* baseboard line where wall meets floor */}
        <div className="rp-baseboard" style={{ bottom: `${room.floorIn * u}cqw`, height: `${4 * u}cqw` }} />

        <Furniture room={room} u={u} />

        {/* the print, centered on the wall above the reference object */}
        <div
          className="rp-art"
          style={{
            width: `${totalW * u}cqw`,
            height: `${totalH * u}cqw`,
            bottom: `${(room.floorIn + room.artFromFloor - totalH / 2) * u}cqw`,
          }}
        >
          <div
            className="rp-frame"
            style={{ background: frame.color, padding: `${frame.frameIn * u}cqw` }}
          >
            <div
              className="rp-mat"
              style={{
                background: frame.matColor ?? "transparent",
                padding: `${frame.matIn * u}cqw`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={alt} />
            </div>
          </div>
        </div>
      </div>

      <div className="rp-controls">
        <div className="rp-row" role="group" aria-label="Room">
          {ROOMS.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`rp-chip ${r.key === roomKey ? "is-active" : ""}`}
              onClick={() => setRoomKey(r.key)}
              aria-pressed={r.key === roomKey}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="rp-row" role="group" aria-label="Frame">
          {FRAMES.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`rp-swatch ${f.key === frameKey ? "is-active" : ""}`}
              onClick={() => setFrameKey(f.key)}
              aria-pressed={f.key === frameKey}
              title={`${f.label} frame`}
            >
              <span
                className="rp-swatch-dot"
                style={{
                  background:
                    f.key === "mat"
                      ? `linear-gradient(135deg, ${f.matColor} 55%, ${f.color} 55%)`
                      : f.color,
                }}
              />
              {f.label}
            </button>
          ))}
        </div>
        <p className="rp-scalenote">
          Shown to scale beside an {room.ref.wIn}″ {room.ref.kind}.
        </p>
      </div>
    </div>
  );
}
