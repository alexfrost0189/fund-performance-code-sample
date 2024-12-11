import React from 'react';
import {TooltipProps} from 'recharts/index';
import {ValueFormat} from '../../../../../global';
import styles from './FundPerformanceNavTooltip.module.scss';
import {formatWithLocale} from '../../../../../../utils';
import {useTranslation} from 'react-i18next';

type FundPerformanceTooltipProps = Pick<TooltipProps, 'active' | 'payload'> & {
  activeDataKey?: string;
  format?: string;
  currency?: string;
  tooltipFormat?: string;
  isBenchmarking: boolean;
  activeKpi?: string;
  activeSource?: string;
  dateLabel?: string;
};
const Keys = ['NAV', 'jCurve', 'Gross IRR', 'Net IRR', 'MOIC'];
const NCKeys = Keys.map(key => `NC ${key}`);

const FundPerformanceNavTooltip: React.FC<FundPerformanceTooltipProps> = ({
  active,
  payload,
  activeDataKey = '',
  currency,
  tooltipFormat,
  isBenchmarking,
  activeKpi,
  activeSource,
  dateLabel,
}) => {
  const {t} = useTranslation();
  if (active && payload?.length) {
    const isLastReportedPoint =
      !!payload.find(({dataKey}) => NCKeys.includes(dataKey as string)) &&
      !!payload.find(({dataKey}) => Keys.includes(dataKey as string));
    return (
      <div className={styles.tooltipWrapper}>
        {!payload[0].dataKey?.toString().includes('benchmarking') && (
          <p className={styles.quarter}>
            {isBenchmarking
              ? payload[0].payload.label
              : dateLabel
              ? payload[0].payload[dateLabel]
              : formatWithLocale(new Date(payload[0].payload.x), 'dd-MM-yy')}
          </p>
        )}

        {payload
          .filter(
            item =>
              !(isLastReportedPoint && NCKeys.includes(item.dataKey as string))
          )
          .map((item, index) => {
            if (!item.dataKey?.toString().includes('benchmarking')) {
              return (
                <div
                  className={styles.kpiWrapper}
                  style={{
                    paddingBottom: isBenchmarking ? '24px' : '4px',
                  }}
                  key={index}
                >
                  <div className={styles.values}>
                    <span
                      className={styles.circle}
                      style={{background: item.color}}
                    ></span>
                    <span>{t(item.name.replace('NC ', ''))}:</span>
                    <ValueFormat
                      value={item.value as number}
                      format={item.name !== 'MOIC' ? tooltipFormat : '.2f'}
                      currency={currency}
                    />
                  </div>
                </div>
              );
            }
            return (
              <div className={styles.benchmarkWrapper} key={index}>
                <p className={styles.quarter}>
                  {formatWithLocale(new Date(item.payload.x), 'dd-MM-yy')}
                </p>
                <div className={styles.values} key={index}>
                  <span
                    className={styles.circle}
                    style={{background: item.color}}
                  ></span>
                  <span>{`${activeKpi}, ${activeSource} :`} </span>
                  <ValueFormat
                    value={item.value as number}
                    format={
                      item.name !== 'benchmarking_moic'
                        ? tooltipFormat
                        : undefined
                    }
                    currency={currency}
                  />
                </div>
              </div>
            );
          })}
      </div>
    );
  }
  return null;
};

export default FundPerformanceNavTooltip;
