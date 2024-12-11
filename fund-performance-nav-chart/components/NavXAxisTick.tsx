import React from 'react';
import {valueFormat} from '../../../../../../utils/value-format';
import {CustomAxisTickProps} from '../../../../../../types/index';

type XAxisProps = Pick<
  CustomAxisTickProps,
  | 'x'
  | 'y'
  | 'payload'
  | 'xOffset'
  | 'yOffset'
  | 'showAxis'
  | 'fill'
  | 'fontSize'
  | 'isXSmall'
  | 'xAxisFormat'
>;

const NavXAXisTick: React.FC<XAxisProps> = ({
  x,
  y,
  payload,
  xOffset = 0,
  yOffset = 0,
  showAxis = false,
  fill,
  fontSize = 12,
  xAxisFormat,
}): JSX.Element => {
  return (
    <g transform={`translate(${x},${y})`}>
      {showAxis && (
        <>
          <text
            x={xOffset}
            y={yOffset}
            textAnchor="middle"
            fill={`rgb(var(--colors-${fill}))`}
            fontSize={fontSize}
          >
            {valueFormat(payload?.value, xAxisFormat).value}
          </text>
        </>
      )}
    </g>
  );
};

export default NavXAXisTick;
