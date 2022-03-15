import React from "react";
import CandleStickChart from "./chart-types/CandleStickChart";
import LineGraphChart from "./chart-types/LineGraphChart";
import {
  charts,
  chartIndicators,
  candleIntervals,
  isCurrentTickTimeGroupSame,
  updateLastOHLC,
  createOHLC,
  markets,
} from "../../utils/utils";

import {
  getForexOHLCHistorical,
  ForexTickConnection,
} from "../../api/forexApi";

import {
  getCryptoOHLCHistorical,
  CryptoTickConnection,
} from "../../api/cryptoApi";

import { Grid } from "@material-ui/core";
import { InputLabel } from "@mui/material";
import { MenuItem } from "@material-ui/core";
import { Select } from "@mui/material";
import { FormControl } from "@material-ui/core";
import OutlinedInput from "@mui/material/OutlinedInput";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

// variable to contain server-set-events connection
let tickConnection;

class ChartComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interval: candleIntervals.one_minute,
      chart: charts.candle_stick,
      indicators: [],
    };
  }
  // accepts props: symbol
  componentDidMount() {
    if (this.props.market === "forex") {
      // getting historical forex data and starting a server sent event connection to get ticks - complete
      getForexOHLCHistorical(
        this.props.symbol,
        "candles",
        this.state.interval.name
      ).then((data) => {
        // console.log("data received: ", data);
        data = data.map((item) => {
          item.date = new Date(item.date);
          return item;
        });
        this.setState({ data: data });

        // establish a forex server-sent-events connection
        tickConnection = new ForexTickConnection(this.props.symbol);
        tickConnection.connection.onmessage = (msg) => {
          let newTick = JSON.parse(JSON.parse(msg.data));
          let lastOHLC = this.state.data[this.state.data.length - 1];
          newTick.date = new Date(newTick.date);

          // send current price to parent component (details) to display
          this.props.getCurrentPrice(newTick.price);

          // check if new tick belongs to the same time group of last OHLC
          let sameTimeGroup = isCurrentTickTimeGroupSame(
            // this.state.interval,
            this.state.interval,
            lastOHLC,
            newTick
          );

          // if time group of previous OHLC and current tick same, update the previous OHLC, else create new OHLC
          let newOHLC = null;
          if (sameTimeGroup) {
            updateLastOHLC(lastOHLC, newTick);
          } else {
            newOHLC = createOHLC(newTick);
          }

          if (newOHLC) this.state.data.push(newOHLC);
        };
      });
    } else {
      // process crypto data
      // get historical data
      getCryptoOHLCHistorical(this.props.symbol, this.state.interval.name).then(
        (data) => {
          data = data.map((item) => {
            item.date = new Date(item.date);
            return item;
          });
          this.setState({ data: data });

          tickConnection = new CryptoTickConnection(this.props.symbol);
          tickConnection.connection.onmessage = (msg) => {
            let newTick = JSON.parse(JSON.parse(msg.data));
            let lastOHLC = this.state.data[this.state.data.length - 1];
            newTick.date = new Date(newTick.date);

            // send current price to parent component (details) to display
            this.props.getCurrentPrice(newTick.price);

            // check if new tick belongs to the same time group of last OHLC
            let sameTimeGroup = isCurrentTickTimeGroupSame(
              // this.state.interval,
              this.state.interval,
              lastOHLC,
              newTick
            );

            // if time group of previous OHLC and current tick same, update the previous OHLC, else create new OHLC
            let newOHLC = null;
            if (sameTimeGroup) {
              updateLastOHLC(lastOHLC, newTick);
            } else {
              newOHLC = createOHLC(newTick);
            }

            if (newOHLC) this.state.data.push(newOHLC);
          };
        }
      );
    }
  }

  componentWillUnmount = () => {
    tickConnection.connection.close();
    console.log("unmounting");
  };

  // change ohlc chart interval
  changeOHLCInterval = (e) => {
    let interval = candleIntervals[e.target.value];
    this.setState({ interval: interval });

    if (this.props.market === "forex") {
      let styleQuery = "candles";
      let intervalQuery = interval.name;
      if (interval.seconds === candleIntervals.one_tick.seconds) {
        styleQuery = "ticks";
        intervalQuery = candleIntervals.one_minute.name;
      }

      getForexOHLCHistorical(this.props.symbol, styleQuery, intervalQuery).then(
        (data) => {
          data = data.map((item) => {
            item.date = new Date(item.date);
            return item;
          });
          this.setState({ data: data });
        }
      );
    } else {
      getCryptoOHLCHistorical(this.props.symbol, interval.name).then((data) => {
        data = data.map((item) => {
          item.date = new Date(item.date);
          return item;
        });
        this.setState({ data: data });
      });
    }
  };

  // change chart on display
  changeChart = (e) => {
    this.setState({ chart: e.target.value });
    if (e.target.value === charts.candle_stick) {
      if (
        this.state.interval.seconds === candleIntervals.one_tick.seconds &&
        this.props.market === "forex"
      ) {
        this.setState({ interval: candleIntervals.one_minute });
        getForexOHLCHistorical(
          this.props.symbol,
          "candles",
          candleIntervals.one_minute.name
        ).then((data) => {
          data = data.map((item) => {
            item.date = new Date(item.date);
            return item;
          });
          this.setState({ data: data });
        });
      }
    }
  };

  // enable and disable chart indicators
  enableDisableIndicator = (indicator) => {
    if (this.state.indicators.includes(indicator)) {
      let newIndicators = this.state.indicators.filter((i) => i !== indicator);
      this.setState({ indicators: newIndicators });
    } else {
      this.state.indicators.push(indicator);
    }
  };

  // enable and disable chart Indicators
  selectUnselectIndicator = (e) => {
    let indicator = e.target.value;

    this.setState({
      indicators:
        typeof indicator === "string" ? indicator.split(",") : indicator,
    });
  };

  render() {
    // change interval options depending on market and chart type
    let intervalOptions = { ...candleIntervals };
    if (
      !(this.props.market === "forex" && this.state.chart === charts.line_graph)
    ) {
      delete intervalOptions.one_tick;
    }

    if (!this.state.data) {
      return <div>Loading...</div>;
    }
    return (
      <div>
        {this.state.chart === charts.candle_stick && (
          <CandleStickChart
            type="hybrid"
            data={this.state.data}
            indicators={this.state.indicators}
          />
        )}
        {this.state.chart === charts.line_graph && (
          <LineGraphChart
            type="hybrid"
            data={this.state.data}
            indicators={this.state.indicators}
          />
        )}
        <div>
          <Grid container spacing={1}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="label-chart-type">Chart</InputLabel>
                <Select
                  labelId="label-chart-type"
                  id="select-chart-type"
                  label="Chart Type"
                  value={this.state.chart}
                  onChange={this.changeChart}
                >
                  {Object.keys(charts).map((chart) => {
                    return (
                      <MenuItem key={chart} value={charts[chart]}>
                        {chart}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="label-chart-interval">Interval</InputLabel>
                <Select
                  labelId="label-chart-interval"
                  id="select-chart-interval"
                  label="Chart Interval"
                  value={this.state.interval.name}
                  onChange={this.changeOHLCInterval}
                >
                  {Object.keys(intervalOptions).map((interval) => {
                    return (
                      <MenuItem key={interval} value={interval}>
                        {interval}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel id="multiple-chip-label">Indicators</InputLabel>
                <Select
                  labelId="multiple-chip-label"
                  id="multiple-chip"
                  multiple
                  value={this.state.indicators}
                  onChange={this.selectUnselectIndicator}
                  input={
                    <OutlinedInput id="select-multiple-chip" label="Chip" />
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        return <Chip key={value} label={value} />;
                      })}
                    </Box>
                  )}
                >
                  {Object.values(chartIndicators).map((indicator) => (
                    <MenuItem key={indicator} value={indicator}>
                      {indicator}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </div>
      </div>
    );
  }
}

export default ChartComponent;
