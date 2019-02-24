export default function drawSerie(serie) {
    if (!serie.linepath) {
        var linepath = serie.container
            .append('path')
            .datum(serie.data)
            .attr('class', 'd3_timeseries line')
            .attr('d', serie.line)
            .attr('stroke', serie.options.color)
            .attr('stroke-linecap', 'round')
            .attr('stroke-width', serie.options.width || 1.5)
            .attr('fill', 'none');

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
            serie.cipath = serieContainer
                .insert('path', ':first-child')
                .datum(serie.data)
                .attr('class', 'd3_timeseries ci-area')
                .attr('d', serie.ciArea)
                .attr('stroke', 'none')
                .attr('fill', serie.options.color)
                .attr('opacity', serie.options.ci_opacity || 0.3);
        }
        if (serie.diffAreas) {
            serie.diffpaths = serie.diffAreas.map(function(area, i) {
                var c = (serie.options.diff_colors
                    ? serie.options.diff_colors
                    : ['green', 'red'])[i];
                return serieContainer
                    .insert('path', function() {
                        return linepath.node();
                    })
                    .datum(serie.data)
                    .attr('class', 'd3_timeseries diff-area')
                    .attr('d', area)
                    .attr('stroke', 'none')
                    .attr('fill', c)
                    .attr('opacity', serie.options.diff_opacity || 0.5);
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
