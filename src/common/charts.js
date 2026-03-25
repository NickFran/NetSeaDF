
const eCharts = require('../lib/echarts/echarts.js');

function initTimeline(state, deps, DOM_Deps) {
    const {DOM, fileHandle, basicFunctions} = deps;
   
    
        let data = fileHandle.getAllSimpleData();
        let timelinePoints = [];
        for (const entry of JSON.parse(data)) {
            timelinePoints.push([entry.timestamps["formatted"][0], 0, entry.fileName]);
        }
        //console.log("Timeline Points:", timelinePoints);

        // Calculate min and max timestamps for xAxis
        const timestamps = timelinePoints.map(pt => new Date(pt[0]).getTime());
        const minTimestamp = Math.min(...timestamps);
        const maxTimestamp = Math.max(...timestamps);
        // Expand range by 1 month on each side
        const minDate = new Date(minTimestamp);
        const maxDate = new Date(maxTimestamp);
        minDate.setMonth(minDate.getMonth() - 1);
        maxDate.setMonth(maxDate.getMonth() + 1);
        const extendedMinTimestamp = minDate.getTime();
        const extendedMaxTimestamp = maxDate.getTime();

        const chart = echarts.init(document.getElementById('timeline'));
        chart.resize();
        const option = {
            title: {
                text: 'Timeline',
                show: false,
                textStyle: {
                    color: '#007bff',
                    fontWeight: 'bold',
                    fontSize: 20
                }
            },
            tooltip: {
                trigger: 'item',
                backgroundColor: '#fff',
                borderColor: '#007bff',
                borderWidth: 1,
                textStyle: {
                    color: '#243744',
                    fontSize: 14
                },
                confine: false,
                formatter: function(params) {
                    if (params && params.data && Array.isArray(params.data) && params.data.length >= 3) {
                        return `<b style="color:#007bff">File:</b> ${String(params.data[2])}<br><b style="color:#243744">Timestamp:</b> ${String(params.data[0])}`;
                    }
                    return '';
                }
            },
                grid: {
                    left: '5%',
                    right: '10%',
                    top: '20%',
                    bottom: '50%',
                    containLabel: true
                },
            xAxis: {
                type: 'time',
                min: extendedMinTimestamp,
                max: extendedMaxTimestamp,
                axisPointer: {
                    show: true,
                    type: 'line',
                    snap: false,
                    label: {
                        show: true,
                        formatter: function(params) {
                            if (!params.value) return '';
                            const date = new Date(params.value);
                            if (state.mapTimeline12hrClock) {
                                return basicFunctions.format12hr(date);
                            } else {
                                return basicFunctions.format24hr(date);
                            }
                        }
                    }
                },
                axisLabel: {
                    rotate: 45,
                    color: '#243744',
                    fontSize: (function() {
                        // Dynamically scale font size based on window width
                        const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                        if (width < 800) return 9;
                        if (width < 1200) return 10;
                        return 13;
                    })(),
                    formatter: function(value) {
                        const date = new Date(value);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        let hour = date.getHours();
                        let min = String(date.getMinutes()).padStart(2, '0');
                        if (state.mapTimeline12hrClock) {
                            let ampm = hour >= 12 ? 'PM' : 'AM';
                            let hour12 = hour % 12;
                            if (hour12 === 0) hour12 = 12;
                            hour12 = String(hour12).padStart(2, '0');
                            return `${month}-${day}`;
                        } else {
                            hour = String(hour).padStart(2, '0');
                            return `${month}-${day}`;
                        }
                    }
                },
                splitNumber: 15,
                axisLine: {
                    lineStyle: {
                        color: '#007bff',
                        width: 2
                    }
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#e0e0e0',
                        type: 'dashed'
                    }
                }
            },
            yAxis: {
                type: 'value',
                show: false,
                min: -1,
                max: 1
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    backgroundColor: '#e0e0e0',
                    fillerColor: '#007bff33',
                    borderColor: '#007bff',
                    handleStyle: {
                        color: '#007bff',
                        borderColor: '#243744'
                    },
                    labelFormatter: function(value) {
                        const date = new Date(value);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        let hour = date.getHours();
                        let min = String(date.getMinutes()).padStart(2, '0');
                        if (state.mapTimeline12hrClock) {
                            let ampm = hour >= 12 ? 'PM' : 'AM';
                            let hour12 = hour % 12;
                            if (hour12 === 0) hour12 = 12;
                            hour12 = String(hour12).padStart(2, '0');
                            return `${year}-${month}-${day} ${hour12}:${min} ${ampm}`;
                        } else {
                            hour = String(hour).padStart(2, '0');
                            return `${year}-${month}-${day} ${hour}:${min}`;
                        }
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ],
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    backgroundColor: '#e0e0e0',
                    fillerColor: '#007bff33',
                    borderColor: '#007bff',
                    handleStyle: {
                        color: '#007bff',
                        borderColor: '#243744'
                    },
                    textStyle: {
                        fontSize: (function() {
                            const width = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                            if (width < 800) return 8;
                            if (width < 1200) return 10;
                            return 13;
                        })()
                    },
                    labelFormatter: function(value, type) {
                        const date = new Date(value);
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        let hour = date.getHours();
                        let min = String(date.getMinutes()).padStart(2, '0');
                        if (state.mapTimeline12hrClock) {
                            let ampm = hour >= 12 ? 'PM' : 'AM';
                            let hour12 = hour % 12;
                            if (hour12 === 0) hour12 = 12;
                            hour12 = String(hour12).padStart(2, '0');
                            return `${year}-${month}-${day} ${hour12}:${min} ${ampm}`;
                        } else {
                            hour = String(hour).padStart(2, '0');
                            return `${year}-${month}-${day} ${hour}:${min}`;
                        }
                    }
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ],
            series: [{
                type: 'scatter',
                data: timelinePoints,
                symbol: 'circle',
                symbolSize: 10,
                itemStyle: {
                    color: '#007bff',
                    borderColor: '#243744',
                    borderWidth: 2
                }
            }]
        };
        chart.setOption(option);
        window.addEventListener('resize', function() {
            chart.resize();
        });
        chart.on('dataZoom', function(params) {
        const axis = chart.getModel().getComponent('xAxis', 0);
        const extent = axis.axis.scale.getExtent();
        const min = extent[0];
        const max = extent[1];
        const minDate = new Date(min);
        const maxDate = new Date(max);
        if (state.mapTimeline12hrClock) {
            state.mapTimelineRange.slider = [basicFunctions.format12hr(minDate), basicFunctions.format12hr(maxDate)];
            console.log('Timeline slider range updated (12hr):', state.mapTimelineRange.slider);
        } else {
            state.mapTimelineRange.slider = [basicFunctions.format24hr(minDate), basicFunctions.format24hr(maxDate)];
            console.log('Timeline slider range updated (24hr):', state.mapTimelineRange.slider);
        }
        //document.getElementById('MapTimelineFilterHeader').innerText = `Timeline Range: ${state.mapTimelineRange.slider[0]} - ${state.mapTimelineRange.slider[1]}`;
        DOM.leaf_UpdateTimelineHeader(state, state.mapTimelineRange.slider[0], state.mapTimelineRange.slider[1]);
        DOM.leaf_filterPlatformsByTimeRange(state, DOM_Deps, state.mapTimelineRange.slider[0], state.mapTimelineRange.slider[1]);
    });
}

module.exports = { initTimeline };