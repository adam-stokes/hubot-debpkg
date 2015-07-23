// Description:
//   Reports latest debian/ubuntu package versions
//
// Commands:
//   ubupkg <pkgname> - Query ubuntu's package archive
//   debpkg <pkgname> - Query debian's package archive
//
// Example retrieval output:
//
// sosreport | 3.2-2 | jessie-kfreebsd | source, kfreebsd-amd64, kfreebsd-i386
// sosreport | 3.2-2 | jessie          | source, amd64, arm64, armel, armhf, i386, mips, mipsel, powerpc, ppc64el, s390x
// sosreport | 3.2-2 | stretch         | source, amd64, arm64, armel, armhf, i386, mips, mipsel, powerpc, ppc64el, s390x
// sosreport | 3.2-2 | sid             | source, amd64, arm64, armel, armhf, hurd-i386, i386, kfreebsd-amd64, kfreebsd-i386, mips, mipsel, powerpc, ppc64el, s390x, sparc
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

var pkgRe = xre("^\\s*" +
                "(?<pkgname>[\\w+0-9\-\_]+)" +
                "[\\s\|]+" +
                "(?<version>[0-9\.\-]+)" +
                "[\\s\|]+" +
                "(?<series>[\\w+\-]+)" +
                "[\\s\|]+" +
                "(?<arch>[\\w+,\\s\-]+)", "ig");

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
    robot.hear(/debpkg\s(\w+)/i, function(msg) {
        request(urlConCat(urlMap.debian, msg.match[1]))
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
                msg.send(unknownTmpl({pkg: msg.match[1]}));
            });
    });
};
