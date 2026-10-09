"use client";

import { forwardRef, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import HL from "@/lib/hairline-kernel";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const {
  Cam, disposer, fit, mk, pointer, poly,
  proj, register, seg, tdone, tset, tval, tween,
} = HL;

const SLIDE = 24, SHELF_Z = [2, 34, 66], BOOKS: any[] = [];
const ROW_W = [
  [4.8, 3.6, 5.6, 4.2, 5.0, 6.0, 4.0, 5.4, 3.8, 5.2, 5.8],
  [5.4, 3.8, 5.0, 5.8, 4.2, 5.2, 3.8, 5.4, 4.6, 5.0],
  [4.4, 5.2, 3.8, 5.6, 4.8, 4.0, 5.4, 4.6, 5.0, 4.0, 5.4],
];
const ROW_H = [
  [22, 25, 20, 26, 24, 21, 25, 23, 26, 22, 24],
  [24, 21, 26, 22, 25, 23, 26, 20, 24, 22],
  [25, 22, 26, 20, 24, 25, 21, 26, 23, 24, 22],
];

if (BOOKS.length === 0) {
  [0, 1, 2].forEach((s) => {
    let x = s === 2 ? -16 : -41;
    ROW_W[s].forEach((w, i) => {
      BOOKS.push({
        id: BOOKS.length,
        s,
        x0: x,
        x1: x + w,
        h: ROW_H[s][i],
        y0: -7,
        y1: 8,
        label: `vol ${s + 1}·${String(i + 1).padStart(2, "0")}`,
      });
      x += w + 0.9;
    });
  });
}

function frame(P: any) {
  const X0 = -46, X1 = 46, Y0 = -10, Y1 = 11;
  const lWall = poly([P(X0 - 4, Y0, 0), P(X0 - 4, Y1, 0), P(X0 - 4, Y1, 98), P(X0 - 4, Y0, 98)]);
  const lFace = poly([P(X0 - 4, Y1, 0), P(X0, Y1, 0), P(X0, Y1, 98), P(X0 - 4, Y1, 98)]);
  const rWall = poly([P(X1, Y0, 0), P(X1 + 4, Y0, 0), P(X1 + 4, Y1, 0), P(X1, Y1, 0)]);
  const rFace = poly([P(X1, Y1, 0), P(X1 + 4, Y1, 0), P(X1 + 4, Y1, 98), P(X1, Y1, 98)]);
  const backWall = poly([P(X0, Y0, 0), P(X1, Y0, 0), P(X1, Y0, 98), P(X0, Y0, 98)]);

  const shelves = [0, 32, 64, 96].map((z) => ({
    top: poly([P(X0 - 4, Y0, z + 2), P(X1 + 4, Y0, z + 2), P(X1 + 4, Y1, z + 2), P(X0 - 4, Y1, z + 2)]),
    lip: poly([P(X0 - 4, Y1, z), P(X1 + 4, Y1, z), P(X1 + 4, Y1, z + 2), P(X0 - 4, Y1, z + 2)]),
  }));

  const hBase = poly([P(26, -3, 2), P(38, -3, 2), P(38, 5, 2), P(26, 5, 2)]);
  const hBaseT = poly([P(26, -3, 4), P(38, -3, 4), P(38, 5, 4), P(26, 5, 4)]);
  const hBaseL = poly([P(26, 5, 2), P(38, 5, 2), P(38, 5, 4), P(26, 5, 4)]);
  const hTop = poly([P(26, -3, 20), P(38, -3, 20), P(38, 5, 20), P(26, 5, 20)]);
  const hGlass = poly([P(28, 1, 4), P(36, 1, 4), P(32, 1, 12)]) + poly([P(32, 1, 12), P(28, 1, 20), P(36, 1, 20)])
    + seg(P(27, 4, 4), P(27, 4, 20)) + seg(P(37, 4, 4), P(37, 4, 20));

  const bPed = poly([P(20, -5, 34), P(36, -5, 34), P(36, 7, 34), P(20, 7, 34)]);
  const bPedT = poly([P(20, -5, 37), P(36, -5, 37), P(36, 7, 37), P(20, 7, 37)]);
  const bPedLip = poly([P(20, 7, 34), P(36, 7, 34), P(36, 7, 37), P(20, 7, 37)]);
  const bBust = seg(P(28, 2, 37), P(28, 2, 42)) + poly([P(22, 1, 46), P(34, 1, 46), P(33, 5, 46), P(23, 5, 46)])
    + poly([P(25, 2, 53), P(31, 2, 53), P(30, 5, 53), P(26, 5, 53)]);

  const oPed = poly([P(-40, -5, 66), P(-26, -5, 66), P(-26, 7, 66), P(-40, 7, 66)]);
  const oPedT = poly([P(-40, -5, 69), P(-26, -5, 69), P(-26, 7, 69), P(-40, 7, 69)]);
  const oPedLip = poly([P(-40, 7, 66), P(-26, 7, 66), P(-26, 7, 69), P(-40, 7, 69)]);
  const oApex = P(-33, 2, 88);
  const obelisk = poly([P(-38, 5, 69), P(-28, 5, 69), oApex]) + poly([P(-28, 5, 69), P(-28, -2, 69), oApex]);

  return { lWall, lFace, rWall, rFace, backWall, shelves, hourglass: { hBase, hBaseT, hBaseL, hTop, hGlass }, bust: { bPed, bPedT, bPedLip, bBust }, obelisk: { oPed, oPedT, oPedLip, obelisk } };
}

function book3D(P: any, b: any, dy: number) {
  const z0 = SHELF_Z[b.s], z1 = z0 + b.h, y0 = b.y0 + dy, y1 = b.y1 + dy;
  const spine = poly([P(b.x0, y1, z0), P(b.x1, y1, z0), P(b.x1, y1, z1), P(b.x0, y1, z1)]);
  const top = poly([P(b.x0, y1, z1), P(b.x1, y1, z1), P(b.x1, y0, z1), P(b.x0, y0, z1)]);
  const leftCover = poly([P(b.x0, y0, z0), P(b.x0, y1, z0), P(b.x0, y1, z1), P(b.x0, y0, z1)]);
  const rightCover = poly([P(b.x1, y0, z0), P(b.x1, y1, z0), P(b.x1, y1, z1), P(b.x1, y0, z1)]);
  const ribs = seg(P(b.x0 + 0.4, y1, z0 + 4), P(b.x1 - 0.4, y1, z0 + 4)) + seg(P(b.x0 + 0.4, y1, z1 - 4), P(b.x1 - 0.4, y1, z1 - 4));
  return { spine, top, leftCover, rightCover, ribs };
}

function mountBookshelf({ stage, svg, read }: any, value: number, play: boolean = false) {
  const bag = disposer();
  let stag = value;
  let autoPlay = play;
  let isHovered = false;

  const C = Cam(45, 0.5, 2.16);
  fit(C, [
    [-50, -11, 0], [50, 12, 0], [-50, -11, 100], [50, 12, 100],
    [-35, 28, 0], [35, 28, 100],
  ], 200, 166);

  const P = proj(C), bk = frame(P), g = mk("g", {}, svg);

  mk("path", { d: bk.backWall, class: "lo" }, g);
  mk("path", { d: bk.lWall, class: "sil" }, g);
  mk("path", { d: bk.lFace, class: "sil" }, g);
  mk("path", { d: bk.rFace, class: "sil" }, g);

  const bookElements: any[] = [];
  [0, 1, 2].forEach((s) => {
    const sh = bk.shelves[s];
    mk("path", { d: sh.top, class: "sil" }, g);
    mk("path", { d: sh.lip, class: "sil" }, g);

    if (s === 0) {
      mk("path", { d: bk.hourglass.hBase, class: "lo" }, g);
      mk("path", { d: bk.hourglass.hBaseT, class: "sil" }, g);
      mk("path", { d: bk.hourglass.hBaseL, class: "sil" }, g);
      mk("path", { d: bk.hourglass.hTop, class: "sil" }, g);
      mk("path", { d: bk.hourglass.hGlass, class: "sil" }, g);
    } else if (s === 1) {
      mk("path", { d: bk.bust.bPed, class: "lo" }, g);
      mk("path", { d: bk.bust.bPedT, class: "sil" }, g);
      mk("path", { d: bk.bust.bPedLip, class: "sil" }, g);
      mk("path", { d: bk.bust.bBust, class: "sil" }, g);
    } else if (s === 2) {
      mk("path", { d: bk.obelisk.oPed, class: "lo" }, g);
      mk("path", { d: bk.obelisk.oPedT, class: "sil" }, g);
      mk("path", { d: bk.obelisk.oPedLip, class: "sil" }, g);
      mk("path", { d: bk.obelisk.obelisk, class: "sil" }, g);
    }

    BOOKS.filter((b) => b.s === s).forEach((b) => {
      const bGrp = mk("g", {}, g);
      const leftCover = mk("path", { class: "lo" }, bGrp);
      const rightCover = mk("path", { class: "lo" }, bGrp);
      const top = mk("path", { class: "sil" }, bGrp);
      const spine = mk("path", { class: "sil" }, bGrp);
      const ribs = mk("path", { class: "nf lo" }, bGrp);
      bookElements[b.id] = { b, spine, top, leftCover, rightCover, ribs, dy: tween(0) };
    });
  });

  mk("path", { d: bk.shelves[3].top, class: "sil" }, g);
  mk("path", { d: bk.shelves[3].lip, class: "sil" }, g);
  bookElements[15]?.ribs.classList.add("hi");

  const centers = BOOKS.map((b) => P((b.x0 + b.x1) / 2, b.y1, SHELF_Z[b.s] + b.h / 2));
  function hit([x, y]: [number, number]) {
    let best = -1, minD = 24;
    centers.forEach((c, i) => { const dist = Math.hypot(x - c[0], y - c[1]); if (dist < minD) { minD = dist; best = i; } });
    return best;
  }

  function draw(id: number, dy: number) {
    const el = bookElements[id];
    if (!el) return;
    const q = book3D(P, el.b, dy);
    el.spine.setAttribute("d", q.spine);
    el.top.setAttribute("d", q.top);
    el.leftCover.setAttribute("d", q.leftCover);
    el.rightCover.setAttribute("d", q.rightCover);
    el.ribs.setAttribute("d", q.ribs);
  }

  let B: any = null;
  let act = -1;
  function setActive(a: number) {
    if (a === act) return;
    const now = performance.now(), from = a >= 0 ? a : act;
    act = a;
    bookElements.forEach((el, i) => {
      const dist = Math.abs(i - from), delay = dist * stag;
      tset(el.dy, a < 0 ? 0 : i === a ? SLIDE : dist === 1 ? SLIDE * 0.6 : dist === 2 ? SLIDE * 0.35 : dist === 3 ? SLIDE * 0.15 : 0, now, delay);
      el.spine.classList.toggle("hi", i === a);
      el.top.classList.toggle("hi", i === a);
      el.leftCover.classList.toggle("hi", i === a);
      el.rightCover.classList.toggle("hi", i === a);
      el.ribs.classList.toggle("hi", i === a || (a < 0 && i === 15));
    });
    read.textContent = a < 0 ? "Library Shelf" : BOOKS[a]?.label || "volume";
    B?.wake();
  }

  let lastAutoChange = 0;
  let autoIndex = 0;

  B = register(stage, (_dt: number, now: number) => {
    let moving = false;
    bookElements.forEach((el, i) => {
      draw(i, tval(el.dy, now));
      if (!tdone(el.dy, now)) moving = true;
    });

    if (autoPlay && !isHovered) {
      if (now - lastAutoChange > 1600) {
        lastAutoChange = now;
        autoIndex = (autoIndex + 4) % BOOKS.length;
        setActive(autoIndex);
      }
      moving = true;
    }

    return moving;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p: [number, number]) => {
      isHovered = true;
      setActive(hit(p));
    },
    leave: () => {
      isHovered = false;
      setActive(-1);
    },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v: number) => { stag = v; },
    setPlay: (p: boolean) => { autoPlay = p; if (p) B.wake(); },
    destroy: bag.dispose,
  };
}

export interface BookshelfProps {
  intensity?: number;
  theme?: "auto" | "light" | "dark";
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  play?: boolean;
  onRead?: (text: string) => void;
}

export const BookshelfFigure = forwardRef<HTMLDivElement, BookshelfProps>(function Bookshelf(
  { intensity = 0.5, theme = "auto", label = "Library Bookshelf", className, style, play = true, onRead, ...rest },
  ref
) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const figureRef = useRef<{ set?: (v: number) => void; setPlay?: (p: boolean) => void; destroy: () => void } | null>(null);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    elRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref as any).current = node;
  }, [ref]);

  useIsoLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    HL.inject(el.getRootNode());

    el.setAttribute("data-hairline", "bookshelf");
    if (theme !== "auto") el.setAttribute("data-hairline-theme", theme);
    el.setAttribute("aria-label", label);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 400 320");
    svg.setAttribute("aria-hidden", "true");
    el.appendChild(svg);

    const readProxy = {
      _val: "",
      get textContent() { return this._val; },
      set textContent(v: string) {
        this._val = v;
        onRead?.(v);
      },
    };

    const paramVal = intensity <= 0.5
      ? intensity / 0.5 * 35
      : 35 + ((intensity - 0.5) / 0.5) * 40;

    const fig = mountBookshelf({ stage: el, svg, read: readProxy }, paramVal, play);
    figureRef.current = fig;

    return () => {
      fig.destroy();
      figureRef.current = null;
      el.innerHTML = "";
    };
  }, []);

  useIsoLayoutEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (theme === "auto") el.removeAttribute("data-hairline-theme");
    else el.setAttribute("data-hairline-theme", theme);

    const paramVal = intensity <= 0.5
      ? intensity / 0.5 * 35
      : 35 + ((intensity - 0.5) / 0.5) * 40;
    figureRef.current?.set?.(paramVal);
    figureRef.current?.setPlay?.(play);
  }, [intensity, theme, play]);

  return (
    <div
      ref={setRef}
      className={className}
      style={{ aspectRatio: "5 / 4", position: "relative", display: "block", ...style }}
      {...rest}
    />
  );
});

export default BookshelfFigure;
