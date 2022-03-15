import * as React from "react";
import Button from "@mui/material/Button";
import PopupState, { bindTrigger } from "material-ui-popup-state";
import IconButton from "@mui/material/IconButton";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StarIcon from "@mui/icons-material/Star";
import { yellow } from "@material-ui/core/colors";
import { WatchListState } from "../../../contexts/WatchListContext";

export default function CardDetailsAdd({
  watchListData: { image, market, name, symbol },
}) {
  const checkIfItemExist = (symbol, market) => {
    //check if symbol already exist in favourites
    if (watchList[market] > 0) {
      watchList[market].some((object) => object.symbol === symbol);
    } else {
      return false;
    }
  };
  const { watchList, dispatch } = WatchListState();
  const [btn, setBtn] = React.useState(checkIfItemExist(symbol, market));

  const handleClick = () => {
    setBtn((btn) => {
      if (btn) {
        //remove
        const newItem = {
          market,
          symbol,
          item: {
            name,
            image,
          },
        };
        dispatch({ type: "REMOVE_ITEM", payload: newItem });
      } else {
        //add
        console.log("add item will happen");
        const newItem = {
          market,
          symbol,
          item: {
            name,
            image,
          },
        };

        dispatch({ type: "ADD_ITEM", payload: newItem });
      }
      return !btn;
    });
  };
  React.useEffect(() => {
    console.log(watchList);
    return () => {};
  }, [watchList]);

  return (
    <PopupState variant="popover" popupId="demo-popup-menu">
      {(popupState) => (
        <React.Fragment>
          <IconButton
            onClick={handleClick}
            style={{ color: "blue[500]" }}
            aria-label="add to watchlist"
            children={
              btn ? (
                <StarIcon sx={{ color: yellow[800] }} />
              ) : (
                <StarBorderIcon />
              )
            }
          ></IconButton>
        </React.Fragment>
      )}
    </PopupState>
  );
}
