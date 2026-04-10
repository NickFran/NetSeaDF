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

* GSOSPF
* GSOJSnP

* input timeline range has slightly different formatting than slider output (inputs are including a T)

* add trace stack line numbers for warning notification posts