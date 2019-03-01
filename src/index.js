import * as d3 from 'd3';
import defaultColors from './defaultColors';
import defaultSettings from './defaultSettings';
import { functorkey, functorkeyscale, keyNotNull, fk } from './utils';
import mouseMove from './chart/mouseMove';
import mouseOut from './chart/mouseOut';
import createLines from './chart/createLines';
import drawSerie from './drawSerie';
import drawMiniDrawer from './chart/drawMiniDrawer';

export default function() {
    var series = [];
    var yscale = d3.scaleLinear();
    var xscale = d3.scaleTime();
    yscale.label = '';
    xscale.label = '';

    var brush = d3.brushX();

    var svg, container, serieContainer, annotationsContainer, drawerContainer, mousevline;
    var fullxscale, tooltipDiv;

    yscale.setformat = function(n) {
        return n.toLocaleString();
    };
    xscale.setformat = xscale.tickFormat();

    var chart = function(elem) {
        // compute mins max on all series
        series = series.map(function(s) {
            var extent = d3.extent(s.data.map(functorkey(s.aes.y)));
            s.min = extent[0];
            s.max = extent[1];
            extent = d3.extent(s.data.map(functorkey(s.aes.x)));
            s.dateMin = extent[0];
            s.dateMax = extent[1];
            return s;
        });

        // set scales

        yscale
            .range([defaultSettings.height - defaultSettings.margin.top - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin, 0])
            .domain([d3.min(series.map(fk('min'))), d3.max(series.map(fk('max')))])
            .nice();

        xscale
            .range([0, defaultSettings.width - defaultSettings.margin.left - defaultSettings.margin.right])
            .domain([d3.min(series.map(fk('dateMin'))), d3.max(series.map(fk('dateMax')))])
            .nice();

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
        svg = d3
            .select(elem)
            .append('svg')
            .attr('width', defaultSettings.width)
            .attr('height', defaultSettings.height);

        // clipping for scrolling in focus area
        svg.append('defs')
            .append('clipPath')
            .attr('id', 'clip')
            .append('rect')
            .attr('width', defaultSettings.width - defaultSettings.margin.left - defaultSettings.margin.right)
            .attr('height', defaultSettings.height - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin)
            .attr('y', -defaultSettings.margin.top);

        // container for focus area
        container = svg
            .insert('g', 'rect.mouse-catch')
            .attr('transform', 'translate(' + defaultSettings.margin.left + ',' + defaultSettings.margin.top + ')')
            .attr('clip-path', 'url(#clip)');

        serieContainer = container.append('g');
        annotationsContainer = container.append('g');

        // mini container at the bottom
        drawerContainer = svg
            .append('g')
            .attr(
                'transform',
                'translate(' + defaultSettings.margin.left + ',' + (defaultSettings.height - defaultSettings.drawerHeight - defaultSettings.margin.bottom) + ')'
            );

        // vertical line moving with mouse tip
        mousevline = svg.append('g').datum({
            x: new Date(),
            visible: false
        });
        mousevline
            .append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', yscale.range()[0])
            .attr('y2', yscale.range()[1])
            .attr('class', 'd3_timeseries mousevline');
        // update mouse vline
        mousevline.update = function() {
            this.attr('transform', function(d) {
                return 'translate(' + (defaultSettings.margin.left + xscale(d.x)) + ',' + defaultSettings.margin.top + ')';
            }).style('opacity', function(d) {
                return d.visible ? 1 : 0;
            });
        };
        mousevline.update();

        var xAxis = d3
            .axisBottom()
            .scale(xscale)
            .tickFormat(xscale.setformat);
        var yAxis = d3
            .axisLeft()
            .scale(yscale)
            .tickFormat(yscale.setformat);

        brush
            .extent([
                [fullxscale.range()[0], 0],
                [fullxscale.range()[1], defaultSettings.drawerHeight - defaultSettings.drawerTopMargin]
            ])

            .on('brush', () => {
                let selection = d3.event.selection;

                xscale.domain(selection.map(fullxscale.invert, fullxscale));

                series.forEach(drawSerie, serieContainer);
                svg.select('.focus.x.axis').call(xAxis);
                mousevline.update();
                updatefocusRing();
            })

            .on('end', () => {
                let selection = d3.event.selection;
                if (selection === null) {
                    xscale.domain(fullxscale.domain());

                    series.forEach(drawSerie);
                    svg.select('.focus.x.axis').call(xAxis);
                    mousevline.update();
                    updatefocusRing();
                }
            });

        svg.append('g')
            .attr('class', 'd3_timeseries focus x axis')
            .attr(
                'transform',
                'translate(' +
                    defaultSettings.margin.left +
                    ',' +
                    (defaultSettings.height - defaultSettings.margin.bottom - defaultSettings.drawerHeight - defaultSettings.drawerTopMargin) +
                    ')'
            )
            .call(xAxis);

        drawerContainer
            .append('g')
            .attr('class', 'd3_timeseries x axis')
            .attr('transform', 'translate(0,' + defaultSettings.drawerHeight + ')')
            .call(xAxis);

        drawerContainer
            .append('g')
            .attr('class', 'd3_timeseries brush')
            .call(brush)
            .attr('transform', `translate(0, ${defaultSettings.drawerTopMargin})`)
            .attr('height', defaultSettings.drawerHeight - defaultSettings.drawerTopMargin);

        svg.append('g')
            .attr('class', 'd3_timeseries y axis')
            .attr('transform', 'translate(' + defaultSettings.margin.left + ',' + defaultSettings.margin.top + ')')
            .call(yAxis)
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -defaultSettings.margin.top - d3.mean(yscale.range()))
            .attr('dy', '.71em')
            .attr('y', -defaultSettings.margin.left + 5)
            .style('text-anchor', 'middle')
            .text(yscale.label);

        // catch event for mouse tip
        svg.append('rect')
            .attr('width', defaultSettings.width)
            .attr('class', 'd3_timeseries mouse-catch')
            .attr('height', defaultSettings.height - defaultSettings.drawerHeight)
            // .style('fill','green')
            .style('opacity', 0)
            .on('mousemove', function() {
                mouseMove(container, xscale, mousevline, annotationsContainer, series, yscale, tooltipDiv, defaultSettings);
            })
            .on('mouseout', function() {
                mouseOut(mousevline, annotationsContainer, xscale, yscale, tooltipDiv);
            });

        tooltipDiv = d3
            .select(elem)
            .style('position', 'relative')
            .append('div')
            .attr('class', 'd3_timeseries tooltip')
            .style('opacity', 0);

        series.forEach(serie => {
            serie.container = serieContainer;
            createLines(serie, xscale, yscale);
            drawSerie(serie);
        });

        drawMiniDrawer(yscale, defaultSettings, series[0], fullxscale, drawerContainer);
    };

    chart.width = function(_) {
        if (!arguments.length) return defaultSettings.width;
        defaultSettings.width = _;
        return chart;
    };

    chart.height = function(_) {
        if (!arguments.length) return defaultSettings.height;
        defaultSettings.height = _;
        return chart;
    };

    chart.margin = function(_) {
        if (!arguments.length) return defaultSettings.margin;
        defaultSettings.margin = _;
        return chart;
    };
    // accessors for margin.left(), margin.right(), margin.top(), margin.bottom()
    d3.keys(defaultSettings.margin).forEach(function(k) {
        chart.margin[k] = function(_) {
            if (!arguments.length) return defaultSettings.margin[k];
            defaultSettings.margin[k] = _;
            return chart;
        };
    });

    // scales accessors
    var scaleGetSet = function(scale) {
        return {
            tickFormat: function(_) {
                if (!arguments.length) return scale.setformat;
                scale.setformat = _;
                return chart;
            },
            label: function(_) {
                if (!arguments.length) return scale.label;
                scale.label = _;
                return chart;
            },
            domain: function(_) {
                if (!arguments.length && scale.fixedomain) return scale.fixedomain;
                if (!arguments.length) return null;
                scale.fixedomain = _;
                return chart;
            }
        };
    };

    chart.yscale = scaleGetSet(yscale);
    chart.xscale = scaleGetSet(xscale);

    chart.addSerie = function(data, aes, options) {
        if (!data && series.length > 0) data = series[0].data;
        if (!options.color) options.color = defaultColors[series.length % defaultColors.length];
        series.push({ data: data, aes: aes, options: options });
        return chart;
    };

    return chart;
}
