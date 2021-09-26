var nodeversion = "2.5.4";

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
const binancelogica = require('./binancelogica')

const { SSL_OP_SINGLE_DH_USE } = require('constants');
const Binance = require('node-binance-api');
const bent = require('bent');
const config = require('./config.js');
let telegram = require('./telegrammclass');
const { exit } = require('process');
const { profile } = require('console');
const e = require('cors');

var biaccounts = [];
var tickers = {};
var teleaccounts = [];

console.info('loading binace profiles');

config.profiles.forEach((profile) => {
	let binanceacc = new Binance();
	let telegrammaccount = new telegram(profile.telestatus, profile.teleid, profile.teletoken);
	binanceacc.options({
		'APIKEY': profile.binancepikey,
		'APISECRET': profile.binancesecretkey,
		useServerTime: true,
		reconnect: true,
		verbose: true,
		urls: {
			base: 'https://api3.binance.com/api/',
			wapi: 'https://api3.binance.com/wapi/',
			sapi: 'https://api3.binance.com/sapi/'
		}
	});
	biaccounts.push(binanceacc);
	teleaccounts.push(telegrammaccount);

});
// const binance = new Binance();
var teleg = new telegram();
// var settings = {}


// google answer 302 so its normal
const replicatorpost = bent('POST', 'string', config.replicatoranscode);

// async url request 
var requestAsync = function (url) {
	return new Promise((resolve, reject) => {
		var req = replicatorpost(url, Buffer.from(this.post), { 'Content-Type': 'text/plain' });
	})
};

var getParallel = async function (urldata, postdata) {
	//transform requests into Promises, await all
	try {
		// remove await from Promise.all
		var data = Promise.all(urldata.map(requestAsync, { post: postdata }));
		// var data = await replicatorpost(urldata[0], Buffer.from(postdata),{'Content-Type' : 'text/plain'});
	} catch (err) {
		console.error(err);
	}
	// console.log(data);
}

// общая библиотека где есть текущие цены и фильтры
// teleg.url = 'https://api.telegram.org/bot' + teleg.token;
tickers.ticker = {};
tickers.ticker.spot = {};
tickers.ticker.futures = {};
tickers.ticker.futuresDapi = {};
tickers.stat = {};
tickers.stat['por'] = 1;
tickers.balance = {};
tickers.balance.spot = {};
tickers.balance.futures = {};
tickers.balance.futuresDapi = {};

// exchange info
// global.settingsTime = settings.time

tickers.filters = {}

tickers.filters.spot = {}
tickers.filters.futures = {}
tickers.filters.futuresDapi = {}


//   загрузка фильтра  для спот в global а также ежедневная обновление значений
//   в мультиакке берется первый ключ, для загрузки фильтров!
//   это может быть потенциальной проблемой, т.к. ключи могут быть совершенно разными
//   рекомендуется первый ключ ставить с подключенными и фьючерсами и спотом

async function loadExchangeInfo(binanceacc) {
	binanceacc.saltanatticker = tickers;
	binanceacc.exchangeInfo(function (error, data) {
		let minimums = {};
		if (error == null) {
			for (let obj of data.symbols) {
				let filters = { status: obj.status };
				filters.baseAsset = obj.baseAsset
				filters.quoteAsset = obj.quoteAsset
				for (let filter of obj.filters) {


					if (filter.filterType == "MIN_NOTIONAL") {
						filters.minNotional = filter.minNotional;
					} else if (filter.filterType == "PRICE_FILTER") {
						filters.minPrice = filter.minPrice;
						filters.maxPrice = filter.maxPrice;
						filters.tickSize = filter.tickSize;
					} else if (filter.filterType == "LOT_SIZE") {
						filters.stepSize = filter.stepSize;
						filters.minQty = filter.minQty;
						filters.maxQty = filter.maxQty;
					}
				}


				filters.baseAssetPrecision = obj.baseAssetPrecision;
				filters.quoteAssetPrecision = obj.quoteAssetPrecision;
				filters.orderTypes = obj.orderTypes;
				filters.icebergAllowed = obj.icebergAllowed;
				minimums[obj.symbol] = filters;
			}
			binanceacc.saltanatticker.filters.spot = minimums
		} else {
			console.log(error)
		}
	});
	// старт фьючерсов. загрузка информации о бирже
	let r = await binanceacc.futuresExchangeInfo();

	let minimums = {};
	for (let obj of r.symbols) {
		let filters = { status: obj.status };
		filters.baseAsset = obj.baseAsset
		filters.quoteAsset = obj.quoteAsset
		for (let filter of obj.filters) {


			if (filter.filterType == "MIN_NOTIONAL") {
				filters.minNotional = filter.minNotional;
			} else if (filter.filterType == "PRICE_FILTER") {
				filters.minPrice = filter.minPrice;
				filters.maxPrice = filter.maxPrice;
				filters.tickSize = filter.tickSize;
			} else if (filter.filterType == "LOT_SIZE") {
				filters.stepSize = filter.stepSize;
				filters.minQty = filter.minQty;
				filters.maxQty = filter.maxQty;
			}
		}


		filters.orderTypes = obj.orderTypes;
		filters.icebergAllowed = obj.icebergAllowed;
		minimums[obj.symbol] = filters;
	}
	binanceacc.saltanatticker.filters.futures = minimums

	r = await binanceacc.deliveryExchangeInfo();
	minimums = {};
	for (let obj of r.symbols) {
		let filters = { status: obj.status };
		filters.baseAsset = obj.baseAsset
		filters.quoteAsset = obj.quoteAsset
		filters.contractSize = obj.contractSize
		for (let filter of obj.filters) {


			if (filter.filterType == "MIN_NOTIONAL") {
				filters.minNotional = filter.minNotional;
			} else if (filter.filterType == "PRICE_FILTER") {
				filters.minPrice = filter.minPrice;
				filters.maxPrice = filter.maxPrice;
				filters.tickSize = filter.tickSize;
			} else if (filter.filterType == "LOT_SIZE") {
				filters.stepSize = filter.stepSize;
				filters.minQty = filter.minQty;
				filters.maxQty = filter.maxQty;
			}
		}


		filters.orderTypes = obj.orderTypes;
		filters.icebergAllowed = obj.icebergAllowed;
		minimums[obj.symbol] = filters;
	}
	binanceacc.saltanatticker.filters.futuresDapi = minimums;

}

// первичная загрузка баланса

async function loadbalance(binanceacc) {
	let r = await binanceacc.deliveryBalance()
	.catch((error) => {
		console.log('deliveryBalance error');
		console.log(error);
		exit(1);
	});
	for (el in r) {
		binanceacc.saltanatticker.balance.futuresDapi[r[el].asset] = r[el]
	}
	r = await binanceacc.futuresBalance()
	.catch((error) => {
		console.log('futuresBalance error');
		console.log(error);
		exit(1);
	});

	for (el in r) {
		binanceacc.saltanatticker.balance.futures[r[el].asset] = r[el]
	}

	binanceacc.balance((error, balances) => {
		if (error) {
			console.error(error);
		} else {
			binanceacc.saltanatticker.balance.spot = balances
			console.log('--------------------');
			console.log('loading spot balances for');
			console.log(binanceacc.getOptions().APIKEY);
			console.log('--------------------');
		}
	});
}

setInterval(() => {
	biaccounts.forEach((account) => {
		loadExchangeInfo(account);
	});
}, 86400000);

// вызов функции с первым ключем
biaccounts.forEach((account) => {

	loadExchangeInfo(account);
	// загрузка цены в global обновление значения в режиме онлайн
	account.websockets.bookTickers(obj => {
		account.saltanatticker.ticker.spot[obj.symbol] = obj;
	});




	account.futuresBookTickerStream(obj => {
		account.saltanatticker.ticker.futures[obj.symbol] = obj;

	});

	account.deliveryBookTickerStream(obj => {
		account.saltanatticker.ticker.futuresDapi[obj.symbol] = obj;

	});


	io.sockets.on('connection', function (socket) {
		io.sockets.emit('spotTicker', { spotTicker: account.saltanatticker.ticker.spot.BNBUSDT })
		io.sockets.emit('futuresTickerDapi', { futuresTickerDapi: account.saltanatticker.ticker.futuresDapi.BNBUSD_210625 })

		io.sockets.emit('futuresTicker', { futuresTicker: account.saltanatticker.ticker.futures.BNBUSDT })

		io.sockets.emit('spotBalance', { spotBalance: account.saltanatticker.balance.spot })


		io.sockets.emit('fapiBalance', { fapiBalance: account.saltanatticker.balance.futures })

		io.sockets.emit('dapiBalance', { dapiBalance: account.saltanatticker.balance.futuresDapi })


		socket.on('disconnect', function () {
			io.sockets.emit('spotTicker', { spotTicker: "ss" })
			console.log('disconnect')
		})
	})


	// загрузка баланса кошелька
	// баланс загружается в global что в корне неверно. необходимо переработать под возврат значений и грузить в глобал массив балансов
	loadbalance(account);

	account.websockets.userDeliveryData(false,
		(bal) => {
			for (el in bal.updateData.balances) {
				account.saltanatticker.balance.futuresDapi[bal.updateData.balances[el].asset].balance = bal.updateData.balances[el].walletBalance
				account.saltanatticker.balance.futuresDapi[bal.updateData.balances[el].asset].crossWalletBalance = bal.updateData.balances[el].crossWalletBalance
			}
		},
		false,
		false
	)


	account.websockets.userFutureData(
		false,
		(bal) => {
			for (el in bal.updateData.balances) {
				account.saltanatticker.balance.futures[bal.updateData.balances[el].asset].balance = bal.updateData.balances[el].walletBalance
				account.saltanatticker.balance.futures[bal.updateData.balances[el].asset].crossWalletBalance = bal.updateData.balances[el].crossWalletBalance
			}
		},
		false,
		false
	);

	account.websockets.userData((bal) => {

		for (el in bal.B) {
			account.saltanatticker.balance.spot[bal.B[el].a].available = bal.B[el].f
			account.saltanatticker.balance.spot[bal.B[el].a].onOrder = bal.B[el].l
		}
	},
		false,
		false,
		false
	)
});
///////////////////////////////////

// index page

app.get('/', function (req, res) {
	res.render('pages/index', {
		tagline: 'sad'
	})
});
app.set('view engine', 'ejs');

// signal page
app.post(config.signalpage, function (req, res) {
	let logica = {};
	let r = '';

	req.on('data', chunk => {
		r = `${chunk}`;
		console.log('-----------------');
		console.log('requset >>');
		console.log(r);
	})

	req.on('end', async () => {
		// let logica = binancelogica(r,global);
		// Необходимо принять сигнал с номером профиля.
		// signalpage += '/:profId';
		// Если номер профиля отсутствует (индекс не определен), то возврат с ошибкой, иначе вызов логики с номером профиля
		if (req.params.profId == undefined || req.params.profId == "0") return res.send("fail");
		let pid = Number(req.params.profId) - 1;
		if (pid >= biaccounts.length) return res.send("fail");
		logica = await binancelogica(r, biaccounts[pid].saltanatticker, pid);
		console.log('-----------------');
		console.log('response <<');
		console.log(logica);
		res.jsonp(logica);
	})

});

// replicator v1 page
app.post(config.replicatorurl, function (req, res) {

	req.on('data', chunk => {
		r = `${chunk}`
		let now = new Date(Date.now() + config.gmttime * 3600000);
		let strnow = now.toLocaleString("ru-RU") + `.${now.getMilliseconds()}`;
		console.log('[' + strnow + '] take replication to (' + config.urls.length + ') urls');
		console.log('>> ' + r);
		getParallel(config.urls, r)
	})
	res.jsonp({ "good": "done" })
});

// replicator v2 page
app.post(config.replicator2url, function (req, res) {
	if (req.params.repId == undefined || req.params.repId == "0") return res.send("fail");
	let rid = Number(req.params.repId) - 1;
	if (rid >= config.rep2urls.length) return res.send("fail");

	req.on('data', chunk => {
		r = `${chunk}`
		let now = new Date(Date.now() + config.gmttime * 3600000);
		let strnow = now.toLocaleString("ru-RU") + `.${now.getMilliseconds()}`;
		console.log('[' + strnow + '] take replication v2 to (' + config.rep2urls[rid].length + ') urls');
		console.log('>> ' + r);
		getParallel(config.rep2urls[rid], r)
	})

	return res.send("done");
});

app.post(config.apiproxypage, function (req, res) {
	let resp = {};
	let request = {};
	let r = '';

	req.on('data', chunk => {
		r = `${chunk}`;
		console.log('-----------------');
		console.log('proxy >>');
		console.log(r);
	});

	req.on('end', async () => {
		try {
			request = JSON.parse(r);
		} catch {
			// catch  json	
			resp = {
				"code": -1121,
				"msg": "Invalid request."
			};
			console.log('400: bad request');
			return res.status(400).send(resp);
		}
		console.log('response <<');
		try {

			let hdr = { 'X-MBX-APIKEY': request.mbx };
			let binanceserver = bent(request.nodeproxymethod.toUpperCase(), 'string', hdr);
			resp = await binanceserver(request.nodebinanceurl);

		} catch (e) {

			// catch  bent			
			resp = resp.statusCode == 403 ? await e.text() : await e.json();
			if (resp == undefined) {
				resp = {
					"code": -1121,
					"msg": "Invalid request."
				};
			}

		}

		let statuscode = resp.statusCode == undefined ? 200 : resp.statusCode;
		console.log(statuscode);
		res.status(statuscode).send(resp);
	});
});

// about page
app.get('/about', function (req, res) {
	res.render('pages/about');
});

// запуск сервера
http.listen(config.httplistenport, function () {
	console.log('listen signals on port:' + config.httplistenport);
	console.log('signal page: ' + config.signalpage);
});

config.profiles.forEach((profile) => {
	let telegrammaccount = new telegram(profile.telestatus, profile.teleid, profile.teletoken);
	telegrammaccount.telegramSendText2("⚠️ Node Start", "Saltanat Bot Antares class v" + nodeversion + " regrads to @tochk & @citra999 | founder: @arman_aubakirov");
	telegrammaccount.telegramSendBuffer();
});

module.exports.binance = biaccounts[0];
module.exports.teleg = teleg;
module.exports.biaccounts = biaccounts;
module.exports.teleaccounts = teleaccounts;

