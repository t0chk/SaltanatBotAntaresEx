let binanceclass = require('./binancespot');
let http = require('request');
let server = require('./server');


// ////binance
var binance = new binanceclass();
binance.marketType = "spot";

////margin
var binanceMar = new binanceclass();
binanceMar.marketType = "margin";

///// binance futures REAL usdt
var binanceFru = new binanceclass();
binanceFru.typeExchange = "/fapi";
binanceFru.marketType = "futures";

///// binance futures real coin
var binanceFro = new binanceclass();
binanceFro.typeExchange = "/dapi";
binanceFro.marketType = "futures";

///// binance futures testnet usdt
// var binanceFtu = new binancespot();
// binanceFtu.typeExchange = "/fapi";
// binanceFtu.marketType = "futures"
// ///// binance futures testnet coin
// var binanceFto = new binancespot();
// binanceFto.typeExchange = "/dapi";
// binanceFto.marketType = "futures"


/////dict market 
var marketDict = {
    'binance': binance,
    //   'binanceftu': binanceFtu,
    //   'binancefto': binanceFto,
    'binancefru': binanceFru,
    'binancefro': binanceFro,
    'binancemar': binanceMar
}

var obrabotka = async function (mesage, global, binanceaccidx=0) {
    mesage = mesage.toLowerCase();
    let t = mesage.split("::");
    let binanceresp = {};
    for (var i = 0; i < t.length; i++) {

        let massiv = t[i].split(';')
        let dictCommand = new Map()
        for (index in massiv) {
            dictCommand[massiv[index].split('=')[0]] = massiv[index].split('=')[1]
        }
        if ((dictCommand['market'] != undefined)) {
            let market = dictCommand['market'];
            var marketClass = marketDict[market];
            marketClass.updateParametr(binanceaccidx); // очищаем значения запроса для нового заполнения
            marketClass.filterStatus = true;
            if (dictCommand['symbol'] != undefined) {
                marketClass.pair = dictCommand['symbol'].toUpperCase();
                // команда perpcut для обрезки в валютной паре слова perp пример если был BTCUSDTPERP то после этой команды станет BTCUSDT
                if (dictCommand['perpcut'] == "true") {
                    marketClass.pair = marketClass.pair.split("PERP")[0]
                }
                if (marketClass.filterDict[marketClass.pair] != undefined) { marketClass.filterStatus = true; }
            }
            if (dictCommand['origclientorderid'] != undefined) { marketClass.origClientOrderId = dictCommand['origclientorderid'] }
            if (dictCommand['newclientorderid'] != undefined) { marketClass.newClientOrderId = dictCommand['newclientorderid'] }
            if (dictCommand['orderid'] != undefined) { marketClass.orderId = dictCommand['orderid'] }

            if (dictCommand['positionside'] != undefined) { marketClass.positionSide = dictCommand['positionside'].toUpperCase() }

            if (dictCommand['sideeffecttype'] != undefined) { marketClass.sideeffecttype = dictCommand['sideeffecttype'].toUpperCase() }
            if (dictCommand['stoplimittimeinforce'] != undefined) { marketClass.stopLimitTimeInForce = dictCommand['stoplimittimeinforce'].toUpperCase() }

            if (dictCommand['oco'] != undefined) { marketClass.oco = dictCommand['oco'].toLowerCase() }

            if (dictCommand['dualsideposition'] != undefined) { marketClass.dualsideposition = dictCommand['dualsideposition'].toLowerCase() }
            if (dictCommand['stoplimitprice'] != undefined) { marketClass.stopLimitPrice = dictCommand['stoplimitprice'] }

            if (dictCommand['isisolated'] != undefined) { marketClass.isIsolated = dictCommand['isisolated'].toUpperCase() }

            if (dictCommand['side'] != undefined) { marketClass.side = dictCommand['side'].toUpperCase(); }
            if (dictCommand['ordertype'] != undefined) { marketClass.type = dictCommand['ordertype'].toUpperCase(); }
            if (dictCommand['timeinforce'] != undefined) { marketClass.timeInForce = dictCommand['timeinforce']; }
            if (dictCommand['quantity'] != undefined) {
                marketClass.quantity = dictCommand['quantity'];
                if ((marketClass.quantity).indexOf('.') == -1) {
                    marketClass.quantity = marketClass.quantity + ".0"
                }
            }
            if (dictCommand['price'] != undefined) {
                marketClass.price = dictCommand['price'];
                if ((marketClass.price).indexOf('.') == -1) {
                    marketClass.price = marketClass.price + ".0"
                }
            }

            if (dictCommand['zaim'] != undefined) { marketClass.zaim = dictCommand['zaim']; }
            if (dictCommand['asset'] != undefined) { marketClass.asset = dictCommand['asset']; }
            if (dictCommand['amount'] != undefined) { marketClass.amount = dictCommand['amount']; }




            if (dictCommand['neworderresptype'] != undefined) { marketClass.newOrderRespType = dictCommand['neworderresptype']; }
            if (dictCommand['stopprice'] != undefined) {
                marketClass.stopPrice = dictCommand['stopprice'];
                if ((marketClass.stopPrice).indexOf('.') == -1) {
                    marketClass.stopPrice = marketClass.stopPrice + ".0"
                }
            }
            if (dictCommand['quoteorderqty'] != undefined) { marketClass.quoteOrderQty = dictCommand['quoteorderqty']; }
            if (dictCommand['callbackrate'] != undefined) { marketClass.callbackRate = dictCommand['callbackrate']; }

            if (dictCommand['priceprocdown'] != undefined) { marketClass.priceprocdown = dictCommand['priceprocdown']; }
            if (dictCommand['priceprocup'] != undefined) { marketClass.priceprocup = dictCommand['priceprocup']; }
            if (dictCommand['priceprocauto'] != undefined) { marketClass.priceprocauto = dictCommand['priceprocauto']; }

            if (dictCommand['leverage'] != undefined) { marketClass.leverage = dictCommand['leverage'].toUpperCase(); }
            if (dictCommand['reduceonly'] != undefined) { marketClass.reduceOnly = dictCommand['reduceonly']; }
            if (dictCommand['closeposition'] != undefined) { marketClass.closePosition = dictCommand['closeposition']; }
            if (dictCommand['allclose'] != undefined) { marketClass.allClose = dictCommand['allclose']; }
            if (dictCommand['activationprice'] != undefined) { marketClass.activationPrice = dictCommand['activationprice']; }
            if (dictCommand['quantityproc'] != undefined) { marketClass.quantityProc = dictCommand['quantityproc']; }
            if (dictCommand['leverageproc'] != undefined) { marketClass.leverageProc = dictCommand['leverageproc']; }
            marketClass.global = global
            // Запрос в Бинанс
            server.teleaccounts[binanceaccidx].telegramSendText2("Request ⏩", t[i]);
            binanceresp = await marketClass.binanceStart(binanceaccidx);
            server.teleaccounts[binanceaccidx].telegramSendResponse("Response ⏪", binanceresp);
            server.teleaccounts[binanceaccidx].telegramSendBuffer();

            // console.log('finaly answer');
            // console.log(binanceresp);
        } else {
            console.log('error market');
            binanceresp = { code: -9000, msg: 'Node error: Market command not defined' };
            server.teleaccounts[binanceaccidx].telegramSendText2("😬 Error", "Market command not defined");
            server.teleaccounts[binanceaccidx].telegramSendBuffer();
        }
    }
    return binanceresp;
}

module.exports = obrabotka;