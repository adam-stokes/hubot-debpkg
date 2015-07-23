// Description:
//   Reports latest debian/ubuntu package versions
//
// Commands:
//   qpkg <pkgname> [:ubuntu] - Query debian or ubuntu's package archive
//
// Author:
//   battlemidget

"use strict";

var Promise = require("bluebird");
var _ = require("lodash");
var request = Promise.promisify(require("request"));
var xre = require("xregexp").XRegExp;

var pkgTmpl = _.template("Latest (<%= pkg %>) version: " +
                         "<%= version %>/<%= series %>");
var unknownTmpl = _.template("Unknown <%= pkg %>, try again Señor.");

var urlMap = {
  debian: "https://qa.debian.org/madison.php?table=debian&text=on",
  ubuntu: "http://people.canonical.com/~ubuntu-archive/madison.cgi?text=on"
};

var pkgRe = xre("^\\s?" +
                "(?<pkgname>[\\w\\d\\-\\_]+)" +
                "[\\s\\|]+" +
                "(?<version>[\\w\\d\\.\\-~]+)" +
                "[\\s\\|]+" +
                "(?<series>[\\w+\\-\\/]+)" +
                "[\\s\\|]+" +
                "(?<arch>[\\w+,\\s\\-]+)", "xg");

function parseResult(line){
    var match = xre.exec(line, pkgRe);
    var pkg = {
        name: match.pkgname,
        version: match.version,
        series: match.series,
        arch: match.arch
    };
    return pkg;
}

function urlConCat(url, name){
    return url + "&package=" + name;
}

module.exports = function(robot) {
    robot.respond(/qpkg ([A-z]+)\s?\:?(?:(\w+))?/i, function(msg) {
        var pkgname = msg.match[1];
        var isUbuntu = msg.match[2] ? msg.match[2] : false;
        var archive = urlMap.debian;
        if (isUbuntu) {
            archive = urlMap.ubuntu;
        }
        var url = urlConCat(archive, pkgname);
        request(url)
            .then(function(res){
                var body = res[0].body.trim().split("\n");
                var parsed = [];
                _.each(body, function(line){
                    parsed.push(parseResult(line));
                });
                return parsed;
            }).then(function(parsed){
                parsed = _.last(parsed);
                msg.send(pkgTmpl({pkg: parsed.name,
                                  version: parsed.version,
                                  series: parsed.series}));
            }).catch(function(){
                msg.send(unknownTmpl({pkg: pkgname}));
            });
    });
};
