import * as React from 'react';

import date from 'date-and-time';
import { Localized } from '@fluent/react';
import cloneDeep from 'lodash.clonedeep';

import Highcharts from 'highcharts/highstock';
import highchartsStock from 'highcharts/modules/stock';
import HighchartsReact from 'highcharts-react-official';

import type { TimeRangeType } from '..';
import { CHART_OPTIONS } from './chart-options';

import './TimeRangeFilter.css';

const INPUT_FORMAT = 'DD/MM/YYYY HH:mm';
const URL_FORMAT = 'YYYYMMDDHHmm';

type Props = {
  project: string;
  timeRange: TimeRangeType | null | undefined;
  timeRangeData: Array<Array<number>>;
  applySingleFilter: (filter: string, type: 'timeRange') => void;
  toggleFilter: (
    filter: string,
    type: 'timeRange',
    event: React.MouseEvent,
  ) => void;
  updateTimeRange: (filter: string) => void;
};

type State = {
  chartFrom: number | null | undefined;
  chartTo: number | null | undefined;
  chartOptions: {
    series: Array<{
      data: Array<any>;
    }>;
    xAxis: Array<{
      events: {
        setExtremes:
          | ((arg0: { min: number; max: number }) => void)
          | null
          | undefined;
      };
    }>;
  };
  inputFrom: string;
  inputTo: string;
  visible: boolean;
};

/**
 * Shows a Time Range filter panel.
 */
export default class TimeRangeFilter extends React.Component<Props, State> {
  chart: { current: any };

  constructor(props: Props) {
    super(props);

    this.state = {
      chartFrom: null,
      chartTo: null,
      chartOptions: CHART_OPTIONS,
      inputFrom: '',
      inputTo: '',
      visible: false,
    };

    this.initializeChart();

    this.chart = React.createRef();
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    const props = this.props;
    const state = this.state;

    if (props.timeRangeData !== prevProps.timeRangeData) {
      this.plotChart();
    }

    if (state.visible !== prevState.visible) {
      this.updateChartExtremes();
    }

    // When filters are toggled or applied, we update the filters state in the SearchBox
    // component, so that we can request entities accordingly. But the Time Range filter
    // state also changes when chartFrom and chartTo values change, so when that happens,
    // we also need to propagate changes to the SearchBox state.
    // Without this code, if you have Time Range filter applied and then change range and
    // click the Apply Filter button, nothing happens. As described in bug 1469611.
    const { chartFrom, chartTo } = state;
    if (
      props.timeRange &&
      (chartFrom !== prevState.chartFrom || chartTo !== prevState.chartTo)
    ) {
      props.updateTimeRange([chartFrom, chartTo].join('-'));
    }
  }

  initializeChart: () => void = () => {
    // Initialize the highchartsStock module
    highchartsStock(Highcharts);

    // Set global options
    Highcharts.setOptions({
      lang: {
        rangeSelectorZoom: '',
      },
    });
  };

  updateChartExtremes: (
    key?: string | null | undefined,
    value?: number | null | undefined,
  ) => void = (
    key: string | null | undefined,
    value: number | null | undefined,
  ) => {
    const { chartFrom, chartTo } = this.state;

    if (chartFrom && chartTo && this.chart.current) {
      const asTime = (str: string) =>
        date.parse(str, URL_FORMAT, true).getTime();
      const from =
        key === 'chartFrom' && value ? value : asTime(chartFrom.toString());
      const to =
        key === 'chartTo' && value ? value : asTime(chartTo.toString());
      this.chart.current.chart.xAxis[0].setExtremes(from, to);
    }
  };

  plotChart: () => null | void = () => {
    const { timeRange, timeRangeData } = this.props;

    // In case of no translations
    if (timeRangeData.length === 0) {
      return null;
    }

    // Set default chart boundaries (full chart)
    let chartFrom = this.getTimeForURL(timeRangeData[0][0]);
    let chartTo = this.getTimeForURL(
      timeRangeData[timeRangeData.length - 1][0],
    );

    // Set chart boundaries from the URL parameter if given
    if (timeRange) {
      chartFrom = timeRange.from;
      chartTo = timeRange.to;
    }

    // Set chart data
    const chartOptions = cloneDeep(this.state.chartOptions);
    chartOptions.series[0].data = timeRangeData;

    // Set the callback function that fires when the minimum and maximum is set for the axis,
    // either by calling the .setExtremes() method or by selecting an area in the chart.
    chartOptions.xAxis[0].events.setExtremes = (event) => {
      const chartFrom = this.getTimeForURL(event.min);
      const chartTo = this.getTimeForURL(event.max);

      this.setState({
        chartFrom,
        chartTo,
        inputFrom: this.getTimeForInput(chartFrom),
        inputTo: this.getTimeForInput(chartTo),
      });
    };

    this.setState({
      chartFrom,
      chartTo,
      chartOptions,
      inputFrom: this.getTimeForInput(chartFrom),
      inputTo: this.getTimeForInput(chartTo),
    });
  };

  getTimeForURL: (unixTime: number) => number = (unixTime: number) => {
    const d = new Date(unixTime);

    return parseInt(date.format(d, URL_FORMAT, true));
  };

  getTimeForInput: (urlTime: number | null | undefined) => any | string = (
    urlTime: number | null | undefined,
  ) => {
    if (!urlTime) {
      return '';
    }

    const d = date.parse(urlTime.toString(), URL_FORMAT, true);

    if (isNaN(Number(d))) {
      return urlTime.toString();
    }

    return date.format(d, INPUT_FORMAT);
  };

  isValidInput: (value: string) => any = (value: string) => {
    return date.isValid(value, INPUT_FORMAT);
  };

  handleInputChange: (event: React.SyntheticEvent<HTMLInputElement>) => void = (
    event: React.SyntheticEvent<HTMLInputElement>,
  ) => {
    const name = event.currentTarget.name;
    const value = event.currentTarget.value;

    if (this.isValidInput(value)) {
      const d = date.parse(value, INPUT_FORMAT);
      this.updateChartExtremes('chart' + name, d.getTime());
    }

    // @ts-expect-error
    this.setState({
      ['input' + name]: value,
    });
  };

  toggleEditingTimeRange: (event: React.MouseEvent) => void = (
    event: React.MouseEvent,
  ) => {
    const { chartFrom, chartTo, visible } = this.state;

    // After Save Range is clicked...
    if (visible) {
      // Make sure Time Range filter is selected
      if (!this.props.timeRange) {
        this.props.toggleFilter(
          [chartFrom, chartTo].join('-'),
          'timeRange',
          event,
        );
      }

      // Make sure inputs are in sync with chart
      this.setState((state) => {
        return {
          inputFrom: this.getTimeForInput(state.chartFrom),
          inputTo: this.getTimeForInput(state.chartTo),
        };
      });
    }

    this.setState((state) => {
      return { visible: !state.visible };
    });
  };

  toggleTimeRangeFilter: (event: React.MouseEvent) => void = (
    event: React.MouseEvent,
  ) => {
    const { chartFrom, chartTo, visible } = this.state;

    if (visible) {
      return;
    }

    this.props.toggleFilter([chartFrom, chartTo].join('-'), 'timeRange', event);
  };

  applyTimeRangeFilter: () => void = () => {
    const { chartFrom, chartTo, visible } = this.state;

    if (visible) {
      return;
    }

    this.props.applySingleFilter([chartFrom, chartTo].join('-'), 'timeRange');
  };

  render(): null | React.ReactNode {
    const props = this.props;

    // In case of no translations or the All Projects view
    if (props.timeRangeData.length === 0 || props.project === 'all-projects') {
      return null;
    }

    let timeRangeClass = 'time-range clearfix';
    if (this.state.visible) {
      timeRangeClass += ' editing';
    }
    if (props.timeRange) {
      timeRangeClass += ' selected';
    }

    return (
      <>
        <li className='horizontal-separator for-time-range'>
          <Localized id='search-TimeRangeFilter--heading-time'>
            <span>TRANSLATION TIME</span>
          </Localized>

          {!this.state.visible ? (
            <Localized
              id='search-TimeRangeFilter--edit-range'
              elems={{
                glyph: <i className='fa fa-chart-area' />,
              }}
            >
              <button
                onClick={this.toggleEditingTimeRange}
                className='edit-range'
              >
                {'<glyph></glyph>EDIT RANGE'}
              </button>
            </Localized>
          ) : (
            <Localized id='search-TimeRangeFilter--save-range'>
              <button
                onClick={this.toggleEditingTimeRange}
                className='save-range'
              >
                SAVE RANGE
              </button>
            </Localized>
          )}
        </li>
        <li className={`${timeRangeClass}`} onClick={this.applyTimeRangeFilter}>
          <span
            className='status fa'
            onClick={this.toggleTimeRangeFilter}
          ></span>

          <span className='clearfix'>
            <label className='from'>
              From
              <input
                type='datetime'
                name='From'
                className={
                  this.isValidInput(this.state.inputFrom) ? '' : 'error'
                }
                disabled={!this.state.visible}
                onChange={this.handleInputChange}
                value={this.state.inputFrom}
              />
            </label>
            <label className='to'>
              To
              <input
                type='datetime'
                name='To'
                className={this.isValidInput(this.state.inputTo) ? '' : 'error'}
                disabled={!this.state.visible}
                onChange={this.handleInputChange}
                value={this.state.inputTo}
              />
            </label>
          </span>

          {!this.state.visible ? null : (
            <HighchartsReact
              highcharts={Highcharts}
              // @ts-expect-error
              options={this.state.chartOptions}
              constructorType={'stockChart'}
              allowChartUpdate={false}
              containerProps={{ className: 'chart' }}
              ref={this.chart}
            />
          )}
        </li>
      </>
    );
  }
}
