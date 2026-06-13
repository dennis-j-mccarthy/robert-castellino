"use client";

import { useState } from "react";

/**
 * To-scale "view on a wall" preview.
 *
 * Each room declares the real-world size (inches) of the wall it shows plus a
 * reference object at its true size. The scene is a container-query context,
 * so 1 inch === (100 / room.realW) cqw and everything — print, frame,
 * furniture — is sized in those units. The print therefore renders at an
 * accurate fraction of the room and scales correctly on any screen.
 *
 * The room also AUTO-MATCHES the chosen print size (small → intimate space,
 * large → den) so each size is shown in a space it actually suits. The viewer
 * can still override the room manually; the override resets when the size
 * changes.
 */

type FurnKind = "counter" | "console" | "sofa" | "sectional";

type Room = {
  key: string;
  label: string;
  realW: number; // inches of wall shown, horizontally
  realH: number; // inches shown, vertically
  wall: string;
  floor: string;
  floorIn: number;
  artFromFloor: number; // inches from floor to the CENTER of the artwork
  ref: { kind: FurnKind; wIn: number; hIn: number; noun: string; tint: string };
};

const ROOMS: Room[] = [
  {
    key: "kitchen",
    label: "Kitchen",
    realW: 104,
    realH: 92,
    wall: "radial-gradient(120% 90% at 50% 16%, rgba(255,250,242,0.55), rgba(120,108,90,0.16)), linear-gradient(180deg, #e7ded0, #d6ccb9)",
    floor: "linear-gradient(180deg, #9a7e57, #7c6242)",
    floorIn: 6,
    artFromFloor: 66,
    ref: { kind: "counter", wIn: 84, hIn: 36, noun: "counter", tint: "#3b3631" },
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
    ref: { kind: "console", wIn: 48, hIn: 31, noun: "console", tint: "#2c2723" },
  },
  {
    key: "living",
    label: "Living room",
    realW: 156,
    realH: 100,
    wall: "radial-gradient(120% 90% at 50% 18%, rgba(255,250,240,0.55), rgba(120,108,90,0.18)), linear-gradient(180deg, #e9e2d4, #d8cfbd)",
    floor: "linear-gradient(180deg, #b08a5e, #8a6a44)",
    floorIn: 15,
    artFromFloor: 62,
    ref: { kind: "sofa", wIn: 84, hIn: 31, noun: "sofa", tint: "#6f7a72" },
  },
  {
    key: "den",
    label: "Den",
    realW: 204,
    realH: 114,
    wall: "radial-gradient(120% 90% at 50% 16%, rgba(255,247,235,0.5), rgba(60,50,40,0.28)), linear-gradient(180deg, #b9ad99, #9c8f78)",
    floor: "linear-gradient(180deg, #7c5c3c, #5d442c)",
    floorIn: 16,
    artFromFloor: 64,
    ref: { kind: "sectional", wIn: 112, hIn: 32, noun: "sectional", tint: "#54504a" },
  },
];

/** Default room for a given print size — small prints in intimate spaces,
 *  large prints in big ones. Keyed off the longest edge in inches. */
function suggestedRoomKey(wIn: number, hIn: number): string {
  const longest = Math.max(wIn, hIn);
  if (longest <= 10) return "kitchen";
  if (longest <= 12) return "hall";
  if (longest <= 24) return "living";
  return "den";
}

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
  const style: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: `${room.floorIn * u}cqw`,
    width: `${ref.wIn * u}cqw`,
    height: `${ref.hIn * u}cqw`,
    "--tint": ref.tint,
  } as React.CSSProperties;

  return <div className={`rp-furn rp-furn--${ref.kind}`} style={style} aria-hidden="true" />;
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
  // Manual room choice is remembered only for the size it was made on, so the
  // room snaps back to the size-appropriate suggestion when the size changes.
  const sizeKey = `${wIn}x${hIn}`;
  const suggested = suggestedRoomKey(wIn, hIn);
  const [override, setOverride] = useState<{ sizeKey: string; roomKey: string } | null>(null);
  const roomKey = override && override.sizeKey === sizeKey ? override.roomKey : suggested;

  const [frameKey, setFrameKey] = useState(FRAMES[0].key);

  const room = ROOMS.find((r) => r.key === roomKey) ?? ROOMS[2];
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
        <div
          className="rp-floor"
          style={{ height: `${room.floorIn * u}cqw`, background: room.floor }}
        />
        <div
          className="rp-baseboard"
          style={{ bottom: `${room.floorIn * u}cqw`, height: `${4 * u}cqw` }}
        />

        <Furniture room={room} u={u} />

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
              onClick={() => setOverride({ sizeKey, roomKey: r.key })}
              aria-pressed={r.key === roomKey}
            >
              {r.label}
              {r.key === suggested && <span className="rp-chip-fit"> · fits</span>}
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
          To scale in a {room.label.toLowerCase()}, beside a {room.ref.wIn}″ {room.ref.noun}.
        </p>
      </div>
    </div>
  );
}
