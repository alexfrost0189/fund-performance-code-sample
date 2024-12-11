import React, {useEffect, useMemo, useState} from 'react';
import NavCustomLegend from '../nav-custom-legend/NavCustomLegend';
import CustomYAxisTick from '../../../../global/custom-y-axis-tick/CustomYAxisTick';
import NavXAXisTick from './components/NavXAxisTick';
import FundPerformanceNavTooltip from './components/FundPerformanceNavTooltip';
import {ReactComponent as BrushTraveller} from '../../../../../assets/icons/brush-traveller.svg';
import {
  BundledExportProps,
  ButtonStyle,
  ControllerOption,
  Func,
  FundPerformanceKpiGroups,
  NavData,
  NavTimeSeries,
  OptionValue,
  TicksType,
} from '../../../../../types';
import {navLegendActions, navLegendItems} from '../../consts';
import {SegmentedControlVariants} from '../../../../global/segmented-control/SegmentedControl';
import {
  Area,
  Bar,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  IconButton,
  LiveDataChartLabelContent,
  LiveDataChartShape,
  Loader,
} from '../../../../';
import {
  arrayOfStringValuesToDateConverter,
  calcDomainRange,
  calcXaxisTicks,
  dateToMilliseconds,
} from '../../../../../utils/benchmarking';
import {
  useChartAnimated,
  useChartHover,
  useMultiAxesTicksCalculation,
} from '../../../../../hooks';
import {
  getImagesExportPayload,
  getTableExportPayload,
} from './FundPerformanceNavChartSettings';
import styles from './FundPerformanceNavChart.module.scss';
import {useTranslation} from 'react-i18next';

interface FundPerformanceNavProps extends NavData {
  getBenchmarkData?: Func<[string, string, FundPerformanceKpiGroups], void>;
  clearBenchmarkData?: Func<[FundPerformanceKpiGroups], void>;
  exportHandler: Func<[BundledExportProps], void>;
  entityName?: string;
  nearCastingData?: NavData;
  showExport?: boolean;
}

const FundPerformanceNavChart: React.FC<FundPerformanceNavProps> = ({
  timeSeries: reportedTimeSeries,
  nearCastingData,
  format,
  currency,
  yAxisFormat,
  tooltipFormat,
  benchmarking,
  benchmarkingTimeSeries,
  getBenchmarkData,
  clearBenchmarkData,
  exportHandler,
  entityName,
  id,
  showExport = true,
  signOffDate,
}) => {
  const timeSeries = useMemo(
    () => ({
      data: [
        ...(reportedTimeSeries.data || []),
        ...(nearCastingData?.timeSeries?.data || []),
      ],
    }),
    [reportedTimeSeries, nearCastingData]
  );
  const {t} = useTranslation();
  const [lineChartKey, setLineChartKey] = useState(0);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [activeKpi, setActiveKpi] = useState<ControllerOption | null>(null);
  const [activeSource, setActiveSource] = useState<OptionValue | null>(null);
  const [showBenchmarking, setShowBenchmarking] = useState(false);
  const [activeDataKey, setActiveDataKey] = useState('NAV');
  const [selectedBar, setSelectedBar] = useState(null);
  const [rangeIndexes, setRangeIndexes] = useState<[number, number]>([
    0,
    (timeSeries.data?.length || 1) - 1,
  ]);
  const [dataForExport, setDataForExport] = useState<NavTimeSeries[]>([]);
  const [benchmarkingRange, setBenchmarkingRange] = useState<number>(
    benchmarkingTimeSeries ? benchmarkingTimeSeries.data.length - 1 : 0
  );
  const [exportInProgress, setExportInProgress] = useState<boolean>(false);
  const [activeCharts, setActiveCharts] = useState<string[]>(
    navLegendItems.map(({value}) => value)
  );
  const {hovered, handleMouseMove, handleMouseLeave} = useChartHover();

  const {ref, isAnimated} = useChartAnimated();

  useEffect(() => {
    setBenchmarkingRange(
      benchmarkingTimeSeries ? benchmarkingTimeSeries.data.length - 1 : 0
    );
  }, [benchmarkingTimeSeries]);

  const changeActiveDataKey = (item: any) => {
    setActiveDataKey(item);
    setLineChartKey(prevState => prevState + 1);
  };

  const {from, to, length} = useMemo(() => {
    if (isBenchmarking && benchmarkingTimeSeries) {
      return calcDomainRange(benchmarkingTimeSeries.data);
    }
    return calcDomainRange(timeSeries.data, rangeIndexes);
  }, [timeSeries, benchmarkingTimeSeries, isBenchmarking, rangeIndexes]);

  const isNearCastingEmpty =
    !nearCastingData?.timeSeries || !nearCastingData?.timeSeries?.data?.length;
  const nearCastingStartingFrom =
    reportedTimeSeries?.data[reportedTimeSeries.data.length - 1].x;

  const chartData = useMemo(() => {
    return arrayOfStringValuesToDateConverter(timeSeries.data);
  }, [timeSeries]);

  const benchmarkingData = useMemo(() => {
    return (
      benchmarkingTimeSeries &&
      arrayOfStringValuesToDateConverter(benchmarkingTimeSeries.data)
    );
  }, [benchmarkingTimeSeries]);

  const {
    maxLeftYAxis,
    minLeftAxis,
    maxRightAxis,
    minRightAxis,
    ticksRightAxis,
    ticksLeftAxis,
  } = useMultiAxesTicksCalculation({
    data: chartData,
    leftAxisDataKeys: [activeDataKey],
    rightAxisDataKeys: ['Contributions', 'Distributions'],
  });

  const xAxisTicksType = useMemo<TicksType>(() => {
    const range = rangeIndexes[1] - rangeIndexes[0];
    const rangeIdx = range >= chartData.length ? chartData.length - 1 : range;
    const {start, end} =
      isBenchmarking && benchmarkingData
        ? dateToMilliseconds(
            benchmarkingData[0].x,
            benchmarkingData[benchmarkingRange].x
          )
        : chartData && chartData.length > 0
        ? dateToMilliseconds(chartData[0].x, chartData[rangeIdx].x)
        : dateToMilliseconds(new Date(), new Date());

    const yearsRange = Math.floor((end - start) / 3.154e10);

    if (yearsRange >= 3) return TicksType.Year;
    return TicksType.Quarter;
  }, [rangeIndexes, length, benchmarkingRange]);

  const xAxisFormat = useMemo(() => {
    if (xAxisTicksType === TicksType.Year) return 'yyyy';
    return "QQ 'YY";
  }, [xAxisTicksType]);

  const getXAxisTicks = useMemo(() => {
    if (isBenchmarking && benchmarkingData) {
      return calcXaxisTicks(benchmarkingData, xAxisTicksType, true).map(
        (item: string) => new Date(item)
      );
    }
    return calcXaxisTicks(chartData, xAxisTicksType, true).map(
      (item: string) => new Date(item)
    );
  }, [chartData, xAxisTicksType, isBenchmarking, benchmarkingData]);

  const CustomTraveller = (props: any) => {
    return <BrushTraveller x={props.x - 7} y={props.y} />;
  };

  const onBrushChange = ({startIndex, endIndex}: any) => {
    // @TODO TimeSeries range onBrushChange.. This should be improved it is just for a demo purpose..
    const timeSeriesRange = timeSeries.data.slice(startIndex, endIndex);
    setDataForExport(timeSeriesRange);
    isBenchmarking && benchmarkingTimeSeries
      ? setBenchmarkingRange(endIndex - startIndex)
      : setRangeIndexes([startIndex, endIndex]);
  };

  const onMouseEnter = (e: any, index: any) => {
    setSelectedBar(index);
  };

  const onMouseLeave = () => {
    setSelectedBar(null);
  };

  const onBenchmarkToggle = () => {
    setShowBenchmarking(prevState => !prevState);
    if (isBenchmarking) {
      setIsBenchmarking(false);
      setActiveKpi(null);
      clearBenchmarkData && clearBenchmarkData(FundPerformanceKpiGroups.Nav);
    }
  };

  const onBenchmarkOptionChange = (
    activeKpi: ControllerOption,
    activeSource: OptionValue
  ) => {
    setActiveKpi(activeKpi);
    setActiveSource(activeSource);
    setIsBenchmarking(true);

    getBenchmarkData &&
      getBenchmarkData(
        activeKpi.name,
        activeSource.name,
        FundPerformanceKpiGroups.Nav
      );
  };

  const handleBundledExport = async () => {
    setExportInProgress(true);

    const isNavActive = activeDataKey === 'NAV';
    const zipFileName = `${entityName}_FundPerformance_${
      isNavActive ? 'Nav' : 'jCurve'
    }`;

    const selectDataForExport =
      dataForExport.length > 0 ? dataForExport : timeSeries.data;

    await exportHandler({
      zipFileName,
      tableExportPayload: getTableExportPayload(
        selectDataForExport,
        isNavActive,
        zipFileName
      ),
      imagesExportPayload: getImagesExportPayload(zipFileName),
    } as unknown as BundledExportProps);

    setExportInProgress(false);
  };

  const lineProps = {
    hide: !isAnimated,
    isAnimationActive: isAnimated,
    dot: false,
    yAxisId: 0,
    strokeWidth: 2,
    connectNulls: true,
    stroke:
      activeDataKey === 'NAV'
        ? `rgb(var(--colors-orange-peel))`
        : `rgb(var(--colors-lan-violet))`,
    activeDot: {
      stroke: `${
        activeDataKey === 'NAV'
          ? `rgb(var(--colors-orange-peel))`
          : `rgb(var(--colors-lan-violet))`
      }`,
      fill: `${
        activeDataKey === 'NAV'
          ? `rgb(var(--colors-orange-peel))`
          : `rgb(var(--colors-lan-violet))`
      }`,
      strokeWidth: 5,
      strokeOpacity: 0.5,
      r: 6.5,
    },
  };

  const brushLineProps = {
    dot: false,
    connectNulls: true,
    strokeWidth: 1,
    stroke:
      activeDataKey === 'NAV'
        ? `rgb(var(--colors-orange-peel))`
        : `rgb(var(--colors-lan-violet))`,
  };

  return (
    <div className={styles.wrapper}>
      {isBenchmarking && !benchmarkingData && <Loader loaderType={'funds'} />}
      <div
        ref={ref}
        style={{
          opacity: isBenchmarking && !benchmarkingData ? 0 : 1,
        }}
      >
        <ResponsiveContainer id="performance-chart" width="100%" height={590}>
          <ComposedChart
            data={
              isBenchmarking && !!benchmarkingData
                ? (benchmarkingData as any)
                : (chartData as any)
            }
            margin={{top: 35, left: 60, right: 60}}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient
                id="nearCastingGradient"
                x1="24.4311"
                y1="6.58801e-06"
                x2="458.185"
                y2="407.236"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor={`rgb(var(--colors-nearcasting-gradient1))`} />
                <stop
                  offset={1}
                  stopColor={`rgb(var(--colors-nearcasting-gradient2))`}
                />
              </linearGradient>
              <linearGradient
                id="signOffDataGradient"
                gradientTransform="rotate(0)"
              >
                <stop offset="0%" stopColor={`rgba(65, 65, 65, 0.8)`} />
                <stop offset="50%" stopColor={`rgba(65, 65, 65, 0.51)`} />
                <stop offset="100%" stopColor={`rgba(52, 51, 51, 0.2)`} />
              </linearGradient>
            </defs>
            <defs>
              <linearGradient
                id="benchmarkingGradient"
                gradientTransform="rotate(90)"
              >
                <stop
                  offset="57%"
                  stopColor={`rgba(var(--colors-harlequin),0.32`}
                />
                <stop
                  offset="100%"
                  stopColor={`rgba(var(--colors-japanese-laurel),0.12)`}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              strokeDasharray="2"
              stroke={`rgb(var(--colors-gray-6))`}
            />
            {id === 'fund-performance-row' && (
              <rect
                y={437}
                width="100%"
                height={52}
                // TODO: Replace color after updating the wrapper structure of the chart
                fill="#272727"
                fillOpacity={0.75}
              />
            )}
            <XAxis
              dataKey="x"
              domain={[from.getTime(), to.getTime()]}
              scale="time"
              type="number"
              interval={0}
              axisLine={false}
              height={60}
              tickLine={false}
              ticks={getXAxisTicks as any}
              tick={
                <NavXAXisTick
                  showAxis={true}
                  fill="gray-3"
                  fontSize={12}
                  yOffset={30}
                  xAxisFormat={xAxisFormat}
                />
              }
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[minLeftAxis, maxLeftYAxis]}
              ticks={ticksLeftAxis}
              yAxisId={0}
              width={1}
              label={{
                value: currency,
                position: 'top',
                dx: -30,
                dy: -13,
                fontSize: '12px',
                fontWeight: '500',
                fill: `rgb(var( --colors-gray-3))`,
              }}
              tick={
                <CustomYAxisTick
                  showAxis={true}
                  xOffset={-20}
                  yOffset={4}
                  fill="gray-3"
                  fontSize={12}
                  fontWeight={500}
                  format={yAxisFormat}
                />
              }
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              domain={[minRightAxis, maxRightAxis]}
              ticks={ticksRightAxis}
              yAxisId={1}
              orientation="right"
              width={1}
              label={
                !isBenchmarking
                  ? {
                      value: currency,
                      position: 'top',
                      dx: 30,
                      dy: -13,
                      fontSize: '12px',
                      fontWeight: '500',
                      fill: `rgb(var( --colors-gray-3))`,
                    }
                  : {}
              }
              tick={
                <CustomYAxisTick
                  showAxis={true}
                  xOffset={25}
                  yOffset={4}
                  fill="gray-3"
                  fontSize={12}
                  format={yAxisFormat}
                  fontWeight={500}
                />
              }
            />
            {!isNearCastingEmpty && (
              <ReferenceArea
                x1={new Date(nearCastingStartingFrom).getTime()}
                ifOverflow="hidden"
                fill="url(#nearCastingGradient)"
                fillOpacity={0.3}
              />
            )}
            <Bar
              isAnimationActive={isAnimated}
              hide={!isAnimated || !activeCharts.includes('contributions')}
              dataKey={t('Global.Contributions')}
              fill={`rgb(var(--colors-lan-rose))`}
              yAxisId={1}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              barSize={1}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`rgb(var(--colors-lan-rose))`}
                  width={3}
                  opacity={selectedBar === index ? 0.5 : 1}
                />
              ))}
            </Bar>
            <Bar
              hide={!isAnimated || !activeCharts.includes('distributions')}
              isAnimationActive={isAnimated}
              dataKey={t('Global.Distributions')}
              fill={`rgb(var(--colors-lan-blue))`}
              yAxisId={1}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              barSize={1}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`rgb(var(--colors-lan-blue))`}
                  width={3}
                  opacity={selectedBar === index ? 0.5 : 1}
                />
              ))}
            </Bar>

            <Tooltip
              content={
                <FundPerformanceNavTooltip
                  activeDataKey={activeDataKey}
                  format={format}
                  currency={currency}
                  tooltipFormat={tooltipFormat}
                  isBenchmarking={isBenchmarking}
                  activeKpi={activeKpi?.label}
                  activeSource={activeSource?.label}
                />
              }
            />
            <Line
              {...lineProps}
              key={lineChartKey}
              type="stepBefore"
              dataKey={activeDataKey}
            />
            {!isNearCastingEmpty && (
              <Line
                key={`NC ${lineChartKey}`}
                {...lineProps}
                type="stepBefore"
                dataKey={`NC ${activeDataKey}`}
                strokeDasharray="6 4"
              />
            )}
            <Area
              dataKey="benchmarking_nav"
              fill="url(#benchmarkingGradient)"
              stroke={`rgb(var(--colors-lan-green))`}
              strokeOpacity={0}
              activeDot={{
                stroke: `rgb(var(--colors-lan-green))`,
                fill: `rgb(var(--colors-lan-green))`,
                strokeWidth: 5,
                strokeOpacity: 0.5,
                r: 6.5,
              }}
            />
            {signOffDate && (
              <ReferenceArea
                isFront={true}
                x1={new Date(signOffDate).getTime()}
                fill="url(#signOffDataGradient)"
                shape={props => (
                  <LiveDataChartShape
                    {...props}
                    fill="url(#signOffDataGradient)"
                  />
                )}
              >
                {hovered && (
                  <Label
                    value={'In-flight data'}
                    content={LiveDataChartLabelContent}
                  />
                )}
              </ReferenceArea>
            )}
            <Legend
              verticalAlign="top"
              align="left"
              wrapperStyle={{
                paddingBottom: '45px',
                paddingTop: '30px',
                fontSize: '14px',
              }}
              iconType="circle"
              content={
                <NavCustomLegend
                  id="fund-performance-nav-chart-legend"
                  kpiToggle={{
                    actions: navLegendActions,
                    value: activeDataKey,
                    onChange: changeActiveDataKey,
                  }}
                  items={navLegendItems}
                  buttonVariant={SegmentedControlVariants.Secondary}
                  benchmarking={benchmarking}
                  onBenchmarkToggle={onBenchmarkToggle}
                  showBenchmarking={showBenchmarking}
                  onBenchmarkOptionChange={onBenchmarkOptionChange}
                  activeKpi={activeKpi}
                  isBenchmarking={isBenchmarking}
                  activeCharts={activeCharts}
                  setActiveCharts={setActiveCharts}
                  exportButton={
                    showExport ? (
                      <IconButton
                        className="performance-chart-export"
                        onClick={handleBundledExport}
                        styleType={ButtonStyle.Primary}
                        icon="export"
                        disabled={showBenchmarking}
                        loading={exportInProgress} // exportInProgress
                        id="performance-nav-chart-export-btn"
                      />
                    ) : undefined
                  }
                />
              }
            />

            <Brush
              className="performance-chart-brush"
              fill={`rgb(var(--colors-black))`}
              dataKey="x"
              height={100}
              travellerWidth={0}
              traveller={<CustomTraveller />}
              data={chartData}
              onChange={onBrushChange}
              tickFormatter={() => ''}
            >
              <LineChart margin={{top: 50, left: 50}}>
                {isNearCastingEmpty && (
                  <CartesianGrid
                    vertical={true}
                    horizontal={false}
                    strokeDasharray="2"
                    stroke={`rgb(var(--colors-gray-6))`}
                  />
                )}
                <XAxis
                  dataKey="x"
                  domain={[
                    chartData[0].x.getTime(),
                    chartData.slice(-1)[0].x.getTime(),
                  ]}
                  scale="time"
                  type="number"
                  tick={false}
                  axisLine={false}
                  height={!isNearCastingEmpty ? 0 : undefined}
                />
                {!isNearCastingEmpty && (
                  <ReferenceArea
                    x1={new Date(nearCastingStartingFrom).getTime()}
                    ifOverflow="visible"
                    fill="url(#nearcastingGradient)"
                    fillOpacity={0.3}
                  />
                )}
                <Line
                  dataKey={activeDataKey}
                  type={'stepBefore'}
                  {...brushLineProps}
                />
                {!isNearCastingEmpty && (
                  <Line
                    dataKey={`NC ${activeDataKey}`}
                    type={'stepBefore'}
                    {...brushLineProps}
                    strokeDasharray="6 4"
                  />
                )}
                {signOffDate && (
                  <ReferenceArea
                    x1={new Date(signOffDate).getTime()}
                    ifOverflow="visible"
                    shape={props => (
                      <LiveDataChartShape
                        {...props}
                        bottomMargin={30}
                        fill="url(#signOffDataGradient)"
                      />
                    )}
                  />
                )}
              </LineChart>
            </Brush>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FundPerformanceNavChart;
