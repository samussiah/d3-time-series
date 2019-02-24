export function functorkey(v) {
    return typeof v === 'function'
        ? v
        : function(d) {
              return d[v];
          };
}

export function functorkeyscale(v, scale) {
    var f =
        typeof v === 'function'
            ? v
            : function(d) {
                  return d[v];
              };
    return function(d) {
        return scale(f(d));
    };
}

export function keyNotNull(k) {
    return function(d) {
        return d.hasOwnProperty(k) && d[k] !== null && !isNaN(d[k]);
    };
}

export function fk(v) {
    return function(d) {
        return d[v];
    };
}
