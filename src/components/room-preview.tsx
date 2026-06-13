"use client";

/**
 * To-scale "view on a wall" preview, over real room photos.
 *
 * Each room photo is calibrated once (by compositing test prints and eyeing
 * the result): `wallRealWidthIn` is how many real inches the full image width
 * spans at the art wall, and `ax`/`ay` mark where art centers on that wall.
 * The print is then sized as printIn / wallRealWidthIn of the image width, so
 * it renders to honest scale and stays correct at any display size.
 *
 * The room is fixed by the selected print size — one room per size, from an
 * intimate hallway for the smallest to a great room for the largest.
 */

type Room = {
  key: string;
  label: string;
  src: string;
  ar: string; // CSS aspect-ratio of the photo, "w / h"
  wallRealWidthIn: number;
  ax: number; // art center X, fraction of image width
  ay: number; // art center Y, fraction of image height
  dim?: number; // optional brightness multiplier on the print, to match ambient light
};

const ROOMS: Room[] = [
  { key: "hallway", label: "Hallway", src: "/assets/rooms/hallway.jpg", ar: "1500 / 861", wallRealWidthIn: 175, ax: 0.52, ay: 0.42, dim: 0.72 },
  { key: "kitchen", label: "Kitchen", src: "/assets/rooms/kitchen.jpg", ar: "1500 / 858", wallRealWidthIn: 145, ax: 0.53, ay: 0.4, dim: 0.72 },
  { key: "bedroom", label: "Bedroom", src: "/assets/rooms/bedroom.jpg", ar: "1500 / 867", wallRealWidthIn: 177, ax: 0.56, ay: 0.45, dim: 0.72 },
  { key: "living", label: "Living room", src: "/assets/rooms/living.jpg", ar: "1500 / 876", wallRealWidthIn: 190, ax: 0.56, ay: 0.33, dim: 0.72 },
  { key: "greatroom", label: "Great room", src: "/assets/rooms/greatroom.jpg", ar: "1500 / 864", wallRealWidthIn: 205, ax: 0.52, ay: 0.35, dim: 0.6 },
];

/** Each print size shows in exactly one room — smallest in the hallway, up to
 *  the great room for the largest. Keyed off the longest edge in inches. */
function roomKeyForSize(wIn: number, hIn: number): string {
  const longest = Math.max(wIn, hIn);
  if (longest <= 10) return "hallway";
  if (longest <= 12) return "kitchen";
  if (longest <= 24) return "bedroom";
  if (longest <= 36) return "living";
  return "greatroom";
}

// Every print is shown in a white-mat frame (thin dark moulding + wide mat).
const FRAME = { color: "#16130f", frameIn: 1.2, matIn: 3, matColor: "#f4f2ec" };

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
  // The room is fixed by the selected size — one room per size.
  const roomKey = roomKeyForSize(wIn, hIn);
  const room = ROOMS.find((r) => r.key === roomKey) ?? ROOMS[2];
  const frame = FRAME;

  // The great-room print is shown in a wide landscape (3:2) crop to suit the
  // large landscape photographs; other rooms use the print's own ratio.
  const renderHIn = room.key === "greatroom" ? wIn / 1.5 : hIn;

  const pad = frame.frameIn + frame.matIn;
  const totalW = wIn + 2 * pad;
  const totalH = renderHIn + 2 * pad;

  // Sizing/placement, all as fractions of the photo (which scales responsively).
  const widthPct = (totalW / room.wallRealWidthIn) * 100;
  const framePadPct = (frame.frameIn / totalW) * 100;
  const matPadPct = (frame.matIn / totalW) * 100;

  return (
    <div className="rp">
      <div className="rp-scene" style={{ aspectRatio: room.ar }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="rp-wall" src={room.src} alt={`${room.label} interior`} />

        <div
          className="rp-art"
          style={{
            left: `${room.ax * 100}%`,
            top: `${room.ay * 100}%`,
            width: `${widthPct}%`,
            aspectRatio: `${totalW} / ${totalH}`,
            filter: room.dim ? `brightness(${room.dim})` : undefined,
          }}
        >
          <div
            className="rp-frame"
            style={{ background: frame.color, padding: `${framePadPct}%` }}
          >
            <div
              className="rp-mat"
              style={{
                background: frame.matColor ?? "transparent",
                padding: `${matPadPct}%`,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={alt} />
            </div>
          </div>
        </div>
      </div>

      <div className="rp-controls">
        <p className="rp-scalenote">
          Shown to scale on the wall of a {room.label.toLowerCase()} · museum mat &amp; frame.
        </p>
      </div>
    </div>
  );
}
