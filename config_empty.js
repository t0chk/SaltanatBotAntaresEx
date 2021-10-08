// ---------------НАСТРОЙКА-----------------------

// часовой пояс пользователя
const gmttime = 3; // UTC+3 (Москва)

// порт подключения салтанат
const httplistenport = 80;

// адрес приемщика сигналов
var signalpage = '/';

// настройка профилей 
// profiles[0].binancepikey

const profiles = [

    /* profile #1 */
    {
        binancepikey: '', /* binance apikey */
        binancesecretkey: '', /* binance secret key */
        telestatus: 'вкл', /* telegram status */
        teleid: '', /* telegram id */
        teletoken: '', /* telegram token */
    },
    /* profile #2 */
    {
        binancepikey: '', /* binance apikey */
        binancesecretkey: '', /* binance secret key */
        telestatus: '', /* telegram status */
        teleid: '', /* telegram id */
        teletoken: '', /* telegram token */
    }
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
const replicatorurl = '/replicator';


// URL для дублирования сигналов. через запятую. 
const urls = [
];

// V 2
// rep2urls
// адрес репликатора сигналов v2 
var replicator2url = '/rep';

// URL для дублирования сигналов. в многомерном массиве
// [0][0] - первая ссылка первого множества
// [0][1] - вторая ссылка первого множества
const rep2urls = [

];

// адрес api proxy
var apiproxypage = '/api';

// ---------------КОНЕЦ НАСТРОЙКИ-----------------------
signalpage += '/:profId';
replicator2url += '/:repId';

// экспорт переменных модуля
module.exports.httplistenport = httplistenport;
module.exports.signalpage = signalpage;
module.exports.profiles = profiles;
module.exports.replicatorurl = replicatorurl;
module.exports.urls = urls;
module.exports.replicator2url = replicator2url
module.exports.rep2urls = rep2urls;
module.exports.replicatoranscode = replicatoranscode;
module.exports.gmttime = gmttime;
module.exports.apiproxypage = apiproxypage;
