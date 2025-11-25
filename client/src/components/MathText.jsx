import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const MATH_PATTERN = /\$\$(.+?)\$\$|\$(.+?)\$/gs;

const renderMathNode = (expression, displayMode, key) => {
  try {
    const html = katex.renderToString(expression, {
      displayMode,
      throwOnError: false,
      strict: 'warn',
    });
    return (
      <span
        key={key}
        className={displayMode ? 'math-equation math-equation--block' : 'math-equation math-equation--inline'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (error) {
    return (
      <span key={key} className="math-equation math-equation--error">
        {expression}
      </span>
    );
  }
};

const renderPlainNodes = (text, keyBase) => {
  if (!text) {
    return [];
  }
  const lines = text.split('\n');
  const nodes = [];
  lines.forEach((line, index) => {
    if (index > 0) {
      nodes.push(<br key={`${keyBase}-br-${index}`} />);
    }
    if (line.length > 0) {
      nodes.push(
        <React.Fragment key={`${keyBase}-text-${index}`}>
          {line}
        </React.Fragment>
      );
    }
  });
  return nodes;
};

const buildNodes = (input) => {
  if (input === null || input === undefined) {
    return [];
  }
  const text = typeof input === 'string' ? input : String(input);
  if (text.length === 0) {
    return [];
  }
  const nodes = [];
  let lastIndex = 0;
  let match;
  let keyIndex = 0;
  MATH_PATTERN.lastIndex = 0;

  while ((match = MATH_PATTERN.exec(text)) !== null) {
    const preceding = text.slice(lastIndex, match.index);
    if (preceding) {
      nodes.push(...renderPlainNodes(preceding, `plain-${keyIndex}`));
    }
    const expression = match[1] ?? match[2];
    if (expression) {
      nodes.push(renderMathNode(expression, Boolean(match[1]), `math-${keyIndex}`));
    }
    keyIndex += 1;
    lastIndex = MATH_PATTERN.lastIndex;
  }

  const trailing = text.slice(lastIndex);
  if (trailing) {
    nodes.push(...renderPlainNodes(trailing, `plain-${keyIndex}`));
  }

  return nodes;
};

const MathText = ({ text }) => {
  const nodes = useMemo(() => buildNodes(text), [text]);
  if (!nodes.length) {
    return null;
  }
  return <>{nodes}</>;
};

export default MathText;
