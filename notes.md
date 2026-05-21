* work on the logging file, it probably should be rewritten.

* ini module is installed via npm, next figure out how to work with this.
  * (ini is needed for DebugMode = False)

* create a mini-popup framework that shows 1 big wrapper window. Then add each popup as a child to the wrapper.
  * create a postPopupToPopupBoard() or something that will allow popups to be pushed to a single area, allowing 1 click close on the wrapper to close all popups during a spam.

* Echarts is not utilized locally and is referencing a network resource
    * THIS LOOKS LIKE ITS BEEN RESLVED BUT DOUBLE CHECK

* Change display info backt to JSON so that objects can be used instead of just simple text

* leaflet maps place names are not all in english?

* 12 hr clock checkbox was never implemented on data point tooltips for timestamp.

* JSSPF
* GSOJSnP

* input timeline range has slightly different formatting than slider output (inputs are including a T)

* add trace stack line numbers for warning notification posts

* windows venv has newer versions for GSW (x.x.21) and cftime (x.x.5), these will need to be downgraded in requirements.txt because mac builds dont exist for them.

* get rid of all config files and put everything into one config.yaml
   * we have no chouice, the settings menu needs to parse the file to pull the defaults, not dealing with that between multiple yamls.

* soon we will swap the order of the settings so it goes label | value | input

* debug labels are good, but only needed for sliders.

* onChartInstanceOptionClick in DOM, menu is shown, then menu populated, should prob be other way around.

* delete view file while view is being used?

* manual time range, close, reopen, change to slider...

* check map.html for path.join, instead look into using fromHereToRoot()

* add indicator when view changes but has yet to be regenerated.

* Work on plotting wrapper for multiple charts on screen
* axis shifts when zoom
* ignore uneeded vars from NC files
* add setting for max time before flag of under ice (setting implemented, now just needs hook in code)

* POPUP FOR FILTERS HAS OFFSET TITLE

* ln 71 userInt for under ice calc

* plot output doesnt use view name

* number measurements for both axis