* work on the logging file, it probably should be rewritten.

* ini module is installed via npm, next figure out how to work with this.
  * (ini is needed for DebugMode = False)

* create a mini-popup framework that shows 1 big wrapper window. Then add each popup as a child to the wrapper.
  * create a postPopupToPopupBoard() or something that will allow popups to be pushed to a single area, allowing 1 click close on the wrapper to close all popups during a spam.

* maybe Clicking on .nc file will move the map to its location

* Echarts is not utilized locally and is referencing a network resource

* Change display info backt to JSON so that objects can be used instead of just simple text

* leaflet maps place names are not all in english?

* add selection color to all multi files

* all instance markers have the same coords, check to make sure this is normal and not some DOM issue.

* the checkbox for 12hr clock in the timeline selection is creating null values because its not checking if a datetime has been chosed before conversion.
  * watch to see if this causes issues, if so, lets check our mode, then check if that modes range is a valid date, then convert. 

* 12 hr clock checkbox was never implemented on data point tooltips for timestamp.