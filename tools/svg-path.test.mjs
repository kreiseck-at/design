import { describe, it, expect } from "vitest";
import { toOps, opsToSvgPath } from "./svg-path.mjs";

const last = (ops) => ops[ops.length - 1];
const endPoint = (op) => op.slice(-2);

describe("toOps", () => {
  it("resolves relative commands and H/V into absolute L", () => {
    expect(toOps({ tag: "path", attrs: { d: "M14 6l-6 6 6 6" } }, {})).toEqual([["M", 14, 6], ["L", 8, 12], ["L", 14, 18]]);
    expect(toOps({ tag: "path", attrs: { d: "M4 7h16V17" } }, {})).toEqual([["M", 4, 7], ["L", 20, 7], ["L", 20, 17]]);
  });
  it("turns an arc into cubics that end exactly at the arc end point", () => {
    const ops = toOps({ tag: "path", attrs: { d: "M11 6.5a3.5 3.5 0 0 1 5 5" } }, {});
    expect(ops[0]).toEqual(["M", 11, 6.5]);
    expect(ops.slice(1).every((o) => o[0] === "C")).toBe(true);
    expect(endPoint(last(ops))).toEqual([16, 11.5]);
    expect(ops.length - 1).toBeLessThanOrEqual(2); // ≤ 90° per piece, this arc is 90°
  });
  it("never drops an arc whose sweep rounds below one piece (huge radius, tiny chord)", () => {
    // With a big enough radius the swept angle underflows the ceil()'s
    // epsilon and used to round down to 0 pieces, silently dropping the
    // whole arc (the path just stopped at its start point).
    const ops = toOps({ tag: "path", attrs: { d: "M10 10A100000000 100000000 0 0 1 10.001 10" } }, {});
    expect(ops.length).toBeGreaterThan(1);
    expect(endPoint(last(ops))).toEqual([10.001, 10]);
  });
  it("splits a 180° arc into two pieces and keeps the midpoint on the circle", () => {
    const ops = toOps({ tag: "path", attrs: { d: "M4 12a8 8 0 0 1 16 0" } }, {});
    expect(ops.length).toBe(3);
    const [, , , , , mx, my] = ops[1];
    expect(Math.hypot(mx - 12, my - 12)).toBeCloseTo(8, 2);
    expect(my).toBeLessThan(12); // sweep=1 goes over the top in SVG's y-down space
  });
  it("draws a circle as four cubics", () => {
    const ops = toOps({ tag: "circle", attrs: { cx: "12", cy: "12", r: "4" } }, {});
    expect(ops[0]).toEqual(["M", 16, 12]);
    expect(ops.filter((o) => o[0] === "C").length).toBe(4);
    expect(last(ops)).toEqual(["Z"]);
    expect(ops[1][1]).toBeCloseTo(16, 3);
    expect(ops[1][2]).toBeCloseTo(12 + 4 * 0.5522847498, 3);
  });
  it("rounds rect corners with the default radius, or none for rx=0", () => {
    const round = toOps({ tag: "rect", attrs: { x: "3", y: "9", width: "18", height: "8" } }, { rx: 2.5 });
    expect(round[0]).toEqual(["M", 5.5, 9]);
    expect(round.filter((o) => o[0] === "C").length).toBe(4);
    const square = toOps({ tag: "rect", attrs: { x: "3", y: "9", width: "18", height: "8", rx: "0" } }, { rx: 2.5 });
    expect(square).toEqual([["M", 3, 9], ["L", 21, 9], ["L", 21, 17], ["L", 3, 17], ["Z"]]);
    const small = toOps({ tag: "rect", attrs: { x: "3", y: "3", width: "7", height: "7", rx: "1" } }, { rx: 2.5 });
    expect(small[0]).toEqual(["M", 4, 3]);
  });
  it("handles line and S (smooth cubic)", () => {
    expect(toOps({ tag: "line", attrs: { x1: "4", y1: "4", x2: "20", y2: "20" } }, {})).toEqual([["M", 4, 4], ["L", 20, 20]]);
    const ops = toOps({ tag: "path", attrs: { d: "M2 12C6 4 10 4 12 12S18 20 22 12" } }, {});
    expect(ops[2]).toEqual(["C", 14, 20, 18, 20, 22, 12]);
  });
});

describe("opsToSvgPath", () => {
  it("prints compact absolute commands", () => {
    expect(opsToSvgPath([["M", 14, 6], ["L", 8, 12], ["C", 1, 2, 3, 4, 5, 6], ["Z"]])).toBe("M14 6L8 12C1 2 3 4 5 6Z");
  });
});
