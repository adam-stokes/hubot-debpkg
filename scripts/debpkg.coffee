# Description:
#   Query madison for debian/ubuntu package versions
#
# Commands:
#   debpkg <package> - queries debian archive for package version
#   ubupkg <package> - queries ubuntu archive for package version
#
# Author:
#   Adam Stokes <adam.stokes@ubuntu.com>

urlMap =
  debian: "https://qa.debian.org/madison.php?table=debian&text=on"
  ubuntu: "http://people.canonical.com/~ubuntu-archive/madison.cgi?text=on"

queryVersion = (robot, msg, url, pkgname) ->
  fetchUrl = "#{url}&package=#{pkgname}"
  msg.send "Looking up via: #{fetchUrl}"
  robot.http(fetchUrl).get() (err, res, body) ->
    if err != null or res.statusCode != 200
      return msg.send("Unable to query for #{pkgname}, try again Señor.")
    for pkgLine in body.trim().split('\n')
      [name, version, series, arch] = pkgLine.split('|')
      msg.send "#{name} | #{version} | <#{series}>"
  return

module.exports = (robot) ->
  robot.hear /debpkg\s(\w+)/i, (msg) ->
    pkg = msg.match[1]
    queryVersion robot, msg, urlMap.debian, pkg
    return
  robot.hear /ubupkg\s(\w+)/i, (msg) ->
    pkg = msg.match[1]
    queryVersion robot, msg, urlMap.ubuntu, pkg
    return
  return
