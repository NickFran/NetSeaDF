* work on the logging file, it probably should be rewritten.

* ini module is installed via npm, next figure out how to work with this.
  * (ini is needed for DebugMode = False)

* create a mini-popup framework that shows 1 big wrapper window. Then add each popup as a child to the wrapper.
  * create a postPopupToPopupBoard() or something that will allow popups to be pushed to a single area, allowing 1 click close on the wrapper to close all popups during a spam.

* Clicking on .nc file will move the map to its location

* each .nc file in that list needs data attatched to it that can be referenced when clicked.
  * Coords
  * Name
  
* Upon impiorting file, use xarray to get what we need, then store the results in a JSON object within a gliders.json file with nameID of object set the same name as file.
  * when file it clicked, get its name and look it up in the JSON, find the match and thats how we get what we need for basic info, but it eneds to be loaded into JSON at import, not each click.

* Echarts is not utilized locally and is referencing a network resource

* Make delete dataset button be at teh bottom of the sidebar

* Change display info backt to JSON so that objects can be used instead of just simple text

* PythonProcess getOverview() is not using our custom functions, change this at some point.

* BUG Loading NC file from disk causes timeout
* map.html, loading NC file has multi promise, it seems like getOverview is the only thing thats needed?
* Yea, overview is completely useless, we only ever get arrt from it, so just use arrt