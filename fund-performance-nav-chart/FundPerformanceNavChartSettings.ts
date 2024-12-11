import {NavTimeSeries, TableSettings} from '../../../../../types';

const headerMapping = [
  {
    columnId: 'NAV',
    label: 'Nav',
  },
  {
    columnId: 'jCurve',
    label: 'jCurve',
  },
  {
    columnId: 'Distributions',
    label: 'Distribution',
  },
  {
    columnId: 'Contributions',
    label: 'Contributions',
  },
  {
    columnId: 'x',
    label: 'Date',
  },
];

const columnOrder = ['NAV', 'jCurve', 'Distributions', 'Contributions', 'x'];

const meta = {
  columns: {
    NAV: {
      styling: {
        align: 'right',
      },
    },
    jCurve: {
      styling: {
        align: 'right',
      },
    },
    Distributions: {
      styling: {
        align: 'right',
      },
    },
    Contributions: {
      styling: {
        align: 'right',
      },
    },
    x: {
      formatter: 'numFmt:dd-mm-yyyy',
      styling: {
        align: 'right',
      },
    },
  },
};
export const fundPerformanceNavChartSettings = (
  zipFileName: string
): TableSettings => {
  return {
    fileName: zipFileName,
    name: 'Fund Performance NAV',
    columnVisibility: {jCurve: false},
    headerMapping,
    columnOrder,
    meta,
  };
};

export const fundPerformanceJCurveChartSettings = (
  zipFileName: string
): TableSettings => {
  return {
    fileName: zipFileName,
    name: 'Fund Performance jCurve',
    columnVisibility: {NAV: false},
    headerMapping,
    columnOrder,
    meta,
  };
};

export const getTableExportPayload = (
  data: NavTimeSeries[],
  isNavActive: boolean,
  zipFileName: string
) => {
  const tableSettings = isNavActive
    ? fundPerformanceNavChartSettings(zipFileName)
    : fundPerformanceJCurveChartSettings(zipFileName);

  return [
    {
      data: data,
      mappings: tableSettings.headerMapping,
      settings: tableSettings,
    },
  ];
};

export const getImagesExportPayload = (zipFileName: string) => {
  return {
    id: 'performance-chart',
    fileName: zipFileName,
    opts: [
      {
        fileName: `${zipFileName}_TransparentBackground`,
        type: 'image/svg+xml',
        ext: 'svg',
        bgColor: 'transparent',
        elsToFilter: [
          'performance-chart-brush',
          'performance-chart-export',
          'performance-benchmark-toggle',
          'recharts-tooltip-wrapper',
        ],
      },
      {
        fileName: `${zipFileName}_WithBackground`,
        type: 'image/svg+xml',
        ext: 'svg',
        bgColor: '#202020',
        elsToFilter: [
          'performance-chart-brush',
          'performance-chart-export',
          'performance-benchmark-toggle',
          'recharts-tooltip-wrapper',
        ],
      },
      {
        fileName: `${zipFileName}_TransparentBackground`,
        type: 'image/png',
        ext: 'png',
        bgColor: 'transparent',
        elsToFilter: [
          'performance-chart-brush',
          'performance-chart-export',
          'performance-benchmark-toggle',
          'recharts-tooltip-wrapper',
        ],
      },
      {
        fileName: `${zipFileName}_WithBackground`,
        type: 'image/png',
        ext: 'png',
        bgColor: '#202020',
        elsToFilter: [
          'performance-chart-brush',
          'performance-chart-export',
          'performance-benchmark-toggle',
          'recharts-tooltip-wrapper',
        ],
      },
    ],
  };
};
