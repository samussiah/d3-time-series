import { functorkeyscale, keyNotNull } from '../utils';

export default function drawMiniDrawer(yscale, defaultSettings, serie, fullxscale, drawerContainer) {
    var smallyscale = yscale.copy().range([defaultSettings.drawerHeight - defaultSettings.drawerTopMargin, 0]);
    var line = d3
        .line()
        .x(functorkeyscale(serie.aes.x, fullxscale))
        .y(functorkeyscale(serie.aes.y, smallyscale))
        .curve(serie.interpolationFunction)
        .defined(keyNotNull(serie.aes.y));
    var linepath = drawerContainer
        .insert('path', ':first-child')
        .datum(serie.data)
        .attr('class', 'd3_timeseries.line')
        .attr('transform', 'translate(0,' + defaultSettings.drawerTopMargin + ')')
        .attr('d', line)
        .attr('stroke', serie.options.color)
        .attr('stroke-width', serie.options.width || 1.5)
        .attr('fill', 'none');
    if (serie.hasOwnProperty('stroke-dasharray')) {
        linepath.attr('stroke-dasharray', serie['stroke-dasharray']);
    }
}
