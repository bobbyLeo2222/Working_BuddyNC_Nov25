import React, { useMemo } from 'react';

/**
 * RadarChart
 * - Square canvas (size x size)
 * - Labels placed INSIDE by default (no clipping), with word-wrapping via <tspan>
 * - Tunable props: labelFontSize, labelInset, labelMode ('inside' | 'outside')
 *
 * Usage (parent controls the card size/shape):
 *   <div className="w-[520px] aspect-square">
 *     <RadarChart data={[{label:'Vocabulary', value: 8}, ...]} />
 *   </div>
 */

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// very simple character-based word wrapping for SVG <text>
const wrapLabel = (text, maxChars = 10) => {
  if (!text) return [''];
  const words = String(text).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (test.length > maxChars) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const RadarChart = ({
  data,
  size = 1200,              // square side (px)
  rings = 4,
  // label positioning:
  labelMode = 'inside',     // 'inside' | 'outside'
  labelInset,               // distance from the outer ring to the label when inside (px). If undefined, auto-scales.
  labelMargin,              // padding beyond the outer ring when labelMode='outside'. Auto-scales if undefined.
  // label style:
  labelFontSize,            // font size (px). If undefined, auto-scales from size.
  maxCharsPerLine = 10,     // wrapping aggressiveness
}) => {
  const processed = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    const count = safeData.length;
    if (!count) return null;

    // canvas = size x size (square)
    const totalSize = size;
    const chartRadius = totalSize / 2.3;
    const center = { x: totalSize / 2, y: totalSize / 2 };

    // scale font & inset automatically if not provided
    const fontPx = labelFontSize ?? Math.round(clamp((size / 300) * 8, 8, 11));
    const insetPx = labelInset ?? Math.round(clamp((size / 300) * 24, 14, 32));
    const marginPx = labelMargin ?? Math.round(clamp((size / 300) * 20, 12, 32));

    const maxTotal = Math.max(
      1,
      ...safeData.map((e) => (Number.isFinite(e?.total) && e.total > 0 ? e.total : 0))
    );

    const angleStep = (Math.PI * 2) / count;

    const toPoint = (ratio, i) => {
      const r = clamp(ratio, 0, 1);
      const a = angleStep * i - Math.PI / 2;
      return {
        x: center.x + Math.cos(a) * chartRadius * r,
        y: center.y + Math.sin(a) * chartRadius * r,
      };
    };

    const metrics = safeData.map((entry, index) => {
      const baseLabel =
        typeof entry?.label === 'string' && entry.label.trim()
          ? entry.label.trim()
          : `Topic ${index + 1}`;
      const numeratorRaw = Number.isFinite(entry?.value) ? entry.value : 0;
      const numerator = numeratorRaw < 0 ? 0 : numeratorRaw;
      const reportedTotal = Number.isFinite(entry?.total) && entry.total > 0 ? entry.total : 0;
      const denominatorCandidate = reportedTotal > 0 ? reportedTotal : maxTotal;
      const denominator = denominatorCandidate === 0 ? 1 : denominatorCandidate;
      const ratio = denominator === 0 ? 0 : numerator / denominator;
      const accuracyPercent =
        reportedTotal > 0
          ? Math.round((clamp(numerator, 0, reportedTotal) / reportedTotal) * 100)
          : 0;

      return {
        label: baseLabel,
        numerator,
        total: reportedTotal,
        ratio: clamp(ratio, 0, 1),
        accuracyPercent,
      };
    });

    // data polygon points
    const valuePoints = metrics.map((metric, i) => toPoint(metric.ratio, i));

    // background rings
    const ringPolygons = Array.from({ length: rings }, (_, ri) => {
      const rr = (ri + 1) / rings;
      return { ratio: rr, points: metrics.map((_, i) => toPoint(rr, i)) };
    });

    // axes
    const axisLines = metrics.map((_, i) => ({
      start: { ...center },
      end: toPoint(1, i),
    }));

    // labels
    const labels = metrics.map((metric, i) => {
      const angle = angleStep * i - Math.PI / 2;

      const innerRadius = chartRadius - insetPx; // inside placement
      const outerRadius = chartRadius + marginPx; // outside placement
      const labelRadius = labelMode === 'inside' ? innerRadius : outerRadius;

      const x = center.x + Math.cos(angle) * labelRadius;
      const y = center.y + Math.sin(angle) * labelRadius;

      const anchor =
        labelMode === 'inside'
          ? 'middle'
          : Math.abs(Math.cos(angle)) < 0.2
          ? 'middle'
          : Math.cos(angle) > 0
          ? 'start'
          : 'end';

      const baseline =
        labelMode === 'inside'
          ? 'middle'
          : Math.abs(Math.sin(angle)) < 0.2
          ? 'middle'
          : Math.sin(angle) > 0
          ? 'hanging'
          : 'baseline';

      return {
        lines: wrapLabel(`${metric.label} (${metric.accuracyPercent}%)`, maxCharsPerLine),
        x,
        y,
        anchor,
        baseline,
        angle,
      };
    });

    // estimate bounding boxes for labels to prevent clipping
    const approxCharWidth = fontPx * 0.58;
    const labelExtents = labels.reduce(
      (acc, lbl) => {
        const maxLineChars =
          lbl.lines.length > 0 ? Math.max(...lbl.lines.map((line) => line.length || 1)) : 1;
        const lineCount = Math.max(lbl.lines.length, 1);
        const approxWidth = Math.max(maxLineChars * approxCharWidth, fontPx);
        const approxHeight = Math.max(lineCount * (fontPx + 2) - 2, fontPx);

        let leftOffset;
        let rightOffset;
        switch (lbl.anchor) {
          case 'start':
            leftOffset = 0;
            rightOffset = approxWidth;
            break;
          case 'end':
            leftOffset = approxWidth;
            rightOffset = 0;
            break;
          default:
            leftOffset = approxWidth / 2;
            rightOffset = approxWidth / 2;
            break;
        }

        let topOffset;
        let bottomOffset;
        switch (lbl.baseline) {
          case 'hanging':
            topOffset = 0;
            bottomOffset = approxHeight;
            break;
          case 'baseline':
            topOffset = approxHeight;
            bottomOffset = 0;
            break;
          default:
            topOffset = approxHeight / 2;
            bottomOffset = approxHeight / 2;
            break;
        }

        const left = lbl.x - leftOffset;
        const right = lbl.x + rightOffset;
        const top = lbl.y - topOffset;
        const bottom = lbl.y + bottomOffset;

        return {
          minX: Math.min(acc.minX, left),
          maxX: Math.max(acc.maxX, right),
          minY: Math.min(acc.minY, top),
          maxY: Math.max(acc.maxY, bottom),
        };
      },
      { minX: 0, maxX: totalSize, minY: 0, maxY: totalSize }
    );

    const padding = (() => {
      if (labelMode !== 'outside') {
        return { top: 0, right: 0, bottom: 0, left: 0 };
      }

      const extra = fontPx * 0.75;
      return {
        left: Math.max(0, -labelExtents.minX) + extra,
        right: Math.max(0, labelExtents.maxX - totalSize) + extra,
        top: Math.max(0, -labelExtents.minY) + extra,
        bottom: Math.max(0, labelExtents.maxY - totalSize) + extra,
      };
    })();

    return {
      center,
      totalSize,
      chartRadius,
      fontPx,
      padding,
      valuePoints,
      ringPolygons,
      axisLines,
      labels,
    };
  }, [data, rings, size, labelMode, labelInset, labelMargin, labelFontSize, maxCharsPerLine]);

  if (!processed) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E5E5E5] bg-white p-6 text-sm text-[#9E9E9E]">
        No topic performance data yet.
      </div>
    );
  }

  const {
    center,
    totalSize,
    valuePoints,
    ringPolygons,
    axisLines,
    labels,
    fontPx,
    padding,
  } = processed;
  const polygonPoints = valuePoints.map(p => `${p.x},${p.y}`).join(' ');
  const padLeft = padding?.left ?? 0;
  const padRight = padding?.right ?? 0;
  const padTop = padding?.top ?? 0;
  const padBottom = padding?.bottom ?? 0;

  return (
    <div className="w-full h-full">
      <svg
        width="100%"
        height="100%"
        viewBox={`${-padLeft} ${-padTop} ${totalSize + padLeft + padRight} ${totalSize + padTop + padBottom}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        {/* rings */}
        {ringPolygons.map(r => (
          <polygon
            key={r.ratio}
            points={r.points.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#E0E7FF"
            strokeWidth={0.8}
          />
        ))}

        {/* axes */}
        {axisLines.map((ln, i) => (
          <line
            key={i}
            x1={ln.start.x}
            y1={ln.start.y}
            x2={ln.end.x}
            y2={ln.end.y}
            stroke="#CBD5F5"
            strokeWidth={0.8}
          />
        ))}

        {/* data polygon */}
        <polygon points={polygonPoints} fill="rgba(99,102,241,0.25)" stroke="#4F46E5" strokeWidth={2} />
        {valuePoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#4F46E5" />
        ))}

        {/* labels (wrapped) */}
        {labels.map((lbl, i) => (
          <text
            key={i}
            x={lbl.x}
            y={lbl.y}
            textAnchor={lbl.anchor}
            alignmentBaseline={lbl.baseline}
            fill="#4B5563"
            fontSize={fontPx}
          >
            {lbl.lines.map((line, li) => (
              <tspan key={li} x={lbl.x} dy={li === 0 ? 0 : fontPx + 2}>
                {line}
              </tspan>
            ))}
          </text>
        ))}

        {/* center dot */}
        <circle cx={center.x} cy={center.y} r={2} fill="#4F46E5" />
      </svg>
    </div>
  );
};

export default RadarChart;
