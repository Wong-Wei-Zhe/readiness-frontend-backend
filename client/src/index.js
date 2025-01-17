import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import App2 from "./App2";
import UserContext from "./contexts/UserContext";
import GeneralContext from "./contexts/GeneralContext";
import "react-alice-carousel/lib/alice-carousel.css";
import WatchListContext from "./contexts/WatchListContext";

ReactDOM.render(
  <React.StrictMode>
    <UserContext>
      <GeneralContext>
        <WatchListContext>
          <App />
          {/* <App2 /> */}
        </WatchListContext>
      </GeneralContext>
    </UserContext>
  </React.StrictMode>,
  document.getElementById("root")
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
