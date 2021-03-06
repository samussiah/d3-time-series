(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3')) :
    typeof define === 'function' && define.amd ? define(['d3'], factory) :
    (global = global || self, global.d3_time_series = factory(global.d3));
}(this, function (d3$1) { 'use strict';

    var defaultColors = ['#a6cee3', '#ff7f00', '#b2df8a', '#1f78b4', '#fdbf6f', '#33a02c', '#cab2d6', '#6a3d9a', '#fb9a99', '#e31a1c', '#ffff99', '#b15928'];

    var defaultSettings = {
        height: 480,
        width: 600,
        drawerHeight: 40,
        drawerTopMargin: 10,
        margin: { top: 10, bottom: 20, left: 30, right: 10 }
    };

    function functorkey(v) {
        return typeof v === 'function' ? v : function (d) {
            return d[v];
        };
    }

    function functorkeyscale(v, scale) {
        var f = typeof v === 'function' ? v : function (d) {
            return d[v];
        };
        return function (d) {
            return scale(f(d));
        };
    }

    function keyNotNull(k) {
        return function (d) {
            return d.hasOwnProperty(k) && d[k] !== null && !isNaN(d[k]);
        };
    }

    function fk(v) {
        return function (d) {
            return d[v];
        };
    }

    function updatefocusRing$1(xdate, annotationsContainer, series, xscale, yscale) {
        var s = annotationsContainer.selectAll('circle.d3_timeseries.focusring');

        if (xdate == null) {
            s = s.data([]);
        } else {
            s = s.data(series.map(function (s) {
                return {
                    x: xdate,
                    item: s.find(xdate),
                    aes: s.aes,
                    color: s.options.color
                };
            }).filter(function (d) {
                return d.item !== undefined && d.item !== null && d.item[d.aes.y] !== null && !isNaN(d.item[d.aes.y]);
            }));
        }

        s.transition().duration(50).attr('cx', function (d) {
            return xscale(d.item[d.aes.x]);
        }).attr('cy', function (d) {
            return yscale(d.item[d.aes.y]);
        });

        s.enter().append('circle').attr('class', 'd3_timeseries focusring').attr('fill', 'none').attr('stroke-width', 2).attr('r', 5).attr('stroke', fk('color'));

        s.exit().remove();
    }

    function _tipFunction(date, series, xscale, yscale) {
        var spans = '<table style="border:none">' + series.filter(function (d) {
            return d.item !== undefined && d.item !== null;
        }).map(function (d) {
            return '<tr><td style="color:' + d.options.color + '">' + d.options.label + ' </td>' + '<td style="color:#333333;text-align:right">' + yscale.setformat(d.item[d.aes.y]) + '</td></tr>';
        }).join('') + '</table>';

        return '<h4>' + xscale.setformat(d3.timeDay(date)) + '</h4>' + spans;
    }

    function updateTip(xdate, tooltipDiv, series, defaultSettings, xscale, yscale) {
        if (xdate == null) {
            tooltipDiv.style('opacity', 0);
        } else {
            var s = series.map(function (s) {
                return { item: s.find(xdate), aes: s.aes, options: s.options };
            });

            tooltipDiv.style('opacity', 0.9).style('left', defaultSettings.margin.left + 5 + xscale(xdate) + 'px').style('top', '0px').html(_tipFunction(xdate, s, xscale, yscale));
        }
    }

    function mouseMove(container, xscale, mousevline, annotationsContainer, series, yscale, tooltipDiv, defaultSettings) {
        var x = d3.mouse(container.node())[0];
        x = xscale.invert(x);
        mousevline.datum({ x: x, visible: true });
        mousevline.update();
        updatefocusRing$1(x, annotationsContainer, series, xscale, yscale);
        updateTip(x, tooltipDiv, series, defaultSettings, xscale, yscale);
    }

    function mouseOut(mousevline, annotationsContainer, xscale, yscale, tooltipDiv) {
        mousevline.datum({ x: null, visible: false });
        mousevline.update();
        updatefocusRing$1(null, annotationsContainer, xscale, yscale);
        updateTip(null, tooltipDiv);
    }

    function createLines(serie, xscale, yscale) {
        // https://github.com/d3/d3-shape/blob/master/README.md#curves
        var aes = serie.aes;

        if (!serie.options.interpolate) {
            serie.options.interpolate = 'linear';
        } else {
            // translate curvenames
            serie.options.interpolate = serie.options.interpolate == 'monotone' ? 'monotoneX' : serie.options.interpolate == 'step-after' ? 'stepAfter' : serie.options.interpolate == 'step-before' ? 'stepBefore' : serie.options.interpolate;
        }
        // to uppercase for d3 curve name
        var curveName = 'curve' + serie.options.interpolate[0].toUpperCase() + serie.options.interpolate.slice(1);
        serie.interpolationFunction = d3[curveName] || d3.curveLinear;

        var line = d3.line().x(functorkeyscale(aes.x, xscale)).y(functorkeyscale(aes.y, yscale)).curve(serie.interpolationFunction).defined(keyNotNull(aes.y));

        serie.line = line;

        serie.options.label = serie.options.label || serie.options.name || serie.aes.label || serie.aes.y;

        if (aes.ci_up && aes.ci_down) {
            var ciArea = d3.area().x(functorkeyscale(aes.x, xscale)).y0(functorkeyscale(aes.ci_down, yscale)).y1(functorkeyscale(aes.ci_up, yscale)).curve(serie.interpolationFunction);
            serie.ciArea = ciArea;
        }

        if (aes.diff) {
            serie.diffAreas = [d3.area().x(functorkeyscale(aes.x, xscale)).y0(functorkeyscale(aes.y, yscale)).y1(function (d) {
                if (d[aes.y] > d[aes.diff]) return yscale(d[aes.diff]);
                return yscale(d[aes.y]);
            }).curve(serie.interpolationFunction), d3.area().x(functorkeyscale(aes.x, xscale)).y1(functorkeyscale(aes.y, yscale)).y0(function (d) {
                if (d[aes.y] < d[aes.diff]) return yscale(d[aes.diff]);
                return yscale(d[aes.y]);
            }).curve(serie.interpolationFunction)];
        }

        serie.find = function (date) {
            var bisect = d3.bisector(fk(aes.x)).left;
            var i = bisect(serie.data, date) - 1;
            if (i == -1) {
                return null;
            }

            // look to far after serie is defined
            if (i == serie.data.length - 1 && serie.data.length > 1 && Number(date) - Number(serie.data[i][aes.x]) > Number(serie.data[i][aes.x]) - Number(serie.data[i - 1][aes.x])) {
                return null;
            }
            return serie.data[i];
        };
    }

    function drawSerie(serie) {
        if (!serie.linepath) {
            var linepath = serie.container.append('path').datum(serie.data).attr('class', 'd3_timeseries line').attr('d', serie.line).attr('stroke', serie.options.color).attr('stroke-linecap', 'round').attr('stroke-width', serie.options.width || 1.5).attr('fill', 'none');

            if (serie.options.dashed) {
                if (serie.options.dashed == true || serie.options.dashed == 'dashed') {
                    serie['stroke-dasharray'] = '5,5';
                } else if (serie.options.dashed == 'long') {
                    serie['stroke-dasharray'] = '10,10';
                } else if (serie.options.dashed == 'dot') {
                    serie['stroke-dasharray'] = '2,4';
                } else {
                    serie['stroke-dasharray'] = serie.options.dashed;
                }
                linepath.attr('stroke-dasharray', serie['stroke-dasharray']);
            }
            serie.linepath = linepath;

            if (serie.ciArea) {
                serie.cipath = serieContainer.insert('path', ':first-child').datum(serie.data).attr('class', 'd3_timeseries ci-area').attr('d', serie.ciArea).attr('stroke', 'none').attr('fill', serie.options.color).attr('opacity', serie.options.ci_opacity || 0.3);
            }
            if (serie.diffAreas) {
                serie.diffpaths = serie.diffAreas.map(function (area, i) {
                    var c = (serie.options.diff_colors ? serie.options.diff_colors : ['green', 'red'])[i];
                    return serieContainer.insert('path', function () {
                        return linepath.node();
                    }).datum(serie.data).attr('class', 'd3_timeseries diff-area').attr('d', area).attr('stroke', 'none').attr('fill', c).attr('opacity', serie.options.diff_opacity || 0.5);
                });
            }
        } else {
            serie.linepath.attr('d', serie.line);
            if (serie.ciArea) {
                serie.cipath.attr('d', serie.ciArea);
            }
            if (serie.diffAreas) {
                serie.diffpaths[0].attr('d', serie.diffAreas[0]);
                serie.diffpaths[1].attr('d', serie.diffAreas[1]);
            }
        }
    }

    function drawMiniDrawer(yscale, defaultSettings, serie, fullxscale, drawerContainer) {
        var smallyscale = yscale.copy().range([defaultSettings.drawerHeight - defaultSettings.drawerTopMargin, 0]);
        var line = d3.line().x(functorkeyscale(serie.aes.x, fullxscale)).y(functorkeyscale(serie.aes.y, smallyscale)).curve(serie.interpolationFunction).defined(keyNotNull(serie.aes.y));
        var linepath = drawerContainer.insert('path', ':first-child').datum(serie.data).attr('class', 'd3_timeseries.line').attr('transform', 'translate(0,' + defaultSettings.drawerTopMargin + ')').attr('d', line).attr('stroke', serie.options.color).attr('stroke-width', serie.options.width || 1.5).attr('fill', 'none');
        if (serie.hasOwnProperty('stroke-dasharray')) {
            linepath.attr('stroke-dasharray', serie['stroke-dasharray']);
        }
    }

    function index () {
        var series = [];
        var yscale = d3$1.scaleLinear();
        var xscale = d3$1.scaleTime();
        yscale.label = '';
        xscale.label = '';

        var brush = d3$1.brushX();

        var svg, container, serieContainer, annotationsContainer, drawerContainer, mousevline;
        var fullxscale, tooltipDiv;

        yscale.setformat = function (n) {
            return n.toLocaleString();
        };
        xscale.setformat = xscale.tickFormat();

        var chart = function chart(elem) {
            // compute mins max on all series
            series = series.map(function (s) {
                var extent = d3$1.extent(s.data.map(functorkey(s.aes.y)));
                s.min = extent[0];
                s.max = extent[1];
                extent = d3$1.extent(s.data.map(functorkey(s.aes.x)));
                s.dateMin = extent[0];
                s.dateMax = extent[1];
                return s;
            });

            // set scales

            yscale.range([defaultSettings.height - defaultSettings.margin.top - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin, 0]).domain([d3$1.min(series.map(fk('min'))), d3$1.max(series.map(fk('max')))]).nice();

            xscale.range([0, defaultSettings.width - defaultSettings.margin.left - defaultSettings.margin.right]).domain([d3$1.min(series.map(fk('dateMin'))), d3$1.max(series.map(fk('dateMax')))]).nice();

            // if user specify domain
            if (yscale.fixedomain) {
                // for showing 0 :
                // chart.addSerie(...)
                //    .yscale.domain([0])
                if (yscale.fixedomain.length == 1) {
                    yscale.fixedomain.push(yscale.domain()[1]);
                }
                yscale.domain(yscale.fixedomain);
            }

            if (xscale.fixedomain) {
                xscale.domain(yscale.fixedomain);
            }

            fullxscale = xscale.copy();

            // create svg
            svg = d3$1.select(elem).append('svg').attr('width', defaultSettings.width).attr('height', defaultSettings.height);

            // clipping for scrolling in focus area
            svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('width', defaultSettings.width - defaultSettings.margin.left - defaultSettings.margin.right).attr('height', defaultSettings.height - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin).attr('y', -defaultSettings.margin.top);

            // container for focus area
            container = svg.insert('g', 'rect.mouse-catch').attr('transform', 'translate(' + defaultSettings.margin.left + ',' + defaultSettings.margin.top + ')').attr('clip-path', 'url(#clip)');

            serieContainer = container.append('g');
            annotationsContainer = container.append('g');

            // mini container at the bottom
            drawerContainer = svg.append('g').attr('transform', 'translate(' + defaultSettings.margin.left + ',' + (defaultSettings.height - defaultSettings.drawerHeight - defaultSettings.margin.bottom) + ')');

            // vertical line moving with mouse tip
            mousevline = svg.append('g').datum({
                x: new Date(),
                visible: false
            });
            mousevline.append('line').attr('x1', 0).attr('x2', 0).attr('y1', yscale.range()[0]).attr('y2', yscale.range()[1]).attr('class', 'd3_timeseries mousevline');
            // update mouse vline
            mousevline.update = function () {
                this.attr('transform', function (d) {
                    return 'translate(' + (defaultSettings.margin.left + xscale(d.x)) + ',' + defaultSettings.margin.top + ')';
                }).style('opacity', function (d) {
                    return d.visible ? 1 : 0;
                });
            };
            mousevline.update();

            var xAxis = d3$1.axisBottom().scale(xscale).tickFormat(xscale.setformat);
            var yAxis = d3$1.axisLeft().scale(yscale).tickFormat(yscale.setformat);

            brush.extent([[fullxscale.range()[0], 0], [fullxscale.range()[1], defaultSettings.drawerHeight - defaultSettings.drawerTopMargin]]).on('brush', function () {
                var selection = d3$1.event.selection;

                xscale.domain(selection.map(fullxscale.invert, fullxscale));

                series.forEach(drawSerie, serieContainer);
                svg.select('.focus.x.axis').call(xAxis);
                mousevline.update();
                updatefocusRing();
            }).on('end', function () {
                var selection = d3$1.event.selection;
                if (selection === null) {
                    xscale.domain(fullxscale.domain());

                    series.forEach(drawSerie);
                    svg.select('.focus.x.axis').call(xAxis);
                    mousevline.update();
                    updatefocusRing();
                }
            });

            svg.append('g').attr('class', 'd3_timeseries focus x axis').attr('transform', 'translate(' + defaultSettings.margin.left + ',' + (defaultSettings.height - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin) + ')').call(xAxis);

            drawerContainer.append('g').attr('class', 'd3_timeseries x axis').attr('transform', 'translate(0,' + defaultSettings.drawerHeight + ')').call(xAxis);

            drawerContainer.append('g').attr('class', 'd3_timeseries brush').call(brush).attr('transform', 'translate(0, ' + defaultSettings.drawerTopMargin + ')').attr('height', defaultSettings.drawerHeight - defaultSettings.drawerTopMargin);

            svg.append('g').attr('class', 'd3_timeseries y axis').attr('transform', 'translate(' + defaultSettings.margin.left + ',' + defaultSettings.margin.top + ')').call(yAxis).append('text').attr('transform', 'rotate(-90)').attr('x', -defaultSettings.margin.top - d3$1.mean(yscale.range())).attr('dy', '.71em').attr('y', -defaultSettings.margin.left + 5).style('text-anchor', 'middle').text(yscale.label);

            // catch event for mouse tip
            svg.append('rect').attr('width', defaultSettings.width).attr('class', 'd3_timeseries mouse-catch').attr('height', defaultSettings.height - defaultSettings.drawerHeight)
            // .style('fill','green')
            .style('opacity', 0).on('mousemove', function () {
                mouseMove(container, xscale, mousevline, annotationsContainer, series, yscale, tooltipDiv, defaultSettings);
            }).on('mouseout', function () {
                mouseOut(mousevline, annotationsContainer, xscale, yscale, tooltipDiv);
            });

            tooltipDiv = d3$1.select(elem).style('position', 'relative').append('div').attr('class', 'd3_timeseries tooltip').style('opacity', 0);

            series.forEach(function (serie) {
                serie.container = serieContainer;
                createLines(serie, xscale, yscale);
                drawSerie(serie);
            });

            drawMiniDrawer(yscale, defaultSettings, series[0], fullxscale, drawerContainer);
        };

        chart.width = function (_) {
            if (!arguments.length) return defaultSettings.width;
            defaultSettings.width = _;
            return chart;
        };

        chart.height = function (_) {
            if (!arguments.length) return defaultSettings.height;
            defaultSettings.height = _;
            return chart;
        };

        chart.margin = function (_) {
            if (!arguments.length) return defaultSettings.margin;
            defaultSettings.margin = _;
            return chart;
        };
        // accessors for margin.left(), margin.right(), margin.top(), margin.bottom()
        d3$1.keys(defaultSettings.margin).forEach(function (k) {
            chart.margin[k] = function (_) {
                if (!arguments.length) return defaultSettings.margin[k];
                defaultSettings.margin[k] = _;
                return chart;
            };
        });

        // scales accessors
        var scaleGetSet = function scaleGetSet(scale) {
            return {
                tickFormat: function tickFormat(_) {
                    if (!arguments.length) return scale.setformat;
                    scale.setformat = _;
                    return chart;
                },
                label: function label(_) {
                    if (!arguments.length) return scale.label;
                    scale.label = _;
                    return chart;
                },
                domain: function domain(_) {
                    if (!arguments.length && scale.fixedomain) return scale.fixedomain;
                    if (!arguments.length) return null;
                    scale.fixedomain = _;
                    return chart;
                }
            };
        };

        chart.yscale = scaleGetSet(yscale);
        chart.xscale = scaleGetSet(xscale);

        chart.addSerie = function (data, aes, options) {
            if (!data && series.length > 0) data = series[0].data;
            if (!options.color) options.color = defaultColors[series.length % defaultColors.length];
            series.push({ data: data, aes: aes, options: options });
            return chart;
        };

        return chart;
    }

    return index;

}));
