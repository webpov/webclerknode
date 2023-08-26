
// const { generalLookupTable } = require('../../util/helper/webhelp');
const { getCryptoPriceDecimals } = require('../../util/helper/webhelp');
const { fetchPlayer, fetchPlayerByRef, fetchPlayerByHRef, updateModeIfValid } = require('../repository/webrepo');
const { getCouplesFromOrders } = require('../../util/helper/webhelp');

var https = require('https');
var crypto = require('crypto');

const getCurrentPrice = async (requestToken) => {
  let theToken = requestToken || "BTCUSDT";

  let url = `https://api.binance.com/api/v3/ticker/price?symbol=${theToken}`;

  try {
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve(data);
        });
      }).on('error', (error) => {
        reject(error);
      });
    });

    const data = JSON.parse(response);
    const currentPrice = parseFloat(data.price);
    return currentPrice;
  } catch (error) {
    console.log("REQUEST FAILED", error);
    // You might want to handle the error here or return a default value
    return null;
  }
};


async function reconstructPlayer(supabase,queryText) {
  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}


  // fetch player
  try {
    thePllayer = await fetchPlayer(supabase, queryText)
    let anotherString = ""
    let tradesString = thePllayer.trades
    theTradeString = tradesString
    let tradesList2 = getCouplesFromOrders(tradesString)
    let profitTradeList = tradesList2.filter((aTrade) => (aTrade.profitLoss > 0))
    let profitableTradeString = getStringFromProfits(profitTradeList)
    thePllayer.trades = anotherString + profitableTradeString

  } catch (error) {
    thePllayer = {trades:`unnamed #|${queryText}|`,subscription:0}
  }

  return thePllayer
}
async function reconstructPlayerByHref(supabase,queryText) {
  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}


  // fetch player
  try {
    thePllayer = await fetchPlayerByHRef(supabase, queryText)
    let anotherString = ""
    let tradesString = thePllayer.trades
    // theTradeString = tradesString
    // console.log("fetchPlayerByHReffetchPlayerByHReffetchPlayerByHRef", thePllayer)
    if (!!tradesString) {
      // console.log("preeeeee getCouplesFromOrders",)
      let tradesList2 = getCouplesFromOrders(tradesString)
      let profitTradeList = tradesList2.filter((aTrade) => (aTrade.profitLoss > 0))
      let profitableTradeString = ""
      try {
        profitableTradeString = getStringFromProfits(profitTradeList)
      } catch (error) {
        console.log("error while getStringFromProfits")
      }
      console.log("preeeeee filter",)
      thePllayer.trades = anotherString + profitableTradeString
      // console.log("fetchPlayerByHReffetchPlayerByHReffetchPlayerByHRef", thePllayer)

    }

  } catch (error) {
    thePllayer = {trades:`unnamed #|${queryText}|`,subscription:0}
  }

  console.log("fetchPlayerByHReffetchPlayerByHReffetchPlayerByHRef", thePllayer)
  return thePllayer
}

async function executeFinalTrade(supabase, queryText, theLastOrder, thePllayer) {
  if (thePllayer?.mode > 0 && !!thePllayer?.binancekeys) {
    if (!!theLastOrder && (theLastOrder.isBuyer || theLastOrder.side.toLowerCase() == "buy")) {
      await updateModeIfValid(supabase, queryText, null);
      let side = "buy";
      let symbol = "BTCUSDT";
      let quantity = "0.001";
      let price = theLastOrder.price;
      let apikeypublic = thePllayer.binancekeys.split(":")[0] || "";
      let apikeysecret = thePllayer.binancekeys.split(":")[1] || "";

      let orderSuccess = true;

      if ((`${apikeypublic}${apikeysecret}`).length == 128) {
        let theFinalTradeData = { side, symbol, quantity, price };
        console.log("makeLimitOrdermakeLimitOrder")
        makeLimitOrder(theFinalTradeData, apikeypublic, apikeysecret, (result) => {
          if (!result) {
            throw Error("no result in make limit order");
          }
        });
        console.log("makeLimitOrdermakeLimitOrder finalllllllllllllllllll")
      } else {
        orderSuccess = false;
      }
    }
  }
}


async function generateInlineResults(queryText) {
  const randdd = parseInt(Math.random() * 100)
  const results = [];
  const textResult = {
    type: 'article',
    id: '1',
    name: 'name  Rrr #'+randdd,
    title: 'Text Result #'+randdd,
    subscription:0,
    input_message_content: {
      message_text: `You entered: ${queryText} \nYou got: ${randdd}`,
    },
  };
  
  // const foundHardcode = hardcode[queryText]
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayer(queryText)
    console.log("player was found", )
  } catch (error) {
    console.log("player not found", queryText)
    thePllayer = {name:`player not found |${queryText}|`,subscription:0}
    
  }
  const betterResult = !thePllayer?.subscription ? textResult : {
    type: 'article',
    id: '1',
    title: '->Text Result +++'+thePllayer.name,
    input_message_content: {
      message_text: `ey: ${thePllayer.name} ye You entered: |${queryText}| \n${queryText.length}You got: ${randdd}`,
    },
  };
  results.push(betterResult);

  return results;
}


function makeLimitOrder({ side, symbol, quantity, price, recvWindow = 5000, timestamp = Date.now() }, apiKey, apiSecret, callback) {
  // if (apiKey === "user") {
  //   const chatId = process.env.TELEGRAM_CHAT_ID;
  //   const token = process.env.TELEGRAM_BOT_TOKEN;

  //   // const message = `Demo API Key @${chatId} | w${token} \n\n\n\n  used to place an order:\nSide: ${side}\nSymbol: ${symbol}\nQuantity: ${quantity}\nPrice: ${price}\n`;    
  //   // const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`;
  //   // https.get(url);
  //   callback(false);
  //   return;
  // }

  const options = {
    hostname: 'api.binance.com',
    port: 443,
    path: '/api/v3/order',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-MBX-APIKEY': apiKey
    }
  };
  let _price = !!price ? price.toFixed(2) : 0
  // let _price = !!price ? price.toFixed(generalLookupTable[symbol] || 2) : 0
  // let _price = !!price ? price.toFixed(getCryptoPriceDecimals(symbol)) : 0
  if (!_price) {
    return null
  }
  const params = `symbol=${symbol}&side=${side}&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${_price}&recvWindow=${recvWindow}&timestamp=${timestamp}`;
  const signature = crypto.createHmac('sha256', apiSecret).update(params).digest('hex');
  const data = `${params}&signature=${signature}`;
  const req = https.request(options, (res) => {
    let result = '';
    res.on('data', (data) => {
      result += data;
    });
    res.on('end', () => {
      callback(JSON.parse(result));
    });
  });
  req.on('error', (err) => {
    callback(err);
  });
  req.write(data);
  req.end();
}



module.exports = {
  reconstructPlayer,
  executeFinalTrade,
  generateInlineResults,
  getCurrentPrice,
  reconstructPlayerByHref,
}