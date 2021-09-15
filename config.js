// ---------------НАСТРОЙКА-----------------------
// порт подключения салтанат
const httplistenport = 80;

// адрес приемщика сигналов
var signalpage = '/example';

// настройка профилей 
// profiles[0].binancepikey

const profiles = [

    /* profile #1 */
    {
        binancepikey: 'key1', /* binance apikey */
        binancesecretkey: 'secret1', /* binance secret key */
        telestatus: 'вкл', /* telegram status */
        teleid: '123', /* telegram id */
        teletoken: '123:AAA', /* telegram token */
    },
    /* profile #2 */
    {
        binancepikey: 'key2', /* binance apikey */
        binancesecretkey: 'secret2', /* binance secret key */
        telestatus: 'вкл', /* telegram status */
        teleid: '123', /* telegram id */
        teletoken: '123:AAA', /* telegram token */
    },    
];

// ---------------РЕПЛИКАТОРЫ----------------------- 
// принимаемый ответ от репликатора
// 200 - OK
// 302 - Found
// Google tables отвечает 302, для других сервисов возможно надо поставить 200

const replicatoranscode = 302;
// V 1
// /replicator
// метод v1 реализован через replicatorurl
const replicatorurl = '/dupl';


// URL для дублирования сигналов. через запятую. 
const urls = [
    'https://127.0.0.1',
    'https://127.0.0.1'
];

// V 2
// rep2urls
// адрес репликатора сигналов v2 
var replicator2url = '/dupv2';

// URL для дублирования сигналов. в многомерном массиве
// адрес приёмщика http://mysalt.com/dupv2/1 , http://mysalt.com/dupv2/1 
// [0][0] - первая ссылка первого множества
// [0][1] - вторая ссылка первого множества
const rep2urls = [
    [
        'https://127.0.0.1',
        'https://127.0.0.1'
    ],
    [
        'https://127.0.0.1',
        'https://127.0.0.1'
    ]
];

// ---------------КОНЕЦ НАСТРОЙКИ-----------------------
signalpage += '/:profId';
replicator2url += '/:repId';

module.exports.httplistenport = httplistenport;
module.exports.signalpage = signalpage;
module.exports.profiles = profiles;
module.exports.replicatorurl = replicatorurl;
module.exports.urls=urls;
module.exports.replicator2url=replicator2url
module.exports.rep2urls=rep2urls;
module.exports.replicatoranscode=replicatoranscode;