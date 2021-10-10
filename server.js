var nodeversion = "2.7.1";

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
var globalexchangeinfo = {};
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
		var req = replicatorpost(url, Buffer.from(this.post), { 'Content-Type': 'text/plain' })
			.catch((e) => {
				console.log('<< url: ',url);
				console.log('<< ans code:', e.code,'/',e.errno);
			});
	})
};

var getParallel = async function (urldata, postdata) {
	//transform requests into Promises, await all
	try {
		Promise.all(urldata.map(requestAsync, { post: postdata }));
	} catch (err) {
		// catch bent error
		console.error(err);
	}
}

// общая библиотека где есть текущие цены и фильтры

globalexchangeinfo.ticker = {};
globalexchangeinfo.ticker.spot = {};
globalexchangeinfo.ticker.futures = {};
globalexchangeinfo.ticker.futuresDapi = {};

globalexchangeinfo.stat = {};
globalexchangeinfo.stat['por'] = 1;

globalexchangeinfo.balance = {};
globalexchangeinfo.balance.spot = {};
globalexchangeinfo.balance.futures = {};
globalexchangeinfo.balance.futuresDapi = {};

globalexchangeinfo.filters = {}
globalexchangeinfo.filters.spot = {}
globalexchangeinfo.filters.futures = {}
globalexchangeinfo.filters.futuresDapi = {}



async function loadExchangeInfo(binanceacc) {
	// ОБРАБОТАТЬ ОТКАЗЫ СОЕДИНЕНИЯ

	console.log('loadExchangeInfo: load global filter');
	await binanceacc.exchangeInfo(function (error, data) {
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

			// Фильтры для спота
			globalexchangeinfo.filters.spot = minimums
		} else {
			console.log('loadExchangeInfo: fail to load global filter ');
			console.log(error);
			exit(0);
		}
	});

	// старт фьючерсов. загрузка информации о бирже
	console.log('loadExchangeInfo: load futures filter');
	let r = await binanceacc.futuresExchangeInfo()
		.catch(error => {
			console.log('loadExchangeInfo: fail to load futures filter ');
			console.log(error);
			exit(0);
		});

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

	// Фильтры для фьючерсов
	globalexchangeinfo.filters.futures = minimums;

	console.log('loadExchangeInfo: load futures delivery filter');
	r = await binanceacc.deliveryExchangeInfo()
		.catch(error => {
			console.log('loadExchangeInfo: fail to load delivery futures filter ');
			console.log(error);
			exit(0);
		});
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
	// Фильтры для деливери
	globalexchangeinfo.filters.futuresDapi = minimums;

}

// первичная загрузка баланса

if (biaccounts.length > 0) {
	// await new Promise(resolve => setTimeout(resolve, 2000));
	(async () => {
		await new Promise(resolve => loadExchangeInfo(biaccounts[0]));
	})();

	setInterval(() => {
		loadExchangeInfo(biaccounts[0]);
	}, 86400000);
}


// Загрузка балансов для всех аккаунтов
biaccounts.forEach(async function (account) {
	console.log('starting key');
	console.log(account.getOptions().APIKEY);
	account.saltanatticker = globalexchangeinfo;
	await account.useServerTime();
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
			console.log('disconnect');
		})
	})


	// загрузка баланса кошелька
	// баланс загружается в global что в корне неверно. необходимо переработать под возврат значений и грузить в глобал массив балансов

	// await loadbalance(account);

	let r = {};

	r = await account.deliveryBalance()
		.then(
			async function (result) {
				console.log('deliveryBalance sucess');
				for (el in result) {
					account.saltanatticker.balance.futuresDapi[result[el].asset] = result[el];
				}
				await account.websockets.userDeliveryData(false,
					(bal) => {
						for (el in bal.updateData.balances) {
							account.saltanatticker.balance.futuresDapi[bal.updateData.balances[el].asset].balance = bal.updateData.balances[el].walletBalance
							account.saltanatticker.balance.futuresDapi[bal.updateData.balances[el].asset].crossWalletBalance = bal.updateData.balances[el].crossWalletBalance
						}
					},
					false,
					false
				);

			},
			async function (error) {
				console.log('deliveryBalance error');
				console.log(error);
			}
		);

	account.futuresBalance()
		.then(
			async function (result) {
				console.log('futuresBalance sucess');
				for (el in result) {
					account.saltanatticker.balance.futures[result[el].asset] = result[el];
				}

				// callback при изменении баланса?
				await account.websockets.userFutureData(
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

			},
			async function (error) {
				console.log('futuresBalance error');
				console.log(error);
			}
		);

	account.balance((error, balances) => {
		if (error) {
			console.log('loading balance error');
			console.error(error);
		} else {
			console.log('spot loading balance success');
			account.saltanatticker.balance.spot = balances;
		}
	});

	await account.websockets.userData((bal) => {

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

		let now = new Date(Date.now() + config.gmttime * 3600000);
		let strnow = now.toLocaleString("ru-RU") + `.${now.getMilliseconds()}`;

		console.log('-----------------');
		console.log('[' + strnow + '] request >>');
		console.log('>> ' + r);
	});

	req.on('end', async () => {
		// let logica = binancelogica(r,global);
		// Необходимо принять сигнал с номером профиля.
		// signalpage += '/:profId';
		// Если номер профиля отсутствует (индекс не определен), то возврат с ошибкой, иначе вызов логики с номером профиля
		if (req.params.profId == undefined || req.params.profId == "0") return res.send("fail");
		let pid = Number(req.params.profId) - 1;
		if (pid >= biaccounts.length) return res.send("fail");
		// biaccounts[pid].saltanatticker - передача общей информации в функцию!
		// фактически она не нужна в виде свойства
		logica = await binancelogica(r, pid)
			.catch(error => {
				console.log(error);
			});
		console.log('-----------------');
		console.log('response <<');
		console.log(logica);
		res.jsonp(logica);
	});

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

// proxy 
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
try {
	http.listen(config.httplistenport, function () {
		console.log('listen signals on port:' + config.httplistenport);
		console.log('signal page: ' + config.signalpage);
	});
} catch (e) {
	console.log('error start webserver');
	console.log(e);
	exit(0);
}

config.profiles.forEach((profile) => {
	let telegrammaccount = new telegram(profile.telestatus, profile.teleid, profile.teletoken);
	telegrammaccount.telegramSendText2("⚠️ Node Start", "Saltanat Bot Antares class v" + nodeversion + " regrads to @tochk & @citra999 | founder: @arman_aubakirov");
	telegrammaccount.telegramSendBuffer();
});

module.exports.binance = biaccounts[0];
module.exports.teleg = teleg;
module.exports.biaccounts = biaccounts;
module.exports.teleaccounts = teleaccounts;
module.exports.globalexchangeinfo = globalexchangeinfo;

