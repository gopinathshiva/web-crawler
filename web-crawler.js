var request = require('request');
var cheerio = require('cheerio');
var urlParser = require('url-parse');

var TARGET_URL, CRAWL_LIMIT, crawledUrls = {},
    crawlCount = 0,
    pagesToCrawl = [];

//getting target url from command line
TARGET_URL = process.argv[2] || "https://www.python.org/";
CRAWL_LIMIT = process.argv[3] || 25;

//checking whether url is valid or not
if (!/^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(TARGET_URL)) {
    console.log("Please enter a valid url, example: https://www.python.org/");
    return;
}

if (isNaN(CRAWL_LIMIT)) {
    console.log("Please enter a valid number for crawl limit");
    return;
}

var url = new urlParser(TARGET_URL);

//setting baseUrl to merge with relative urls of the page
var baseUrl = url.protocol + "//" + url.hostname;

pagesToCrawl.push(TARGET_URL);

crawl();

//function to begin and stop the page crawling
function crawl() {

    if (crawlCount >= CRAWL_LIMIT) {
        console.log("crawl limit reached!!!");
        return;
    } else if (!pagesToCrawl.length) {
        console.log("No pages to crawl");
        return;
    }

    var url = pagesToCrawl.shift();
    if (url in crawledUrls) {
        //page is crawled already so proceed crawling next url
        crawl();
    } else {
        visitPage(url, crawl);
    }

}

//function to crawl the given url
function visitPage(nextUrl, callback) {

    crawledUrls[nextUrl] = true;
    crawlCount++;
    console.log("Url to crawl: " + nextUrl);
    console.log("Crawling page: " + crawlCount);

    //Making request
    request(nextUrl, function(err, res, body) {

        if (err) {
            console.log("Error:" + err);
        } else {
            //console.log("Status Code:"+res.statusCode);
            if (res.statusCode === 200) {
                //Parsing document body
                var $ = cheerio.load(body);
                var pageTitle = $("title").text();
                console.log(pageTitle);
                collectAllPageLinks($);
            }
        }
        callback();//calling crawl function

    });

}

//function to collect all urls in the page
function collectAllPageLinks($) {

    var allRelativeLinks = $("a[href='/']");
    var allAbsoluteLinks = $("a[href^='http']");

    allAbsoluteLinks.each(function() {
        pagesToCrawl.push($(this).attr('href'));
    });

    allRelativeLinks.each(function() {
        pagesToCrawl.push(baseUrl + $(this).attr('href'));
    });

    //console.log("Found "+ allAbsoluteLinks.length +" Absolute urls");
    //console.log("Found "+ allRelativeLinks.length +" Relative urls");
    //console.log("Found "+ (allAbsoluteLinks.length+allRelativeLinks.length) +" urls in the page");

}
