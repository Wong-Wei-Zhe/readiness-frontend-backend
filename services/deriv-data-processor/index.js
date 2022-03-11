const Redis = require("ioredis");
const { ws, subscribeTickStream } = require("./config.js");
const { changeTickFormat } = require("./utils.js");

const redis = new Redis({
  host: "cache",
  PORT: 6379,
});
const sub = new Redis({
  host: "cache",
  PORT: 6379,
});
const pub = new Redis({
  host: "cache",
  PORT: 6379,
});

let isSocketOpen = false;
const connections = [];
const connectionItem = {
  symbol: "",
  stream_id: "",
};

ws.on("open", () => {
  console.log("connection is open :)");
  isSocketOpen = true;
});

// subscribe on channels
sub.subscribe("FOREX_IS_CONNECTION_ON", (err, count) => {
  if (err) {
    console.error("Failed to subscribe: %s", err.message);
  } else {
    console.log(`Subscribed successfully! Num of sub channels: ${count}`);
  }
});

// listening to subscribed channels
sub.on("message", (channel, message) => {
  message = JSON.parse(message);

  if (channel === "FOREX_IS_CONNECTION_ON") {
    const { id, symbol } = message;
    // console.log("in ", id, symbol);

    // sub to tick stream if connection to symbol does not exist
    if (!checkConnectionExistOnSymbol(symbol)) subscribeTickStream(symbol);

    // send key name for client to get tick data
    pub.publish(
      "CONNECTION_CHANNEL",
      JSON.stringify({ id: id, channel: `tick_${symbol}` })
    );
  }
});

// listening to websocket
ws.onmessage = (msg) => {
  msg = JSON.parse(msg.data);

  if (msg.msg_type === "tick") {
    // console.log("tick ", msg);
    connectionItem.stream_id = msg.subscription.id;
    connectionItem.symbol = msg.tick.symbol;

    if (!checkConnectionExistOnSymbol(connectionItem.symbol))
      connections.push(connectionItem);
    let processedTick = changeTickFormat(msg.tick);
    redis.set(`tick_${msg.tick.symbol}`, JSON.stringify(processedTick));

    // check if data was saved in redis
    // redis.get(`tick_${msg.tick.symbol}`).then((result, err) => {
    //   console.log("result ", JSON.parse(result));
    // });
  }
};

// check if tick stream exists
const checkConnectionExistOnSymbol = (symbol) => {
  let exist = false;
  connections.forEach((i) => {
    if (i.symbol === symbol) exist = true;
  });

  return exist;
};
