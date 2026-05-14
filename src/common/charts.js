const eCharts = require('../lib/echarts/echarts.js');

function getPlotPalette() {
    return [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
    ];
}

function buildFileColorMap(fileNames) {
    const palette = getPlotPalette();
    let fileColorMap = {};

    fileNames.forEach((fileName, index) => {
        fileColorMap[fileName] = palette[index % palette.length];
    });

    return fileColorMap;
}

function zipXYArrays(xValues, yValues) {
    if (!Array.isArray(xValues) || !Array.isArray(yValues)) {
        return [];
    }

    let points = [];
    let pairCount = Math.min(xValues.length, yValues.length);

    for (let i = 0; i < pairCount; i++) {
        let x = xValues[i];
        let y = yValues[i];

        if (x == null || y == null) {
            continue;
        }

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            continue;
        }

        points.push([x, y]);
    }

    return points;
}

function getTimestampIndexesToUse(xTimestampArrays, yTimestampArrays, onlyUseFirstTimestamp) {
    let maxUsableIndex = Math.min(xTimestampArrays.length, yTimestampArrays.length);

    if (maxUsableIndex <= 0) {
        return [];
    }

    if (onlyUseFirstTimestamp) {
        return [0];
    }

    return Array.from({ length: maxUsableIndex }, (_, index) => index);
}

function initTimeline(state, deps, DOM_Deps) {
    const {DOM, fileHandle, basicFunctions} = deps;
   
    
        let data = fileHandle.getAllSimpleData();
        let timelinePoints = [];
        for (const entry of JSON.parse(data || '[]')) {
            const firstTimestamp = entry?.timestamps?.formatted?.[0];
            if (!firstTimestamp) continue;
            timelinePoints.push([firstTimestamp, 0, entry.fileName]);
        }
        //console.log("Timeline Points:", timelinePoints);

        // Calculate robust min and max timestamps for xAxis
        const timestamps = timelinePoints
            .map(pt => new Date(pt[0]).getTime())
            .filter(ts => Number.isFinite(ts));

        let minDate, maxDate;

        if (timestamps.length === 0) {
            // No valid data — fallback to current date ± 1 month
            minDate = new Date();
            maxDate = new Date();
            minDate.setMonth(minDate.getMonth() - 1);
            maxDate.setMonth(maxDate.getMonth() + 1);
        } else if (timestamps.length === 1) {
            // Single entry — center on that point ± 1 month
            minDate = new Date(timestamps[0]);
            maxDate = new Date(timestamps[0]);
            minDate.setMonth(minDate.getMonth() - 1);
            maxDate.setMonth(maxDate.getMonth() + 1);
        } else {
            // Normal case — expand actual range by 1 month each side
            minDate = new Date(Math.min(...timestamps));
            maxDate = new Date(Math.max(...timestamps));
            minDate.setMonth(minDate.getMonth() - 1);
            maxDate.setMonth(maxDate.getMonth() + 1);
        }

        const extendedMinTimestamp = minDate.getTime();
        const extendedMaxTimestamp = maxDate.getTime();

        // Add invisible boundary points so dataZoom has a proper range
        // (null y-values won't render but give the slider correct min/max)
        timelinePoints.unshift([extendedMinTimestamp, null, '']);
        timelinePoints.push([extendedMaxTimestamp, null, '']);

        // Ensure the timeline container has enough height
        const timelineEl = document.getElementById('timeline');
        if (timelineEl) {
            timelineEl.style.height = '200px'; // Adjust as needed
        }
        const chart = eCharts.init(timelineEl);
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
                left: '6%',
                right: '10%',
                top: '10%',
                bottom: '28%', // More space for zoom and labels
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
                            return `${month}-${day} ${hour12}:${min}`;
                        } else {
                            hour = String(hour).padStart(2, '0');
                            return `${month}-${day} ${hour}:${min}`;
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
        
        document.getElementById('minTimelineRangeLabel').innerText = state.mapTimelineRange.slider[0];
        document.getElementById('maxTimelineRangeLabel').innerText = state.mapTimelineRange.slider[1];
        
        DOM.leaf_filterPlatformsByTimeRange(state, DOM_Deps, state.mapTimelineRange.slider[0], state.mapTimelineRange.slider[1]);
    });

    return chart;
}

function buildPlotInstance(appState, deps, chartInstanceIndex) {
    const {charts, integrations, pathDep} = deps;
    const onlyUseFirstTimestamp = true;
    const includeDataPoints = true;
    const includeAxisPointer = true;

    let chartElement = document.createElement('div');
    chartElement.id = `plotInstance-${chartInstanceIndex}`;
    chartElement.classList.add('plotInstance');
    chartElement.style.width = '100%';
    chartElement.style.height = '620px';

    let chart = eCharts.init(chartElement);
    chartElement.chartObject = chart;

    let thisChartInstance = appState.currentView.chartInstances[chartInstanceIndex];
    let thisChartsDataMap = appState.currentView.dataMap || {};
    let thisChartsAxis = thisChartInstance.axis;
    let allFilesInvolved = appState.currentView.data || Object.keys(thisChartsDataMap);
    let Yaxis = appState.currentView.targetDim;
    let fileColorMap = buildFileColorMap(allFilesInvolved);
    let xAxisInstances = thisChartsAxis.filter(axisInstance => axisInstance.AxisSide === 'X' && axisInstance.Data);
    let series = [];
    let hasMultipleXAxes = xAxisInstances.length > 1;
    let axisPointerXAxisIndex = 0;
    let xAxisConfigs = xAxisInstances.map((xAxisInstance, index) => {
        let axisConfig = {
            type: 'value',
            position: index === 0 ? 'bottom' : 'top',
            axisLine: {
                show: true
            },
            axisTick: {
                show: true
            },
            axisLabel: {
                show: true
            },
            axisPointer: {
                show: includeAxisPointer,
                label: {
                    show: includeAxisPointer && index === axisPointerXAxisIndex
                }
            }
        };

        if (index > 1) {
            axisConfig.offset = (index - 1) * 30;
        }

        return axisConfig;
    });

    let xAxisNameGraphics = [];

    if (thisChartInstance.general?.EnableZoom) {
        if (xAxisInstances[0]) {
            xAxisNameGraphics.push({
                type: 'text',
                left: '50%',
                bottom: 20,
                silent: true,
                style: {
                    text: xAxisInstances[0].Data,
                    fill: '#666',
                    font: '12px sans-serif',
                    textAlign: 'center'
                }
            });
        }

        if (hasMultipleXAxes && xAxisInstances[1]) {
            xAxisNameGraphics.push({
                type: 'text',
                left: '50%',
                top: 72,
                silent: true,
                style: {
                    text: xAxisInstances[1].Data,
                    fill: '#666',
                    font: '12px sans-serif',
                    textAlign: 'center'
                }
            });
        }
    } else {
        xAxisConfigs = xAxisConfigs.map((axisConfig, index) => ({
            ...axisConfig,
            name: xAxisInstances[index]?.Data,
            nameLocation: 'middle',
            nameGap: index === 0 ? 34 : 28
        }));
    }

    let dataZoomConfigs = [];

    if (thisChartInstance.general?.EnableZoom) {
        dataZoomConfigs.push(
            {
                type: 'inside',
                xAxisIndex: xAxisInstances.map((_, index) => index)
            },
            {
                type: 'inside',
                yAxisIndex: 0
            },
            {
                type: 'slider',
                xAxisIndex: 0,
                bottom: 18,
                height: 26
            },
            {
                type: 'slider',
                yAxisIndex: 0,
                right: 10,
                filterMode: 'none'
            }
        );

        if (hasMultipleXAxes) {
            dataZoomConfigs.push({
                type: 'slider',
                xAxisIndex: 1,
                top: 58,
                height: 26
            });
        }
    }

    allFilesInvolved.forEach((fileName) => {
        let fileDataMap = thisChartsDataMap[fileName];
        if (!fileDataMap) {
            return;
        }

        let yTimestampArrays = fileDataMap[Yaxis];
        if (!Array.isArray(yTimestampArrays)) {
            return;
        }

        xAxisInstances.forEach((xAxisInstance, xAxisIndex) => {
            let xAxisVarName = xAxisInstance.Data;
            let xTimestampArrays = fileDataMap[xAxisVarName];

            if (!Array.isArray(xTimestampArrays)) {
                return;
            }

            let timestampIndexesToUse = getTimestampIndexesToUse(xTimestampArrays, yTimestampArrays, onlyUseFirstTimestamp);

            timestampIndexesToUse.forEach((timestampIndex) => {
                let linePoints = zipXYArrays(xTimestampArrays[timestampIndex], yTimestampArrays[timestampIndex]);

                if (linePoints.length === 0) {
                    return;
                }

                series.push({
                    name: fileName,
                    type: 'line',
                    xAxisIndex,
                    showSymbol: includeDataPoints,
                    symbol: 'circle',
                    symbolSize: includeDataPoints ? 6 : 0,
                    connectNulls: false,
                    data: linePoints,
                    itemStyle: {
                        color: fileColorMap[fileName]
                    },
                    lineStyle: {
                        color: fileColorMap[fileName],
                        width: 2
                    },
                    emphasis: {
                        focus: 'series'
                    },
                    meta: {
                        fileName,
                        xAxisVarName,
                        yAxisVarName: Yaxis,
                        timestampIndex
                    }
                });
            });
        });
    });

    chart.setOption({
        title: {
            text: thisChartInstance.general?.Name || `Chart ${chartInstanceIndex + 1}`,
            top: 8,
            left: 'center'
        },
        axisPointer: {
            show: includeAxisPointer,
            type: 'cross',
            axis: 'y',
            snap: false,
            label: {
                show: includeAxisPointer
            }
        },
        tooltip: {
            trigger: includeAxisPointer ? 'axis' : 'item',
            axisPointer: includeAxisPointer ? {
                type: 'cross',
                axis: 'y',
                snap: false,
                label: {
                    show: true
                }
            } : undefined,
            formatter: function(params) {
                if (includeAxisPointer) {
                    let tooltipParams = Array.isArray(params) ? params : [params];
                    let firstParam = tooltipParams.find(seriesParam => seriesParam?.seriesModel?.option?.xAxisIndex === axisPointerXAxisIndex) || tooltipParams[0];

                    if (!firstParam) {
                        return '';
                    }

                    let tooltipLines = [
                        `${firstParam.axisDimension || 'X'}: ${firstParam.axisValue ?? '?'}`
                    ];

                    tooltipParams.forEach((seriesParam) => {
                        let point = Array.isArray(seriesParam.data) ? seriesParam.data : [];
                        let xValue = point[0] ?? '?';
                        let yValue = point[1] ?? '?';
                        let meta = seriesParam.seriesModel?.option?.meta || {};
                        let seriesColor = typeof seriesParam.color === 'string' ? seriesParam.color : (seriesParam.color?.colorStops?.[0]?.color || '#333');
                        tooltipLines.push(`<div style="border-left: 8px solid ${seriesColor}; padding-left: 10px; margin-top: 4px; color: #000;"><div style="font-weight: 600; color: #000;">${meta.fileName || seriesParam.seriesName}</div><div style="color: #000;">${meta.xAxisVarName || 'X'}: ${xValue}<br>${meta.yAxisVarName || 'Y'}: ${yValue}<br>Timestamp: ${meta.timestampIndex ?? '?'}</div></div>`);
                    });

                    return tooltipLines.join('<br><br>');
                }

                let point = Array.isArray(params.data) ? params.data : [];
                let xValue = point[0] ?? '?';
                let yValue = point[1] ?? '?';
                let meta = params.seriesModel?.option?.meta || {};
                let seriesColor = typeof params.color === 'string' ? params.color : (params.color?.colorStops?.[0]?.color || '#333');
                return `<div style="border-left: 8px solid ${seriesColor}; padding-left: 10px; color: #000;"><div style="font-weight: 600; color: #000;">${meta.fileName || params.seriesName}</div><div style="color: #000;">${meta.xAxisVarName || 'X'}: ${xValue}<br>${meta.yAxisVarName || 'Y'}: ${yValue}<br>Timestamp: ${meta.timestampIndex ?? '?'}</div></div>`;
            }
        },
        legend: {
            type: 'scroll',
            top: 42,
            left: 'center'
        },
        grid: {
            left: '8%',
            right: '5%',
            top: hasMultipleXAxes ? 124 : 92,
            bottom: thisChartInstance.general?.EnableZoom ? 92 : 58,
            containLabel: true
        },
        xAxis: xAxisConfigs,
        yAxis: {
            type: 'value',
            name: Yaxis,
            nameLocation: 'middle',
            nameGap: 48,
            axisPointer: {
                show: includeAxisPointer,
                label: {
                    show: includeAxisPointer
                }
            },
            inverse: true
        },
        graphic: xAxisNameGraphics,
        dataZoom: dataZoomConfigs,
        series
    });

    window.addEventListener('resize', function() {
        chart.resize();
    });

    return chartElement;
}

module.exports = { initTimeline, buildPlotInstance };