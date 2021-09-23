const config = require('./config.js');
let server = require('./server');

class binanceClass {
    constructor(binanceaccidx = 0) {
        // api key 
        this.global = {}
        //this.binance = undefined

        // аккаунт binance для работы
        this.binanceaccount = server.biaccounts[binanceaccidx];

        this.orderId = 0
        this.priceprocdown = undefined
        this.priceprocup = undefined
        this.priceprocauto = undefined

        this.positionSide = "BOTH"
        this.stopLimitPrice = 0
        this.sideeffecttype = "NO_SIDE_EFFECT"
        this.dualsideposition = "no"
        this.oco = "false"
        this.stopLimitTimeInForce = "FOK"
        this.key = ""
        this.zaim = ""
        this.asset = ""
        this.amount = 0
        this.isIsolated = "FALSE"
        this.startTime = 16000000
        this.endTime = 19000000
        this.timefrime = "1h"
        this.cancelOrder = "false"
        this.origClientOrderId = ""
        this.newClientOrderId = ""
        // api secret
        this.secret = ""
        this.baseUrl = ""
        this.typeExchange = "/dapi";
        this.marketType = "spot";
        // статус фильтра если true тогда скрипт будет фильтровать цену и количетсов по правилам биржы бинанс
        this.filterStatus = false;
        // словарь в который при запуске скрипта будет записан фильтры по всем парам выбранной биржы
        this.filterDict = {};
        this.pos = 0
        this.command = "";
        this.param = "";
        this.pair = "BTCUSD_201225";
        this.side = "";
        this.type = "";
        this.timeInForce = "GTC";
        this.quantity = 0;
        this.price = 0;
        this.newOrderRespType = "ACK";
        this.stopPrice = 0;
        this.quoteOrderQty = 0;
        this.callbackRate = 0.5;
        this.market = "";
        this.leverage = 0;
        this.reduceOnly = "false";
        this.closePosition = "false";
        this.allClose = "false";
        this.signalCount = "";
        this.signalID = "";
        this.formula = "false";
        this.rowid = "";
        this.rowText = "";

        // цена за один контракт 
        this.contractSize = 0
        // первая валюта в валютной пары нужно будет для указаные количество в процентах
        this.baseAsset = "";
        // вторая валюта в валютной пары нужно будет для указаные количество в процентах
        this.quoteAsset = "";
        // фильтрация цены шаг
        this.tickSize = "";
        // фильтрация количество шаг
        this.stepSize = "";

        this.activationPrice = 0;
        // ниже команды которые необходимы для работы от баланса 
        this.quantityProc = 0;
        this.leverageProc = 0;
    }
    // соединитель через которое отправляються команды в биржу 

    // реинициализация и очистка параметров перед стартом нового задания
    updateParametr(binanceaccidx = 0) {
        this.priceprocdown = undefined
        this.priceprocup = undefined
        this.priceprocauto = undefined
        this.positionSide = "BOTH"
        this.stopLimitTimeInForce = "FOK"
        this.dualsideposition = "no"
        this.sideeffecttype = "NO_SIDE_EFFECT"
        this.oco = "false"
        this.cancelOrderID = "false"
        this.pair = "BTCUSD_201225";
        this.origClientOrderId = ""
        this.newClientOrderId = ""
        this.side = "";
        this.type = "";
        this.timeInForce = "GTC";
        this.quantity = 0;
        this.price = 0;
        this.newOrderRespType = "ACK";
        this.stopPrice = 0;
        this.quoteOrderQty = 0;
        this.callbackRate = 0.5;
        this.market = "";
        this.leverage = 0;
        this.reduceOnly = "false";
        this.closePosition = "false";
        this.allClose = "false";
        this.signalCount = "";
        this.signalID = "";
        this.formula = "false";
        this.rowid = "";
        this.rowText = "";

        // цена за один контракт 
        this.contractSize = 0
        // первая валюта в валютной пары нужно будет для указаные количество в процентах
        this.baseAsset = "";
        // вторая валюта в валютной пары нужно будет для указаные количество в процентах
        this.quoteAsset = "";
        // фильтрация цены шаг
        this.tickSize = "";
        // фильтрация количество шаг
        this.stepSize = "";

        this.activationPrice = 0;
        // ниже команды которые необходимы для работы от баланса 
        this.quantityProc = 0;
        this.leverageProc = 0;

        // аккаунт binance для работы
        this.binanceaccount = server.biaccounts[binanceaccidx];

        // аккаунт телеграм для сообщений
        this.telegaccount = undefined;

    }

    ///////////  -----------------------------------------
    // спот
    // liquid swap info
    BinanceBSwap() {
        this.command = "/sapi/v1/bswap/liquidity"
        this.param = "poolId=8";
        this.pos = 2;
    }

    //////создание ордеров oco для спот
    async BinanceCreatOrderOcoSpot() {


        let param = {
            "type": "OCO",
            "stopPrice": this.stopPrice,
            "stopLimitTimeInForce": this.stopLimitTimeInForce,
            "stopLimitPrice": this.stopLimitPrice
        }
        this.param = param;
        let r = undefined
        // Я не понимаю почему при покупке возвращается orderListId, а при продаже orderId
        if (this.side == "BUY") {
            r = this.binanceaccount.buy(this.pair, this.quantity, this.price, this.param, (error, response) => {
                if (response.orderListId == undefined) {
                    this.telegaccount.telegramSendText2("😬 Error", JSON.stringify(error.body));
                    return error.body;
                } else {
                    return response;
                }
            });
        } else {
            r = this.binanceaccount.sell(this.pair, this.quantity, this.price, this.param, (error, response) => {
                if (response.orderId == undefined) {
                    this.telegaccount.telegramSendText2("😬 Error", JSON.stringify(error.body));
                    return error.body;
                } else {
                    return response;
                }
            });
        }
        return r;

    }

    //////создание ордеров для спот
    BinanceCreatOrderSpot() {

        let param = {};
        param["type"] = this.type;
        param["side"] = this.side;
        this.newOrderRespType = "RESULT";

        // param["newOrderRespType"]=this.newOrderRespType;
        if (this.type == "LIMIT") {
            param["timeInForce"] = this.timeInForce;
        }
        // else if ((this.type == "MARKET") && (this.quoteOrderQty != 0)) {
        //   param["quoteOrderQty"]= this.quoteOrderQty;
        // }
        else if ((this.type == "STOP_LOSS") || (this.type == "TAKE_PROFIT")) {
            param["stopPrice"] = this.stopPrice;
        } else if ((this.type == "STOP_LOSS_LIMIT") || (this.type == "TAKE_PROFIT_LIMIT")) {
            param["timeInForce"] = this.timeInForce;
            param["stopPrice"] = this.stopPrice;
        } else if (this.type == "LIMIT_MAKER") { }
        if (this.newClientOrderId != "") {
            param["newClientOrderId"] = this.newClientOrderId
        }
        this.param = param

        //console.log(this.param)
        let r = undefined
        if (this.side == "BUY") {
            r = this.binanceaccount.buy(this.pair, this.quantity, this.price, this.param, (error, response) => {
                if (response.orderId == undefined) {
                    this.telegaccount.telegramSendText2("😬 Error", JSON.stringify(error.body));
                    return error.body;

                } else {
                    return response;
                }
            });
        } else {
            r = this.binanceaccount.sell(this.pair, this.quantity, this.price, this.param, (error, response) => {
                if (response.orderId == undefined) {
                    this.telegaccount.telegramSendText2("😬 Error", JSON.stringify(error.body));
                    return error.body;

                } else {
                    return response;

                }
            });
        }
        return r

    }
    ////закрытие всех ордеров спота по выбранной валютной пары
    async BinanceCloseAllOrderSpot() {
        let r = this.binanceaccount.cancelAll(this.pair, (error, response) => {
            if (response.length == undefined) {
                this.telegaccount.telegramSendText2("😬 Error", JSON.stringify(error.body));
                return error.body;
            } else {
                return response;
            }
        });
        return r
    }
    async BinanceCloseOrderIdSpot() {
        let r = this.binanceaccount.cancel(this.pair, this.orderId, (error, response, symbol) => {
            return response;
        });
        return r
    }
    // Информация о пользователе спот
    BinanceAccountInfoSpot() {

        this.command = "/api/v3/account"
        this.param = ""
        this.pos = 2
    }
    BinanceFilterSpot() {

        this.command = "/api/v3/exchangeInfo"
        this.param = ""
        this.pos = 1
    }
    BinanceSymbolOrderBookSpot() {
        this.command = "/api/v3/ticker/bookTicker";
        this.param = "symbol=" + this.pair;
        this.pos = 1;
    }
    // все ордера
    BinanceOpenOrderSpot() {

        this.command = "/api/v3/openOrders"
        this.param = ""
        this.pos = 2
    }
    //  метод для получение количество от процента от баланса для спотового рынка
    BinanceQuantityProcSpot() {
        if (this.price == 0) {
            if (this.side == "BUY") {
                this.price = this.global.ticker.spot[this.pair].bestAsk
            } else if (this.side == "SELL") {
                this.price = this.global.ticker.spot[this.pair].bestBid
            }
        }

        this.quoteOrderQty = 0;
        if (this.side == 'BUY') {
            let balance = this.global.balance.spot[this.quoteAsset].available
            this.quantity = Number(balance) / (100 / Number(this.quantityProc));
            this.quantity = this.quantity / Number(this.price);

        } else if (this.side == 'SELL') {


            let balance = this.global.balance.spot[this.baseAsset].available
            this.quantity = Number(balance) / (100 / Number(this.quantityProc));


        }
        this.binancefilterStartSpot();
    }




    ///////////  -----------------------------------------
    //////////   фьючерсы


    BinanceFundingGetInfoFutures() {
        this.command = this.typeExchange + "/v1/premiumIndex";
        this.param = "";
        this.pos = 1;
    }

    ////Change Position Mode
    async BinanceChangePositionModeFutures() {

        return await this.binanceaccount.futuresChangePositionSideDual(this.pair, { dualSidePosition: this.dualsideposition })
    }
    //  метод для получение количество от процента от баланса для фьючерсного рынка
    BinanceQuantityProcFutures() {
        // нужно определить указана ли цена если нет то берем цену ask для sell и bid для buy
        if (this.price == 0) {
            if (this.side == "BUY") {
                if (this.typeExchange == "/fapi") {
                    this.price = this.global.ticker.futures[this.pair].bestAsk
                } else if (this.typeExchange == '/dapi') {
                    this.price = this.global.ticker.futuresDapi[this.pair].bestAsk
                }
            } else if (this.side == "SELL") {
                if (this.typeExchange == "/fapi") {
                    this.price = this.global.ticker.futures[this.pair].bestBid
                } else if (this.typeExchange == '/dapi') {
                    this.price = this.global.ticker.futuresDapi[this.pair].bestBid
                }

            }
        }

        // нужно выяснить какой фьючерс coin или usdt
        // тут будет обработка coin фьючерсов
        if (this.typeExchange == "/dapi") {
            let balance = 0

            balance = Number(this.global.balance.futuresDapi[this.baseAsset].availableBalance)
            this.quantity = (balance / (100 / Number(this.quantityProc))); // процент от баланса 
            this.quantity = this.quantity * this.price; // узнаем сколько это будет стоит 
            this.quantity = this.quantity / Number(this.contractSize); // делим на контракт 
            this.quantity = this.quantity * Number(this.leverageProc); // умножаем на плечо
            this.quantity = Number(this.quantity).toFixed(0);
            this.binancefilterStartdapi()
        }
        // тут будет обработка usdt фьючерсов
        else if (this.typeExchange == "/fapi") {
            let balance = Number(this.global.balance.futures[this.quoteAsset].availableBalance)
            this.quantity = (balance / (100 / Number(this.quantityProc))) * Number(this.leverageProc);
            this.quantity = Number(this.quantity) / Number(this.price);
            this.binancefilterStartfapi()
        }
    }
    //////создание ордеров для фьючерсов
    async BinanceCreatOrderFutures() {

        let param = {}
        this.newOrderRespType = "RESULT";
        param["type"] = this.type
        param["newOrderRespType"] = this.newOrderRespType
        if (this.type == "LIMIT") {
            param["timeInForce"] = this.timeInForce
        } else if (this.type == "MARKET") {
            this.price = false
        } else if ((this.type == "STOP") || (this.type == "TAKE_PROFIT")) {
            param["stopPrice"] = this.stopPrice
        } else if ((this.type == "STOP_MARKET") || (this.type == "TAKE_PROFIT_MARKET")) {
            this.price = false
            if (this.closePosition == "true") {

                param["timeInForce"] = this.timeInForce
                param["stopPrice"] = this.stopPrice
                param["closePosition"] = this.closePosition;
            } else {
                param["timeInForce"] = this.timeInForce
                param["stopPrice"] = this.stopPrice
            }
        } else if (this.type == "TRAILING_STOP_MARKET") {
            param["callbackRate"] = this.callbackRate;
            this.price = false
            if (this.activationPrice != 0) {
                param["activationPrice"] = this.activationPrice;
                this.activationPrice = 0
            }
        }
        if (this.newClientOrderId != "") {
            param["newClientOrderId"] = this.newClientOrderId
        }
        if (this.reduceOnly == "true") {
            param["reduceOnly"] = this.reduceOnly;
        }
        if (this.positionSide != "BOTH") {
            param["positionSide"] = this.positionSide;
        }

        this.param = param
        console.log(this.param)

        if (this.typeExchange == "/fapi") {
            return await this.binanceaccount.futuresOrder(this.side, this.pair, this.quantity, this.price, this.param);
        } else if (this.typeExchange == "/dapi") {
            return await this.binanceaccount.deliveryOrder(this.side, this.pair, this.quantity, this.price, this.param);
        }
    }
    ////закрытие всех ордеров фьючерсов по выбранной валютной пары
    async BinanceCloseAllOrderFutures() {
        if (this.typeExchange == "/fapi") {
            return await this.binanceaccount.futuresCancelAll(this.pair);
        } else if (this.typeExchange == "/dapi") {
            return await this.binanceaccount.deliveryCancelAll(this.pair)
        }

    }
    ////закрытие ордера по id 
    async BinanceCloseOrderIdFutures() {
        if (this.typeExchange == "/fapi") {
            let params = {}
            if (this.orderId != 0) {
                params["orderId"] = this.orderId
            } else {
                params["origClientOrderId"] = this.origClientOrderId
            }
            return await this.binanceaccount.futuresCancel(this.pair, params)

        } else if (this.typeExchange == "/dapi") {
            return await this.binanceaccount.deliveryCancel(this.pair, params)
        }

    }

    /////изменение плеча во фьючерсах
    async BinanceLeverageFutures() {
        if (this.typeExchange == "/dapi") {
            return await this.binanceaccount.deliveryLeverage(this.pair, this.leverage)
        } else if (this.typeExchange == "/fapi") {
            return await this.binanceaccount.futuresLeverage(this.pair, this.leverage)
        }
    }
    // Информация о пользователе фьючерсах
    BinanceAccountInfoFutures() {
        this.command = this.typeExchange + "/v1/balance";
        this.param = "";
        this.pos = 2;
    }
    // открытые ордера 
    BinanceOpenOrderFutures() {
        this.command = this.typeExchange + "/v1/openOrders";
        this.param = "";
        this.pos = 2;
    }
    // Информация о пользователе фьючерсах
    BinanceAccountInfoFuturesV2() {
        this.command = this.typeExchange + "/v2/balance";
        this.param = "";
        this.pos = 2;
    }
    // нужно чтобы узнать текущие настройки leverage
    BinancePositionRiskInfo() {
        this.command = this.typeExchange + "/v1/positionRisk";
        this.param = "";
        this.pos = 2;
    }
    BinanceSymbolBookFutures() {
        this.command = this.typeExchange + "/v1/ticker/bookTicker";
        this.param = "symbol=" + this.pair;
        this.pos = 2;
    }
    BinanceFilterFutures() {
        this.command = this.typeExchange + "/v1/exchangeInfo";
        this.param = "";
        this.pos = 1;
    }
    // margin
    // все ордера
    BinanceOpenOrderMar() {
        this.command = "/sapi/v1/margin/openOrders"
        this.param = ""
        this.pos = 2
    }

    // borrow margin
    BinanceBorrowMargin() {
        this.command = "/sapi/v1/margin/loan"
        if (this.isIsolated == "TRUE") {
            this.param = "asset=" + this.asset + "&amount=" + this.amount + "&isIsolated=" + this.isIsolated + "&symbol=" + this.pair
        } else {
            this.param = "asset=" + this.asset + "&amount=" + this.amount
        }
        this.pos = 3
    }
    // repay margin
    BinanceRepayMargin() {
        this.command = "/sapi/v1/margin/repay"
        if (this.isIsolated == "TRUE") {
            this.param = "asset=" + this.asset + "&amount=" + this.amount + "&isIsolated=" + this.isIsolated + "&symbol=" + this.pair
        } else {
            this.param = "asset=" + this.asset + "&amount=" + this.amount
        }
        this.pos = 3
    }
    BinanceCloseAllOrderMargin() {
        this.command = "/sapi/v1/margin/order"
        this.param = "symbol=" + this.pair + "&isIsolated=" + this.isIsolated
        this.pos = 4
    }
    BinanceCloseOrderIdMargin() {
        this.command = "/sapi/v1/margin/order"
        this.param = "symbol=" + this.pair + "&origClientOrderId=" + this.origClientOrderId + "&isIsolated=" + this.isIsolated
        this.pos = 4
    }

    // info account margin
    BinanceAccountInfoMargin() {
        this.command = "/sapi/v1/margin/account"
        this.param = ""
        this.pos = 2
    }
    // info account isoleted margin
    BinanceAccountInfoMarginIso() {
        this.command = "/sapi/v1/margin/isolated/account"
        this.param = ""
        this.pos = 2
    }

    //  метод для получение количество от процента от баланса для спотового рынка
    BinanceQuantityProcMar() {
        if (this.price == 0) {
            if (this.side == 'BUY') {
                this.BinanceSymbolOrderBookSpot();
                let res = this.binanceConnect();
                if (res[0] != undefined) { this.price = res[0]['askPrice']; } else if (res['askPrice'] != undefined) { this.price = res['askPrice']; }
            }
        }
        if (this.isIsolated == "TRUE") {
            this.BinanceAccountInfoMarginIso();
            let res = this.binanceConnect();
            let balance = 0
            for (let i = 0; i < res.assets.length; i++) {
                if (res.assets[i].symbol == this.pair) {
                    if (this.side == "BUY") {
                        balance = res.assets[i].quoteAsset.free
                        this.quantity = Number(balance) / (100 / Number(this.quantityProc));
                        this.quantity = this.quantity / Number(this.price);

                        break;
                    } else if (this.side == "SELL") {
                        balance = res.assets[i].baseAsset.free
                        this.quantity = Number(balance) / (100 / Number(this.quantityProc));
                        break;
                    }
                }

            }
        } else if (this.isIsolated == "FALSE") {
            this.BinanceAccountInfoMargin();
            let res = this.binanceConnect();
            let balance = 0
            let sPair = ""
            if (this.side == "BUY") {
                sPair = this.quoteAsset
            } else if (this.side == "SELL") {
                sPair = this.baseAsset
            }
            for (let i = 0; i < res.userAssets.length; i++) {
                if (res.userAssets[i].asset == sPair) {
                    if (this.side == "BUY") {
                        balance = res.userAssets[i].free
                        this.quantity = Number(balance) / (100 / Number(this.quantityProc));
                        this.quantity = this.quantity / Number(this.price);
                        break;
                    } else if (this.side == "SELL") {
                        balance = res.userAssets[i].free
                        this.quantity = Number(balance) / (100 / Number(this.quantityProc));
                        break;
                    }
                }

            }
        }


        this.quoteOrderQty = 0;
        this.binancefilterStartSpot();
    }

    // создание ордера в margin 
    BinanceCreatOrderMargin() {
        let param = "symbol=" + this.pair + "&side=" + this.side + "&type=" + this.type + "&newOrderRespType=" + this.newOrderRespType + "&isIsolated=" + this.isIsolated + "&sideEffectType=" + this.sideeffecttype;
        if (this.type == "LIMIT") {
            param = param + "&timeInForce=" + this.timeInForce + "&quantity=" + this.quantity + "&price=" + this.price;
        } else if ((this.type == "MARKET") && (this.quoteOrderQty == 0)) {
            param = param + "&quantity=" + this.quantity;
        } else if ((this.type == "MARKET") && (this.quoteOrderQty != 0)) {
            param = param + "&quoteOrderQty=" + this.quoteOrderQty;
        } else if ((this.type == "STOP_LOSS") || (this.type == "TAKE_PROFIT")) {
            param = param + "&quantity=" + this.quantity + "&stopPrice=" + this.stopPrice;
        } else if ((this.type == "STOP_LOSS_LIMIT") || (this.type == "TAKE_PROFIT_LIMIT")) {
            param = param + "&timeInForce=" + this.timeInForce + "&quantity=" + this.quantity + "&price=" + this.price + "&stopPrice=" + this.stopPrice;
        } else if (this.type == "LIMIT_MAKER") {
            param = param + "&quantity=" + this.quantity + "&price=" + this.price;
        }
        if (this.newClientOrderId != "") {
            param = param + "&newClientOrderId=" + this.newClientOrderId
        }
        this.command = "/sapi/v1/margin/order"
        this.param = param
        this.pos = 3
    }




    // логика работы 
    //// фильтрация цены и количество согласно фильтрам бинанс
    binancefilterStartSpot() {
        if (this.price === 0) {
            if (this.side == "BUY") {
                this.price = this.global.ticker.spot[this.pair].bestAsk
            } else if (this.side == "SELL") {
                this.price = this.global.ticker.spot[this.pair].bestBid
            }
        }



        if (this.priceprocdown != undefined) {
            this.price = this.price * (1 - (this.priceprocdown / 100))
        } else if (this.priceprocup != undefined) {
            this.price = this.price * (1 + (this.priceprocup / 100))
        } else if (this.priceprocauto != undefined) {
            if (this.side == "BUY") {
                this.price = this.price * (1 - (this.priceprocauto / 100))

            } else if (this.side == "SELL") {
                this.price = this.price * (1 + (this.priceprocauto / 100))

            }
        }

        if (this.filterStatus) {
            this.tickSize = this.global.filters.spot[this.pair]['tickSize'];
            this.stepSize = this.global.filters.spot[this.pair]['stepSize'];
            this.baseAsset = this.global.filters.spot[this.pair]['baseAsset'];
            this.quoteAsset = this.global.filters.spot[this.pair]['quoteAsset'];
            // начало фильтрации цена по правилам биржы

            this.tickSize = Number(this.tickSize).toFixed(8);
            let dot = (this.tickSize).indexOf('.');
            let position = (this.tickSize).indexOf('1');

            if (dot > position) {

                this.tickSize = Number(this.tickSize).toFixed(8);
                this.price = this.price - (this.price % this.tickSize);
                this.stopPrice = this.stopPrice - (this.stopPrice % this.tickSize);
                this.stopLimitPrice = this.stopLimitPrice - (this.stopLimitPrice % this.tickSize);


            } else if (dot < position) {

                this.price = ((this.price).toString()).substr(0, ((this.price).toString()).indexOf('.') + position)
                this.stopPrice = ((this.stopPrice).toString()).substr(0, ((this.stopPrice).toString()).indexOf('.') + position)
                this.stopLimitPrice = ((this.stopLimitPrice).toString()).substr(0, ((this.stopLimitPrice).toString()).indexOf('.') + position)

            }
            // конец фильтрации цена по правилам биржы
            // начало фильтрации количество по правилам биржы

            this.stepSize = Number(this.stepSize).toFixed(8);
            this.stepSize = (this.stepSize).toString();

            dot = (this.stepSize).indexOf('.');

            position = (this.stepSize).indexOf('1');


            if (dot > position) {

                this.stepSize = Number(this.stepSize).toFixed(8);
                this.quantity = this.quantity - (this.quantity % this.stepSize);

            } else if (dot < position) {
                this.quantity = ((this.quantity).toString()).substr(0, ((this.quantity).toString()).indexOf('.') + position)

            }

            // конец фильтрации количество по правилам биржы

        }

    }


    binancefilterStartfapi() {
        if (this.price == 0) {
            if (this.side == "BUY") {
                this.price = this.global.ticker.futures[this.pair].bestAsk
            } else if (this.side == "SELL") {
                this.price = this.global.ticker.futures[this.pair].bestBid
            }
        }



        if (this.priceprocdown != undefined) {
            this.price = this.price * (1 - (this.priceprocdown / 100))
        } else if (this.priceprocup != undefined) {
            this.price = this.price * (1 + (this.priceprocup / 100))
        } else if (this.priceprocauto != undefined) {
            if (this.side == "BUY") {
                this.price = this.price * (1 - (this.priceprocauto / 100))

            } else if (this.side == "SELL") {
                this.price = this.price * (1 + (this.priceprocauto / 100))

            }
        }

        if (this.filterStatus) {

            this.tickSize = this.global.filters.futures[this.pair]['tickSize'];
            this.stepSize = this.global.filters.futures[this.pair]['stepSize'];
            this.baseAsset = this.global.filters.futures[this.pair]['baseAsset'];
            this.quoteAsset = this.global.filters.futures[this.pair]['quoteAsset'];
            // начало фильтрации цена по правилам биржы
            this.tickSize = Number(this.tickSize).toFixed(8);
            let dot = (this.tickSize).indexOf('.');
            let position = (this.tickSize).indexOf('1');

            if (dot > position) {

                this.tickSize = Number(this.tickSize).toFixed(8);
                this.price = this.price - (this.price % this.tickSize);
                this.stopPrice = this.stopPrice - (this.stopPrice % this.tickSize);
                this.stopLimitPrice = this.stopLimitPrice - (this.stopLimitPrice % this.tickSize);


            } else if (dot < position) {

                this.price = ((this.price).toString()).substr(0, ((this.price).toString()).indexOf('.') + position)
                this.stopPrice = ((this.stopPrice).toString()).substr(0, ((this.stopPrice).toString()).indexOf('.') + position)
                this.stopLimitPrice = ((this.stopLimitPrice).toString()).substr(0, ((this.stopLimitPrice).toString()).indexOf('.') + position)

            }
            // конец фильтрации цена по правилам биржы
            // начало фильтрации количество по правилам биржы

            this.stepSize = Number(this.stepSize).toFixed(8);
            this.stepSize = (this.stepSize).toString();

            dot = (this.stepSize).indexOf('.');

            position = (this.stepSize).indexOf('1');


            if (dot > position) {

                this.stepSize = Number(this.stepSize).toFixed(8);
                this.quantity = this.quantity - (this.quantity % this.stepSize);

            } else if (dot < position) {
                this.quantity = ((this.quantity).toString()).substr(0, ((this.quantity).toString()).indexOf('.') + position)

            }

            // конец фильтрации количество по правилам биржы

        }

    }

    binancefilterStartdapi() {
        if (this.price === 0) {
            if (this.side == "BUY") {
                this.price = this.global.ticker.futuresDapi[this.pair].bestAsk
            } else if (this.side == "SELL") {
                this.price = this.global.ticker.futuresDapi[this.pair].bestBid
            }
        }



        if (this.priceprocdown != undefined) {
            this.price = this.price * (1 - (this.priceprocdown / 100))
        } else if (this.priceprocup != undefined) {
            this.price = this.price * (1 + (this.priceprocup / 100))
        } else if (this.priceprocauto != undefined) {
            if (this.side == "BUY") {
                this.price = this.price * (1 - (this.priceprocauto / 100))

            } else if (this.side == "SELL") {
                this.price = this.price * (1 + (this.priceprocauto / 100))

            }
        }

        if (this.filterStatus) {
            this.tickSize = this.global.filters.futuresDapi[this.pair]['tickSize'];
            this.stepSize = this.global.filters.futuresDapi[this.pair]['stepSize'];
            this.baseAsset = this.global.filters.futuresDapi[this.pair]['baseAsset'];
            this.quoteAsset = this.global.filters.futuresDapi[this.pair]['quoteAsset'];
            // начало фильтрации цена по правилам биржы
            if (this.typeExchange == '/dapi') {
                this.contractSize = this.global.filters.futuresDapi[this.pair]['contractSize'];
            }
            this.tickSize = Number(this.tickSize).toFixed(8);
            let dot = (this.tickSize).indexOf('.');
            let position = (this.tickSize).indexOf('1');

            if (dot > position) {

                this.tickSize = Number(this.tickSize).toFixed(8);
                this.price = this.price - (this.price % this.tickSize);
                this.stopPrice = this.stopPrice - (this.stopPrice % this.tickSize);
                this.stopLimitPrice = this.stopLimitPrice - (this.stopLimitPrice % this.tickSize);


            } else if (dot < position) {

                this.price = ((this.price).toString()).substr(0, ((this.price).toString()).indexOf('.') + position)
                this.stopPrice = ((this.stopPrice).toString()).substr(0, ((this.stopPrice).toString()).indexOf('.') + position)
                this.stopLimitPrice = ((this.stopLimitPrice).toString()).substr(0, ((this.stopLimitPrice).toString()).indexOf('.') + position)

            }
            // конец фильтрации цена по правилам биржы
            // начало фильтрации количество по правилам биржы

            this.stepSize = Number(this.stepSize).toFixed(8);
            this.stepSize = (this.stepSize).toString();

            dot = (this.stepSize).indexOf('.');

            position = (this.stepSize).indexOf('1');


            if (dot > position) {

                this.stepSize = Number(this.stepSize).toFixed(8);
                this.quantity = this.quantity - (this.quantity % this.stepSize);

            } else if (dot < position) {
                this.quantity = ((this.quantity).toString()).substr(0, ((this.quantity).toString()).indexOf('.') + position)

            }

            // конец фильтрации количество по правилам биржы

        }

    }
    // обычный режим
    async binanceStart(binanceaccidx = 0) {
        server.dateStartRequest = new Date(Date.now() - config.gmttime * 3600000);
        this.binanceaccount = server.biaccounts[binanceaccidx];
        this.telegaccount = server.teleaccounts[binanceaccidx];
        
        if (this.marketType == "spot") {
            this.binancefilterStartSpot();
            if (this.allClose != "false") {
                if (this.allClose == "true") {
                    let r = await this.BinanceCloseAllOrderSpot();
                    // this.updateParametr();
                    return r
                } else if (this.allClose == "order") {
                    let r = await this.BinanceCloseOrderIdSpot();
                    // this.updateParametr();
                    return r
                }

            } else {
                if (this.oco == "true") {
                    let r = await this.BinanceCreatOrderOcoSpot();
                    // this.updateParametr();
                    return r
                } else {
                    if (this.quantityProc != 0) {
                        this.BinanceQuantityProcSpot();
                    }
                    let r = await this.BinanceCreatOrderSpot();
                    // this.updateParametr();
                    return r
                }


            }
        }
        // futures done
        else if (this.marketType == "futures") {
            if (this.typeExchange == "/dapi") {
                this.binancefilterStartdapi();
            } else if (this.typeExchange == "/fapi") {
                this.binancefilterStartfapi()
            }
            if (this.leverage != 0) {
                // плечо
                let r = this.BinanceLeverageFutures();
            }

            if (this.allClose != "false") {
                if (this.allClose == "true") {
                    /////// запуск команды закрытие ордеров фьючерсный рынок
                    let r = await this.BinanceCloseAllOrderFutures();
                    // this.updateParametr();
                    return r
                } else if (this.allClose == "order") {
                    let r = await this.BinanceCloseOrderIdFutures();
                    // this.updateParametr();

                    return r
                }
            } else {
                if ((this.dualsideposition == "true") || (this.dualsideposition == "false")) {
                    let r = await this.BinanceChangePositionModeFutures()
                    // this.updateParametr();
                    return r
                } else if (this.dualsideposition == "no") {
                    if (this.quantityProc != 0) {
                        this.BinanceQuantityProcFutures();
                    }
                    // запуск создание ордера
                    let r = await this.BinanceCreatOrderFutures();
                    // this.updateParametr();
                    return r
                } else {
                    return "вы ввели не правильное значение dualsideposition"
                }
            }
        }

    }
    
    binanceGetBestPrice() {
        // расписать все маркеты!
        switch (this.marketType) {
            case 'futures':
                return this.typeExchange == "/fapi" ? this.global.ticker.futures[this.pair] : this.global.ticker.futuresDapi[this.pair];
            case 'spot':
                return this.global.ticker.spot[this.pair];
            case 'margin':
                return this.global.ticker.spot[this.pair];

        }
    }

    async binanceGetSymbolPrice(){
        let prices = await this.binanceaccount.prices(this.pair);
        return prices[this.pair];
    }

}

module.exports = binanceClass;