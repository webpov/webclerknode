const { fetchPlayerWithOrdersSubAndMode, updateModeIfValid, fetchPlayerByHash } = require('../repository/webdk');
const { getCurrentPrice, fetchPlayerByHref  } = require('../repository/webdk');
const { shortHash } = require('../../util/webhelp');
const { getCouplesFromOrders, getStringFromProfits } = require('../../util/webhelp');
const { makeLimitOrder } = require('../repository/webdk');


function setupPlayerStatsMessageBody(thePllayer) {
  let statsMessageReply = `Attempts <Avail. / Total - Good>: ${thePllayer.attempts} / ${thePllayer.totalAttempts} - ${thePllayer.goodAttempts}`
  statsMessageReply += `\nELO: ${thePllayer.eloWTL}`
  statsMessageReply += `\n\nProfits:\n${thePllayer.trades}`
  return statsMessageReply
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

async function reconstructPlayer(supabase,queryText) {  
  let thePllayer = {trades:`guest #|${queryText}|`,subscription:0}
  try {
    thePllayer = await fetchPlayerByHash(supabase, queryText)
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
  try {
    thePllayer = await fetchPlayerByHref(supabase, queryText)
    let anotherString = ""
    let tradesString = thePllayer.trades
    if (!!tradesString) {
      let tradesList2 = getCouplesFromOrders(tradesString)
      let profitTradeList = tradesList2.filter((aTrade) => (aTrade.profitLoss > 0))
      let profitableTradeString = ""
      try {
        profitableTradeString = getStringFromProfits(profitTradeList)
      } catch (error) {
        console.log("error while getStringFromProfits")
      }
      thePllayer.trades = anotherString + profitableTradeString
    }
  } catch (error) {
    thePllayer = {trades:`unnamed #|${queryText}|`,subscription:0}
  }
  return thePllayer
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
  let thePllayer = null;
  try {
    thePllayer = await fetchPlayerByHash(queryText)
  } catch (error) {
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

async function generalQubUpdateMessage(supabase,queryText) {
  let thePllayers = []
  let theLastOrder = null
  let triggeredOrders = ""
  try {
    thePllayers = await fetchPlayerWithOrdersSubAndMode(supabase)
    if (thePllayers.length > 0) {
      thePllayers.map(async (thePllayer)=>{
        let lastOrder = ''
        const transactions = !!thePllayer.orders ? (
          thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
        ) : []
        if (transactions.length > 0) {
          theLastOrder = transactions[transactions.length-1]
          lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
        }
        if (!lastOrder) return
        if (!theLastOrder) return
        let currentPrrr = await getCurrentPrice()
        if (currentPrrr < theLastOrder.price) {
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
        } else {
          console.log(`${Date.now()} ******`)
        }
      })      
    }

  } catch (error) {
    thePllayers = []
  }

  return `${thePllayers.map((anItem,index)=>(JSON.stringify(anItem.hash))).join("\n")} \n\n
  triggered Orders ${triggeredOrders}`
}
async function generalQubTradeMessage(supabase,queryText) {
  let thePllayers = []
  let theLastOrder = null
  let triggeredOrders = ""
  try {
    thePllayers = await fetchPlayerWithOrdersSubAndMode(supabase)
    if (thePllayers.length > 0) {
      thePllayers.map(async (thePllayer)=>{
        let lastOrder = ''
        const transactions = !!thePllayer.orders ? (
          thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
        ) : []
        if (transactions.length > 0) {
          theLastOrder = transactions[transactions.length-1]
          lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
        }
        if (!lastOrder) return
        if (!theLastOrder) return
        let currentPrrr = await getCurrentPrice()
        if (currentPrrr < theLastOrder.price) {
          triggeredOrders += `|||${JSON.stringify(theLastOrder)}`
          await executeFinalTrade(supabase, thePllayer.hash, theLastOrder, thePllayer)
        } else {
          console.log(`${Date.now()} some are pending | \n ******`)
        }
      })      
    }

  } catch (error) {
    thePllayers = []
  }

  return `${thePllayers.map((anItem,index)=>(JSON.stringify(anItem.hash))).join("\n")} \n\n
  triggered Orders ${triggeredOrders}`
}

async function getFinalTelegramCheckMessage(supabase,queryText) {
  let theLastOrder = null
  let thePllayer = await reconstructPlayerByHref(supabase,queryText)
  let theMessageReply = `Check-in: #${shortHash(queryText)}`
  let statsMessageReply = setupPlayerStatsMessageBody(thePllayer)
  let theOrdersList = getCouplesFromOrders(thePllayer.orders)
  let lastOrder = theOrdersList.length > 0 ? theOrdersList[theOrdersList.length-1] : {}
  if ("startHash" in lastOrder) { delete lastOrder["startHash"] }
  const transactions = !!thePllayer.orders ? (
    thePllayer.orders.split('&&&').filter(item=>!!item).map((anOrder,index)=>JSON.parse(anOrder))
  ) : []
  if (transactions.length > 0) {
    theLastOrder = transactions[transactions.length-1]
    lastOrder = `theLastOrder:${JSON.stringify(theLastOrder)}`
  } else {
    lastOrder = `lastOrder from coupled:${JSON.stringify(lastOrder)}`
  }
  statsMessageReply += `\n\nLast Order:\n${lastOrder}`

  await executeFinalTrade(supabase, queryText, theLastOrder, thePllayer);
  return (`${theMessageReply}\n${statsMessageReply}\n\nStatus: ${!!thePllayer?.subscription ? "VIP" : "GUEST"} || ${thePllayer?.mode > 0 ? "mode:"+thePllayer?.mode : "idle"}`);
}

async function generateInlineResults22(queryText,randdd) {
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
    thePllayer = await fetchPlayerByHash(queryText)
  } catch (error) {
    thePllayer = {name:`player not found`,subscription:0}
    
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

module.exports = {
  getFinalTelegramCheckMessage,
  generalQubUpdateMessage,
  generalQubTradeMessage,
  reconstructPlayer,
  generateInlineResults,
  reconstructPlayerByHref,
  setupPlayerStatsMessageBody,
  generateInlineResults22,
}